import ImageController from './ImageController'
import Editor from './Editor'
import * as THREE from 'three'

export default class Application {
    constructor(canvas, labels, layout) {
        this.labels = labels
        this.layout = layout
        const editor = new Editor()
        this.editor = editor
        editor.create_renderer({canvas})
        editor.create_scene('back', {color: '#278', light: 0xffffff})
        const camera = editor.create_camera()
        const imageController = new ImageController(camera, canvas)
        editor.start()

        imageController.hover = (raycaster) => {
            const mvObject = editor.scene_raycast('back', raycaster)
            if (mvObject) {
            }
        }

        imageController.select = (raycaster, event) => {
            const mvObject = editor.scene_raycast('back', raycaster)
            if (mvObject) {
            }
        }
    }

    newFrame = (mvFrame) => {
        this.editor.clear_scene('back')
        if (!mvFrame) {
            return
        }

        const loader = new THREE.TextureLoader()

        for (const position in mvFrame) {
            const image_path = mvFrame[position].image
            const json_path = mvFrame[position].json

            loader.load(image_path, (texture) => {
                const width = texture.image.naturalWidth;
                const height = texture.image.naturalHeight;
                const offset = this.layout && this.layout[position](width, height)

                fetch(json_path).then(res => res.json()).then(data => {
                    const mv_scene = new MvScene(texture, data, offset)
                    this.editor.scene_addObject('back', mv_scene);
                })
            })
        }
    }
}
