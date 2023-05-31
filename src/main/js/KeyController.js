export default class KeyController {
    constructor(application, component, keyMap) {
        this.application = application
        component.addEventListener("keydown", (event) => {
            if (event.getModifierState("Accel")) {
                switch (event.code) {
                    case 'KeyS': {
                        request_save_project(event.getModifierState("Shift"))
                        break
                    }
                    case 'KeyO': {
                        request_open_project()
                        break
                    }
                    case 'KeyN': {
                        this.application.new_object()
                    }
                }
                return
            }
            switch (event.code) {
                case keyMap['FirstImage']: {
                    break;
                }
                case keyMap['LastImage']: {
                    break;
                }
                case keyMap['NextImage']: {
                    application.next_frame()
                    break;
                }
                case keyMap['PrevImage']: {
                    application.prev_frame()
                    break;
                }
                case keyMap['NextObject']: {
                    application.next_object()
                    break;
                }
                case keyMap['PrevObject']: {
                    application.prev_object()
                    break;
                }
                case keyMap['ToggleHide']: {
                    application.toggle_hide()
                    break;
                }
                case keyMap['Check']: {
                    break;
                }
                case keyMap['Fit']: {
                    break;
                }
                case keyMap['Formatted']: {
                    break;
                }
                case keyMap['ColorSetting']: {
                    break;
                }
                case keyMap['VisibleSetting']: {
                    break;
                }
                case keyMap['Clipping']: {
                    application.toggle_clipping()
                    break;
                }
            }
        })
    }
}


