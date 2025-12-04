import { Component, AfterViewInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { Subject, debounceTime, filter, merge, Subscription } from 'rxjs';
import { changesDT } from './data.type';
import { FileExplorerService } from '../../../core/services/fileexplorer.service';
import { CursorService } from '../../../core/services/cursor.service';

declare const monaco: any;

// change tracking queue (kept separate)
let changesQueue: changesDT[] = [];

const FlagForUpdateSend = (character: string): boolean => {
  if (character.length > 10 || character.includes('\n') || character.includes(' ')) {
    return true;
  }
  return false;
};

@Component({
  selector: 'app-ide-editor',
  imports: [],
  templateUrl: './ide-editor.html',
  styleUrls: ['./ide-editor.scss'],
})
export class IdeEditor implements AfterViewInit, OnDestroy {
  @ViewChild('editorContainer', { static: false }) editorContainer!: ElementRef<HTMLDivElement>;

  // monaco variables
  private monacoInstance: any;
  private editorInstance: any;

  code = `function hello() {\n  console.log('Hello from Monaco!');\n}`;

  private activePath: string | null = null;
  private contentChanges$ = new Subject<string>();
  private debounced$ = this.contentChanges$.pipe(debounceTime(1000));
  private immediate$ = this.contentChanges$.pipe(filter((value) => FlagForUpdateSend(value)));
  private outgoing$ = merge(this.debounced$, this.immediate$);
  private subs: Subscription[] = [];

  constructor(private fes: FileExplorerService, private cursorService: CursorService) {}


  private getLanguageFromPath(filePath: string): string {
    if (!filePath) return 'plaintext';
    
    const ext = filePath.substring(filePath.lastIndexOf('.')).toLowerCase();
    
    switch (ext) {
      case '.cpp':
      case '.c':
        return 'cpp';
      case '.txt':
      default:
        return 'plaintext';
    }
  }

  async ngAfterViewInit(): Promise<void> {
    try {
      // Load Monaco from assets using AMD loader
      this.monacoInstance = await this.loadMonaco();

      this.editorInstance = this.monacoInstance.editor.create(this.editorContainer.nativeElement, {
        value: this.code,
        language: 'plaintext',
        theme: 'vs-dark',
        automaticLayout: true,
        minimap: { enabled: true },
      });
    } catch (err) {
      // just for worst case scenario, big-oh moment
      console.error('Failed to load monaco-editor:', err);
      if (this.editorContainer && this.editorContainer.nativeElement)
        this.editorContainer.nativeElement.textContent =
          'Editor failed to load. See console for details.';
      return;
    }

    // handle editor content changes
    this.editorInstance.onDidChangeModelContent((event: any) => {
      event.changes.forEach((change: any) => {
        const newChange: changesDT = {
          id: changesQueue.length + 1,
          range: change.range,
          text: change.text,
          rangeOffset: change.rangeOffset,
          rangeLength: change.rangeLength,
        };
        changesQueue.push(newChange);
      });
      const last = changesQueue[changesQueue.length - 1];
      if (last) this.contentChanges$.next(last.text);
    });

    // update cursor position for footer
    if (this.editorInstance && typeof this.editorInstance.onDidChangeCursorPosition === 'function') {
      this.editorInstance.onDidChangeCursorPosition((e: any) => {
        try {
          const pos = e.position || e.target && e.target.position;
          if (pos) this.cursorService.setPosition(pos.lineNumber || pos.line, pos.column || pos.columnNumber || pos.column);
        } catch (err) { /* ignore */ }
      });
    }

    // save pipeline
    this.subs.push(this.outgoing$.subscribe(() => {
      this.saveCurrentFile();
    }));

    // subscribe to active file changes from service
    this.subs.push(this.fes.activeFile$.subscribe(f => {
      if (f) {
        this.activePath = f.path;
        if (this.editorInstance) {
          const current = this.editorInstance.getValue();
          if (current !== f.content) {
            const model = this.editorInstance.getModel();
            if (model && typeof model.setValue === 'function') model.setValue(f.content);
            else this.editorInstance.setValue(f.content);
          }
          // Update language based on file extension
          const language = this.getLanguageFromPath(f.path);
          const currentModel = this.editorInstance.getModel();
          if (currentModel) {
            this.monacoInstance.editor.setModelLanguage(currentModel, language);
          }
        }
      } else {
        this.activePath = null;
      }
    }));
  }

  /**
   * Load Monaco Editor from assets using AMD loader
   * This approach works for both dev server and file:// protocol
   */
  private loadMonaco(): Promise<any> {
    return new Promise((resolve, reject) => {
      // Check if monaco is already loaded
      if (typeof (window as any).monaco !== 'undefined') {
        resolve((window as any).monaco);
        return;
      }

      // Determine base path based on protocol
      const isFileProtocol = window.location.protocol === 'file:';
      let basePath: string;
      
      if (isFileProtocol) {
        // For file:// protocol, compute path relative to the HTML file
        // Remove hash and query string first
        let href = window.location.href.split('#')[0].split('?')[0];
        const lastSlash = href.lastIndexOf('/');
        const baseDir = href.substring(0, lastSlash);
        basePath = `${baseDir}/assets/monaco`;
      } else {
        basePath = '/assets/monaco';
      }

      console.log('[Monaco] Loading from:', basePath);

      // Configure Monaco environment for workers
      (window as any).MonacoEnvironment = {
        getWorker: function (_moduleId: any, label: string) {
          // Use inline workers for file:// protocol to avoid CORS issues
          return new Worker(URL.createObjectURL(new Blob([`
            self.MonacoEnvironment = { baseUrl: '${basePath}/' };
            importScripts('${basePath}/vs/base/worker/workerMain.js');
          `], { type: 'application/javascript' })));
        }
      };

      // Load the AMD loader
      const loaderScript = document.createElement('script');
      loaderScript.src = `${basePath}/vs/loader.js`;
      loaderScript.onload = () => {
        // Configure require
        const require = (window as any).require;
        require.config({
          paths: { 'vs': `${basePath}/vs` }
        });

        // Load monaco
        require(['vs/editor/editor.main'], () => {
          resolve((window as any).monaco);
        }, (err: any) => {
          reject(err);
        });
      };
      loaderScript.onerror = (err) => {
        reject(new Error('Failed to load Monaco loader script'));
      };
      document.head.appendChild(loaderScript);
    });
  }

  ngOnDestroy(): void {
    if (this.editorInstance) {
      this.editorInstance.dispose();
    }
    this.subs.forEach(s => s.unsubscribe());
  }

  private saveCurrentFile() {
    if (!this.activePath || !this.editorInstance) return;
    const content = this.editorInstance.getValue();
    this.fes.saveFile(this.activePath, content).catch(err => {
      console.error('Failed to save file', err);
    });
  }
}
