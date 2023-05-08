import {MvOptions, MvCamera, MvFrame, MvScene, MvProject} from "./MvObjects"
import {MvController, MvApplication} from "./MvApplication";
import GLController from "./GLController";
import WebController from "./WebController";
import KeyController from "./KeyController";

window.MvOptions = MvOptions
window.MvCamera = MvCamera
window.MvFrame = MvFrame
window.MvScene = MvScene
window.MvProject = MvProject

window.MvController = MvController
window.MvApplication = MvApplication

window.GLController = GLController
window.WebController = WebController

window.KeyController = KeyController

import {MvMesh} from "./MvMesh";

window.MvMesh = MvMesh

import * as THREE from 'three'

window.THREE = THREE
