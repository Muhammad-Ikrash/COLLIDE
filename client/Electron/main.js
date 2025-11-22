import { app, BrowserWindow, ipcMain, dialog } from "electron";
import * as fs from "fs/promises";
import * as path from "path";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.on("ready", () => {
    const mainWindow = new BrowserWindow({
        webPreferences: {
            preload: path.join(__dirname, "preload.js"),
            contextIsolation: true,
            nodeIntegration: false
        }
    });

    mainWindow.loadURL("http://localhost:4200");
    // mainWindow.webContents.openDevTools(); // Optional: for debugging

    // IPC Handlers
    ipcMain.handle('dialog:openDirectory', async () => {
        const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
            properties: ['openDirectory']
        });
        if (canceled) {
            return null;
        } else {
            return filePaths[0];
        }
    });

    ipcMain.handle('fs:readDirectory', async (event, dirPath) => {
        try {
            const dirents = await fs.readdir(dirPath, { withFileTypes: true });
            return dirents.map(dirent => ({
                name: dirent.name,
                path: path.join(dirPath, dirent.name),
                type: dirent.isDirectory() ? 'folder' : 'file'
            }));
        } catch (error) {
            console.error('Error reading directory:', error);
            throw error;
        }
    });

    ipcMain.handle('fs:readFile', async (event, filePath) => {
        return await fs.readFile(filePath, 'utf-8');
    });

    ipcMain.handle('fs:writeFile', async (event, filePath, content) => {
        return await fs.writeFile(filePath, content, 'utf-8');
    });

    ipcMain.handle('fs:createFile', async (event, parentPath, name) => {
        const filePath = path.join(parentPath, name);
        await fs.writeFile(filePath, '', 'utf-8');
        return { name, path: filePath, type: 'file' };
    });

    ipcMain.handle('fs:createFolder', async (event, parentPath, name) => {
        const folderPath = path.join(parentPath, name);
        await fs.mkdir(folderPath);
        return { name, path: folderPath, type: 'folder' };
    });

    ipcMain.handle('fs:delete', async (event, targetPath) => {
        return await fs.rm(targetPath, { recursive: true, force: true });
    });

    ipcMain.handle('fs:rename', async (event, oldPath, newPath) => {
        return await fs.rename(oldPath, newPath);
    });
});