import { app, BrowserWindow, ipcMain, dialog } from "electron";
import * as fs from "fs/promises";
import { existsSync } from "fs";
import * as path from "path";
import { fileURLToPath } from 'url';
import { spawn, execSync } from 'child_process';
import os from 'os';
import http from 'http';
import net from 'net';

let shell;
let mainWindow = null;
let angularProcess = null;
let usedPort = null;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paths
const ANGULAR_DIR = path.join(__dirname, '..', 'COLLIDE-FRONTEND');
const DIST_DIR = path.join(ANGULAR_DIR, 'dist', 'COLLIDE-FRONTEND', 'browser');

// Build configuration
const BUILD_CONFIG = {
    angularDir: ANGULAR_DIR,
    distDir: 'dist/collide-frontend/browser'
};

// Configuration
const CONFIG = {
    maxBuildTime: 300000, // 5 minutes max for build
    isDev: !app.isPackaged,
    forceRebuild: process.argv.includes('--rebuild'),
    angularHost: 'localhost',
    portRange: { start: 4200, end: 4300 },
    maxStartupTime: 120000 // 2 minutes for dev server startup
};

let workingDir;

/**
 * Check if Angular build exists and is up to date
 */
function isBuildValid() {
    const indexPath = path.join(DIST_DIR, 'index.html');
    
    if (!existsSync(indexPath)) {
        console.log('No build found');
        return false;
    }
    
    // For dev mode, always rebuild if --rebuild flag is passed
    if (CONFIG.forceRebuild) {
        console.log('Force rebuild requested');
        return false;
    }
    
    return true;
}

/**
 * Check if a port is available
 */
function isPortAvailable(port) {
    return new Promise((resolve) => {
        const server = net.createServer();
        server.once('error', () => resolve(false));
        server.once('listening', () => {
            server.close();
            resolve(true);
        });
        server.listen(port);
    });
}

/**
 * Find an available port in the configured range
 */
async function findAvailablePort() {
    for (let port = CONFIG.portRange.start; port <= CONFIG.portRange.end; port++) {
        if (await isPortAvailable(port)) {
            return port;
        }
    }
    throw new Error(`No available ports in range ${CONFIG.portRange.start}-${CONFIG.portRange.end}`);
}

/**
 * Start Angular dev server on specified port
 */
function startAngularServer(port) {
    return new Promise((resolve, reject) => {
        console.log(`Starting Angular dev server on port ${port}...`);
        
        const isWindows = process.platform === 'win32';
        const command = isWindows ? 'npx.cmd' : 'npx';
        const args = ['ng', 'serve', '--port', port.toString()];
        
        angularProcess = spawn(command, args, {
            cwd: ANGULAR_DIR,
            shell: true,
            stdio: ['ignore', 'pipe', 'pipe'],
            env: { ...process.env, FORCE_COLOR: '1' }
        });
        
        angularProcess.stdout.on('data', (data) => {
            const text = data.toString();
            console.log('[Angular]', text.trim());
            
            // Check for successful compilation
            if (text.includes('Compiled successfully') || text.includes('Application bundle generation complete')) {
                resolve();
            }
        });
        
        angularProcess.stderr.on('data', (data) => {
            const text = data.toString();
            // Filter out common warnings
            if (!text.includes('ExperimentalWarning') && !text.includes('DEP')) {
                console.error('[Angular Error]', text.trim());
            }
        });
        
        angularProcess.on('error', (err) => {
            reject(err);
        });
        
        angularProcess.on('close', (code) => {
            if (code !== 0 && code !== null) {
                reject(new Error(`Angular process exited with code ${code}`));
            }
        });
        
        // Timeout
        setTimeout(() => {
            reject(new Error('Angular server startup timed out'));
        }, CONFIG.maxStartupTime);
    });
}

/**
 * Wait for Angular server to be ready (HTTP check)
 */
function waitForAngular(url, timeout = 60000) {
    return new Promise((resolve, reject) => {
        const startTime = Date.now();
        
        const checkServer = () => {
            http.get(url, (res) => {
                if (res.statusCode === 200) {
                    resolve();
                } else {
                    retry();
                }
            }).on('error', retry);
        };
        
        const retry = () => {
            if (Date.now() - startTime > timeout) {
                reject(new Error('Timeout waiting for Angular server'));
            } else {
                setTimeout(checkServer, 1000);
            }
        };
        
        checkServer();
    });
}

/**
 * Build Angular application
 */
