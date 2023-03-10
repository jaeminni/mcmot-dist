import * as THREE from 'three'

export default class Editor {
    renderer
    scenes = {}
    camera
    controllers = {}

    create_renderer(parameters = {}) {
        const renderer = new THREE.WebGLRenderer(parameters)
        renderer.setPixelRatio(window.devicePixelRatio)
        return this.renderer = renderer
    }

    clear_scene(key) {
        const scene = this.scenes[key]
        const group = scene.group;
        for (const object of group.children) {
            group.remove(object)
            object.dispose()
        }

        group.clear()
    }

    create_scene(key, parameters = {}) {
        const scene = new THREE.Scene()

        if (parameters.color) {
            scene.background = new THREE.Color(parameters.color)
        }
        if (parameters.light) {
            const light = new THREE.AmbientLight(parameters.light)
            scene.add(light)
        }

        const group = new THREE.Group()
        scene.add(group)
        scene.group = group

        return this.scenes[key] = scene
    }

    scene_raycast(key, raycaster) {
        const scene = this.scenes[key]
        const group = scene.group
        if (group) {
            for (const mvScene of group.children) {
                const intersect = mvScene.raycast(raycaster)
                if (intersect) {
                    return {scene: mvScene, object: intersect.object}
                }
            }
        }

        return {}
    }

    scene_addObject(key, object) {
        const scene = this.scenes[key]
        if (scene.group) {
            scene.group.add(object)
        }
    }

    create_camera(fov = 60, near = 0.1, far = 50000) {
        const canvas = this.renderer.domElement
        const width = canvas.clientWidth
        const height = canvas.clientHeight

        const aspect = width / height

        const camera = new THREE.PerspectiveCamera(fov, aspect, near, far)
        camera.up = new THREE.Vector3(0, -1, 0)
        camera.position.set(0, 0, -640)
        camera.lookAt(0, 0, 0)
        camera.updateProjectionMatrix()
        // camera.matrixWorldAutoUpdate = false

        this.camera = camera
        return camera
    }

    needResize() {
        const canvas = this.renderer.domElement
        const width = canvas.clientWidth
        const height = canvas.clientHeight

        const resize = canvas.width !== width || canvas.height !== height
        if (resize) {
            this.renderer.setSize(width, height, false)
            this.camera.aspect = canvas.clientWidth / canvas.clientHeight
            this.camera.updateProjectionMatrix()
        }
    }

    will_render
    did_render

    render = (time) => {
        this.needResize()

        this.renderer.clear()

        this.will_render && this.will_render(this.renderer, time)
        for (const key in this.scenes) {
            this.renderer.autoClear = false
            this.renderer.clearDepth()
            this.renderer.render(this.scenes[key], this.camera)
        }
        this.did_render && this.did_render(this.renderer, time)

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
}
