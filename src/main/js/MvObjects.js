import ImageGeometry from "./ImageGeometry";
import * as THREE from "three";
import * as martinez from 'martinez-polygon-clipping'
import {ShapeUtils} from "three";
import {MvBox} from "./MvMesh";

function merge(rect1, rect2) {
    return [
        [Math.min(rect1[0][0], rect2[0][0]), Math.min(rect1[0][1], rect2[0][1])],
        [Math.max(rect1[1][0], rect2[1][0]), Math.max(rect1[1][1], rect2[1][1])]
    ]
}

function contains(rect, point) {
    return !((rect[0][0] - MvMesh.point_size) > point.x || (rect[1][0] + MvMesh.point_size) < point.x
        || (rect[0][1] - MvMesh.point_size) > point.y || (rect[1][1] + MvMesh.point_size) < point.y)
}

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
    static deleted = 0x555555
    static no_id = 0xff0000
    static has_errors = 0xffffff
    static id_name = 'id'
    static epsilon = 0.005
    static useClip = true
}

class MvObject {
    static epsilon = 0.0005
    static pre_data = {}

    constructor(parent, data, prev, index) {
        this.parent = parent
        this.index = index

        prev && (prev.next = this)
        this.prev = prev

        if (data_mapper['to_json']) {
            for (const to_json of data_mapper['to_json']) {
                if (data[to_json]) {
                    data[to_json] = JSON.stringify(data[to_json], null, 2)
                }
            }
        }

        if (!data.hasOwnProperty('deleted')) {
            data.deleted = false
        }

        this.data = data
        this.moved = false

        const track_id = data[MvOptions.id_name] || null

        data[MvOptions.id_name] = track_id
        const properties = {}
        properties[MvOptions.id_name] = track_id
        Object.assign(properties, data)

        this.faces = properties['geometry']
        if (properties.hasOwnProperty('wheels')) {
            this.wheels = properties['wheels']
        }

        delete properties['geometry']
        delete properties['wheels']

        this.properties = properties
        this.errors = {}

        // const mv_id = this.get_id()
        // const pre_data = MvObject.pre_data[mv_id]
        // if (pre_data) {
        //     if (pre_data.faces) {
        //         this.faces = pre_data.faces
        //     }
        //     this.deleted = !!pre_data.deleted
        // }
    }

    // save_position = (position) => {
    //     const mv_id = this.get_id()
    //     const pre_data = MvObject.pre_data[mv_id]
    //
    //     if (pre_data) {
    //         pre_data.faces = position
    //     } else {
    //         MvObject.pre_data[mv_id] = {faces: position}
    //     }
    // }
    //
    // save_deleted = () => {
    //     const mv_id = this.get_id()
    //     const pre_data = MvObject.pre_data[mv_id]
    //
    //     if (pre_data) {
    //         pre_data.deleted = this.deleted
    //     } else {
    //         MvObject.pre_data[mv_id] = {deleted: this.deleted}
    //     }
    // }

    get_id = () => {
        return `${this.parent.get_id()}-${this.index}`
    }

    clip = (clip, face) => {
        const inter = martinez.intersection(clip, [[[...face, face[0]]]])

        if (!inter || inter.length === 0) {
            return
        }
        return inter[0][0]
    }
    toObject = (update = true, clip) => {
        const object = {}

        if (clip) {
            object['geometry'] = this.clip(clip, this.faces).slice(0, 4)
        } else {
            object['geometry'] = this.faces
        }
        // const mv_id = this.get_id()
        // const pre_data = MvObject.pre_data[mv_id]
        // if (pre_data) {
        //     if (pre_data.faces) {
        //         object['geometry'] = pre_data.faces
        //     }
        //     if (!pre_data.deleted) {
        //         object['deleted'] = true
        //     }
        // }

        if (this.hasOwnProperty('wheels')) {
            object['wheels'] = this.wheels
        }
        Object.assign(object, this.properties)

        if (data_mapper['to_json']) {
            for (const to_json of data_mapper['to_json']) {
                if (object[to_json]) {
                    object[to_json] = JSON.parse(object[to_json])
                }
            }
        }

        if (data_mapper['to_int']) {
            for (const to_int of data_mapper['to_int']) {
                if (object[to_int]) {
                    object[to_int] = Number(object[to_int])
                }
            }
        }

        if (update) {
            this.moved = false
            Object.assign(this.data, this.properties)
        }
        return object
    }

    isPropertyChanged = () => {
        if (this.moved) {
            return true
        }

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
        const type = this.properties[data_mapper['key_class']]
        const id = this.properties[MvOptions.id_name] || null
        return type + (id ? ` (${id})` : '')
    }

    mesh
    cell
    has_errors

