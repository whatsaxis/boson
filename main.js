const { app, BrowserWindow, dialog, Menu, ipcMain, webContents } = require('electron');
const path = require('path');
const fs = require('fs');

let currentlyEditing = "-";

let currentContents = "";
let unsavedCurrentContents = "";

let win;

function createWindow() {
    win = new BrowserWindow({
        height: 600,
        width: 800,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        },
        icon: path.join(__dirname, 'assets', 'icon.png'),
        title: 'Boson Editor',
        show: false
    });

    function openFile() {
        const files = dialog.showOpenDialogSync(win, {
            properties: ['openFile', 'showHiddenFiles'],
            filters: [{
                name: 'Text Files',
                extensions: ['txt', 'rtf', 'doc', 'docx', 'docm', 'odt', 'pdf', 'tex', 'wpd']
            },
            {
                name: 'All Files',
                extensions: ['*']
            }],
        });
        if (!files) return;

        const file = files[0];
        const content = fs.readFileSync(file).toString();
        currentlyEditing = file;
        currentContents = content;
        
        win.webContents.send('file-loaded', {
            editing: currentlyEditing,
            content: currentContents
        });
    }

    function commitChangesToFile(path) {
        fs.writeFile(path, unsavedCurrentContents, (e) => {
            if (e) {
                return;
            }
        });

        currentContents = unsavedCurrentContents;
        win.title = "Boson Editor";
    }

    function saveAsNewFile() {
        const file = dialog.showSaveDialogSync(win, {
            title: 'Save As..',
            filters: [{
                name: 'Text File',
                extensions: ['txt']
            },
            {
                name: 'All Files',
                extensions: ['*']
            }],
        })
        if (!file) return;

        fs.writeFile(file, currentContents, (e) => {
            if (e) {
                return;
            }
        });

        currentlyEditing = file;

        win.webContents.send('file-loaded', {
            editing: currentlyEditing,
            content: currentContents
        });
    }

    const isMac = process.platform === 'darwin';
    const menu = Menu.buildFromTemplate([{
        label: 'File',
        submenu: [
            {
                label: 'New File',
                click: () => {
                    commitChangesToFile(currentlyEditing);

                    unsavedCurrentContents = "";
                    currentContents = "";
                    currentlyEditing = "-";

                    win.webContents.send('file-loaded', {
                        editing: currentlyEditing,
                        content: currentContents
                    });
                }
            },
            {
                label: 'Open File',
                click: openFile
            },
            { type: 'separator' },
            {
                label: 'Save',
                accelerator: 'Ctrl+S',
                click: () => {
                    currentContents = unsavedCurrentContents;
                    currentlyEditing === '-' ? saveAsNewFile() : commitChangesToFile(currentlyEditing);
                    win.title = "Boson Editor";
                }
            },
            {
                label: 'Save As..',
                accelerator: isMac ? 'Ctrl+Cmd+S' : 'Ctrl+Shift+S',
                click: saveAsNewFile
            },
            { type: 'separator' },
            { label: "Quit", role: "quit" }
        ]
    },
    {
        label: 'Edit',
        submenu: [
            {
                label: 'Undo',
                role: 'undo',
            },
            {
                label: 'Redo',
                accelerator: 'Ctrl+Shift+Z',
                role: 'redo',
            },
            { type: 'separator' },
            {
                label: 'Cut',
                role: 'cut',
            },
            {
                label: 'Copy',
                role: 'copy',
            },
            {
                label: 'Paste',
                role: 'paste',
            }
        ]
    }
    ]);

    win.setTitle('Boson Editor');
    win.loadFile('src/index.html');
    Menu.setApplicationMenu(menu);
    // win.webContents.openDevTools({ mode: 'detach' });

    win.on('ready-to-show', () => {
        win.show();
    });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

ipcMain.on('asynchronous-message', (event, arg) => {
    unsavedCurrentContents = arg['content'];

    if (unsavedCurrentContents !== currentContents) {
        win.title = "Boson Editor*";
    }
});