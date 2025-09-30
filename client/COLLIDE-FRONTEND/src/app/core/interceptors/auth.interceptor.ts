import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
// NOTE: Adjust the path if your AuthService is located elsewhere relative to this file
import { AuthService } from '../services/auth.service'; 

/**
 * Interceptor function that automatically attaches the JWT token 
 * from the AuthService to outgoing requests.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // 1. Inject the AuthService to access the token.
  const authService = inject(AuthService);
  const authToken = authService.getToken(); // Assuming this returns the token or null/undefined

  // --- Bypass Logic ---
  // IMPORTANT: Do NOT intercept the authentication requests themselves (login/signup)
  // because you don't have a valid token *yet* when making those calls.
  // We assume your future Spring Boot API base path for auth is '/api/auth'
  if (req.url.includes('/api/auth')) { 
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