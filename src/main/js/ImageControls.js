import * as THREE from 'three'
import {Vector3} from "three";
import {MvMesh} from "./MvMesh";


const STATE = {
    NONE: -1,
    MOVE: 0,
    PAN: 1,
    ZOOM: 2,
}

export default class ImageControls {
    constructor(camera, canvas) {
        this.camera = camera
        this.canvas = canvas
        this.canvas.style.touchAction = 'none'

        this.enabled = true

        this.state = STATE.NONE
        this.raycaster = new THREE.Raycaster()
        this.origin = new THREE.Vector3()
        this.mouse_pointer = new THREE.Vector3()
        this.target_pointer = new THREE.Vector3()
        this.plane = new THREE.Plane()
        camera.getWorldDirection(this.plane.normal)

        this.injection()

        this.update_dpi()
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

        switch (this.state) {
            case STATE.PAN:
                this.pan(event)
                break
            case STATE.MOVE:
                if (this.mouse_move) {
                    this.updateTargetPointer(event)
                    this.mouse_move(this, event)
                }
                break
            default:
                if (this.hover) {
                    this.updateTargetPointer(event)
                    this.hover(this, event)
                }
        }
    }

    update
    hover
    mouse_move
    mouse_down
    mouse_up

    pan = (event) => {
        this.calOffset(event)
        this.addCameraPosition(this.target_pointer.multiplyScalar(-1))
        this.update && this.update()
    }

    calOffset = (event) => {
        this.updateTargetPointer(event)
        return this.target_pointer.sub(this.origin)
    }

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
                if (this.mouse_down) {
                    this.mouse_down(this, event)
                }
        }
    }

    onMouseUp = (event) => {
        if (this.enabled === false) {
            return
        }

        switch (this.state) {
            case STATE.MOVE:
                if (this.mouse_up) {
                    this.updateRaycaster(event)
                    this.mouse_up(this, event)
                }
        }

        this.state = STATE.NONE
    }

    onMouseWheel = (event) => {
        if (this.enabled === false) {
            return
        }

        this.zoom(event, event.deltaY < 0 ? -1 : 1)
    }

    ZOOM_SCALE_SPEED = 0.1
    zoom = (event, direction) => {
        this.updateRaycaster(event);
        this.target_pointer.copy(this.raycaster.ray.direction)
            .multiplyScalar(this.camera.position.z * this.ZOOM_SCALE_SPEED * direction)
        this.addCameraPosition(this.target_pointer)
        this.update_dpi()
        this.update && this.update()
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

    update_dpi = () => {
        this.raycaster.setFromCamera({x: 0, y: 1}, this.camera)
        const top = new Vector3()
        this.raycaster.ray.intersectPlane(this.plane, top)
        this.raycaster.setFromCamera({x: 0, y: -1}, this.camera)
        const bottom = new Vector3()
        this.raycaster.ray.intersectPlane(this.plane, bottom)

        const rect = this.canvas.getBoundingClientRect()

        this.dpi = Math.abs(top.y - bottom.y) / rect.height
        this.raycaster.params.Points.threshold = MvMesh.point_size / 2 * this.dpi
    }
}
