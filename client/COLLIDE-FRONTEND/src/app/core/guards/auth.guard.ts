// src/app/core/guards/auth.guard.ts

import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { inject } from '@angular/core';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isLoggedIn()) {
    return true; // ALLOW: User is logged in
  } else {
    // DENY and redirect to auth page
    return router.createUrlTree(['/auth'], { queryParams: { returnUrl: state.url } });
  }
};