    get_color = () => {
        if (this.properties.deleted) {
            return MvOptions.deleted
        }
        return this.has_errors ? MvOptions.has_errors : this.properties[MvOptions.id_name] ? MvOptions.color : MvOptions.no_id
    }

    get_shape(clip, shapes, all_points, face) {
        let ps
        if (MvOptions.useClip) {
            const inter = martinez.intersection(clip, [[[...face, face[0]]]])

            if (!inter || inter.length === 0) {
                return
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

    is_equals(v1, v2) {
        return Math.abs(v1 - v2) < MvObject.epsilon
    }

    is_flat(p1, p2) {
        return this.is_equals(p1.x, p2.x) || this.is_equals(p1.y, p2.y)
    }

    is_box(points) {
        if (points.length !== 4) {
            return false
        }

        let flat = true
        for (let i = 0; i < 4; ++i) {
            flat &&= this.is_flat(points[i], points[(i + 1) % 4])
        }

        return flat
    }

    move_end = (position) => {
        // this.save_position(position.map(v => [v.x, v.y]))
        this.faces = position.map(v => [v.x, v.y])
        this.moved = true

        this.compute_rect()
        this.parent.update_rect(this.rect)
    }

    compute_rect = () => {
        this.rect = [[100000, 100000], [-100000, -100000]]

        console.log(this.faces)
        for (const p of this.faces) {
            this.rect = merge(this.rect, [p, p])
        }
    }

    create_mesh = (clip, gl_container, web_container) => {
        if (data_mapper.editable) {
            this.compute_rect()
        }

        if (this.properties.deleted) {
            return
        }

        const shapes = []
        const all_points = []
        if (Array.isArray(this.faces)) {
            this.get_shape(clip, shapes, all_points, this.faces)
        } else {
            for (const key in this.faces) {
                const face = this.faces[key]
                if (!face) {
                    continue
                }
                this.get_shape(clip, shapes, all_points, face)
            }
        }

        let label_point

        this.mv_mesh = null
        // const is_box = this.is_box(all_points)
        if (data_mapper.editable && !MvOptions.useClip) {
            const object = {
                x: all_points[0].x,
                y: all_points[0].y,
                width: all_points[2].x - all_points[0].x,
                height: all_points[2].y - all_points[0].y
            }

            this.mv_mesh = new MvBox(object, this)
            this.mv_mesh.add(gl_container)
            label_point = all_points[0]
        } else {
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
            this.points = new THREE.Points(geometry, new THREE.PointsMaterial({color: 0x00ff00}))
            gl_container.add(this.points)

            // const bufferAttribute = geometry.getAttribute('position')
            // const points = new THREE.Points(geometry, new THREE.PointsMaterial({size: 1.5}));
            // gl_container.add(points)
        }

        const elem = document.createElement('div');
        let position = new THREE.Vector3(label_point.x, label_point.y, 0);
        gl_container.localToWorld(position)
        elem.position = position
        elem.textContent = this.properties[MvOptions.id_name];
        this.elem = elem
        web_container.appendChild(elem);
    }

    dispose = (gl_container, web_container) => {
        if (this.mv_mesh) {
            this.mv_mesh.dispose(gl_container)
            this.mv_mesh = null
        }
        if (this.mesh) {
            gl_container.remove(this.mesh)
            this.mesh.geometry.dispose()
            this.mesh.material.dispose()
            this.mesh = null
        }
        if (this.points) {
            gl_container.remove(this.points)
            this.points.geometry.dispose()
            this.points.material.dispose()
            this.points = null
        }
        this.elem = null
        this.cell = null
    }

    raycast = (controls, type) => {
        const raycaster = controls.raycaster
        if (this.mv_mesh) {
            let target
            switch (type) {
                case 'hover':
                    target = this.mv_mesh.hover(controls)
                    break
                case 'select':
                    target = this.mv_mesh.select(controls)
                    break
            }
            if (target) {
                return {object: this, target}
            }
        }
        if (this.mesh) {
            const intersects = []
            this.mesh.raycast(raycaster, intersects);
            if (intersects.length > 0) {
                return {object: this}
            }
        }

        return {}
    }

    select = () => {
        if (this.mesh) {
            console.log(this)
            window.object = this;
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
        this.relative_path = path.relative_path

        this.objects = []
        this.json_error = false
        ++MvCamera.json_count
        this.index = 0;

        // this.read_object()

        this.layout = MvOptions.layout[name] || (() => {
            return [0, 0]
        })
    }

    read_object = () => {
        if (exists(this.json_path)) {
            const data = read_json(this.json_path)
            this.filename = data['filename']
            this.prev = null
            for (const object of data[data_mapper['key_objects']]) {
                this.objects.push(this.prev = new MvObject(this, object, this.prev, ++this.index))
            }
            this.objects.length > 0 && (this.first_object = this.objects[0])
        } else {
            this.json_error = true
        }
    }

    update_rect = (rect) => {
        this.rect = [[0, 0], [this.width, this.height]]
        this.objects.forEach(object => {
            this.rect = merge(this.rect, object.rect)
        })
        console.log('update_rect', this.rect)
    }
    new_object = (object) => {
        console.log('new_object', object)
        let data = data_mapper.new_object
        if (object) {
            data = JSON.parse(JSON.stringify(object.toObject(false)))
            for (const p of data.geometry) {
                p[0] += 20
                p[1] += 20
            }
        }
        this.objects.push(this.prev = new MvObject(this, data, this.prev, ++this.index))
    }

    get_id = () => {
        return `${this.parent.get_id()}-${this.name}`
    }

    export = () => {
        const content = {}
        content['filename'] = this.filename
        const key_objects = data_mapper['key_objects']
        content[key_objects] = []

        let clip
        if (data_mapper.export && data_mapper.export.useClip) {
            clip = this.clip
        }

        for (const object of this.objects) {
            const o = object.toObject(false, clip)
            const deleted = o.deleted
            delete o.deleted

            if (!deleted) {
                content[key_objects].push(o)
            }
        }

        return {
            relative_path: this.relative_path,
            content
        }
    }

    internal_save(camera_list) {
        if (camera_list) {
            camera_list.push(this)
            return
        }

        const file = {}
        file['filename'] = this.filename
        const key_objects = data_mapper['key_objects']
        file[key_objects] = this.objects.map(object => object.toObject())

        document.dispatchEvent(new CustomEvent('save-camera', {
            cancelable: true,
            detail: {
                path: this.json_path,
                json: JSON.stringify(file, null, 4)
            }
        }));
    }

    save = (forced, camera_list) => {
        let needSave = false
        if (forced) {
            this.internal_save(camera_list)
            needSave = true
        } else {
            for (const object of this.objects) {
                if (object.isPropertyChanged()) {
                    needSave = true
                    break
                }
            }

            if (needSave) {
                this.internal_save(camera_list)
            }
        }

        return needSave
    }

    mesh
    cell

    create_mesh = (gl_container, web_container, callback) => {
        const texture_loader = new THREE.TextureLoader()
        texture_loader.load(this.image_path, (texture) => {
            const width = texture.image.naturalWidth
            const height = texture.image.naturalHeight
            const offset = this.layout(width, height)

            this.width = width
            this.height = height

            const geometry = new ImageGeometry(width, height);
            const material = new THREE.MeshBasicMaterial({
                map: texture, depthWrite: false
            });
            if (this.json_error) {
                // material.opacity = 0.3
                material.color = new THREE.Color(0xff0000)
                // material.transparent = true
            }

            this.mesh = new THREE.Mesh(geometry, material)
            this.mesh.translateX(offset[0])
            this.mesh.translateY(offset[1])
            gl_container.add(this.mesh)

            this.clip = [[[0, 0], [width, 0], [width, height], [0, height], [0, 0]]]

            this.rect = [[0, 0], [width, height]]
            this.objects.forEach(object => {
                object.create_mesh(this.clip, this.mesh, web_container)
                if (data_mapper.editable) {
                    this.rect = merge(this.rect, object.rect)
                }
            })
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


    target = new THREE.Vector3()
    raycast = (controls, type) => {
        const raycaster = controls.raycaster
        if (!this.mesh) {
            return {}
        }

        this.target.copy(controls.target_pointer)
        this.mesh.worldToLocal(this.target)

        if (contains(this.rect, this.target)) {
            for (const _object of this.objects) {
                const {object, target} = _object.raycast(controls, type)
                if (object) {
                    return {camera: this, object, target}
                }
            }
            return {camera: this}
        }

        // const intersects = []
        // this.mesh.raycast(raycaster, intersects);
        // if (intersects.length > 0) {
        //     this.target.copy(controls.target_pointer)
        //     this.mesh.worldToLocal(this.target)
        //     console.log(controls.target_pointer, raycaster, intersects[0], this.target)
        //     for (const _object of this.objects) {
        //         const {object, target} = _object.raycast(controls, type)
        //         if (object) {
        //             return {camera: this, object, target}
        //         }
        //     }
        //     return {camera: this}
        // }

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

    get_cameras = (list = []) => {
        for (const camera_name in this.cameras) {
            list.push(this.cameras[camera_name])
        }
        return list
    }

    get_id = () => {
        return `${this.parent.get_id()}-${this.name}`
    }

    export = () => {
        const list = []
        for (const camera in this.cameras) {
            list.push(this.cameras[camera].export())
        }

        return list
    }

    save = (forced, camera_list) => {
        let needSave = false
        for (const camera in this.cameras) {
            needSave |= this.cameras[camera].save(forced, camera_list)
        }
        return needSave
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

            const set_error = (src_camera_object, dst_camera_object, src_object, dst_object, src_key) => {
                this.has_errors = true
                if (this.cell) {
                    this.cell.classList.add('has-errors')
                }

                src_camera_object && (src_camera_object.has_errors = true)
                dst_camera_object && (dst_camera_object.has_errors = true)
                src_object && (src_object.has_errors = true)
                src_object && (src_object.errors[src_key] = true)
                dst_object && (dst_object.has_errors = true)
                dst_object && (dst_object.errors[src_key] = true)

                src_object && src_object.deselect()
                dst_object && dst_object.deselect()
            }

            for (let i = 0; i < length; ++i) {
                const src_camera_object = this.cameras[camera_keys[i]]
                if (src_camera_object.json_error) {
                    set_error(src_camera_object)
                    continue
                }
                for (let j = i; j < length; ++j) {
                    const dst_camera_object = this.cameras[camera_keys[j]]
                    for (const src_object of src_camera_object.objects) {
                        const src_id = src_object.properties[MvOptions.id_name]
                        if (!src_id) {
                            set_error(src_camera_object, null, src_object, null, MvOptions.id_name)
                            continue
                        }
                        for (const src_key in src_object.properties) {
                            let src_value = src_object.properties[src_key] || null
                            if (src_value) {
                                src_value = src_value.toString()
                            }

                            for (const dst_object of dst_camera_object.objects) {
                                const dst_id = dst_object.properties[MvOptions.id_name]
                                if (!dst_id) {
                                    set_error(null, dst_camera_object, null, dst_object, MvOptions.id_name)
                                    continue
                                } else if (src_id !== dst_id) {
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

                                if (same_key) {
                                    set_error(src_camera_object, dst_camera_object, src_object, dst_object, src_key)
                                } else if (src_value !== dst_value && propertiesConfig['editable']) {
                                    set_error(src_camera_object, dst_camera_object, src_object, dst_object, src_key)
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

    get_cameras = (list = []) => {
        for (const frame_name in this.frames) {
            this.frames[frame_name].get_cameras(list)
        }
        return list
    }

    get_id = () => {
        return this.name
    }

    export = () => {
        const list = []
        for (const frame in this.frames) {
            list.push(...this.frames[frame].export())
        }

        return list
    }

    save = (forced, camera_list) => {
        let needSave = false
        for (const frame in this.frames) {
            needSave |= this.frames[frame].save(forced, camera_list)
        }
        return needSave
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

function replace_data(data, label) {
    const replace = label.match(/{(\d+)}/g)
    replace.forEach(match => {
        const exec = /{(\d+)}/.exec(match)
        if (exec) {
            label = label.replaceAll(match, data[exec[1]])
        }
    })

    return label
}

class MvProject {
    static REGEX = /camera_(front|rear)_(left|center|right)_(forward|backward)_fov(60|100).*\/SCENE-(\w+)-(\d+)_FRAME_(\d+)\.(json|jpg|png)$/i

    constructor(files) {
        MvObject.pre_data = {}

        const scenes = {}
        MvCamera.json_count = 0
        for (const file of files) {
            const exec = data_mapper.re.exec(file)
            const scene = getObject(scenes, replace_data(exec, data_mapper.scene))
            const frame = getObject(scene, replace_data(exec, data_mapper.frame))
            const camera = getObject(frame, replace_data(exec, data_mapper.camera))
            const target = /json/i.test(replace_data(exec, data_mapper.ext)) ? 'json' : 'image'
            camera[target] = file
            camera['relative_path'] = exec[0]
        }
        this.scenes = {}

        for (const scene_name in scenes) {
            this.scenes[scene_name] = new MvScene(this, scene_name, scenes[scene_name])
        }
    }

    get_cameras = (list = []) => {
        for (const scene_name in this.scenes) {
            this.scenes[scene_name].get_cameras(list)
        }
        return list
    }

    export = () => {
        const list = []
        for (const scene_name in this.scenes) {
            list.push(...this.scenes[scene_name].export())
        }

        return list
    }

    save = (forced, camera_list) => {
        let needSave = false
        for (const scene_name in this.scenes) {
            needSave |= this.scenes[scene_name].save(forced, camera_list)
        }
        return needSave
    }

    changeProperty = () => {
        for (const scene_name in this.scenes) {
            this.scenes[scene_name].changeProperty()
        }
    }
}

export {MvOptions, MvObject, MvCamera, MvFrame, MvScene, MvProject}
