import * as THREE from 'three'


const STATE = {
    NONE: -1,
    MOVE: 0,
    PAN: 1,
    ZOOM: 2,
}

export default class ImageController {
    constructor(camera, canvas) {
        this.camera = camera
        this.canvas = canvas
        this.canvas.style.touchAction = 'none'

        this.enabled = true

        this.state = STATE.NONE
        this.raycaster = new THREE.Raycaster()
        this.mouse_pointer = new THREE.Vector3()
        this.target_pointer = new THREE.Vector3()
        this.plane = new THREE.Plane()
        camera.getWorldDirection(this.plane.normal)

        this.injection()
    }

    injection = () => {
        this.canvas.addEventListener('contextmenu', this.onContextMenu)

        this.canvas.addEventListener('mousemove', this.onMouseMove)
        this.canvas.addEventListener('mousedown', this.onMouseDown)
        this.canvas.addEventListener('mouseup', this.onMouseUp)

        this.canvas.addEventListener('wheel', this.onMouseWheel)
    }

    dispose = () => {
        this.canvas.removeEventListener('contextmenu', this.onContextMenu)

        this.canvas.removeEventListener('mousemove', this.onMouseMove)
        this.canvas.removeEventListener('mousedown', this.onMouseDown)
        this.canvas.removeEventListener('mouseup', this.onMouseUp)

        this.canvas.removeEventListener('wheel', this.onMouseWheel)
    }

    onContextMenu = (event) => {
        if (this.enabled === false) {
            return
        }

        event.preventDefault()
    }

    onMouseMove = (event) => {
        if (this.enabled === false) {
            return
        }

        if (this.hover) {
            this.updateRaycaster(event)
            this.hover(this.raycaster, event)
        }

        switch (this.state) {
            case STATE.PAN:
                this.pan(event)
                break
            case STATE.MOVE:
                this.move(event)
                break
            default:
        }
    }

    move = (event) => {
        return true
    }

    selecting // (event, offset)
    hover

    pan = (event) => {
        this.calOffset(event)
        this.addCameraPosition(this.target_pointer.multiplyScalar(-1))
    }

    calOffset = (event) => {
        this.updateTargetPointer(event)
        return this.target_pointer.sub(this.origin)
    }

    origin = new THREE.Vector3()
    onMouseDown = (event) => {
        if (this.enabled === false) {
            return
        }

        this.updateOrigin(event)

        switch (event.button) {
            case THREE.MOUSE.RIGHT:
                this.state = STATE.PAN
                break
            case THREE.MOUSE.LEFT:
                this.state = STATE.MOVE
        }
    }

    onMouseUp = (event) => {
        if (this.enabled === false) {
            return
        }

        switch (this.state) {
            case STATE.MOVE:
                if (this.selecting) {
                    this.updateRaycaster(event)
                    this.selecting(this.raycaster, event)
                }
        }

        this.state = STATE.NONE
    }

    onMouseWheel = (event) => {
        if (this.enabled === false) {
            return
        }

        this.zoom(event, event.deltaY < 0 ? 1 : -1)
    }

    ZOOM_SCALE_SPEED = 0.1
    zoom = (event, direction) => {
        this.updateRaycaster(event);
        this.target_pointer.copy(this.raycaster.ray.direction)
            .multiplyScalar(Math.abs(this.camera.position.z) * this.ZOOM_SCALE_SPEED * direction)

        // this.updateTargetPointer(event)
        // this.target_pointer.sub(this.camera.position).normalize()
        //     .multiplyScalar(Math.abs(this.camera.position.z) * this.ZOOM_SCALE_SPEED * direction)
        this.addCameraPosition(this.target_pointer)
    }

    addCameraPosition = (diff) => {
        this.camera.position.add(diff)
        this.camera.updateMatrixWorld()
    }

    updateOrigin = (event) => {
        this.updateTargetPointer(event)
        this.origin.copy(this.target_pointer)
    }

    updateTargetPointer = (event) => {
        this.updateRaycaster(event)
        this.raycaster.ray.intersectPlane(this.plane, this.target_pointer)
    }

    updateRaycaster = (event) => {
        const rect = this.canvas.getBoundingClientRect()

        this.mouse_pointer.x = (event.clientX - rect.left) / rect.width * 2 - 1
        this.mouse_pointer.y = -(event.clientY - rect.top) / rect.height * 2 + 1

        this.raycaster.setFromCamera(this.mouse_pointer, this.camera)
    }
}
