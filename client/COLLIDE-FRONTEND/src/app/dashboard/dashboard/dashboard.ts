import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { ProjectApiService, Project } from '../../core/services/project-api.service';

interface Workspace {
  id: string;
  name: string;
  folderPath: string;
  role: 'Admin' | 'Collaborator' | 'Viewer';
  memberCount: number;
  lastAccessed: string;
  lastAccessedTime: string;
  color?: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.scss']
})
export class Dashboard implements OnInit {
  private authService = inject(AuthService);
  private projectApi = inject(ProjectApiService);
  private router = inject(Router);
  
  username = 'User';
  workspaces: Workspace[] = [];
  
  // Modal state
  showCreateModal = false;
  newProjectName = '';
  newProjectFolder = '';
  isCreating = false;
  createError = '';

  // Random colors for workspace icons
  private colors = ['#4f46e5', '#059669', '#dc2626', '#7c3aed', '#ea580c', '#0891b2', '#be185d'];

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      if (user) {
        this.username = user.user_metadata?.full_name || user.email || 'User';
      }
    });
    
    this.loadProjects();
  }

  loadProjects(): void {
    this.projectApi.getProjects().subscribe({
      next: (response) => {
        this.workspaces = response.projects.map((p, index) => this.mapProjectToWorkspace(p, index));
      },
      error: (err) => {
        console.error('Failed to load projects:', err);
      }
    });
  }

  private mapProjectToWorkspace(project: Project, index: number): Workspace {
    const now = new Date();
    const lastMod = new Date(project.lastModifiedAt);
    const diffMs = now.getTime() - lastMod.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    
    let lastAccessed: string;
    let lastAccessedTime: string;
    
    if (diffHours < 1) {
      lastAccessed = 'Just now';
      lastAccessedTime = '0h';
    } else if (diffHours < 24) {
      lastAccessed = `${diffHours} hours ago`;
      lastAccessedTime = `${diffHours}h`;
    } else if (diffDays < 7) {
      lastAccessed = `${diffDays} days ago`;
      lastAccessedTime = `${diffDays}d`;
    } else {
      const weeks = Math.floor(diffDays / 7);
      lastAccessed = `${weeks} week${weeks > 1 ? 's' : ''} ago`;
      lastAccessedTime = `${weeks}w`;
    }

    return {
      id: project.id.toString(),
      name: project.name,
      folderPath: project.folderPath,
      role: 'Admin', // TODO: Get actual role from membership
      memberCount: 1, // TODO: Get actual member count
      lastAccessed,
      lastAccessedTime,
      color: this.colors[index % this.colors.length]
    };
  }

  getRoleIcon(role: string): string {
    const icons = {
      'Admin': '👑',
      'Collaborator': '👥',
      'Viewer': '👀'
    };
    return icons[role as keyof typeof icons] || '📁';
  }

  getInitials(name: string): string {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  }

  openWorkspace(workspace: Workspace): void {
    // Navigate to workspace with project ID
    this.router.navigate(['/workspace', workspace.id]);
  }

  logout(): void {
    this.authService.logout();
  }

  // Modal methods
  openCreateModal(): void {
    this.showCreateModal = true;
    this.newProjectName = '';
    this.newProjectFolder = '';
    this.createError = '';
  }

  closeCreateModal(): void {
    this.showCreateModal = false;
    this.newProjectName = '';
    this.newProjectFolder = '';
    this.createError = '';
  }

  async selectFolder(): Promise<void> {
    if (!window.electronAPI?.selectFolder) {
      // Fallback for browser testing - prompt for path
      const path = prompt('Enter folder path (Electron not available):');
      if (path) {
        this.newProjectFolder = path;
      }
      return;
    }

    try {
      const folderPath = await window.electronAPI.selectFolder();
      if (folderPath) {
        this.newProjectFolder = folderPath;
      }
    } catch (err) {
      console.error('Failed to select folder:', err);
      this.createError = 'Failed to select folder';
    }
  }

  createProject(): void {
    if (!this.newProjectName.trim()) {
      this.createError = 'Project name is required';
      return;
    }

    if (!this.newProjectFolder.trim()) {
      this.createError = 'Please select a folder for the project';
      return;
    }

    this.isCreating = true;
    this.createError = '';

    this.projectApi.createProject({
      name: this.newProjectName.trim(),
      folderPath: this.newProjectFolder.trim()
    }).subscribe({
      next: (project) => {
        this.isCreating = false;
        this.closeCreateModal();
        // Navigate to the workspace with the new project ID
        this.router.navigate(['/workspace', project.id]);
      },
      error: (err) => {
        this.isCreating = false;
        this.createError = err.error?.error || 'Failed to create project';
        console.error('Failed to create project:', err);
      }
    });
  }
}