function buildAngular(loadingWindow) {
    return new Promise((resolve, reject) => {
        console.log('Building Angular application...');
        
        // Update loading window status
        if (loadingWindow) {
            updateLoadingStatus(loadingWindow, 'Building application...');
        }
        
        const isWindows = process.platform === 'win32';
        const command = isWindows ? 'npx.cmd' : 'npx';
        // Use --base-href ./ for file:// protocol compatibility
        const args = ['ng', 'build', '--configuration', 'development', '--base-href', './'];
        
        const buildProcess = spawn(command, args, {
            cwd: ANGULAR_DIR,
            shell: true,
            stdio: ['ignore', 'pipe', 'pipe'],
            env: { ...process.env, FORCE_COLOR: '1' }
        });
        
        let output = '';
        
        buildProcess.stdout.on('data', (data) => {
            const text = data.toString();
            output += text;
            console.log('[Build]', text.trim());
            
            // Update loading window with progress
            if (loadingWindow && text.includes('Building...')) {
                updateLoadingStatus(loadingWindow, 'Compiling...');
            }
        });
        
        buildProcess.stderr.on('data', (data) => {
            const text = data.toString();
            if (!text.includes('ExperimentalWarning')) {
                console.error('[Build Error]', text.trim());
            }
        });
        
        buildProcess.on('close', (code) => {
            if (code === 0) {
                console.log('✓ Build completed successfully');
                resolve();
            } else {
                reject(new Error(`Build failed with code ${code}\n${output}`));
            }
        });
        
        buildProcess.on('error', (err) => {
            reject(err);
        });
        
        // Timeout
        setTimeout(() => {
            buildProcess.kill();
            reject(new Error('Build timed out'));
        }, CONFIG.maxBuildTime);
    });
}

/**
 * Update loading window status message
 */
function updateLoadingStatus(loadingWindow, message) {
    if (loadingWindow && !loadingWindow.isDestroyed()) {
        loadingWindow.webContents.executeJavaScript(`
            document.querySelector('.status').innerHTML = '${message}<span class="dots"></span>';
        `).catch(() => {});
    }
}

/**
 * Create a loading window while waiting for Angular
 */
function createLoadingWindow() {
    const loadingWindow = new BrowserWindow({
        width: 400,
        height: 300,
        frame: false,
        transparent: true,
        alwaysOnTop: true,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true
        }
    });
    
    const loadingHTML = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body {
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    background: linear-gradient(135deg, #1a1625 0%, #2d1f47 100%);
                    height: 100vh;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    border-radius: 12px;
                    overflow: hidden;
                }
                .logo {
                    font-size: 32px;
                    font-weight: bold;
                    background: linear-gradient(135deg, #a855f7 0%, #ec4899 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    margin-bottom: 24px;
                }
                .spinner {
                    width: 40px;
                    height: 40px;
                    border: 3px solid rgba(168, 85, 247, 0.2);
                    border-top-color: #a855f7;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                    margin-bottom: 20px;
                }
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
                .status {
                    font-size: 14px;
                    color: #b8b8b8;
                }
                .dots::after {
                    content: '';
                    animation: dots 1.5s steps(4, end) infinite;
                }
                @keyframes dots {
                    0%, 20% { content: ''; }
                    40% { content: '.'; }
                    60% { content: '..'; }
                    80%, 100% { content: '...'; }
                }
            </style>
        </head>
        <body>
            <div class="logo">COLLIDE</div>
            <div class="spinner"></div>
            <div class="status">Loading<span class="dots"></span></div>
        </body>
        </html>
    `;
    
    loadingWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(loadingHTML)}`);
    return loadingWindow;
}

/**
 * Create the main application window
 */
function createMainWindow() {
    mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        minWidth: 800,
        minHeight: 600,
        show: false, // Don't show until ready
        title: 'COLLIDE',
        webPreferences: {
            preload: path.join(__dirname, "preload.js"),
            contextIsolation: true,
            nodeIntegration: false
        }
    });
    
    return mainWindow;
}

/**
 * Setup all IPC handlers
 */
