import { Component, OnInit, OnDestroy, inject, HostListener } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { IdeEditor } from './ide-editor/ide-editor';
import { FileTabs } from './file-tabs/file-tabs';
import { FileTreeComponent } from './file-explorer/file-explorer';
import { WorkspaceHeader } from './workspace-header/workspace-header';
import { IdeFooter } from './ide-footer/ide-footer';
import { TerminalComponent } from './terminal/terminal';
import { ChatSidebar } from './chat-sidebar/chat-sidebar';
import { ProjectApiService, Project, ProjectMember } from '../../core/services/project-api.service';
import { FileExplorerService } from '../../core/services/fileexplorer.service';
import { ChatService } from '../../core/services/chat.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';


@Component({
  selector: 'app-workspace',
  imports: [
    CommonModule, FormsModule, IdeEditor, FileTabs, FileTreeComponent, WorkspaceHeader, IdeFooter, TerminalComponent, ChatSidebar
  ],
  templateUrl: './workspace.html',
  styleUrl: './workspace.scss',
  standalone: true
})
export class Workspace implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  public router = inject(Router);
  private projectApi = inject(ProjectApiService);
  private fileExplorerService = inject(FileExplorerService);
  private chatService = inject(ChatService);

  projectId: string | null = null;
  project: Project | null = null;
  projectRootPath: string | null = null;
  isLoading = true;
  error: string | null = null;

  // Panel visibility state
  showFileExplorer = true;
  showTerminal = true;
  showChat = false;
  
  // Activity bar active item
  activeActivityItem: 'files' | 'search' | 'git' | 'extensions' = 'files';

  // Terminal resize state
  terminalHeight = 200;
  private isResizingTerminal = false;
  private resizeStartY = 0;
  private resizeStartHeight = 0;
  private readonly minTerminalHeight = 100;
  private readonly maxTerminalHeight = 600;

  // Settings popup state
  showSettingsPopup = false;
  isEditingName = false;
  editedProjectName = '';
  showDeleteConfirm = false;

  // Collaborators popup state
  showCollaboratorsPopup = false;
  members: ProjectMember[] = [];
  isLoadingMembers = false;
  newMemberEmail = '';
  newMemberRole: 'CO_ADMIN' | 'CONTRIBUTOR' = 'CONTRIBUTOR';
  addMemberError = '';
  currentUserRole: string | null = null;

  // Folder selection prompt state
  showFolderPrompt = false;
  selectedLocalPath = '';
  isSharedProject = false;

  // Track if any files are open
  hasOpenFiles = false;

  // Chat unread count
  unreadChatCount = 0;
  private subscriptions: Subscription[] = [];

  ngOnInit(): void {
    // Subscribe to opened files to track if editor should be shown
    this.fileExplorerService.openedFiles$.subscribe(files => {
      this.hasOpenFiles = files.length > 0;
    });

    // Subscribe to chat unread count
    this.subscriptions.push(
      this.chatService.unreadCount$.subscribe(count => {
        this.unreadChatCount = count;
      })
    );

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
        this.currentUserRole = project.role || null;
        
        // Connect to chat for this project
        this.connectToChat(project);
        
        // Check if this is a shared project (user is not the owner)
        this.isSharedProject = project.role !== 'ADMIN';
        
        // Use localFolderPath if available (works for both owner and members)
        // localFolderPath is set for owner during project creation
        // and for members when they first select their local folder
        if (project.localFolderPath) {
          this.projectRootPath = project.localFolderPath;
          this.isLoading = false;
          this.setFileExplorerPath(this.projectRootPath);
        } else if (!this.isSharedProject && project.folderPath) {
          // Fallback for owner: use project's folderPath if localFolderPath not set
          this.projectRootPath = project.folderPath;
          this.isLoading = false;
          this.setFileExplorerPath(this.projectRootPath);
        } else if (this.isSharedProject) {
          // Shared project without local path - prompt user to select one
          this.isLoading = false;
          this.showFolderPrompt = true;
        } else {
          // Owner with no path set (shouldn't normally happen)
          this.projectRootPath = null;
          this.isLoading = false;
        }
      },
      error: (err) => {
        console.error('Failed to load project:', err);
        this.error = err.error?.error || 'Failed to load project';
        this.isLoading = false;
      }
    });
  }

  private setFileExplorerPath(path: string): void {
    // Trigger file explorer to use this path
    if ((this.fileExplorerService as any).rootPathSubject) {
      (this.fileExplorerService as any).rootPathSubject.next(path);
    }
  }

  selectLocalFolder(): void {
    // Use Electron's dialog to select a folder
    if ((window as any).electronAPI?.selectFolder) {
      (window as any).electronAPI.selectFolder().then((result: string | null) => {
        if (result) {
          this.selectedLocalPath = result;
        }
      }).catch((err: any) => {
        console.error('Failed to select folder:', err);
      });
    } else {
      // Fallback: prompt user to enter path manually
      const path = prompt('Enter the local folder path for this project:');
      if (path) {
        this.selectedLocalPath = path;
      }
    }
  }

  confirmLocalFolder(): void {
    if (!this.selectedLocalPath || !this.project) return;
    
    console.log('Setting local folder path:', this.selectedLocalPath, 'for project:', this.project.id);
    
    this.projectApi.setLocalFolderPath(this.project.id, this.selectedLocalPath).subscribe({
      next: (response) => {
        console.log('Successfully set local folder path:', response);
        this.projectRootPath = response.localFolderPath;
        this.showFolderPrompt = false;
        this.setFileExplorerPath(this.projectRootPath);
      },
      error: (err) => {
        console.error('Failed to set local folder path:', err);
        const errorMessage = err.error?.error || err.message || 'Unknown error';
        alert('Failed to set folder path: ' + errorMessage);
      }
    });
  }

  cancelFolderSelection(): void {
    this.showFolderPrompt = false;
    this.router.navigate(['/dashboard']);
  }

  goToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }

  // Panel toggle methods
  toggleFileExplorer(): void {
    this.showFileExplorer = !this.showFileExplorer;
    if (this.showFileExplorer) {
      this.activeActivityItem = 'files';
    }
  }

  toggleTerminal(): void {
    this.showTerminal = !this.showTerminal;
  }

  toggleChat(): void {
    this.showChat = !this.showChat;
    if (this.showChat) {
      // Mark messages as read when chat is opened
      this.chatService.markAsRead();
    } else {
      // Notify service that chat is closed (for unread tracking)
      this.chatService.setChatClosed();
    }
  }

  private connectToChat(project: Project): void {
    // Get current user info from localStorage
    const userJson = localStorage.getItem('user');
    let userId = 0;
    let userName = 'User';
    let userEmail = '';
    
    if (userJson) {
      try {
        const user = JSON.parse(userJson);
        userId = user.id || 0;
        userName = user.name || user.email?.split('@')[0] || 'User';
        userEmail = user.email || '';
      } catch (e) {
        console.error('Failed to parse user data for chat:', e);
      }
    }
    
    // Always connect to chat, even without user info
    this.chatService.connect(project.id, userId, userName, userEmail);
  }

  setActiveActivity(item: 'files' | 'search' | 'git' | 'extensions'): void {
    if (this.activeActivityItem === item && this.showFileExplorer) {
      this.showFileExplorer = false;
    } else {
      this.activeActivityItem = item;
      this.showFileExplorer = true;
    }
  }

  openSettings(): void {
    this.showSettingsPopup = !this.showSettingsPopup;
    this.isEditingName = false;
    this.showDeleteConfirm = false;
    if (this.showSettingsPopup && this.project) {
      this.editedProjectName = this.project.name;
    }
  }

  closeSettingsPopup(): void {
    this.showSettingsPopup = false;
    this.isEditingName = false;
    this.showDeleteConfirm = false;
  }

  startEditingName(): void {
    this.isEditingName = true;
    this.editedProjectName = this.project?.name || '';
  }

  cancelEditingName(): void {
    this.isEditingName = false;
    this.editedProjectName = this.project?.name || '';
  }

  saveProjectName(): void {
    if (!this.project || !this.editedProjectName.trim()) return;
    
    const trimmedName = this.editedProjectName.trim();
    if (trimmedName === this.project.name) {
      this.isEditingName = false;
      return;
    }

    this.projectApi.updateProject(this.project.id, { name: trimmedName }).subscribe({
      next: (updatedProject) => {
        this.project = updatedProject;
        this.isEditingName = false;
      },
      error: (err) => {
        console.error('Failed to update project name:', err);
        // Reset to original name
        this.editedProjectName = this.project?.name || '';
      }
    });
  }

  showDeleteConfirmation(): void {
    this.showDeleteConfirm = true;
  }

  cancelDelete(): void {
    this.showDeleteConfirm = false;
  }

  confirmDeleteProject(): void {
    if (!this.project) return;

    this.projectApi.deleteProject(this.project.id).subscribe({
      next: () => {
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        console.error('Failed to delete project:', err);
        this.showDeleteConfirm = false;
      }
    });
  }

  openCollaborators(): void {
    this.showCollaboratorsPopup = true;
    this.addMemberError = '';
    this.newMemberEmail = '';
    this.newMemberRole = 'CONTRIBUTOR';
    this.loadMembers();
  }

  closeCollaboratorsPopup(): void {
    this.showCollaboratorsPopup = false;
    this.addMemberError = '';
  }

  loadMembers(): void {
    if (!this.project) return;
    
    this.isLoadingMembers = true;
    this.projectApi.getProjectMembers(this.project.id).subscribe({
      next: (response) => {
        this.members = response.members;
        // Find current user's role (we'll need to match by checking the auth service later)
        this.isLoadingMembers = false;
      },
      error: (err) => {
        console.error('Failed to load members:', err);
        this.isLoadingMembers = false;
      }
    });
  }

  addMember(): void {
    if (!this.project || !this.newMemberEmail.trim()) return;
    
    this.addMemberError = '';
    this.projectApi.addProjectMember(this.project.id, {
      email: this.newMemberEmail.trim(),
      role: this.newMemberRole
    }).subscribe({
      next: () => {
        this.newMemberEmail = '';
        this.newMemberRole = 'CONTRIBUTOR';
        this.loadMembers();
      },
      error: (err) => {
        this.addMemberError = err.error?.error || 'Failed to add member';
      }
    });
  }

  updateMemberRole(member: ProjectMember, newRole: string): void {
    if (!this.project) return;
    
    this.projectApi.updateMemberRole(this.project.id, member.userId, {
      role: newRole as any
    }).subscribe({
      next: () => {
        this.loadMembers();
      },
      error: (err) => {
        console.error('Failed to update role:', err);
      }
    });
  }

  removeMember(member: ProjectMember): void {
    if (!this.project) return;
    
    if (confirm(`Remove ${member.userName || member.userEmail} from the project?`)) {
      this.projectApi.removeMember(this.project.id, member.userId).subscribe({
        next: () => {
          this.loadMembers();
        },
        error: (err) => {
          console.error('Failed to remove member:', err);
        }
      });
    }
  }

  isOwner(member: ProjectMember): boolean {
    return this.project?.ownerId === member.userId;
  }

  getMembersByRole(role: string): ProjectMember[] {
    return this.members.filter(m => m.role === role);
  }

  canManageMembers(): boolean {
    // Check if current user is admin or co-admin
    // For now, we'll allow management if user can access the project
    // This should ideally check against the current user's role
    return true;
  }

  // Terminal resize methods
  startTerminalResize(event: MouseEvent): void {
    event.preventDefault();
    this.isResizingTerminal = true;
    this.resizeStartY = event.clientY;
    this.resizeStartHeight = this.terminalHeight;
    document.body.style.cursor = 'ns-resize';
    document.body.style.userSelect = 'none';
  }

  @HostListener('document:mousemove', ['$event'])
  onMouseMove(event: MouseEvent): void {
    if (!this.isResizingTerminal) return;
    
    const deltaY = this.resizeStartY - event.clientY;
    let newHeight = this.resizeStartHeight + deltaY;
    
    // Clamp to min/max bounds
    newHeight = Math.max(this.minTerminalHeight, Math.min(this.maxTerminalHeight, newHeight));
    this.terminalHeight = newHeight;
  }

  @HostListener('document:mouseup')
  onMouseUp(): void {
    if (this.isResizingTerminal) {
      this.isResizingTerminal = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }
  }

  ngOnDestroy(): void {
    // Clean up subscriptions
    this.subscriptions.forEach(sub => sub.unsubscribe());
    
    // Disconnect from chat
    this.chatService.disconnect();
    
    // Clean up resize state
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }
}
