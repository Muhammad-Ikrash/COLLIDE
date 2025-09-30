// src/app/workspace/workspace.routes.ts

import { Routes } from '@angular/router';
import { Workspace } from './workspace/workspace';

export const WORKSPACE_ROUTES: Routes = [
  {
    // Parameterized route: :projectId is required to load the workspace
    path: ':projectId', 
    component: Workspace,
  },
  {
    path: '',
    redirectTo: '/dashboard', // If someone hits /workspace without an ID, redirect them
    pathMatch: 'full'
  }
];