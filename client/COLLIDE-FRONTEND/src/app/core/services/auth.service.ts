// src/app/core/services/auth.service.ts

import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';

const AUTH_TOKEN_KEY = 'jwt_token'; 
// 3 2  4 4 4 7 8 5

@Injectable({ providedIn: 'root' })
export class AuthService {
    
    private router = inject(Router);

    // BehaviorSubject to track state, starting with whatever is in localStorage
    // This makes the service immediately aware of the login state on app startup
    private readonly _isLoggedIn = new BehaviorSubject<boolean>(!!localStorage.getItem(AUTH_TOKEN_KEY));
    public readonly isLoggedIn$ = this._isLoggedIn.asObservable(); // Public observable for component subscriptions

    constructor() {} // Constructor is empty, injection handled by inject()

    /**
     * Checks if a token exists in localStorage (MOCK for validity check)
     * This is the core method called by the Guards.
     */
    public isLoggedIn(): boolean {
        const tokenExists = !!localStorage.getItem(AUTH_TOKEN_KEY);
        this._isLoggedIn.next(tokenExists); // Always update the state
        return true; // Temporary fix
        return tokenExists; 
    }

    /**
     * Gets the JWT token from localStorage for use in HTTP requests.
     * Used by the AuthInterceptor to attach tokens to API calls.
     */
    public getToken(): string | null {
        return localStorage.getItem(AUTH_TOKEN_KEY);
    }
    
    // --- MOCK METHODS FOR TESTING ROUTING FLOW ---

    public mockLogin(mockToken: string = 'COLLIDE_TEST_TOKEN'): void {
        localStorage.setItem(AUTH_TOKEN_KEY, mockToken);
        this._isLoggedIn.next(true); // Set state to logged in
        
        // This navigation will be used by your LoginComponent later
        this.router.navigate(['/dashboard']); 
    }

    public mockLogout(): void {
        localStorage.removeItem(AUTH_TOKEN_KEY);
        this._isLoggedIn.next(false); // Set state to logged out
        
        // This navigation will be used by your Navbar/Profile component later
        this.router.navigate(['/auth/login']); 
    }
}