export default class KeyController {
    constructor(application, component, keyMap) {
        this.application = application
        component.addEventListener("keydown", (event) => {
            console.log(event)
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


