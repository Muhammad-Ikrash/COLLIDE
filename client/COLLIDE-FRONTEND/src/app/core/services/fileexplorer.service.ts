import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, firstValueFrom } from 'rxjs';

export type OpenedFile = {
  id: string; // use path as id
  path: string;
  name: string;
  content: string;
};

@Injectable({ providedIn: 'root' })
export class FileExplorerService {
  private openedFilesSubject = new BehaviorSubject<OpenedFile[]>([]);
  openedFiles$ = this.openedFilesSubject.asObservable();

  private activeFileSubject = new BehaviorSubject<OpenedFile | null>(null);
  activeFile$ = this.activeFileSubject.asObservable();

  constructor(private http: HttpClient) {}

  private backendUrls() { return ['http://localhost:8080', 'http://localhost:3000']; }

  private async tryGet(path: string) {
    for (const base of this.backendUrls()) {
      const url = `${base}/api/file?path=${encodeURIComponent(path)}`;
      try {
        const res: any = await firstValueFrom(this.http.get(url));
        return res;
      } catch (err) {
        // try next
      }
    }
    throw new Error('All backends failed');
  }

  private async tryPost(path: string, content: string) {
    for (const base of this.backendUrls()) {
      const url = `${base}/api/file`;
      try {
        const res: any = await firstValueFrom(this.http.post(url, { path, content }));
        return res;
      } catch (err) {
        // try next
      }
    }
    throw new Error('All backends failed');
  }

  private async tryPostJson(endpoint: string, body: any) {
    const errors: any[] = [];
    // Try each configured backend, then try a relative path as a last resort
    const bases = [...this.backendUrls(), ''];
    for (const base of bases) {
      // construct candidate URL: if base is empty use endpoint (relative)
      const url = base ? `${base}${endpoint}` : endpoint;
      try {
        console.debug('[FileExplorerService] POST', url, body);
        const res: any = await firstValueFrom(this.http.post(url, body));
        return res;
      } catch (err) {
        console.warn('[FileExplorerService] POST failed', url, err);
        errors.push({ url, err });
        // try next
      }
    }
    const msg = errors.map(e => `${e.url}: ${e.err?.message || e.err}`).join(' | ');
    throw new Error('All backends failed — attempts: ' + msg);
  }

  async openFile(path: string, name?: string) {
    const payload = await this.tryGet(path);
    const file: OpenedFile = { id: path, path: payload.path || path, name: name || (payload.path != null ? payload.path.split('\\').pop() : path), content: payload.content || '' };
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
    await this.tryPost(path, content);
    // update local cache
    const arr = this.openedFilesSubject.value.map(f => f.id === path ? { ...f, content } : f);
    this.openedFilesSubject.next(arr);
    const active = this.activeFileSubject.value;
    if (active && active.id === path) this.activeFileSubject.next({ ...active, content });
  }

  // delete a file or folder. If folder, remove recursively.
  async deletePath(path: string) {
    await this.tryPostJson('/api/delete', { path });
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

  // rename a path (file or folder). newName is only the last segment (name.ext) or folder name
  async renamePath(oldPath: string, newName: string) {
    // compute new path by replacing last segment
    const sepIndex = Math.max(oldPath.lastIndexOf('\\'), oldPath.lastIndexOf('/'));
    const parent = sepIndex >= 0 ? oldPath.substring(0, sepIndex + 1) : '';
    const newPath = parent + newName;
    await this.tryPostJson('/api/rename', { oldPath, newPath });

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

  // create file or folder inside parent. If name includes a dot treat as file, otherwise folder.
  async createInParent(parent: string, name: string) {
    const res = await this.tryPostJson('/api/create', { parent, name });
    return res;
  }
}
