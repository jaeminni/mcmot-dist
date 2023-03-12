const {app, BrowserWindow, ipcMain, dialog} = require('electron')
const fs = require("fs");
const path = require("path");

function getFiles(file_path, files, ext) {
    const stat = fs.statSync(file_path)
    if (stat.isDirectory()) {
        const children = fs.readdirSync(file_path);
        for (const child of children) {
            if (child.startsWith('.')) {
                continue
            }
            getFiles(path.join(file_path, child), files, ext)
        }
    } else {
        if (!ext || ext.test(file_path)) {
            files.push(file_path)
        }
    }
}

ipcMain.on('open-directory', (event) => {
    dialog.showOpenDialog({properties: ['openDirectory']}).then(arg => {
        if (!arg.canceled) {
            const files = []
            getFiles(arg.filePaths[0], files, /(json|jpg|png)$/i);
            event.reply('open-directory', files);
        }
    })
});

ipcMain.on('save-camera', (event, arg) => {
    console.log(arg)
    const path = arg.path
    const json = arg.json

    fs.writeFileSync(path, json)
});

const createWindow = () => {
    const mainWindow = new BrowserWindow({
        width: 1600, height: 1200, webPreferences: {
            nodeIntegration: true, contextIsolation: false
        }
    })

    const html = 'resources/main.html';

    mainWindow.loadFile(html).then();
}

app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        BrowserWindow.getAllWindows().length === 0 && createWindow();
    })
})

app.on('window-all-closed', () => {
    process.platform !== 'darwin' && app.quit()
})
