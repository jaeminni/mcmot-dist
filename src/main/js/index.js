import * as THREE from 'three'

import {OrbitControls, MapControls} from "./OrbitControls.js"
import ImageGeometry from "./ImageGeometry.js"
import {DragControls} from './DragControls.js'

import Editor from './Editor'

import {LineGeometry} from 'three/examples/jsm/lines/LineGeometry.js'
import {LineMaterial} from 'three/examples/jsm/lines/LineMaterial.js'
import {Line2} from 'three/examples/jsm/lines/Line2.js'

import {SVGRenderer} from 'three/addons/renderers/SVGRenderer.js'

import Stats from 'three/addons/libs/stats.module.js'
import {GUI} from 'three/addons/libs/lil-gui.module.min.js'
import {Wireframe} from 'three/addons/lines/Wireframe.js'
import {WireframeGeometry2} from 'three/addons/lines/WireframeGeometry2.js'

import SAT from './SAT.js'

import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';
import {ConvexGeometry} from 'three/addons/geometries/ConvexGeometry.js';
import ImageController from "./ImageController";

import MvObject from './MvObject'
import MvScene from './MvScene'
import MvProject from './MvProject'

import Application from "./Application";

window.ImageController = ImageController

window.THREE = THREE
window.OrbitControls = OrbitControls
window.MapControls = MapControls
window.LineGeometry = LineGeometry
window.LineMaterial = LineMaterial
window.Line2 = Line2
window.ImageGeometry = ImageGeometry
window.DragControls = DragControls
window.SVGRenderer = SVGRenderer
window.Editor = Editor
window.Stats = Stats
window.GUI = GUI
window.Wireframe = Wireframe
window.WireframeGeometry2 = WireframeGeometry2
window.SAT = SAT
window.BufferGeometryUtils = BufferGeometryUtils
window.ConvexGeometry = ConvexGeometry
window.MvObject = MvObject
window.MvScene = MvScene
window.MvProject = MvProject
window.Application = Application

