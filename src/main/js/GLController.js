import {MvController} from "./MvApplication";
import ImageControls from "./ImageControls";
import * as THREE from "three";

export default class GLController extends MvController {
    application

    constructor(application, canvas, labels) {
        super();
        this.application = application
        application.controllers.push(this)

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

        this.create_camera()

        this.controls = new ImageControls(this.camera, canvas)
        this.controls.hover = (raycaster) => {
            if (this.frame) {
                for (const _camera in this.frame.cameras) {
                    const {camera, object} = this.frame.cameras[_camera].raycast(raycaster)

                    if (camera || object) {
                        this.application.hover_object(object)
                        return
                    }
                }
                this.application.hover_object()
            }
        }

        this.controls.select = (raycaster) => {
            if (this.frame) {
                for (const _camera in this.frame.cameras) {
                    const {camera, object} = this.frame.cameras[_camera].raycast(raycaster)
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
        this.texture_loader = new THREE.TextureLoader()

        this.start()
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
            label.style.transform = `translate(0, -100%) translate(${x}px,${y}px)`;
        }

        if (this.rendering) {
            requestAnimationFrame(this.render)
        }
    }

    rendering = false

    start() {
        this.rendering = true
        requestAnimationFrame(this.render)
    }

    stop() {
        this.rendering = false
    }

    new_project = (project) => {
        this.project = project
    }

    dispose_project = (project) => {
        this.project = undefined
    }

    select_frame = (frame) => {
        this.frame = frame
        for (const camera in frame.cameras) {
            frame.cameras[camera].create_mesh(this.gl_group, this.labels)
        }
    }
    deselect_frame = (frame) => {
        for (const camera in frame.cameras) {
            frame.cameras[camera].dispose(this.gl_group, this.labels)
        }
        this.labels.innerHTML = ''
        this.frame = undefined
    }
    hover_object = (object) => {
        if (object) {
            object.hover()
        }
    }
    dehover_object = (object) => {
        if (object) {
            object.dehover()
        }
    }
    select_camera = (camera) => {
    }
    deselect_camera = (camera) => {
    }
    select_object = (object) => {
        if (object) {
            object.select()
        }
    }
    deselect_object = (object) => {
        if (object) {
            object.deselect()
        }
    }
}