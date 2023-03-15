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

    static opacity = 0.4
    static color = 0x0000ff
    static emissive = 0x000000
    static select = 0xff00ff
    static hover = 0x00f000
    static no_id = 0xff0000
    static id_name = 'id'
}

class MvObject {
    constructor(parent, data, prev) {
        prev && (prev.next = this)
        this.prev = prev

        this.data = data
        const track_id = data[MvOptions.id_name] || null

        data[MvOptions.id_name] = track_id
        const properties = {}
        properties[MvOptions.id_name] = track_id
        Object.assign(properties, data)

        this.faces = properties['geometry']
        this.wheels = properties['wheels']

        delete properties['geometry']
        delete properties['wheels']

        this.properties = properties
    }

    toObject = () => {
        const object = {}
        object['geometry'] = this.faces
        object['wheels'] = this.wheels
        Object.assign(object, this.properties)
        return object
    }

    isPropertyChanged = () => {
        for (const key in this.properties) {
            if (this.data[key] !== this.properties[key]) {
                return true
            }
        }
        return false
    }

    changeProperty = (key, value) => {
        this.properties[key] = value
        if (key === MvOptions.id_name) {
            if (this.elem) {
                this.elem.textContent = value
            }
        }
    }

    mesh
    cell

    get_color = () => {
        return this.properties[MvOptions.id_name] ? MvOptions.color : MvOptions.no_id
    }

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
            color: this.get_color(),
            emissive: MvOptions.emissive
        });

        this.mesh = new THREE.Mesh(geometry, material)
        gl_container.add(this.mesh)

        const elem = document.createElement('div');
        let position = new THREE.Vector3(minX, minY, 0);
        gl_container.localToWorld(position)
        elem.position = position
        elem.textContent = this.properties[MvOptions.id_name];
        this.elem = elem
        web_container.appendChild(elem);
    }

    dispose = (gl_container, web_container) => {
        if (this.mesh) {
            gl_container.remove(this.mesh)
            this.mesh.geometry.dispose()
            this.mesh.material.dispose()
            this.mesh = null
        }
        this.elem = null
        this.cell = null
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
            this.mesh.material.color.set(this.get_color())
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
    constructor(parent, name, path, prev) {
        prev && (prev.next = this)
        this.prev = prev

        this.parent = parent
        this.name = name

        this.image_path = path.image
        this.json_path = path.json

        this.objects = []
        fetch(this.json_path).then(res => res.json()).then(data => {
            this.filename = data['filename']
            prev = null
            for (const object of data.objects) {
                this.objects.push(prev = new MvObject(this, object, prev))
            }
            this.objects.length > 0 && (this.first_object = this.objects[0])
        })

        this.layout = MvOptions.layout[name] || (() => {
            return [0, 0]
        })
    }

    internal_save() {
        const file = {
            filename: this.filename,
            objects: this.objects.map(object => object.toObject())
        }

        document.dispatchEvent(new CustomEvent('save-camera', {
            cancelable: true,
            detail: {
                path: this.json_path,
                json: JSON.stringify(file, null, 4)
            }
        }));
    }

    save = (forced) => {
        if (forced) {
            this.internal_save()
        } else {
            let needSave = false
            for (const object of this.objects) {
                if (object.isPropertyChanged()) {
                    needSave = true
                    break
                }
            }

            if (needSave) {
                this.internal_save()
            }
        }
    }

    mesh
    cell

    create_mesh = (gl_container, web_container, callback) => {
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
            callback && callback()
        })
    }

    dispose = (gl_container, web_container, callback) => {
        this.objects.forEach(object => object.dispose(this.mesh, web_container))

        if (this.mesh) {
            gl_container.remove(this.mesh)
            this.mesh.geometry.dispose()
            this.mesh.material.dispose()
            this.mesh = null
        }

        this.cell = null
        callback && callback()
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
    constructor(parent, name, cameras, prev) {
        prev && (prev.next = this)
        this.prev = prev

        this.parent = parent
        this.name = name
        this.cameras = {}
        prev = null
        for (const camera in cameras) {
            prev = this.cameras[camera] = new MvCamera(this, camera, cameras[camera], prev)
        }
    }

    save = (forced) => {
        for (const camera in this.cameras) {
            this.cameras[camera].save(forced)
        }
    }

    cell
}

class MvScene {
    constructor(parent, name, frames) {
        this.parent = parent
        this.name = name;
        this.frames = {}
        let prev = null
        for (const frame in frames) {
            prev = this.frames[frame] = new MvFrame(this, frame, frames[frame], prev)
        }
    }

    save = (forced) => {
        for (const frame in this.frames) {
            this.frames[frame].save(forced)
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

    save = (forced) => {
        for (const scene_name in this.scenes) {
            this.scenes[scene_name].save(forced)
        }
    }
}

export {MvOptions, MvCamera, MvFrame, MvScene, MvProject}