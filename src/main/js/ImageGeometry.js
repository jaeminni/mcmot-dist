import {BufferGeometry, Float32BufferAttribute} from 'three';

export default class ImageGeometry extends BufferGeometry {
    constructor(width = 1, height = 1) {
        super();
        this.type = 'ImageGeometry';

        this.parameters = {
            width: width,
            height: height
        };

        const vertices = [0, 0, 0, width, 0, 0, 0, height, 0, width, height, 0];
        const normals = [0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1];
        const uvs = [0, 1, 1, 1, 0, 0, 1, 0];
        const indices = [0, 2, 1, 2, 3, 1];

        this.setIndex(indices);
        this.setAttribute('position', new Float32BufferAttribute(vertices, 3));
        this.setAttribute('normal', new Float32BufferAttribute(normals, 3));
        this.setAttribute('uv', new Float32BufferAttribute(uvs, 2));
    }
}
