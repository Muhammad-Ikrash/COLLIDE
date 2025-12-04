import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
// NOTE: Adjust the path if your AuthService is located elsewhere relative to this file
import { AuthService } from '../services/auth.service'; 


export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // 1. Inject the AuthService to access the token.
  const authService = inject(AuthService);
  const authToken = authService.getToken(); // Assuming this returns the token or null/undefined

  // --- Bypass Logic ---
  // Only bypass specific public auth endpoints, NOT all /api/auth/*
  const publicEndpoints = [
    '/api/auth/login',
    '/api/auth/register',
    '/api/auth/forgot-password',
    '/api/auth/reset-password',
    '/api/auth/refresh'
  ];
  
  if (publicEndpoints.some(endpoint => req.url.includes(endpoint))) { 
    return next(req); 
  }

  // --- Security Logic ---
  // If a token exists (i.e., the user is "logged in"), clone the request and set the header.
  if (authToken) {
    const authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${authToken}` // Standard JWT format
      }
    });
    // Send the secured request
    return next(authReq);
  }

  // If no token, just pass the original (unsecured) request along.
  return next(req);
};