function setupIpcHandlers() {
    // Terminal handlers
    ipcMain.on('terminal-start', (event, cwd) => {
        if (shell) return;

        workingDir = cwd || os.homedir();
        
        shell = spawn(
            process.platform === "win32" ? "cmd.exe" : "/bin/bash",
            [],
            {
                cwd: workingDir,
                shell: true
            }
        );

        shell.stdout.on("data", (data) => {
            let tempData = data.toString();
            if (!tempData.includes(workingDir)) {
                tempData = '\n' + tempData;
            }
            console.log('in electron stdout : ' + data.toString());
            event.reply("terminal-data", tempData);
        });

        shell.stderr.on("data", (data) => {
            console.log('in electron error : ' + data.toString());
            event.reply("terminal-data", data.toString());
        });

        shell.on("close", () => {
            shell = null;
        });
    });

    ipcMain.on('terminal-input', (event, input) => {
        if (!shell) return;
        if (input == '\r' || input == '\n') {
            shell.stdin.write('\r\n');
        } else {
            shell.stdin.write(input);
        }
    });

    ipcMain.on('terminal-kill', (event) => {
        if (shell) {
            shell.kill();
            shell = null;
        }
    });

    // File system handlers
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
}

/**
 * Cleanup function to kill Angular process on exit
 */
function cleanup() {
    console.log('Cleaning up...');
    
    if (shell) {
        shell.kill();
        shell = null;
    }
    
    if (angularProcess) {
        console.log('Stopping Angular dev server...');
        // On Windows, we need to kill the entire process tree
        if (process.platform === 'win32') {
            spawn('taskkill', ['/pid', angularProcess.pid.toString(), '/f', '/t'], { shell: true });
        } else {
            angularProcess.kill('SIGTERM');
        }
        angularProcess = null;
    }
}

/**
 * Check if running in dev mode (--dev flag)
 */
function isDevMode() {
    return process.argv.includes('--dev');
}

/**
 * Get the path to the built index.html
 */
function getBuiltIndexPath() {
    return path.join(DIST_DIR, 'index.html');
}

/**
 * Main application startup
 */
async function startApp() {
    let loadingWindow = null;
    const devMode = isDevMode();
    
    try {
        // Show loading window
        loadingWindow = createLoadingWindow();
        
        if (devMode) {
            // DEV MODE: Start Angular dev server for hot reload
            updateLoadingStatus(loadingWindow, 'Starting dev server');
            
            usedPort = await findAvailablePort();
            const angularUrl = `http://${CONFIG.angularHost}:${usedPort}`;
            
            console.log(`[Dev Mode] Starting Angular on port ${usedPort}`);
            
            await startAngularServer(usedPort);
            await waitForAngular(angularUrl);
            
            mainWindow = createMainWindow();
            mainWindow.loadURL(angularUrl);
        } else {
            // BUILD MODE: Load from built files
            console.log('[Build Mode] Loading from compiled files');
            
            // Check if build exists, if not, build it
            if (!isBuildValid()) {
                updateLoadingStatus(loadingWindow, 'Building application');
                console.log('Build not found, compiling Angular...');
                await buildAngular(loadingWindow);
            }
            
            const indexPath = getBuiltIndexPath();
            console.log(`Loading from: ${indexPath}`);
            
            mainWindow = createMainWindow();
            
            // Set up event listener BEFORE loading
            let shown = false;
            const showWindow = () => {
                if (shown) return;
                shown = true;
                if (loadingWindow && !loadingWindow.isDestroyed()) {
                    loadingWindow.close();
                }
                mainWindow.show();
                mainWindow.focus();
            };
            
            mainWindow.once('ready-to-show', showWindow);
            mainWindow.webContents.once('did-finish-load', showWindow);
            
            // Fallback timeout in case events don't fire
            setTimeout(showWindow, 5000);
            
            mainWindow.on('closed', () => {
                mainWindow = null;
            });
            
            // Load from file system
            await mainWindow.loadFile(indexPath);
            return; // Event handlers already set up above
        }
        
        mainWindow.once('ready-to-show', () => {
            if (loadingWindow && !loadingWindow.isDestroyed()) {
                loadingWindow.close();
            }
            mainWindow.show();
            mainWindow.focus();
        });
        
        mainWindow.on('closed', () => {
            mainWindow = null;
        });
        
    } catch (error) {
        console.error('Failed to start application:', error);
        
        if (loadingWindow && !loadingWindow.isDestroyed()) {
            loadingWindow.close();
        }
        
        const modeText = devMode ? 'dev server' : 'built application';
        dialog.showErrorBox('Startup Error', 
            `Failed to start the ${modeText}:\n${error.message}\n\nPlease make sure Angular dependencies are installed.`);
        
        app.quit();
    }
}

// App lifecycle events
app.on('ready', () => {
    setupIpcHandlers();
    startApp();
});

app.on('window-all-closed', () => {
    cleanup();
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('before-quit', cleanup);

app.on('activate', () => {
    if (mainWindow === null) {
        startApp();
    }
});