import { Component } from '@angular/core';
import { IdeEditor } from './ide-editor/ide-editor';
import { FileTabs } from './file-tabs/file-tabs';
import { FileTreeComponent } from './file-explorer/file-explorer';
import { WorkspaceHeader } from './workspace-header/workspace-header';
import { IdeFooter } from './ide-footer/ide-footer';
import { TerminalComponent } from './terminal/terminal';
import { ChatSidebar } from './chat-sidebar/chat-sidebar';


@Component({
  selector: 'app-workspace',
  imports: [
    IdeEditor,FileTabs,FileTreeComponent,WorkspaceHeader,IdeFooter,TerminalComponent,ChatSidebar
  ],
  templateUrl: './workspace.html',
  styleUrl: './workspace.scss',
  standalone: true
})
export class Workspace {
  projectRootPath: string | null = null;

  onRootPathChange(path: string | null) {
    this.projectRootPath = path;
    console.log('Root path changed to:', path);
  }
}
