import { Component, AfterViewInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { debounce, debounceTime, Subject, filter, merge } from 'rxjs';
import { changesDT } from './data.type';
import { EditorComponent } from "ngx-monaco-editor-v2";

// change tracking variables
let changesQueue: changesDT[] = [];
let currentPointInChangesQueue: number = 0;
let limitInChangesQueue: number = 0;

const FlagForUpdateSend = (character: string): boolean => {
  if (character.length > 10 || character.includes('\n') || character.includes(' ')) {
    return true;
  }
  return false;
};

const sendToBackend = (): void => {
  limitInChangesQueue = changesQueue.length;
  console.log('Sending changes to backend:');
  for (; currentPointInChangesQueue < limitInChangesQueue; currentPointInChangesQueue++) {
    console.log(changesQueue[currentPointInChangesQueue]);
  }
};
// propagation control
const contentChanges$ = new Subject<string>();
const immediateChanges$ = new Subject<string>(); // to be used to save the file immediately or when closing the editor
const debounced$ = contentChanges$.pipe(debounceTime(1000));
const immediate$ = contentChanges$.pipe(filter((value) => FlagForUpdateSend(value)));
const outgoing$ = merge(debounced$, immediate$);
outgoing$.subscribe((value) => {
  sendToBackend();
});

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

  async ngAfterViewInit(): Promise<void> {
    try {
      this.monaco = await import('monaco-editor');

      // to handle worker URLs correctly
      self.MonacoEnvironment = {
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
      this.editorContainer.nativeElement.textContent =
        'Editor failed to load. See console for details.';
    }

    this.editorInstance.onDidChangeModelContent((event: any) => {
      event.changes.forEach((change: any, index: number) => {
        const newChange: changesDT = {
          id: changesQueue.length + 1,
          range: change.range,
          text: change.text,
          rangeOffset: change.rangeOffset,
          rangeLength: change.rangeLength,
        };

        changesQueue.push(newChange);
      });

      contentChanges$.next(changesQueue[changesQueue.length - 1].text);
    });
  }

  ngOnDestroy(): void {
    if (this.editorInstance) {
      this.editorInstance.dispose();
    }
  }
}
