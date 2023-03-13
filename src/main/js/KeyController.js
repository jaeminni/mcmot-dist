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
                case keyMap['PrevImage']: {
                    break;
                }
                case keyMap['NextImage']: {
                    break;
                }
                case keyMap['NextObject']: {
                    break;
                }
                case keyMap['PrevObject']: {
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


