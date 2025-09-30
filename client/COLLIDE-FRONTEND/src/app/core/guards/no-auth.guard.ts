// src/app/core/guards/no-auth.guard.ts

import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { inject } from '@angular/core';

export const noAuthGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isLoggedIn()) {
    return true; // ALLOW: User is logged out (can access login/signup)
  } else {
    // DENY and redirect to dashboard, because the user is ALREADY logged in
    return router.createUrlTree(['/dashboard']);
  }
};