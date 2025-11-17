import { Component, signal, Input, Inject, PLATFORM_ID, Output, EventEmitter } from '@angular/core';
import { FileExplorerService } from '../../../core/services/fileexplorer.service';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';

type TreeNode = {
  id: string;
  name: string;
  path: string;
  type: 'file' | 'folder';
  children?: TreeNode[];
};

@Component({
  selector: 'file-node',
  standalone: true,
  imports: [CommonModule],
  template: `
  <div class="node" [attr.data-id]="node.id" (contextmenu)="onContextMenu($event, node)">
    <span class="arrow" (click)="onToggle(node)">{{ node.type === 'folder' ? (isExpanded(node.id) ? '▾' : '▸') : '' }}</span>
    <span class="icon">{{ iconFor(node) }}</span>
    <span class="label" (click)="onClick(node)">{{ node.name }}</span>
  </div>
  <div class="children" *ngIf="node.children?.length && isExpanded(node.id)">
    <file-node *ngFor="let c of node.children" [node]="c" [level]="level + 1" (open)="onChildOpen($event)" (rename)="onChildRename($event)" (delete)="onChildDelete($event)" (create)="onChildCreate($event)"></file-node>
  </div>

  <div class="context-menu" *ngIf="contextVisible" [style.left.px]="contextX" [style.top.px]="contextY" (click)="$event.stopPropagation()">
    <div *ngIf="!isRenaming && !isCreating" class="cm-actions">
      <button class="cm-btn" (click)="startRename($event)">Rename</button>
      <button class="cm-btn" (click)="onDelete(node,$event)">Delete</button>
      <button *ngIf="node.type === 'folder'" class="cm-btn" (click)="startCreate($event)">Create New File</button>
    </div>
    <div *ngIf="isRenaming" class="cm-rename">
      <input #renameInput [value]="node.name" (keydown.enter)="confirmRename(renameInput.value)" />
      <button class="cm-btn" (click)="confirmRename(renameInput.value)">Save</button>
      <button class="cm-btn" (click)="closeContext()">Cancel</button>
    </div>
    <div *ngIf="isCreating" class="cm-create">
      <input #createInput placeholder="name.ext or foldername" (keydown.enter)="confirmCreate(createInput.value)" />
      <button class="cm-btn" (click)="confirmCreate(createInput.value)">Create</button>
      <button class="cm-btn" (click)="closeContext()">Cancel</button>
    </div>
  </div>
  `,
  styles: [
    `
    :host { display:block }
    .node { display:flex; align-items:center; gap:6px; user-select:none }
    .arrow { width:18px; display:inline-flex; justify-content:center; cursor:pointer }
    .children { margin-left: 12px; }
    .context-menu { position: fixed; z-index: 2200; background: var(--bg-context, #222); color: var(--fg, #eee); border: 1px solid rgba(255,255,255,0.06); padding: 8px; border-radius: 6px; box-shadow: 0 6px 18px rgba(0,0,0,0.6); }
    .cm-actions { display:flex; flex-direction:column; gap:6px }
    .cm-btn { background: transparent; color: inherit; border: 1px solid rgba(255,255,255,0.04); padding:6px 8px; border-radius:4px; cursor:pointer }
    .cm-rename input, .cm-create input { padding:6px; border-radius:4px; border:1px solid rgba(255,255,255,0.04); margin-bottom:6px }
  `,
  ],
})
export class FileNodeComponent {
  @Output() open = new EventEmitter<{ path: string; name?: string }>();
  @Output() rename = new EventEmitter<{ path: string; newName: string }>();
  @Output() delete = new EventEmitter<{ path: string }>();
  @Output() create = new EventEmitter<{ parent: string; name: string }>();
  @Input() node!: TreeNode;
  @Input() level = 0;
  contextVisible = false;
  contextX = 0;
  contextY = 0;
  isRenaming = false;
  isCreating = false;
  private outsideListener: any = null;

  isExpanded(id: string) {
    if (typeof window === 'undefined') {
      return this.level === 0 && this.node.type === 'folder';
    }
    const cmp: any = (window as any).__fileTreeComponentInstance;
    if (!cmp) return this.level === 0 && this.node.type === 'folder';
    return cmp.isExpanded(id);
  }

  onToggle(node: TreeNode) {
    if (typeof window === 'undefined') return;
    const cmp: any = (window as any).__fileTreeComponentInstance;
    if (cmp) cmp.toggle(node.id);
  }

