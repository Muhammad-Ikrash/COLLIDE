// src/app/app.routes.ts

import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { LoadingScreen } from './loading-screen/loading-screen/loading-screen';
// NOTE: You need to create a simple 404/NotFound component
// import { NotFoundComponent } from './not-found/not-found.component'; 

export const routes: Routes = [
  // 1. Initial Load: Loading Screen Component handles the check and redirect.
  { 
    path: '', 
    component: LoadingScreen,
    // No guard here, as this component's ngOnInit does the initial check.
  },
  
  // 2. Auth Feature (Lazy Loaded)
  {
    path: 'auth',
    loadChildren: () => import('./auth/auth.routes').then(r => r.AUTH_ROUTES),
  },
  
  // 3. Protected Dashboard Feature (Lazy Loaded)
  {
    path: 'dashboard',
    canActivate: [authGuard], // PROTECTED!
    loadChildren: () => import('./dashboard/dashboard.routes').then(r => r.DASHBOARD_ROUTES),
  },

  // 4. Protected Workspace Feature (Lazy Loaded)
  {
    path: 'workspace',
    canActivate: [authGuard], // PROTECTED!
    loadChildren: () => import('./workspace/workspace.routes').then(r => r.WORKSPACE_ROUTES),
  },
  
  // 5. Catch-all for 404 (You need a 404 Component)
  // { path: '**', component: NotFoundComponent, standalone: true }
  { path: '**', redirectTo: 'dashboard' } // Temporary redirect until 404 component is built
];