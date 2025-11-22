import { Injectable, NgZone } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type OpenedFile = {
  id: string; // use path as id
  path: string;
  name: string;
  content: string;
};

declare global {
  interface Window {
    electronAPI: {
      selectFolder: () => Promise<string | null>;
      readDirectory: (path: string) => Promise<any[]>;
      readFile: (path: string) => Promise<string>;
      writeFile: (path: string, content: string) => Promise<void>;
      createFile: (parent: string, name: string) => Promise<any>;
      createFolder: (parent: string, name: string) => Promise<any>;
      deletePath: (path: string) => Promise<void>;
      renamePath: (oldPath: string, newPath: string) => Promise<void>;
    };
  }
}

@Injectable({ providedIn: 'root' })
export class FileExplorerService {
  private openedFilesSubject = new BehaviorSubject<OpenedFile[]>([]);
  openedFiles$ = this.openedFilesSubject.asObservable();

  private activeFileSubject = new BehaviorSubject<OpenedFile | null>(null);
  activeFile$ = this.activeFileSubject.asObservable();

  private rootPathSubject = new BehaviorSubject<string | null>(null);
  rootPath$ = this.rootPathSubject.asObservable();

  constructor(private zone: NgZone) {}

  async openFolder() {
    if (!window.electronAPI) {
      console.error('Electron API not available');
      return;
    }
    const path = await window.electronAPI.selectFolder();
    if (path) {
      this.zone.run(() => {
        this.rootPathSubject.next(path);
        this.openedFilesSubject.next([]);
        this.activeFileSubject.next(null);
      });
    }
  }

  async getTree(path: string) {
    if (!window.electronAPI) return [];
    const items = await window.electronAPI.readDirectory(path);
    // Sort folders first, then files
    return items.sort((a, b) => {
      if (a.type === b.type) return a.name.localeCompare(b.name);
      return a.type === 'folder' ? -1 : 1;
    });
  }

  async openFile(path: string, name?: string) {
    if (!window.electronAPI) return;
    const content = await window.electronAPI.readFile(path);
    const file: OpenedFile = { 
      id: path, 
      path: path, 
      name: name || path.split(/[\\/]/).pop() || path, 
      content: content 
    };
    
    const existing = this.openedFilesSubject.value.find(f => f.id === file.id);
    if (!existing) {
      this.openedFilesSubject.next([...this.openedFilesSubject.value, file]);
    }
    this.activeFileSubject.next(file);
    return file;
  }

  closeFile(id: string) {
    const arr = this.openedFilesSubject.value.filter(f => f.id !== id);
    this.openedFilesSubject.next(arr);
    const active = this.activeFileSubject.value;
    if (active && active.id === id) {
      this.activeFileSubject.next(arr.length ? arr[arr.length - 1] : null);
    }
  }

  activateFile(id: string) {
    const f = this.openedFilesSubject.value.find(x => x.id === id) || null;
    this.activeFileSubject.next(f);
  }

  async saveFile(path: string, content: string) {
    if (!window.electronAPI) return;
    await window.electronAPI.writeFile(path, content);
    // update local cache
    const arr = this.openedFilesSubject.value.map(f => f.id === path ? { ...f, content } : f);
    this.openedFilesSubject.next(arr);
    const active = this.activeFileSubject.value;
    if (active && active.id === path) this.activeFileSubject.next({ ...active, content });
  }

  async deletePath(path: string) {
    if (!window.electronAPI) return;
    await window.electronAPI.deletePath(path);
    // remove opened files whose path equals path or starts with path + separator
    const arr = this.openedFilesSubject.value.filter(f => {
      if (f.path === path) return false;
      if (f.path.startsWith(path + '\\')) return false;
      if (f.path.startsWith(path + '/')) return false;
      return true;
    });
    this.openedFilesSubject.next(arr);
    // adjust active file if needed
    const active = this.activeFileSubject.value;
    if (active && (active.path === path || active.path.startsWith(path + '\\') || active.path.startsWith(path + '/'))) {
      this.activeFileSubject.next(arr.length ? arr[arr.length - 1] : null);
    }
  }

  async renamePath(oldPath: string, newName: string) {
    if (!window.electronAPI) return;
    // compute new path by replacing last segment
    const sepIndex = Math.max(oldPath.lastIndexOf('\\'), oldPath.lastIndexOf('/'));
    const parent = sepIndex >= 0 ? oldPath.substring(0, sepIndex + 1) : '';
    const newPath = parent + newName;
    
    await window.electronAPI.renamePath(oldPath, newPath);

    // update opened files: rename exact or prefix
    const arr = this.openedFilesSubject.value.map(f => {
      if (f.path === oldPath) {
        const newNameOnly = newPath.split(/\\|\//).pop() || newName;
        return { ...f, path: newPath, id: newPath, name: newNameOnly };
      }
      if (f.path.startsWith(oldPath + '\\') || f.path.startsWith(oldPath + '/')) {
        const suffix = f.path.substring(oldPath.length);
        const updatedPath = newPath + suffix;
        const updatedName = updatedPath.split(/\\|\//).pop() || f.name;
        return { ...f, path: updatedPath, id: updatedPath, name: updatedName };
      }
      return f;
    });
    this.openedFilesSubject.next(arr);

    // update active if necessary
    const active = this.activeFileSubject.value;
    if (active) {
      if (active.path === oldPath) {
        const updated = arr.find(x => x.path === newPath) || null;
        this.activeFileSubject.next(updated);
      } else if (active.path.startsWith(oldPath + '\\') || active.path.startsWith(oldPath + '/')) {
        const suffix = active.path.substring(oldPath.length);
        const updatedPath = newPath + suffix;
        const updated = arr.find(x => x.path === updatedPath) || null;
        this.activeFileSubject.next(updated);
      }
    }
  }

  async createInParent(parent: string, name: string) {
    if (!window.electronAPI) return;
    // Simple heuristic: if it has a dot, it's a file.
    if (name.includes('.')) {
      return await window.electronAPI.createFile(parent, name);
    } else {
      return await window.electronAPI.createFolder(parent, name);
    }
  }
}
