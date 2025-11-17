
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FileExplorerService, OpenedFile } from '../../../core/services/fileexplorer.service';

@Component({
  selector: 'app-file-tabs',
  imports: [CommonModule],
  templateUrl: './file-tabs.html',
  styleUrl: './file-tabs.scss'
})
export class FileTabs {
  openedFiles: OpenedFile[] = [];
  activeFile: OpenedFile | null = null;

  constructor(private fes: FileExplorerService) {
    this.fes.openedFiles$.subscribe(v => this.openedFiles = v);
    this.fes.activeFile$.subscribe(v => this.activeFile = v);
  }

  activate(id: string) {
    this.fes.activateFile(id);
  }

  close(e: MouseEvent, id: string) {
    e.stopPropagation();
    this.fes.closeFile(id);
  }
}
