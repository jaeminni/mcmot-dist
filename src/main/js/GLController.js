import {MvController} from "./MvApplication";
import ImageControls from "./ImageControls";
import * as THREE from "three";
import {SelectMesh} from "./SelectGeometry";
import {MvOptions} from "./MvObjects";

export default class GLController extends MvController {
    constructor(application, canvas, labels) {
        super(application);

        this.canvas = canvas
        this.labels = labels

        const renderer = new THREE.WebGLRenderer({canvas})
        renderer.setPixelRatio(window.devicePixelRatio)
        this.renderer = renderer

        const gl_scene = new THREE.Scene()
        this.gl_scene = gl_scene
        gl_scene.background = new THREE.Color('#278')
        gl_scene.add(new THREE.AmbientLight(0xffffff))
        this.gl_group = new THREE.Group()
        gl_scene.add(this.gl_group)
        this.gl_select = new THREE.Group()
        gl_scene.add(this.gl_select)

        this.create_camera()

        this.controls = new ImageControls(this.camera, canvas)
        this.texture_loader = new THREE.TextureLoader()

        this.update()
    }


    moved = false
    mouse_move = (control, event) => {
        this.moved = true
        switch (this.move_mode) {
            case 'object_select':
                this.select_mesh.update(control.origin, control.target_pointer)
                break
            case 'object_move':
                this.intersects.forEach(intersect => {
                    const object = intersect.object
                    const index = intersect.index

                    object.move(index, control, event)
                })
                break
        }

        this.update()
    }

    move_mode = null
    select_mesh = null
    intersects = []
    origin = new THREE.Vector3()
    offset = new THREE.Vector3()

    start_select = (control, event) => {
        this.select_mesh = new SelectMesh(control.origin)
        this.gl_select.add(this.select_mesh)
    }

    end_select = (control, event) => {
        this.gl_select.remove(this.select_mesh)
        this.select_mesh.dispose()
        this.select_mesh = null
    }

    mouse_down = (controls, event) => {
        this.moved = false
        this.move_mode = null
        let selected
        if (!MvOptions.useClip) {
            if (this.frame) {
                for (const _camera in this.frame.cameras) {
                    const {camera, object, target} = this.frame.cameras[_camera].raycast(controls, 'select')
                    if(target) {
                        selected = target
                        break
                    }
                }
            }
        }

        if (selected) {
            this.move_mode = 'object_move'
            this.intersects = [selected]
        } else {
            // this.move_mode = 'object_select'
            // console.log('object_select')
            // this.start_select(controls, event)
        }
        this.update()
    }

    mouse_up = (controls, event) => {
        if (!this.moved) {
            this.select(controls, event)
            return
        }
        switch (this.move_mode) {
            case 'object_select':
                this.end_select(controls, event)
                break
            case 'object_move':
                this.intersects.forEach(intersect => {
                    const object = intersect.object
                    object.move_end()
                })
                break
        }
        this.move_mode = null
        this.update()
    }

    create_camera = (fov = 60, near = 0.1, far = 50000) => {
        const canvas = this.canvas
        const width = canvas.clientWidth
        const height = canvas.clientHeight

        const aspect = width / height

        const camera = new THREE.PerspectiveCamera(fov, aspect, near, far)
        camera.up = new THREE.Vector3(0, -1, 0)
        camera.position.set(0, 0, -640)
        camera.lookAt(0, 0, 0)
        camera.updateProjectionMatrix()

        this.camera = camera
    }

    needResize = () => {
        const canvas = this.canvas
        const width = canvas.clientWidth
        const height = canvas.clientHeight

        const resize = canvas.width !== width || canvas.height !== height
        if (resize) {
            this.renderer.setSize(width, height, false)
            this.camera.aspect = canvas.clientWidth / canvas.clientHeight
            this.camera.updateProjectionMatrix()
        }
    }

    render = (time) => {
        this.needResize()

        this.renderer.clear()

        this.renderer.autoClear = false
        this.renderer.clearDepth()
        this.renderer.render(this.gl_scene, this.camera)

        const temp = new THREE.Vector3();
        for (const label of this.labels.children) {
            const position = label.position;
            temp.copy(position);
            temp.project(this.camera);
            const x = (temp.x * .5 + .5) * this.canvas.clientWidth;
            const y = (temp.y * -.5 + .5) * this.canvas.clientHeight;
            label.style.transform = `translate(0, 0) translate(${x}px,${y}px)`;
        }

        if (this.rendering) {
            requestAnimationFrame(this.render)
        }
    }

    rendering = false

    start = () => {
        // this.rendering = true
        // requestAnimationFrame(this.render)
    }

    stop = () => {
        // this.rendering = false
    }

    update = () => {
        requestAnimationFrame(this.render)
    }

    new_project = (project) => {
        this.project = project
    }

    dispose_project = (project) => {
        this.project = null
        for (const scene in project.scenes) {
            for (const _frame in project.scenes[scene]) {
                const frame = project.scenes[scene][_frame]
                for (const camera in frame.cameras) {
                    frame.cameras[camera].dispose(this.gl_group, this.labels, this.update)
                }
            }
        }
        this.labels.innerHTML = ''
        this.frame = null
        this.controls.hover = null
        this.controls.select = null
        this.update()
    }

    hover = (controls, event) => {
        if (this.frame) {
            for (const _camera in this.frame.cameras) {
                const {camera, object} = this.frame.cameras[_camera].raycast(controls, 'hover')

                if (camera || object) {
                    this.application.hover_object(object)
                    return
                }
            }
            this.application.hover_object()
        }
    }

    select = (controls, event) => {
        if (this.frame) {
            for (const _camera in this.frame.cameras) {
                const {camera, object} = this.frame.cameras[_camera].raycast(controls, 'select')
                if (camera || object) {
                    this.application.select_camera(camera)
                    this.application.select_object(object)
                    return
                }
            }
            this.application.select_camera()
            this.application.select_object()
        }
    }

    select_frame = (frame) => {
        if (!frame) {
            return
        }
        for (const camera in frame.cameras) {
            frame.cameras[camera].create_mesh(this.gl_group, this.labels, this.update)
        }
        this.frame = frame
        this.controls.update = this.update
        this.controls.hover = this.hover
        this.controls.mouse_move = this.mouse_move
        this.controls.mouse_down = this.mouse_down
        this.controls.mouse_up = this.mouse_up
        this.update()
    }
    deselect_frame = (frame) => {
        if (!frame) {
            return
        }
        for (const camera in frame.cameras) {
            frame.cameras[camera].dispose(this.gl_group, this.labels, this.update)
        }
        this.labels.innerHTML = ''
        this.frame = null
        this.controls.update = null
        this.controls.hover = null
        this.controls.mouse_move = null
        this.controls.mouse_down = null
        this.controls.mouse_up = null
        this.update()
    }
    hover_object = (object) => {
        if (object) {
            object.hover()
            this.update()
        }
    }
    dehover_object = (object) => {
        if (object) {
            object.dehover()
            this.update()
        }
    }
    select_camera = (camera) => {
    }
    deselect_camera = (camera) => {
    }
    select_object = (object) => {
        if (object) {
            object.select()
            this.update()
        }
    }
    deselect_object = (object) => {
        if (object) {
            object.deselect()
            this.update()
        }
    }
    changeProperty = (object, key, value) => {
        // object.changeProperty(key, value)
    }
    toggle_hide = (frame, hide) => {
        for (const camera in frame.cameras) {
            frame.cameras[camera].hide(hide)
        }
    }
}
