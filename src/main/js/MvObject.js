import * as THREE from 'three'

export default class MvObject extends THREE.Mesh {
    static default_options = {
        opacity: 0.6, color: 0x0000ff, emissive: 0x000000,
        selecting: 0xff0000, hover: 0x00f000
    }

    constructor(object, options = MvObject.default_options) {
        const properties = {}
        Object.assign(properties, object)

        const faces = properties['geometry']
        const wheels = properties['wheels']

        delete properties['geometry']
        delete properties['wheels']

        const shapes = []
        for (const key in faces) {
            let face = faces[key]
            if (!face) {
                continue
            }

            const points = []
            for (const point of face) {
                points.push({x: point[0], y: point[1]})
            }
            points.push({x: face[0][0], y: face[0][1]})
            const shape = new THREE.Shape().setFromPoints(points);
            shapes.push(shape)
        }

        const geometry = new THREE.ShapeGeometry(shapes);
        const material = new THREE.MeshPhongMaterial({
            side: THREE.DoubleSide,
            depthWrite: false,
            opacity: options.opacity,
            transparent: true,
            wireframe: false,
            color: options.color,
            emissive: options.emissive
        });

        super(geometry, material)
        this.faces = faces
        this.wheels = wheels
        this.properties = properties
        this.options = options
    }
    dispose = () => {
        this.geometry.dispose()
        this.material.dispose()
    }
    selecting = (bool) => {
        this.material.color.set(bool ? this.options.selecting : this.options.color)
    }
    hover = (bool) => {
        this.material.emissive.set(bool ? this.options.hover : this.options.emissive)
    }
}