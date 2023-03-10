export default class MvProject {
    static REGEX = /camera_(front|rear)_(left|center|right)_(forward|backward)_fov(60|100)\/SCENE-(\w)-(\d+)_FRAME_(\d+)\.(json|jpg|png)$/

    constructor(files) {
        this.scenes = {}

        for (const file of files) {
            const exec = MvProject.REGEX.exec(file)

            const scene = this.getObject(this.scenes, `SCENE-${exec[5]}-${exec[6]}`)
            const frame = this.getObject(scene, exec[7])
            const position = this.getObject(frame, `${exec[1]}_${exec[2]}_${exec[3]}_${exec[4]}`)
            const target = /json/i.test(exec[8]) ? 'json': 'image'
            position[target] = file
        }
    }

    getObject = (object, key) => {
        if (!object[key]) {
            object[key] = {}
        }
        return object[key]
    }
}