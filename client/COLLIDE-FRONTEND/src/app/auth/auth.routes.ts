// src/app/auth/auth.routes.ts

import { Routes } from '@angular/router';
import { Auth } from './auth/auth';
import { Login } from './auth/login/login';
import { Signup } from './auth/signup/signup';
import { ForgotPassword } from './auth/forgot-password/forgot-password';
import { noAuthGuard } from '../core/guards/no-auth.guard';

export const AUTH_ROUTES: Routes = [
  {
    path: '',
    component: Auth, // Container for login, signup, etc.
    canActivate: [noAuthGuard], // Prevents logged-in users from seeing the forms
    children: [
      { path: 'login', component: Login },
      { path: 'signup', component: Signup },
      { path: 'forgot-password', component: ForgotPassword },
      { path: '', redirectTo: 'login', pathMatch: 'full' } // Default auth path
    ]
  }
];