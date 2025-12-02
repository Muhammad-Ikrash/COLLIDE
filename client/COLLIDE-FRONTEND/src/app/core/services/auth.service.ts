// src/app/core/services/auth.service.ts

import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { supabase } from './supabase.client';

const AUTH_TOKEN_KEY = 'supabase_access_token';

@Injectable({ providedIn: 'root' })
export class AuthService {
    
    private router = inject(Router);

    // BehaviorSubject to track state, starting with whatever is in localStorage
    // This makes the service immediately aware of the login state on app startup
    private readonly _isLoggedIn = new BehaviorSubject<boolean>(!!localStorage.getItem(AUTH_TOKEN_KEY));
    public readonly isLoggedIn$ = this._isLoggedIn.asObservable(); // Public observable for component subscriptions

    private readonly _currentUser = new BehaviorSubject<any>(null);
    public readonly currentUser$ = this._currentUser.asObservable();

    constructor() {
        // Listen to Supabase auth state changes
        supabase.auth.onAuthStateChange((event, session) => {
            if (session?.access_token) {
                this.setToken(session.access_token);
                this._currentUser.next(session.user);
            } else {
                this.clearToken();
                this._currentUser.next(null);
            }
        });

        // Initialize user if token exists
        if (this.getToken()) {
            this.getCurrentSession().then(session => {
                if (session?.user) {
                    this._currentUser.next(session.user);
                }
            });
        }
    }

    /**
     * Checks if a token exists in localStorage
     * This is the core method called by the Guards.
     */
    public isLoggedIn(): boolean {
        const tokenExists = !!localStorage.getItem(AUTH_TOKEN_KEY);
        this._isLoggedIn.next(tokenExists); // Always update the state
        return tokenExists; 
    }

    /**
     * Gets the Supabase access token from localStorage for use in HTTP requests.
     * Used by the AuthInterceptor to attach tokens to API calls.
     */
    public getToken(): string | null {
        return localStorage.getItem(AUTH_TOKEN_KEY);
    }

    /**
     * Sets the Supabase access token and updates login state.
     * Called after successful login/register with Supabase.
     */
    public setToken(token: string): void {
        localStorage.setItem(AUTH_TOKEN_KEY, token);
        this._isLoggedIn.next(true);
    }

    /**
     * Clears the token and updates login state.
     * Called on logout.
     */
    public clearToken(): void {
        localStorage.removeItem(AUTH_TOKEN_KEY);
        this._isLoggedIn.next(false);
    }

    /**
     * Logout user from Supabase and clear local token
     */
    public async logout(): Promise<void> {
        await supabase.auth.signOut();
        this.clearToken();
        this.router.navigate(['/auth']);
    }

    /**
     * Get current Supabase user session
     */
    public async getCurrentSession() {
        const { data: { session } } = await supabase.auth.getSession();
        return session;
    }
    
    // --- MOCK METHODS FOR TESTING ROUTING FLOW ---

    public mockLogin(mockToken: string = 'COLLIDE_TEST_TOKEN'): void {
        this.setToken(mockToken);
        // This navigation will be used by your LoginComponent later
        this.router.navigate(['/dashboard']); 
    }

    public mockLogout(): void {
        this.clearToken();
        // This navigation will be used by your Navbar/Profile component later
        this.router.navigate(['/auth']); 
    }
}