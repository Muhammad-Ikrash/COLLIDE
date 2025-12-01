// src/app/auth/auth.routes.ts

import { Routes } from '@angular/router';
import { Auth } from './auth/auth';
import { ForgotPassword } from './auth/forgot-password/forgot-password';
import { ResetPassword } from './auth/reset-password/reset-password';
import { noAuthGuard } from '../core/guards/no-auth.guard';

export const AUTH_ROUTES: Routes = [
  {
    path: '',
    component: Auth, // Unified login/signup with tabs
    canActivate: [noAuthGuard], // Prevents logged-in users from seeing the forms
  },
  {
    path: 'forgot-password',
    component: ForgotPassword,
    canActivate: [noAuthGuard],
  },
  {
    path: 'reset-password',
    component: ResetPassword,
    canActivate: [noAuthGuard],
  }
];