import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

interface Workspace {
  id: string;
  name: string;

  role: 'Admin' | 'Collaborator' | 'Viewer';
  memberCount: number;
  lastAccessed: string;
  lastAccessedTime: string;
  color?: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.scss']
})
export class DashboardComponent implements OnInit {
  username = 'Eshaal Yasir';
  workspaces: Workspace[] = [
    {
      id: '1',
      name: 'React Dashboard',
      role: 'Admin',
      memberCount: 3,
      lastAccessed: '2 hours ago',
      lastAccessedTime: '2h',
      color: '#4f46e5'
    },
    {
      id: '2',
      name: 'Data Analytics',
      role: 'Admin',
      memberCount: 2,
      lastAccessed: '1 week ago',
      lastAccessedTime: '1w',
      color: '#059669'
    },
    {
      id: '3',
      name: 'Node.js API',
      role: 'Collaborator',
      memberCount: 5,
      lastAccessed: '1 day ago',
      lastAccessedTime: '1d',
      color: '#dc2626'
    },
    {
      id: '4',
      name: 'Mobile App',
      role: 'Viewer',
      memberCount: 8,
      lastAccessed: '3 days ago',
      lastAccessedTime: '3d',
      color: '#7c3aed'
    }
  ];

  ngOnInit(): void {}

  getRoleIcon(role: string): string {
    const icons = {
      'Admin': '👑',
      'Collaborator': '👥',
      'Viewer': '👀'
    };
    return icons[role as keyof typeof icons] || '📁';
  }

  getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  }

  openWorkspace(workspace: Workspace): void {
    // Navigate to workspace editor
    console.log('Opening workspace:', workspace.name);
    // this.router.navigate(['/workspace', workspace.id]);
  }
}