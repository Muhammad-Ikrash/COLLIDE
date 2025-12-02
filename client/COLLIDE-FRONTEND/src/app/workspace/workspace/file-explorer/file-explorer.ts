import { Component, signal, Input, Inject, PLATFORM_ID, Output, EventEmitter, OnInit } from '@angular/core';
import { FileExplorerService } from '../../../core/services/fileexplorer.service';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { Emitter } from 'monaco-editor';

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
    .node { display:flex; align-items:center; gap:6px; user-select:none; padding: 2px 0; cursor: pointer; }
    .node:hover { background: rgba(255,255,255,0.05); }
    .arrow { width:18px; display:inline-flex; justify-content:center; cursor:pointer; color: #888; }
    .children { margin-left: 12px; border-left: 1px solid rgba(255,255,255,0.05); }
    .context-menu { position: fixed; z-index: 2200; background: var(--bg-context, #222); color: var(--fg, #eee); border: 1px solid rgba(255,255,255,0.06); padding: 8px; border-radius: 6px; box-shadow: 0 6px 18px rgba(0,0,0,0.6); }
    .cm-actions { display:flex; flex-direction:column; gap:6px }
    .cm-btn { background: transparent; color: inherit; border: 1px solid rgba(255,255,255,0.04); padding:6px 8px; border-radius:4px; cursor:pointer; text-align: left; }
    .cm-btn:hover { background: rgba(255,255,255,0.1); }
    .cm-rename input, .cm-create input { padding:6px; border-radius:4px; border:1px solid rgba(255,255,255,0.04); margin-bottom:6px; background: #333; color: white; }
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
    if (cmp) cmp.toggle(node);
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
    this.open.emit({ path: node.path, name: node.name });
  }

  onChildOpen(payload: { path: string; name?: string }) {
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
  templateUrl: './file-explorer.html',
  styles: [
    `
    .file-explorer-container { height: 100%; display: flex; flex-direction: column; }
    .empty-state { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #888; }
    .empty-state button { margin-top: 10px; padding: 8px 16px; background: #007acc; color: white; border: none; border-radius: 4px; cursor: pointer; }
    .tree-content { flex: 1; overflow-y: auto; }
    .tree-root { font-family: var(--font, Arial); padding: 10px; }
  `,
  ],
})
export class FileTreeComponent implements OnInit {
  tree = signal<TreeNode | null>(null);
  expanded = signal(new Set<string>());
  rootPath: string | null = null;

  // Output event to emit rootPath to parent component
  @Output() rootPathChange = new EventEmitter<string | null>();





  constructor(@Inject(PLATFORM_ID) private platformId: Object, private fes: FileExplorerService) {
    if (isPlatformBrowser(this.platformId)) {
      (window as any).__fileTreeComponentInstance = this;
    }
  }

  ngOnInit() {
    this.fes.rootPath$.subscribe(path => {
      this.rootPath = path;
      // Emit the rootPath to parent component
      this.rootPathChange.emit(path);
      if (path) {
        this.loadRoot(path);
      }
    });
  }

  openFolder() {
    this.fes.openFolder();
  }

  async loadRoot(path: string) {
    const children = await this.fes.getTree(path);
    const rootNode: TreeNode = {
      id: path,
      name: path.split(/[\\/]/).pop() || path,
      path: path,
      type: 'folder',
      children: children
    };
    this.tree.set(rootNode);
    // Expand root by default
    this.expanded.update(set => {
        const newSet = new Set(set);
        newSet.add(rootNode.id);
        return newSet;
    });
  }

  async onRename(e: { path: string; newName: string }) {
    try {
      await this.fes.renamePath(e.path, e.newName);
      if (this.rootPath) this.loadRoot(this.rootPath); // simplistic reload
    } catch (err) {
      console.error('Rename failed', err);
      alert('Rename failed: ' + ((err as any)?.message || err));
    }
  }

  async onDelete(e: { path: string }) {
    try {
      await this.fes.deletePath(e.path);
      if (this.rootPath) this.loadRoot(this.rootPath);
    } catch (err) {
      console.error('Delete failed', err);
      alert('Delete failed: ' + ((err as any)?.message || err));
    }
  }

  async onCreate(e: { parent: string; name: string }) {
    try {
      const res: any = await this.fes.createInParent(e.parent, e.name);
      if (this.rootPath) this.loadRoot(this.rootPath);
      if (res && res.type === 'file' && res.path) {
        this.open(res.path, res.path.split(/\\|\//).pop());
      }
    } catch (err) {
      console.error('Create failed', err);
      alert('Create failed: ' + ((err as any)?.message || err));
    }
  }

  open(path: string, name?: string) {
    try {
      if (this.fes && typeof this.fes.openFile === 'function') this.fes.openFile(path, name);
    } catch (err) {
      console.warn('Failed to open file via FileExplorerService', err);
    }
  }

  isExpanded = (id: string) => this.expanded().has(id);

  async toggle(node: TreeNode) {
    const id = node.id;
    const set = new Set(this.expanded());
    if (set.has(id)) {
      set.delete(id);
    } else {
      set.add(id);
      // Lazy load children if not present
      if (!node.children || node.children.length === 0) {
          const children = await this.fes.getTree(node.path);
          node.children = children;
      }
    }
    this.expanded.set(set);
  }
}
