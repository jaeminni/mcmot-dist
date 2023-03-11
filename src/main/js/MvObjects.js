import ImageGeometry from "./ImageGeometry";
import * as THREE from "three";

class MvOptions {
    static offset = 100
    static layout = {
        'front_center_forward_60': function (width, height) {
            return [0, -(height + MvOptions.offset)]
        }, 'front_center_forward_100': function (width, height) {
            return [0, 0]
        }, 'front_left_forward_100': function (width, height) {
            return [-(width + MvOptions.offset), 0]
        }, 'front_left_backward_100': function (width, height) {
            return [-(width + MvOptions.offset), +(height + MvOptions.offset)]
        }, 'front_right_forward_100': function (width, height) {
            return [+(width + MvOptions.offset), 0]
        }, 'front_right_backward_100': function (width, height) {
            return [+(width + MvOptions.offset), +(height + MvOptions.offset)]
        },
    }

    static opacity = 0.6
    static color = 0x0000ff
    static emissive = 0x000000
    static select = 0xff0000
    static hover = 0x00f000
}

class MvObject {
    constructor(parent, data) {
        this.data = data

        const properties = {}
        Object.assign(properties, data)

        this.faces = properties['geometry']
        this.wheels = properties['wheels']

        delete properties['geometry']
        delete properties['wheels']

        this.properties = properties
    }

    mesh
    cell

    create_mesh = (gl_container, web_container) => {
        const shapes = []
        let minX = 100000, minY = 100000
        for (const key in this.faces) {
            const face = this.faces[key]
            if (!face) {
                continue
            }

            const points = []
            for (const point of face) {
                minX = Math.min(minX, point[0])
                minY = Math.min(minY, point[1])
                points.push({x: point[0], y: point[1]})
            }
            points.push({x: face[0][0], y: face[0][1]})
            const shape = new THREE.Shape().setFromPoints(points);
            shapes.push(shape)
        }

        const geometry = new THREE.ShapeGeometry(shapes);
        const material = new THREE.MeshPhongMaterial({
            side: THREE.BackSide,
            depthWrite: false,
            opacity: MvOptions.opacity,
            transparent: true,
            wireframe: false,
            color: MvOptions.color,
            emissive: MvOptions.emissive
        });

        this.mesh = new THREE.Mesh(geometry, material)
        gl_container.add(this.mesh)

        const elem = document.createElement('div');
        let position = new THREE.Vector3(minX, minY, 0);
        gl_container.localToWorld(position)
        elem.position = position
        elem.textContent = this.properties.type;
        web_container.appendChild(elem);
    }

    dispose = (gl_container, web_container) => {
        if (this.mesh) {
            gl_container.remove(this.mesh)
            this.mesh.geometry.dispose()
            this.mesh.material.dispose()
            this.mesh = undefined
        }
        this.cell = undefined
    }

    raycast = (raycaster) => {
        if (!this.mesh) {
            return
        }

        const intersects = []
        this.mesh.raycast(raycaster, intersects);
        if (intersects.length > 0) {
            return this
        }
    }

    select = () => {
        if (this.mesh) {
            this.mesh.material.color.set(MvOptions.select)
        }
    }

    deselect = () => {
        if (this.mesh) {
            this.mesh.material.color.set(MvOptions.color)
        }
    }
    hover = () => {
        if (this.mesh) {
            this.mesh.material.emissive.set(MvOptions.hover)
        }
    }
    dehover = () => {
        if (this.mesh) {
            this.mesh.material.emissive.set(MvOptions.emissive)
        }
    }
}

class MvCamera {
    constructor(parent, name, image_path, json_path) {
        this.parent = parent
        this.name = name

        this.image_path = image_path
        this.json_path = json_path

        this.objects = []
        fetch(this.json_path).then(res => res.json()).then(data => {
            this.filename = data['filename']
            for (const object of data.objects) {
                this.objects.push(new MvObject(this, object))
            }
        })

        this.layout = MvOptions.layout[name] || (() => {
            return [0, 0]
        })
    }

    mesh
    cell

    create_mesh = (gl_container, web_container) => {
        const texture_loader = new THREE.TextureLoader()
        texture_loader.load(this.image_path, (texture) => {
            const width = texture.image.naturalWidth
            const height = texture.image.naturalHeight
            const offset = this.layout(width, height)

            const geometry = new ImageGeometry(width, height);
            const material = new THREE.MeshBasicMaterial({
                map: texture, depthWrite: false
            });

            this.mesh = new THREE.Mesh(geometry, material)
            this.mesh.translateX(offset[0])
            this.mesh.translateY(offset[1])
            gl_container.add(this.mesh)

            this.objects.forEach(object => object.create_mesh(this.mesh, web_container))
        })
    }

    dispose = (gl_container, web_container) => {
        this.objects.forEach(object => object.dispose(this.mesh, web_container))

        if (this.mesh) {
            gl_container.remove(this.mesh)
            this.mesh.geometry.dispose()
            this.mesh.material.dispose()
            this.mesh = undefined
        }

        this.cell = undefined
    }

    raycast = (raycaster) => {
        if (!this.mesh) {
            return
        }

        const intersects = []
        this.mesh.raycast(raycaster, intersects);
        if (intersects.length > 0) {
            intersects.length = 0
            for (const object of this.objects) {
                const _object = object.raycast(raycaster, intersects)
                if (_object) {
                    return {camera: this, object: _object}
                }
            }
            return {camera: this}
        }
        return {}
    }
}

class MvFrame {
    constructor(parent, name, cameras) {
        this.parent = parent
        this.name = name
        this.cameras = {}
        for (const camera_name in cameras) {
            this.cameras[camera_name] = new MvCamera(this, camera_name, cameras[camera_name].image, cameras[camera_name].json)
        }
    }

    cell
}

class MvScene {
    constructor(parent, name, frames) {
        this.parent = parent
        this.name = name;
        this.frames = {}
        for (const frame_name in frames) {
            this.frames[frame_name] = new MvFrame(this, frame_name, frames[frame_name])
        }
    }
}

const getObject = (object, key) => {
    if (!object[key]) {
        object[key] = {}
    }
    return object[key]
}

class MvProject {
    static REGEX = /camera_(front|rear)_(left|center|right)_(forward|backward)_fov(60|100)\/SCENE-(\w+)-(\d+)_FRAME_(\d+)\.(json|jpg|png)$/i

    constructor(files) {
        const scenes = {}
        for (const file of files) {
            const exec = MvProject.REGEX.exec(file)

            const scene = getObject(scenes, `SCENE-${exec[5]}-${exec[6]}`)
            const frame = getObject(scene, exec[7])
            const camera = getObject(frame, `${exec[1]}_${exec[2]}_${exec[3]}_${exec[4]}`)
            const target = /json/i.test(exec[8]) ? 'json' : 'image'
            camera[target] = file
        }
        this.scenes = {}
        for (const scene_name in scenes) {
            this.scenes[scene_name] = new MvScene(this, scene_name, scenes[scene_name])
        }
    }
}

export {MvOptions, MvCamera, MvFrame, MvScene, MvProject}