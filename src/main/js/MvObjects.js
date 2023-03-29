import ImageGeometry from "./ImageGeometry";
import * as THREE from "three";
import * as martinez from 'martinez-polygon-clipping'

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
    static has_errors = 0xffffff
    static id_name = 'id'
    static epsilon = 0.005
    static useClip = true
}

class MvObject {
    constructor(parent, data, prev) {
        this.parent = parent

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
        this.errors = {}
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
                this.deselect()
            }
        }
    }

    get_name = () => {
        const type = this.properties['type']
        const id = this.properties[MvOptions.id_name] || null
        return type + (id ? ` (${id})` : '')
    }

    mesh
    cell
    has_errors

    get_color = () => {
        return this.has_errors ? MvOptions.has_errors : this.properties[MvOptions.id_name] ? MvOptions.color : MvOptions.no_id
    }

    is_clockwise(points) {
        const center = [0, 0]
        points.forEach(p => {
            center[0] += p[0]
            center[1] += p[1]
        })
        center[0] /= points.length
        center[1] /= points.length

        const angles = points.map(p => {
            const angle = Math.atan2(center[1] - p[1], p[0] - center[0]) * 180 / Math.PI
            return angle < 0 ? angle + 360 : angle
        })

        return angles[0] > angles[1]
    }

    create_mesh = (clip, gl_container, web_container) => {
        const shapes = []
        const all_points = []
        for (const key in this.faces) {
            const face = this.faces[key]
            if (!face) {
                continue
            }

            let ps
            if (MvOptions.useClip) {
                const is_clockwise = this.is_clockwise(face)
                if (!is_clockwise) {
                    face.reverse()
                }
                const inter = martinez.intersection(clip, [[[...face, face[0]]]])

                if (!inter || inter.length === 0) {
                    continue
                }
                ps = inter[0][0]
            } else {
                ps = face
            }
            const points = []
            for (const point of ps) {
                const x = point[0], y = point[1]
                points.push({x, y})
            }

            const shape = new THREE.Shape().setFromPoints(points);
            shapes.push(shape)
            all_points.push(...points)
        }

        let label_point
        all_points.sort((a, b) => {
            return a.x - b.x
        })
        if (all_points[0].y <= all_points[1].y) {
            label_point = all_points[0]
        } else {
            label_point = all_points[1]
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
        let position = new THREE.Vector3(label_point.x, label_point.y, 0);
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
    hide = (hide) => {
        if (this.mesh) {
            this.mesh.visible = !hide
            this.elem.style.visibility = hide ? 'hidden' : 'visible'
        }
    }
}

class MvCamera {
    static json_count = 0

    constructor(parent, name, path, prev) {
        prev && (prev.next = this)
        this.prev = prev

        this.parent = parent
        this.name = name

        this.image_path = path.image
        this.json_path = path.json

        this.objects = []
        ++MvCamera.json_count
        fetch(this.json_path).then(res => res.json()).then(data => {
            this.filename = data['filename']
            prev = null
            for (const object of data.objects) {
                this.objects.push(prev = new MvObject(this, object, prev))
            }
            this.objects.length > 0 && (this.first_object = this.objects[0])
            if (--MvCamera.json_count === 0) {
                document.dispatchEvent(new CustomEvent('properties-init', {
                    cancelable: true
                }));
            }
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

            const clip = [[[0, 0], [width, 0], [width, height], [0, height], [0, 0]]]

            this.objects.forEach(object => object.create_mesh(clip, this.mesh, web_container))
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

    hide = (hide) => {
        this.objects.forEach(object => object.hide(hide))
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

    changeProperty = (src, key, value) => {
        if (src) {
            src.changeProperty(key, value)
            const src_id = src.properties[MvOptions.id_name]
            if (!src_id) {
                return
            }

            this.has_errors = false

            for (const camera in this.cameras) {
                const camera_object = this.cameras[camera]
                camera_object.has_errors = false
                for (const dst of camera_object.objects) {
                    dst.has_errors = false
                    dst.deselect()
                }
            }

            for (const camera in this.cameras) {
                const camera_object = this.cameras[camera]
                for (const dst of camera_object.objects) {
                    const dst_id = dst.properties[MvOptions.id_name]
                    if (src === dst || !dst_id || src_id !== dst_id) {
                        continue
                    }

                    const dst_value = dst.properties[key]
                    if (value !== dst_value) {
                        this.has_errors = true
                        camera_object.has_errors = true
                        src.has_errors = true
                        src.errors[key] = true
                        dst.has_errors = true
                        dst.errors[key] = true

                        src.deselect()
                        dst.deselect()
                    }
                }
            }
        } else {
            this.has_errors = false
            if (this.cell) {
                this.cell.classList.remove('has-errors')
            }

            for (const camera in this.cameras) {
                const camera_object = this.cameras[camera]
                camera_object.has_errors = false
                for (const dst of camera_object.objects) {
                    dst.has_errors = false
                    for (const p_key in dst.properties) {
                        dst.errors[p_key] = false
                        dst.deselect()
                    }
                }
            }

            const camera_keys = Object.keys(this.cameras)
            const length = camera_keys.length

            for (let i = 0; i < length; ++i) {
                const src_camera_object = this.cameras[camera_keys[i]]
                for (let j = i; j < length; ++j) {
                    const dst_camera_object = this.cameras[camera_keys[j]]
                    for (const src_object of src_camera_object.objects) {
                        const src_id = src_object.properties[MvOptions.id_name]
                        if (!src_id) {
                            continue
                        }
                        for (const src_key in src_object.properties) {
                            let src_value = src_object.properties[src_key] || null
                            if (src_value) {
                                src_value = src_value.toString()
                            }

                            for (const dst_object of dst_camera_object.objects) {
                                const dst_id = dst_object.properties[MvOptions.id_name]
                                if (!dst_id || src_id !== dst_id) {
                                    continue
                                }

                                let dst_value = dst_object.properties[src_key] || null
                                if (dst_value) {
                                    dst_value = dst_value.toString()
                                }

                                const same_key = src_key === MvOptions.id_name
                                    && src_camera_object === dst_camera_object
                                    && src_object !== dst_object
                                    && src_value === dst_value

                                if (src_value !== dst_value || same_key) {
                                    this.has_errors = true
                                    if (this.cell) {
                                        this.cell.classList.add('has-errors')
                                    }
                                    src_camera_object.has_errors = true
                                    dst_camera_object.has_errors = true
                                    src_object.has_errors = true
                                    src_object.errors[src_key] = true
                                    dst_object.has_errors = true
                                    dst_object.errors[src_key] = true

                                    src_object.deselect()
                                    dst_object.deselect()
                                }
                            }
                        }
                    }
                }
            }
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

    changeProperty = () => {
        for (const frame in this.frames) {
            this.frames[frame].changeProperty()
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
        MvCamera.json_count = 0
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

    changeProperty = () => {
        for (const scene_name in this.scenes) {
            this.scenes[scene_name].changeProperty()
        }
    }
}

export {MvOptions, MvCamera, MvFrame, MvScene, MvProject}