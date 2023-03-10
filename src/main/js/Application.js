import ImageController from './ImageController'
import Editor from './Editor'
import * as THREE from 'three'

export default class Application {
    constructor(canvas, layout) {
        this.layout = layout
        const editor = new Editor()
        this.editor = editor
        editor.create_renderer({canvas})
        editor.create_scene('back', {color: '#278', light: 0xffffff})
        const camera = editor.create_camera()
        const imageController = new ImageController(camera, canvas)
        editor.start()

        const scenes = []
        this.scenes = scenes
        let hovered, selected

        imageController.hover = (raycaster) => {
            for (const mesh of scenes) {
                const hover = mesh.raycast(raycaster)
                if (hover) {
                    if (hovered) {
                        hovered.hover(false)
                    }
                    hovered = hover.object
                    hovered.hover(true)
                    return
                }
            }
            if (hovered) {
                hovered.hover(false)
                hovered = undefined
            }
        }

        imageController.selecting = (raycaster) => {
            for (const scene of scenes) {
                const selecting = scene.raycast(raycaster)
                if (selecting) {
                    if (selected) {
                        selected.selecting(false)
                    }
                    selected = selecting.object
                    selected.selecting(true)
                    return
                }
            }
            if (selected) {
                selected.selecting(false)
                selected = undefined
            }
        }
    }

    newFrame = (mvFrame) => {
        this.editor.clear_scene('back')
        // this.scenes.length = 0
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
                const offset = layout[position](width, height)

                fetch(json_path).then(res => res.json()).then(data => {
                    const mv_scene = new MvScene(texture, data, offset)
                    this.editor.scene_addObject('back', mv_scene);
                    // this.scenes.push(mv_scene)
                })
            })
        }
    }
}
