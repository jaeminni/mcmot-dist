import {MvController} from "./MvApplication"
import {MvOptions} from "./MvObjects";

export default class WebController extends MvController {
    scene_component
    object_component
    properties_component

    constructor(application, scene_component, object_component, properties_component) {
        super(application);

        this.scene_component = scene_component
        this.object_component = object_component
        this.properties_component = properties_component
    }

    create_frame_cell = (frame, count) => {
        const frame_li = document.createElement('li')
        const count_str = ('0' + count).slice(-2)
        frame_li.innerHTML = `${count_str}.${frame.name}`
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

        let count = 0
        for (const frame in scene.frames) {
            nested.appendChild(this.create_frame_cell(scene.frames[frame], ++count))
        }

        scene.cell = scene_li

        return scene_li
    }

    new_project = (project) => {
        if (!project) {
            return
        }
        for (const scene in project.scenes) {
            this.scene_component.appendChild(
                this.create_scene_cell(project.scenes[scene])
            )
        }
    }

    dispose_project = (project) => {
        if (!project) {
            return
        }
        this.scene_component.innerHTML = ''
        for (const scene in project.scenes) {
            for (const frame in project.scenes[scene].frames) {
                this.application.deselect_frame(project.scenes[scene].frames[frame])
            }
            project.scenes[scene].cell = null
        }
    }

    select_frame = (frame) => {
        if (!frame) {
            return
        }
        frame.cell.classList.add('selected')
        for (const camera in frame.cameras) {
            const camera_div = document.createElement('div')
            camera_div.classList.add('nested', 'list')
            frame.cameras[camera].cell = camera_div
            const title = document.createElement('div')
            title.classList.add('title')
            title.textContent = frame.cameras[camera].name
            camera_div.appendChild(title)

            let count = 0
            frame.cameras[camera].objects.forEach(object => {
                const object_div = document.createElement('div')
                object.cell = object_div
                object_div.classList.add('object')
                const count_str = ('0' + ++count).slice(-2)
                object_div.textContent = `${count_str}.${object.properties['type']}`
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
        document.title = `${frame.parent.name}-${frame.name}`
    }
    deselect_frame = (frame) => {
        if (!frame) {
            return
        }
        frame.cell.classList.remove('selected')
        for (const camera in frame.cameras) {
            frame.cameras[camera].objects.forEach(object => {
                object.cell = null
            })
            frame.cameras[camera].cell = null
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
    select_object = async (object) => {
        if (object && object.cell) {
            object.cell.classList.add('selected')

            const title = document.createElement('div')
            title.classList.add('title')
            title.textContent = 'properties'
            title.tabIndex = 1
            this.properties_component.appendChild(title)
            const table = document.createElement('table')
            table.classList.add('list')
            this.properties_component.appendChild(table)

            for (const key in object.properties) {
                const tr = document.createElement('tr')
                table.appendChild(tr)
                const label = document.createElement('td')
                label.textContent = key
                tr.appendChild(label)

                const td = document.createElement('td')
                const input = document.createElement('input')
                input.addEventListener('change', (e) => {
                    if (!Number.isInteger(input.value)) {
                        setTimeout(() => {
                            input.value = object.properties[key]
                            input.select()
                        })
                        return
                    }
                    application.changeProperty(object, key, input.value)
                })
                td.appendChild(input)
                tr.appendChild(td)

                if (key === MvOptions.id_name) {
                    input.type = 'number'
                    input.focus()
                    input.addEventListener('keydown', (e) => {
                        if(!/\d/.test(e.key)) {
                            e.preventDefault();
                            return
                        }
                        if (e.code === 'Enter') {
                            input.blur()
                            document.dispatchEvent(new CustomEvent('object-blur', {
                                cancelable: true,
                            }));
                        }
                    })
                    setTimeout(() => {
                        input.select()
                    })
                } else {
                    input.type = 'text'
                    input.disabled = true
                }
                input.value = object.properties[key]
            }
        }
    }
    deselect_object = (object) => {
        if (object && object.cell) {
            object.cell.classList.remove('selected')
        }
        this.properties_component.innerHTML = ''
    }

    changeProperty = (object, key, value) => {

    }
}
