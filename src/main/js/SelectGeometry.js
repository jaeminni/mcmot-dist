import {BufferGeometry, Float32BufferAttribute, Mesh} from 'three';

class SelectGeometry extends BufferGeometry {
    constructor({x, y} = {x: 0, y: 0}) {
        super();
        this.type = 'SelectGeometry';

        const vertices = [x, y, 0, x, y, 0, x, y, 0, x, y, 0];
        const normals = [0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1];
        const uvs = [0, 1, 1, 1, 0, 0, 1, 0];
        const indices = [0, 2, 1, 2, 3, 1];

        this.setIndex(indices);

        this.position = new Float32BufferAttribute(vertices, 3)
        this.setAttribute('position', this.position);
        this.setAttribute('normal', new Float32BufferAttribute(normals, 3));
        this.setAttribute('uv', new Float32BufferAttribute(uvs, 2));
    }

    update = (origin, target) => {
        const x1 = Math.min(origin.x, target.x)
        const y1 = Math.min(origin.y, target.y)

        const x2 = Math.max(origin.x, target.x)
        const y2 = Math.max(origin.y, target.y)

        this.position.array[0] = x1
        this.position.array[1] = y1

        this.position.array[3] = x2
        this.position.array[4] = y1

        this.position.array[6] = x1
        this.position.array[7] = y2

        this.position.array[9] = x2
        this.position.array[10] = y2

        this.position.needsUpdate = true
    }
}

class SelectMesh extends Mesh {
    static opacity = .15
    static color = 0x0000FF

    constructor(origin) {
        const geometry = new SelectGeometry(origin)
        const material = new THREE.MeshPhongMaterial({
            depthWrite: false,
            transparent: true,
            opacity: SelectMesh.opacity,
            color: SelectMesh.color,
        });
        super(geometry, material)
        this.type = 'SelectMesh'
    }

    update = (origin, target) => {
        this.geometry.update(origin, target)
    }
    dispose = () => {
        this.geometry.dispose()
        this.material.dispose()
    }
}

export {SelectGeometry, SelectMesh}
