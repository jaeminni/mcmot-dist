import {MvController} from "./MvApplication"

export default class WebController extends MvController {
    application
    scene_component
    object_component
    properties_component

    constructor(application, scene_component, object_component, properties_component) {
        super();
        this.application = application
        application.controllers.push(this)
        this.scene_component = scene_component
        this.object_component = object_component
        this.properties_component = properties_component
    }

    create_frame_cell = (frame) => {
        const frame_li = document.createElement('li')
        frame_li.innerHTML = frame.name
        frame_li.addEventListener('click', () => {
            this.application.select_frame(frame)
        })

        frame.cell = frame_li

        return frame_li
    }

    create_scene_cell = (scene) => {
        const span = document.createElement('span')
        span.className = 'caret'
        span.innerHTML = scene.name

        const nested = document.createElement('ul')
        nested.className = 'nested'

        span.addEventListener("click", function () {
            nested.classList.toggle("active");
            span.classList.toggle("caret-down");
        });

        const scene_li = document.createElement('li')
        scene_li.appendChild(span)
        scene_li.appendChild(nested)

        for (const frame in scene.frames) {
            nested.appendChild(this.create_frame_cell(scene.frames[frame]))
        }

        scene.cell = scene_li

        return scene_li
    }

    new_project = (project) => {
        for (const scene in project.scenes) {
            this.scene_component.appendChild(
                this.create_scene_cell(project.scenes[scene])
            )
        }
    }

    dispose_project = (project) => {
        this.scene_component.innerHTML = ''
        for (const scene in project.scenes) {
            for (const frame in project.scenes[scene].frames) {
                project.scenes[scene].frames[frame].cell = undefined
            }
            project.scenes[scene].cell = undefined
        }
    }

    select_frame = (frame) => {
        frame.cell.classList.add('selected')
        for (const camera in frame.cameras) {
            const camera_div = document.createElement('div')
            camera_div.classList.add('nested', 'list')
            frame.cameras[camera].cell = camera_div
            frame.cameras[camera].objects.forEach(object => {
                const object_div = document.createElement('div')
                object.cell = object_div
                object_div.classList.add('object')
                object_div.textContent = object.properties['type']
                object_div.addEventListener('click', () => {
                    this.application.select_camera(frame.cameras[camera])
                    this.application.select_object(object)
                })
                object_div.addEventListener('mouseover', () => {
                    this.application.hover_object(object)
                })
                camera_div.appendChild(object_div)
            })
            this.object_component.appendChild(camera_div)
        }
    }
    deselect_frame = (frame) => {
        frame.cell.classList.remove('selected')
        for (const camera in frame.cameras) {
            frame.cameras[camera].objects.forEach(object => {
                object.cell = undefined
            })
            frame.cameras[camera].cell = undefined
        }
        this.object_component.innerHTML = ''
        this.properties_component.innerHTML = ''
    }
    hover_object = (object) => {
        if (object && object.cell) {
            object.cell.classList.add('object_hover')
        }
    }
    dehover_object = (object) => {
        if (object && object.cell) {
            object.cell.classList.remove('object_hover')
        }
    }
    select_camera = (camera) => {
        if (camera && camera.cell) {
            camera.cell.classList.add('active')
        }
    }
    deselect_camera = (camera) => {
        if (camera && camera.cell) {
            camera.cell.classList.remove('active')
        }
    }
    select_object = (object) => {
        if (object && object.cell) {
            object.cell.classList.add('selected')

            const table = document.createElement('table')
            table.classList.add('list')
            this.properties_component.appendChild(table)

            for (const key in object.properties) {
                const tr = document.createElement('tr')
                table.appendChild(tr)
                {
                    const td = document.createElement('td')
                    td.textContent = key
                    tr.appendChild(td)
                }
                {
                    const td = document.createElement('td')
                    const input = document.createElement('input')
                    input.type = 'text'
                    input.value = object.properties[key]
                    input.addEventListener('change', () => {
                        object.properties[key] = input.value
                    })
                    td.appendChild(input)
                    tr.appendChild(td)
                }
            }
        }
    }
    deselect_object = (object) => {
        if (object && object.cell) {
            object.cell.classList.remove('selected')
        }
        this.properties_component.innerHTML = ''
    }
}