  onContextMenu(ev: MouseEvent, node: TreeNode) {
    ev.preventDefault();
    ev.stopPropagation();
    this.contextX = ev.clientX;
    this.contextY = ev.clientY;
    this.contextVisible = true;
    this.isRenaming = false;
    this.isCreating = false;
    this.outsideListener = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target) return;
      if ((target.closest && !target.closest('.context-menu'))) this.closeContext();
    };
    document.addEventListener('click', this.outsideListener);
  }

  closeContext() {
    this.contextVisible = false;
    this.isRenaming = false;
    this.isCreating = false;
    if (this.outsideListener) {
      document.removeEventListener('click', this.outsideListener);
      this.outsideListener = null;
    }
  }

  startRename(ev: MouseEvent) {
    ev.stopPropagation();
    this.isRenaming = true;
  }

  confirmRename(value: string) {
    if (!value || value.trim() === '') return;
    this.rename.emit({ path: this.node.path, newName: value.trim() });
    this.closeContext();
  }

  onDelete(node: TreeNode, ev: MouseEvent) {
    ev.stopPropagation();
    if (!confirm(`Delete ${node.name}? This cannot be undone.`)) { this.closeContext(); return; }
    this.delete.emit({ path: node.path });
    this.closeContext();
  }

  startCreate(ev: MouseEvent) {
    ev.stopPropagation();
    this.isCreating = true;
  }

  confirmCreate(value: string) {
    if (!value || value.trim() === '') return;
    this.create.emit({ parent: this.node.path, name: value.trim() });
    this.closeContext();
  }

  onClick(node: TreeNode) {
    if (node.type !== 'file') return;
    // Prefer Angular event emission path
    this.open.emit({ path: node.path, name: node.name });
    // fallback to global window hook for older codepaths
    if (typeof window === 'undefined') return;
    const cmp: any = (window as any).__fileTreeComponentInstance;
    if (cmp && typeof cmp.open === 'function') cmp.open(node.path, node.name);
  }

  onChildOpen(payload: { path: string; name?: string }) {
    // bubble child open events upward
    this.open.emit(payload);
  }

  onChildRename(payload: { path: string; newName: string }) {
    this.rename.emit(payload);
  }

  onChildDelete(payload: { path: string }) {
    this.delete.emit(payload);
  }

  onChildCreate(payload: { parent: string; name: string }) {
    this.create.emit(payload);
  }

  iconFor(n: TreeNode) {
    if (n.type === 'folder') return n.children && n.children.length ? '📂' : '📁';
    const ext = n.name.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'ts': return '📘';
      case 'js': return '📜';
      case 'json': return '🧾';
      case 'html': return '🌐';
      case 'scss': return '🎨';
      case 'md': return '📝';
      default: return '📄';
    }
  }
}

@Component({
  selector: 'app-file-explorer',
  standalone: true,
  imports: [CommonModule, HttpClientModule, FileNodeComponent],
  template: `
  <div class="tree-root" *ngIf="tree() as t; else loading">
    <file-node [node]="t" [level]="0"
      (open)="open($event.path,$event.name)"
      (rename)="onRename($event)"
      (delete)="onDelete($event)"
      (create)="onCreate($event)"
    ></file-node>
  </div>
  <ng-template #loading><div>Loading file tree…</div></ng-template>
  `,
  styles: [
    `
    .tree-root { font-family: var(--font, Arial); }
  `,
  ],
})
export class FileTreeComponent {
  tree = signal<TreeNode | null>(null);
  expanded = signal(new Set<string>());

  constructor(private http: HttpClient, @Inject(PLATFORM_ID) private platformId: Object, private fes: FileExplorerService) {
    // expose global reference for the small demo recursion helper only in browser
    if (isPlatformBrowser(this.platformId)) {
      (window as any).__fileTreeComponentInstance = this;
      this.load();
    }
  }

  async onRename(e: { path: string; newName: string }) {
    try {
      await this.fes.renamePath(e.path, e.newName);
      this.load();
    } catch (err) {
      console.error('Rename failed', err);
      alert('Rename failed: ' + ((err as any)?.message || err));
    }
  }

  async onDelete(e: { path: string }) {
    try {
      await this.fes.deletePath(e.path);
      this.load();
    } catch (err) {
      console.error('Delete failed', err);
      alert('Delete failed: ' + ((err as any)?.message || err));
    }
  }

  async onCreate(e: { parent: string; name: string }) {
    try {
      const res: any = await this.fes.createInParent(e.parent, e.name);
      console.debug('Create result', res);
      // reload tree and open file if created
      this.load();
      if (res && res.type === 'file' && res.path) {
        // open created file in a new tab
        this.open(res.path, res.path.split(/\\|\//).pop());
      }
    } catch (err) {
      console.error('Create failed', err);
      alert('Create failed: ' + ((err as any)?.message || err));
    }
  }

  open(path: string, name?: string) {
    // forwarded to FileExplorerService; in some builds the DI token might be different, so guard
    try {
      if (this.fes && typeof this.fes.openFile === 'function') this.fes.openFile(path, name);
    } catch (err) {
      console.warn('Failed to open file via FileExplorerService', err);
    }
  }

  load() {
    // Try the Spring Boot backend on 8080 first, then fall back to legacy dev server on 3000
    const tryUrls = [
      'http://localhost:8080/api/tree',
      'http://localhost:3000/api/tree'
    ];

    const tryNext = (index: number) => {
      if (index >= tryUrls.length) {
        console.error('All attempts to load file tree failed');
        return;
      }
      const url = tryUrls[index];
      this.http.get<TreeNode>(url).subscribe((t) => this.tree.set(t), (err) => {
        console.warn('Failed to load file tree from', url, ' — trying next. Error:', err?.message || err);
        tryNext(index + 1);
      });
    };

    tryNext(0);
  }

  isExpanded = (id: string) => this.expanded().has(id);

  toggle(id: string) {
    const set = new Set(this.expanded());
    if (set.has(id)) set.delete(id); else set.add(id);
    this.expanded.set(set);
  }
}
