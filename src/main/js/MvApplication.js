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
}

class MvApplication extends MvController {
    controllers = []
    project
    frame

    constructor() {
        super()
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
    }

    deselect_frame = (frame) => {
        this.controllers.forEach(controller => controller.deselect_frame(frame))
        this.frame = null
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

    save = (forced) => {
        if (this.project) {
            this.project.save(forced)
        }
    }

    changeProperty = (object, key, value) => {
        this.controllers.forEach(controller => controller.changeProperty(object, key, value))
    }

    prev_frame = () => {
        this.frame && this.frame.prev && this.select_frame(this.frame.prev)
    }
    next_frame = () => {
        this.frame && this.frame.next && this.select_frame(this.frame.next)
    }
    prev_object = () => {
        this.selected_object && this.selected_object.prev && this.select_object(this.selected_object.prev)
    }
    next_object = () => {
        let selected_object

        if (this.selected_object && this.selected_object.next) {
            selected_object = this.selected_object.next
        } else if (!this.selected_object && this.selected_camera && this.selected_camera.first_object) {
            selected_object = this.selected_camera.first_object
        }

        selected_object && this.select_object(selected_object)
    }
}

export {MvController, MvApplication}