export default class KeyController {
    constructor(application, component, keyMap) {
        this.application = application
        component.addEventListener("keydown", (event) => {
            console.log(event.code)
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
                case keyMap['AllHide ']: {
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
            }
        })
    }
}


