class MvController {
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
            this.project = undefined
        }
    }

    select_frame = (frame) => {
        this.frame && this.deselect_frame(this.frame)
        this.controllers.forEach(controller => controller.select_frame(frame))
        this.frame = frame
    }

    deselect_frame = (frame) => {
        this.controllers.forEach(controller => controller.deselect_frame(frame))
        this.frame = undefined
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
        this.hovered_object = undefined
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
        this.selected_camera = undefined
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
        this.selected_object = undefined
    }

    update = () => {
        this.controllers.forEach(controller => controller.update())
    }

    save = (forced) => {
        if (this.project) {
            this.project.save(forced)
        }
    }
}

export {MvController, MvApplication}