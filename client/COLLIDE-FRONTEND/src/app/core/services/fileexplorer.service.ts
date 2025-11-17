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
}
