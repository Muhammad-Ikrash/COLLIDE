import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { IdeEditor } from './ide-editor/ide-editor';
import { FileTabs } from './file-tabs/file-tabs';
import { FileTreeComponent } from './file-explorer/file-explorer';
import { WorkspaceHeader } from './workspace-header/workspace-header';
import { IdeFooter } from './ide-footer/ide-footer';
import { TerminalComponent } from './terminal/terminal';
import { ChatSidebar } from './chat-sidebar/chat-sidebar';
import { ProjectApiService, Project } from '../../core/services/project-api.service';
import { FileExplorerService } from '../../core/services/fileexplorer.service';
import { CommonModule } from '@angular/common';


@Component({
  selector: 'app-workspace',
  imports: [
    CommonModule, IdeEditor, FileTabs, FileTreeComponent, WorkspaceHeader, IdeFooter, TerminalComponent, ChatSidebar
  ],
  templateUrl: './workspace.html',
  styleUrl: './workspace.scss',
  standalone: true
})
export class Workspace implements OnInit {
  private route = inject(ActivatedRoute);
  public router = inject(Router);
  private projectApi = inject(ProjectApiService);
  private fileExplorerService = inject(FileExplorerService);

  projectId: string | null = null;
  project: Project | null = null;
  projectRootPath: string | null = null;
  isLoading = true;
  error: string | null = null;

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      this.projectId = params.get('projectId');
      if (this.projectId) {
        this.loadProject(parseInt(this.projectId, 10));
      } else {
        this.router.navigate(['/dashboard']);
      }
    });
  }

  private loadProject(id: number): void {
    this.isLoading = true;
    this.error = null;

    this.projectApi.getProject(id).subscribe({
      next: (project) => {
        this.project = project;
        this.projectRootPath = project.folderPath || null;
        this.isLoading = false;
        
        // Set the root path in the file explorer service
        if (this.projectRootPath) {
          // Trigger file explorer to use this path
          (this.fileExplorerService as any).rootPathSubject?.next(this.projectRootPath);
        }
      },
      error: (err) => {
        console.error('Failed to load project:', err);
        this.error = err.error?.error || 'Failed to load project';
        this.isLoading = false;
      }
    });
  }

  goToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }
}
