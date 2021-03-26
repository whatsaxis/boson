const { ipcRenderer } = require('electron');

const editor = document.getElementById('editor');
const currentlyEditing = document.getElementById('currently-editing');
const line = document.getElementById('line');
const character = document.getElementById('character');

editor.addEventListener("input", () => {  // todo https://livebook.manning.com/book/electron-in-action/chapter-2/108 and https://stackoverflow.com/questions/8694054/onchange-event-with-contenteditable
    ipcRenderer.send('asynchronous-message', {
        content: editor.innerHTML,
    });
}, false);

ipcRenderer.on('file-loaded', (event, arg) => {
    currentlyEditing.innerHTML = arg['editing'];
    editor.innerHTML = arg['content'];
});