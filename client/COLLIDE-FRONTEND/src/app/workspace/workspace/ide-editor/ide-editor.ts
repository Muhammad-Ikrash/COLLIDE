import { Component, AfterViewInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { Subject, debounceTime, filter, merge, Subscription } from 'rxjs';
import { changesDT } from './data.type';
import { EditorComponent } from "ngx-monaco-editor-v2";
import { FileExplorerService } from '../../../core/services/fileexplorer.service';
import { CursorService } from '../../../core/services/cursor.service';

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
  imports: [EditorComponent],
  templateUrl: './ide-editor.html',
  styleUrls: ['./ide-editor.scss'],
})
export class IdeEditor implements AfterViewInit, OnDestroy {
  @ViewChild('editorContainer', { static: false }) editorContainer!: ElementRef<HTMLDivElement>;

  // monaco variables
  private monaco: any;
  private editorInstance: any;

  code = `function hello() {\n  console.log('Hello from Monaco!');\n}`;

  private activePath: string | null = null;
  private contentChanges$ = new Subject<string>();
  private debounced$ = this.contentChanges$.pipe(debounceTime(1000));
  private immediate$ = this.contentChanges$.pipe(filter((value) => FlagForUpdateSend(value)));
  private outgoing$ = merge(this.debounced$, this.immediate$);
  private subs: Subscription[] = [];

  constructor(private fes: FileExplorerService, private cursorService: CursorService) {}

  async ngAfterViewInit(): Promise<void> {
    try {
      this.monaco = await import('monaco-editor');

      // to handle worker URLs correctly
      (self as any).MonacoEnvironment = {
        getWorkerUrl: function (moduleId: any, label: string) {
          if (label === 'json') {
            return './assets/monaco/vs/language/json/json.worker.js';
          }
          if (label === 'css' || label === 'scss' || label === 'less') {
            return './assets/monaco/vs/language/css/css.worker.js';
          }
          if (label === 'html' || label === 'handlebars' || label === 'razor') {
            return './assets/monaco/vs/language/html/html.worker.js';
          }
          if (label === 'typescript' || label === 'javascript') {
            return './assets/monaco/vs/language/typescript/ts.worker.js';
          }
          return './assets/monaco/vs/editor/editor.worker.js';
        },
      };

      this.editorInstance = this.monaco.editor.create(this.editorContainer.nativeElement, {
        value: this.code,
        language: 'typescript',
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
        }
      } else {
        this.activePath = null;
      }
    }));
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
