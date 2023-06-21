import {MvOptions} from "./MvObjects";

class MvController {
    application

    constructor(application) {
        if (application) {
            this.application = application
            application.controllers.push(this)
        }
    }

    new_project = (project) => {
    }
    dispose_project = (project) => {
    }
    select_frame = (frame) => {
    }
    deselect_frame = (frame) => {
    }
    hover_object = (object) => {
    }
    dehover_object = (object) => {
    }
    select_camera = (camera) => {
    }
    deselect_camera = (camera) => {
    }
    select_object = (object) => {
    }
    deselect_object = (object) => {
    }
    update = () => {
    }
    changeProperty = (object, key, value) => {
    }
    prev_frame = () => {
    }
    next_frame = () => {
    }
    prev_object = () => {
    }
    next_object = () => {
    }
    toggle_hide = () => {
    }
    toggle_clipping = () => {
    }
}

class MvApplication extends MvController {
    version = "v1.0.6"
    controllers = []
    project
    frame

    constructor() {
        super()

        document.addEventListener('properties-init', () => {
            this.project && this.project.changeProperty()
        });
    }

    export = () => {
        if (this.project) {
            return this.project.export()
        }
    }

    new_project = (project) => {
        this.project && this.dispose_project(this.project)
        if (project) {
            this.controllers.forEach(controller => controller.new_project(project))
            this.project = project
        }
    }

    dispose_project = (project) => {
        if (project) {
            this.controllers.forEach(controller => controller.dispose_project(project))
            this.project = null
        }
    }

    select_frame = (frame) => {
        this.frame && this.deselect_frame(this.frame)
        this.controllers.forEach(controller => controller.select_frame(frame))
        this.frame = frame
        document.dispatchEvent(new CustomEvent('object-blur', {
            cancelable: true,
        }));
    }

    deselect_frame = (frame) => {
        this.controllers.forEach(controller => controller.deselect_frame(frame))
        this.frame = null
        this.selected_camera = null
        this.selected_object = null
        this.hide = false
    }
    hover_object = (object) => {
        if (this.hovered_object === object) {
            return
        }

        this.hovered_object && this.dehover_object(this.hovered_object)
        this.controllers.forEach(controller => controller.hover_object(object))
        this.hovered_object = object
    }
    dehover_object = (object) => {
        this.controllers.forEach(controller => controller.dehover_object(object))
        this.hovered_object = null
    }

    new_object = () => {
        if (data_mapper.editable && this.selected_camera) {
            const camera = this.selected_camera

            camera.new_object(this.selected_object)

            this.select_frame(this.frame)
            this.deselect_camera(camera)
            this.select_camera(camera)
        }
    }

    reselect_camera = () => {
        const frame = this.frame
        const camera = this.selected_camera

        this.select_frame(frame)
        this.deselect_camera(camera)
        this.select_camera(camera)
    }

    select_camera = (camera) => {
        if (this.selected_camera === camera) {
            return
        }

        this.selected_camera && this.deselect_camera(this.selected_camera)
        this.controllers.forEach(controller => controller.select_camera(camera))
        this.selected_camera = camera
    }
    deselect_camera = (camera) => {
        this.controllers.forEach(controller => controller.deselect_camera(camera))
        this.selected_camera = null
    }

    select_object = (object) => {
        if (this.selected_object === object) {
            return
        }

        this.selected_object && this.deselect_object(this.selected_object)
        this.controllers.forEach(controller => controller.select_object(object))
        this.selected_object = object
    }
    deselect_object = (object) => {
        this.controllers.forEach(controller => controller.deselect_object(object))
        this.selected_object = null
    }

    update = () => {
        this.controllers.forEach(controller => controller.update())
    }

    save = (forced, camera_list) => {
        if (this.project) {
            return this.project.save(forced, camera_list)
        }
    }

    changeProperty = (object, key, value) => {
        object.changeProperty(key, value)
        object.parent.parent.changeProperty()
        this.controllers.forEach(controller => controller.changeProperty(object, key, value))
        this.update()
    }

    prev_frame = () => {
        this.frame && this.frame.prev && this.select_frame(this.frame.prev)
    }
    next_frame = () => {
        this.frame && this.frame.next && this.select_frame(this.frame.next)
    }

    object_blur = () => {
        const window_content = document.querySelector('.window-content')
        window_content.focus()
    }
    prev_object = () => {
        this.object_blur()
        this.selected_object && this.selected_object.prev && this.select_object(this.selected_object.prev)
    }
    next_object = () => {
        this.object_blur()
        let selected_object

        if (this.selected_object && this.selected_object.next) {
            selected_object = this.selected_object.next
        } else if (!this.selected_object && this.selected_camera && this.selected_camera.first_object) {
            selected_object = this.selected_camera.first_object
        }

        selected_object && this.select_object(selected_object)
    }

    hide = false
    toggle_hide = () => {
        this.hide = !this.hide
        this.frame && this.controllers.forEach(controller => controller.toggle_hide(this.frame, this.hide))
        this.update()
    }

    toggle_clipping = () => {
        MvOptions.useClip = !MvOptions.useClip
        if (this.frame) {
            const frame = this.frame;

            (async () => {
                this.deselect_frame(frame)
            })().then(() => {
                this.select_frame(frame)
            })
        }
    }
}

export {MvController, MvApplication}
