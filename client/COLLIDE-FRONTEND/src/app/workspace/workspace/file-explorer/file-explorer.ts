import { Component, signal, Input, Inject, PLATFORM_ID } from '@angular/core';
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
  <div class="node" [attr.data-id]="node.id">
    <span class="arrow" (click)="onToggle(node)">{{ node.type === 'folder' ? (isExpanded(node.id) ? '▾' : '▸') : '' }}</span>
    <span class="icon">{{ iconFor(node) }}</span>
    <span class="label">{{ node.name }}</span>
  </div>
  <div class="children" *ngIf="node.children?.length && isExpanded(node.id)">
    <file-node *ngFor="let c of node.children" [node]="c" [level]="level + 1"></file-node>
  </div>
  `,
  styles: [
    `
    :host { display:block }
    .node { display:flex; align-items:center; gap:6px; user-select:none }
    .arrow { width:18px; display:inline-flex; justify-content:center; cursor:pointer }
    .children { margin-left: 12px; }
  `,
  ],
})
export class FileNodeComponent {
  @Input() node!: TreeNode;
  @Input() level = 0;

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
    <file-node [node]="t" [level]="0"></file-node>
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

  constructor(private http: HttpClient, @Inject(PLATFORM_ID) private platformId: Object) {
    // expose global reference for the small demo recursion helper only in browser
    if (isPlatformBrowser(this.platformId)) {
      (window as any).__fileTreeComponentInstance = this;
      this.load();
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
