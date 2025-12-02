import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

const API_BASE_URL = 'http://localhost:8080';

export interface Project {
  id: number;
  name: string;
  ownerId: number;
  folderPath: string;
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
}
