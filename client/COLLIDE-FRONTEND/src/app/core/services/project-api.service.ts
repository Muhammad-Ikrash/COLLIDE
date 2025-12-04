import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

const API_BASE_URL = 'http://localhost:8080';

export interface Project {
  id: number;
  name: string;
  ownerId: number;
  folderPath: string;
  localFolderPath?: string;
  role?: string;
  memberCount?: number;
  createdAt: string;
  lastModifiedAt: string;
}

export interface ProjectsResponse {
  projects: Project[];
}

export interface CreateProjectRequest {
  name: string;
  folderPath: string;
}

export interface ProjectMember {
  id: number;
  userId: number;
  userName: string;
  userEmail: string;
  role: 'ADMIN' | 'CO_ADMIN' | 'CONTRIBUTOR' | 'VIEWER' | 'BANNED';
  createdAt: string;
}

export interface MembersResponse {
  members: ProjectMember[];
}

export interface AddMemberRequest {
  email: string;
  role: 'ADMIN' | 'CO_ADMIN' | 'CONTRIBUTOR' | 'VIEWER';
}

export interface UpdateRoleRequest {
  role: 'ADMIN' | 'CO_ADMIN' | 'CONTRIBUTOR' | 'VIEWER' | 'BANNED';
}

export interface CollaborativeFile {
  id: number;
  filename: string;
  path: string;
  isDirectory: boolean;
  addedBy: number;
  addedByName: string;
  createdAt: string;
}

export interface CollaborativeFilesResponse {
  files: CollaborativeFile[];
}

export interface FileSelection {
  path: string;
  filename: string;
  isDirectory: boolean;
}

export interface SetCollaborativeFilesRequest {
  files: FileSelection[];
}

@Injectable({
  providedIn: 'root'
})
export class ProjectApiService {
  private http = inject(HttpClient);

  /**
   * Get all projects for the current user
   */
  getProjects(): Observable<ProjectsResponse> {
    return this.http.get<ProjectsResponse>(`${API_BASE_URL}/api/projects`);
  }

  /**
   * Get a single project by ID
   */
  getProject(id: number): Observable<Project> {
    return this.http.get<Project>(`${API_BASE_URL}/api/projects/${id}`);
  }

  /**
   * Create a new project
   */
  createProject(request: CreateProjectRequest): Observable<Project> {
    return this.http.post<Project>(`${API_BASE_URL}/api/projects`, request);
  }

  /**
   * Update a project
   */
  updateProject(id: number, request: Partial<CreateProjectRequest>): Observable<Project> {
    return this.http.put<Project>(`${API_BASE_URL}/api/projects/${id}`, request);
  }

  /**
   * Delete a project
   */
  deleteProject(id: number): Observable<void> {
    return this.http.delete<void>(`${API_BASE_URL}/api/projects/${id}`);
  }

  // ============ Project Members ============

  /**
   * Get all members of a project
   */
  getProjectMembers(projectId: number): Observable<MembersResponse> {
    return this.http.get<MembersResponse>(`${API_BASE_URL}/api/projects/${projectId}/members`);
  }

  /**
   * Add a member to a project
   */
  addProjectMember(projectId: number, request: AddMemberRequest): Observable<ProjectMember> {
    return this.http.post<ProjectMember>(`${API_BASE_URL}/api/projects/${projectId}/members`, request);
  }

  /**
   * Update a member's role
   */
  updateMemberRole(projectId: number, userId: number, request: UpdateRoleRequest): Observable<ProjectMember> {
    return this.http.put<ProjectMember>(`${API_BASE_URL}/api/projects/${projectId}/members/${userId}`, request);
  }

  /**
   * Remove a member from a project
   */
  removeMember(projectId: number, userId: number): Observable<void> {
    return this.http.delete<void>(`${API_BASE_URL}/api/projects/${projectId}/members/${userId}`);
  }

  /**
   * Set local folder path for the current user's project
   */
  setLocalFolderPath(projectId: number, localFolderPath: string): Observable<{ message: string; localFolderPath: string }> {
    return this.http.put<{ message: string; localFolderPath: string }>(
      `${API_BASE_URL}/api/projects/${projectId}/local-path`,
      { localFolderPath }
    );
  }

  // ============ Collaborative Files ============

  /**
   * Get all collaborative files for a project
   */
  getCollaborativeFiles(projectId: number): Observable<CollaborativeFilesResponse> {
    return this.http.get<CollaborativeFilesResponse>(`${API_BASE_URL}/api/projects/${projectId}/files`);
  }

  /**
   * Set collaborative files for a project (bulk update)
   */
  setCollaborativeFiles(projectId: number, request: SetCollaborativeFilesRequest): Observable<{ message: string; files: CollaborativeFile[] }> {
    return this.http.put<{ message: string; files: CollaborativeFile[] }>(
      `${API_BASE_URL}/api/projects/${projectId}/files`,
      request
    );
  }

  /**
   * Add a single collaborative file
   */
  addCollaborativeFile(projectId: number, file: FileSelection): Observable<CollaborativeFile> {
    return this.http.post<CollaborativeFile>(`${API_BASE_URL}/api/projects/${projectId}/files`, file);
  }

  /**
   * Remove a collaborative file
   */
  removeCollaborativeFile(projectId: number, fileId: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${API_BASE_URL}/api/projects/${projectId}/files/${fileId}`);
  }

  /**
   * Check if a file is marked as collaborative
   */
  checkCollaborativeFile(projectId: number, path: string): Observable<{ isCollaborative: boolean; path: string }> {
    return this.http.get<{ isCollaborative: boolean; path: string }>(
      `${API_BASE_URL}/api/projects/${projectId}/files/check`,
      { params: { path } }
    );
  }
}
