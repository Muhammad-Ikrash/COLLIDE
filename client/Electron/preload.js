const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    selectFolder: () => ipcRenderer.invoke('dialog:openDirectory'),
    readDirectory: (path) => ipcRenderer.invoke('fs:readDirectory', path),
    readFile: (path) => ipcRenderer.invoke('fs:readFile', path),
    writeFile: (path, content) => ipcRenderer.invoke('fs:writeFile', path, content),
    createFile: (parent, name) => ipcRenderer.invoke('fs:createFile', parent, name),
    createFolder: (parent, name) => ipcRenderer.invoke('fs:createFolder', parent, name),
    deletePath: (path) => ipcRenderer.invoke('fs:delete', path),
    renamePath: (oldPath, newPath) => ipcRenderer.invoke('fs:rename', oldPath, newPath)
});
