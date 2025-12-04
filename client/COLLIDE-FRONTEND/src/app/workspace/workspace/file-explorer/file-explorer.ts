import { Component, signal, Input, Inject, PLATFORM_ID, Output, EventEmitter, OnInit } from '@angular/core';
import { FileExplorerService } from '../../../core/services/fileexplorer.service';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
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
  <div class="tree-item">
    <div class="item-row" (contextmenu)="onContextMenu($event, node)">
      <!-- Expand/Collapse for folders -->
      <button *ngIf="node.type === 'folder'" class="expand-btn" (click)="onToggle(node)">
        <svg viewBox="0 0 16 16" fill="currentColor" [class.expanded]="isExpanded(node.path)">
          <path d="M5.7 13.7L5 13l4.6-4.6L5 3.7l.7-.7 5.3 5.4-5.3 5.3z"/>
        </svg>
      </button>
      <span *ngIf="node.type !== 'folder'" class="expand-placeholder"></span>
      
      <!-- Icon -->
      <span class="item-icon" (click)="onClick(node)">
        <svg *ngIf="node.type === 'folder'" viewBox="0 0 24 24" fill="currentColor">
          <path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"/>
        </svg>
        <svg *ngIf="node.type === 'file'" viewBox="0 0 24 24" fill="currentColor" [class]="getFileClass(node.name)">
          <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm4 18H6V4h7v5h5v11z"/>
        </svg>
      </span>
      
      <!-- Name -->
      <span class="item-name" (click)="onClick(node)">{{ node.name }}</span>
    </div>
    
    <!-- Children -->
    <div class="children" *ngIf="node.children?.length && isExpanded(node.path)">
      <file-node *ngFor="let c of node.children; trackBy: trackByPath" [node]="c" [level]="level + 1" 
        (open)="onChildOpen($event)" 
        (rename)="onChildRename($event)" 
        (delete)="onChildDelete($event)" 
        (create)="onChildCreate($event)">
      </file-node>
    </div>
  </div>

  <!-- Context Menu -->
  <div class="context-menu" *ngIf="contextVisible" [style.left.px]="contextX" [style.top.px]="contextY" (click)="$event.stopPropagation()">
    <div *ngIf="!isRenaming && !isCreating" class="cm-actions">
      <button class="cm-btn" (click)="startRename($event)">
        <svg viewBox="0 0 16 16" fill="currentColor"><path d="M13.23 1h-1.46L3.52 9.25l-.16.22L1 13.59 2.41 15l4.12-2.36.22-.16L15 4.23V2.77L13.23 1zM2.41 13.59l1.51-3 1.45 1.45-2.96 1.55zm3.83-2.06L4.47 9.76l6-6 1.77 1.77-6 6z"/></svg>
        Rename
      </button>
      <button class="cm-btn" (click)="onDelete(node,$event)">
        <svg viewBox="0 0 16 16" fill="currentColor"><path d="M10 3h3v1h-1v9l-1 1H4l-1-1V4H2V3h3V2a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v1zM9 2H6v1h3V2zM4 13h7V4H4v9z"/></svg>
        Delete
      </button>
      <button *ngIf="node.type === 'folder'" class="cm-btn" (click)="startCreate($event)">
        <svg viewBox="0 0 16 16" fill="currentColor"><path d="M14 7H9V2H7v5H2v2h5v5h2V9h5V7z"/></svg>
        New File
      </button>
    </div>
    <div *ngIf="isRenaming" class="cm-input-section">
      <input #renameInput [value]="node.name" (keydown.enter)="confirmRename(renameInput.value)" (keydown.escape)="closeContext()" autofocus />
      <div class="cm-btn-row">
        <button class="cm-btn save" (click)="confirmRename(renameInput.value)">Save</button>
        <button class="cm-btn cancel" (click)="closeContext()">Cancel</button>
      </div>
    </div>
    <div *ngIf="isCreating" class="cm-input-section">
      <input #createInput placeholder="filename.ext" (keydown.enter)="confirmCreate(createInput.value)" (keydown.escape)="closeContext()" autofocus />
      <div class="cm-btn-row">
        <button class="cm-btn save" (click)="confirmCreate(createInput.value)">Create</button>
        <button class="cm-btn cancel" (click)="closeContext()">Cancel</button>
      </div>
    </div>
  </div>
  `,
  styles: [
    `
    :host { display: block; }
    
    .tree-item {
      .item-row {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 6px 12px;
        cursor: pointer;
        border-radius: 4px;
        transition: background-color 0.1s ease;

        &:hover {
          background-color: rgba(168, 85, 247, 0.1);
        }
      }
    }

    .expand-btn {
      width: 18px;
      height: 18px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: transparent;
      border: none;
      cursor: pointer;
      padding: 0;
      flex-shrink: 0;

      svg {
        width: 12px;
        height: 12px;
        fill: #b8b8b8;
        transition: transform 0.15s ease;

        &.expanded {
          transform: rotate(90deg);
        }
      }

      &:hover svg {
        fill: #a855f7;
      }
    }

    .expand-placeholder {
      width: 18px;
      height: 18px;
      flex-shrink: 0;
    }

    .item-icon {
      width: 18px;
      height: 18px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;

      svg {
        width: 16px;
        height: 16px;
        fill: #b8b8b8;
        
        &.ts-file { fill: #3178c6; }
        &.js-file { fill: #f7df1e; }
        &.json-file { fill: #cbcb41; }
        &.html-file { fill: #e34f26; }
        &.css-file, &.scss-file { fill: #cc6699; }
        &.md-file { fill: #083fa1; }
        &.folder { fill: #dcb67a; }
      }
    }

    .item-name {
      flex: 1;
      font-size: 13px;
      color: #ffffff;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      user-select: none;
    }

    .children {
      padding-left: 16px;
      border-left: 1px solid rgba(168, 85, 247, 0.2);
      margin-left: 8px;
    }

    /* Context Menu */
    .context-menu {
      position: fixed;
      z-index: 2200;
      background: #1e1a2e;
      border: 1px solid rgba(168, 85, 247, 0.5);
      border-radius: 8px;
      padding: 6px;
      min-width: 160px;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5), 0 0 20px rgba(168, 85, 247, 0.2);
    }

    .cm-actions {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .cm-btn {
      display: flex;
      align-items: center;
      gap: 10px;
      width: 100%;
      padding: 8px 12px;
      background: transparent;
      border: none;
      border-radius: 6px;
      color: #ffffff;
      font-size: 13px;
      cursor: pointer;
      text-align: left;
      transition: all 0.1s ease;

      svg {
        width: 14px;
        height: 14px;
        fill: #b8b8b8;
        flex-shrink: 0;
      }

      &:hover {
        background: rgba(168, 85, 247, 0.15);
        
        svg {
          fill: #a855f7;
        }
      }

      &.save {
        background: linear-gradient(135deg, #a855f7 0%, #9333ea 100%);
        justify-content: center;
        
        &:hover {
          background: linear-gradient(135deg, #b066f9 0%, #a855f7 100%);
        }
      }

      &.cancel {
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        justify-content: center;
        
        &:hover {
          background: rgba(255, 255, 255, 0.1);
        }
      }
    }

    .cm-input-section {
      padding: 4px;
      
      input {
        width: 100%;
        padding: 8px 12px;
        background: #1a1625;
        border: 1px solid rgba(168, 85, 247, 0.3);
        border-radius: 6px;
        color: #ffffff;
        font-size: 13px;
        outline: none;
        margin-bottom: 8px;
        box-sizing: border-box;

        &:focus {
          border-color: #a855f7;
          box-shadow: 0 0 0 2px rgba(168, 85, 247, 0.2);
        }

        &::placeholder {
          color: #666;
        }
      }
    }

    .cm-btn-row {
      display: flex;
      gap: 6px;
      
      .cm-btn {
        flex: 1;
        padding: 6px 12px;
      }
    }
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

  // TrackBy function for ngFor to prevent re-rendering issues
  trackByPath(index: number, node: TreeNode): string {
    return node.path;
  }

  isExpanded(path: string) {
    if (typeof window === 'undefined') {
      return this.level === 0 && this.node.type === 'folder';
    }
    const cmp: any = (window as any).__fileTreeComponentInstance;
    if (!cmp) return this.level === 0 && this.node.type === 'folder';
    return cmp.isExpanded(path);
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

  getFileClass(name: string): string {
    const ext = name.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'ts': return 'ts-file';
      case 'js': return 'js-file';
      case 'json': return 'json-file';
      case 'html': return 'html-file';
      case 'css': return 'css-file';
      case 'scss': return 'scss-file';
      case 'md': return 'md-file';
      default: return '';
    }
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
    .file-explorer-container { 
      height: 100%; 
      display: flex; 
      flex-direction: column;
      background-color: #1a1625;
    }
    
    .empty-state { 
      flex: 1; 
      display: flex; 
      flex-direction: column; 
      align-items: center; 
      justify-content: center; 
      color: #888;
      padding: 20px;
      text-align: center;
      
      p {
        margin: 0 0 16px 0;
        font-size: 13px;
        color: #b8b8b8;
      }
      
      button { 
        padding: 10px 20px; 
        background: linear-gradient(135deg, #a855f7 0%, #9333ea 100%);
        color: white; 
        border: none; 
        border-radius: 6px; 
        cursor: pointer;
        font-size: 13px;
        font-weight: 500;
        transition: all 0.15s ease;
        
        &:hover {
          background: linear-gradient(135deg, #b066f9 0%, #a855f7 100%);
          box-shadow: 0 0 15px rgba(168, 85, 247, 0.4);
        }
      }
    }
    
    .tree-content { 
      flex: 1; 
      overflow-y: auto;
      
      &::-webkit-scrollbar {
        width: 8px;
      }
      
      &::-webkit-scrollbar-track {
        background: transparent;
      }
      
      &::-webkit-scrollbar-thumb {
        background: rgba(168, 85, 247, 0.3);
        border-radius: 4px;
        
        &:hover {
          background: rgba(168, 85, 247, 0.5);
        }
      }
    }
    
    .tree-root { 
      font-family: var(--font, Arial); 
      padding: 8px 0;
    }
    
    .loading-state {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
      color: #b8b8b8;
      font-size: 13px;
      gap: 10px;
      
      .spinner {
        width: 16px;
        height: 16px;
        border: 2px solid rgba(168, 85, 247, 0.2);
        border-top-color: #a855f7;
        border-radius: 50%;
        animation: spin 1s linear infinite;
      }
      
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
    }
  `,
  ],
})
export class FileTreeComponent implements OnInit {
  tree = signal<TreeNode | null>(null);
  expanded = signal(new Set<string>());
  rootPath: string | null = null;

  constructor(@Inject(PLATFORM_ID) private platformId: Object, private fes: FileExplorerService) {
    if (isPlatformBrowser(this.platformId)) {
      (window as any).__fileTreeComponentInstance = this;
    }
  }

  ngOnInit() {
    this.fes.rootPath$.subscribe(path => {
      this.rootPath = path;
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
    // Expand root by default - use path as identifier
    this.expanded.update(set => {
        const newSet = new Set(set);
        newSet.add(rootNode.path);
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

  isExpanded = (path: string) => this.expanded().has(path);

  async toggle(node: TreeNode) {
    const id = node.path; // Use path as the unique identifier
    const set = new Set(this.expanded());
    if (set.has(id)) {
      set.delete(id);
    } else {
      set.add(id);
      // Lazy load children if not present
      if (!node.children || node.children.length === 0) {
          const children = await this.fes.getTree(node.path);
          node.children = children;
          // Force signal update by recreating the tree
          this.tree.set({ ...this.tree()! });
      }
    }
    this.expanded.set(set);
  }
}
