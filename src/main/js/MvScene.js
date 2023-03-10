import * as THREE from 'three'
import ImageGeometry from "./ImageGeometry";
import MvObject from "./MvObject";

export default class MvScene extends THREE.Mesh {
    constructor(texture, data, offset = [0, 0]) {
        const width = texture.image.naturalWidth;
        const height = texture.image.naturalHeight;

        const geometry = new ImageGeometry(width, height);
        const material = new THREE.MeshBasicMaterial({
            map: texture, depthWrite: false
        });
        super(geometry, material);

        this.translateX(offset[0])
        this.translateY(offset[1])

        this.filename = data.filename
        for (const object of data.objects) {
            this.add(new MvObject(object))
        }
    }

    raycast = (raycaster) => {
        let intersects = []
        super.raycast(raycaster, intersects);
        if (intersects.length > 0) {
            const children = intersects[0].object.children
            intersects = []
            for (const child of children) {
                child.raycast(raycaster, intersects);
                if (intersects.length > 0) {
                    return intersects[0]
                }
            }
        }
    }

    dispose = () => {
        this.geometry.dispose()
        this.material.dispose()

        for (const child of this.children) {
            this.remove(child)
            child.dispose()
        }
    }
}