// src/app/dashboard/dashboard.routes.ts

import { Routes } from '@angular/router';
import { DashboardComponent } from './dashboard/dashboard';

export const DASHBOARD_ROUTES: Routes = [
  {
    path: '',
    component: DashboardComponent, // The main Dashboard view
    // Child routes for Dashboard go here if needed later (e.g., settings)
  }
];



