import * as THREE from 'three';
import {Raycaster, Vector2} from "three";

import {LineGeometry} from "three/examples/jsm/lines/LineGeometry";
import {Line2} from "three/examples/jsm/lines/Line2";
import {LineMaterial} from "three/examples/jsm/lines/LineMaterial";

const get_box_geometry = ({x, y, width, height}) => {
    const geometry = new THREE.BufferGeometry()

    const vertices = [x, y, 0, x + width, y, 0, x, y + height, 0, x + width, y + height, 0];
    const normals = [0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1];
    const uvs = [0, 1, 1, 1, 0, 0, 1, 0];
    const indices = [0, 2, 1, 2, 3, 1];

    geometry.setIndex(indices);
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));

    geometry.vertices = vertices

    return geometry
}

const get_material = (options = {opacity: 0.6, color: 0xFFFFFF, emissive: 0x000000}) => {
    return new THREE.MeshPhongMaterial({
        depthWrite: false,
        transparent: true,
        opacity: options.opacity,
        color: options.color,
        emissive: options.emissive
    });
}

const disc = new THREE.TextureLoader().load('textures/disc.png')

class MvMesh {
    static point_size = 10
    static point_size_attenuation = false

    object_mesh = []
    points_mesh

    editable = true
}


class MvBox extends MvMesh {
    constructor(object) {
        super()
        this.geometry = get_box_geometry(object)
        this.material = get_material()

        this.main = new THREE.Mesh(this.geometry, this.material)
        this.object_mesh.push(this.main)

        this.points_mesh = new THREE.Points(this.geometry, new THREE.PointsMaterial({
            depthWrite: false,
            size: MvMesh.point_size,
            sizeAttenuation: MvMesh.point_size_attenuation,
            map: disc, alphaTest: 0.6,
            // side: THREE.DoubleSide
        }))
        this.move_end()
    }

    worldUnits = (worldUnits) => {
        this.line.material.worldUnits = worldUnits
        this.line.material.needsUpdate = true
    }

    resolution = (resolution) => {
        this.line.material.resolution = resolution
        this.line.material.needsUpdate = true
    }

    add = (gl_container) => {
        this.group = new THREE.Group()
        this.group.add(this.main)
        this.group.add(this.points_mesh)

        gl_container.add(this.group)

        this.gl_container = gl_container
    }

    dispose = (gl_container) => {
        if (this.group) {
            gl_container.remove(this.group)

            this.main.geometry.dispose()
            this.main.material.dispose()
            this.points_mesh.geometry.dispose()
            this.points_mesh.material.dispose()

            this.group.remove(this.main)
            this.group.remove(this.points_mesh)

            this.main = null
            this.points_mesh = null
            this.group = null

            this.gl_container = null
        }
    }

    select = (control) => {
        const raycaster = control.raycaster
        // raycaster.params.Points.threshold = MvMesh.point_size / 4

        let intersects = []
        this.points_mesh.raycast(raycaster, intersects);

        if (intersects.length > 0) {
            const index = intersects[0].index
            console.log(index)
            const x = this.geometry.attributes.position.getX(index)
            const y = this.geometry.attributes.position.getY(index)
            const z = this.geometry.attributes.position.getZ(index)
            const v = new THREE.Vector3(x, y, z)
            // const v2 = this.group.localToWorld(v)

            this.origin.copy(v)
            console.log(this.origin)
            this.array.set(this.geometry.attributes.position.array)
            console.log(this.array)

            return {object: this, index: intersects[0].index}
        }

        intersects = raycaster.intersectObject(this.main)

        if (intersects.length > 0) {
            console.log('select_mesh', intersects[0])
            const point = this.group.position
            this.origin.copy(point)
            return {object: this}
        }
    }

    hover = (control) => {
        const raycaster = control.raycaster

        let intersects = []
        this.points_mesh.raycast(raycaster, intersects);

        if (intersects.length > 0) {
            const index = intersects[0].index
            return {object: this, index}
        }

        intersects = raycaster.intersectObjects(this.group.children)
        if (intersects.length > 0) {
            return {object: this}
        }
    }

    move_end = () => {
        this.geometry.computeBoundingBox()
        this.geometry.computeBoundingSphere()
    }

    array = new Float32Array(12)
    origin = new THREE.Vector3()
    temp = new THREE.Vector3()
    move = (index, control, event) => {
        if (index !== undefined) {
            this.temp.copy(control.target_pointer).sub(control.origin)
            this.temp.add(this.origin)
            // this.temp = this.group.worldToLocal(this.temp)

            let index2
            switch (index) {
                case 0:
                    index2 = 3
                    break
                case 1:
                    index2 = 2
                    break
                case 2:
                    index2 = 1
                    break
                case 3:
                    index2 = 0
                    break
            }

            console.log(index, index2, this.array)
            const x1 = this.array[0 + 3 * index2]
            const y1 = this.array[1 + 3 * index2]

            console.log('coord', x1, y1)
            const x2 = this.temp.x
            const y2 = this.temp.y
            console.log('coord', x2, y2)

            const minX = Math.min(x1, x2)
            const minY = Math.min(y1, y2)
            const maxX = Math.max(x1, x2)
            const maxY = Math.max(y1, y2)

            console.log('coord', minX, minY, maxX, maxY)

            this.geometry.attributes.position.array[0] = minX
            this.geometry.attributes.position.array[1] = minY

            this.geometry.attributes.position.array[3] = maxX
            this.geometry.attributes.position.array[4] = minY

            this.geometry.attributes.position.array[6] = minX
            this.geometry.attributes.position.array[7] = maxY

            this.geometry.attributes.position.array[9] = maxX
            this.geometry.attributes.position.array[10] = maxY

            console.log(this.geometry.attributes.position.array)

            // this.geometry.attributes.position.setXYZ(index, this.temp.x, this.temp.y, this.temp.z)
            this.geometry.attributes.position.needsUpdate = true
        } else {
            this.temp.copy(control.target_pointer).sub(control.origin)
            // this.temp = this.points_mesh.worldToLocal(this.temp)
            this.temp.add(this.origin)
            // this.temp = this.group.worldToLocal(this.temp)

            this.group.position.set(this.temp.x, this.temp.y, this.temp.z)
            this.group.position.needsUpdate = true
        }
    }
}

export {MvMesh, MvBox}
