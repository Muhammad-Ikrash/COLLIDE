import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../core/services/auth.service';
import { supabase } from '../../core/services/supabase.client';

const API_BASE_URL = 'http://localhost:8080';

@Component({
  selector: 'app-auth',
  imports: [FormsModule, CommonModule, RouterLink],
  templateUrl: './auth.html',
  styleUrl: './auth.scss'
})
export class Auth {
  private router = inject(Router);
  private authService = inject(AuthService);
  private http = inject(HttpClient);

  activeTab: 'login' | 'signup' = 'login';
  isLoading = false;
  errorMessage = '';

  loginForm = {
    email: '',
    password: ''
  };

  signupForm = {
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  };

  switchTab = (tab: 'login' | 'signup') => {
    this.activeTab = tab;
    this.errorMessage = '';
  };

  onLogin = async (event?: Event) => {
    if (event) {
      event.preventDefault();
    }

    // Trim whitespace from inputs
    const email = (this.loginForm.email || '').trim();
    const password = (this.loginForm.password || '').trim();

    // Validate fields
    if (!email || !password) {
      this.errorMessage = 'Please fill in all fields';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    try {
      // Sign in with Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password
      });

      if (error) {
        throw error;
      }

      // If successful, Supabase auth state change will update the token via AuthService
      if (data.session?.access_token) {
        this.authService.setToken(data.session.access_token);
        
        // Sync user to backend database
        await this.syncUserToBackend(data.session.access_token);
        
        this.router.navigate(['/dashboard']);
      } else {
        this.errorMessage = 'No session returned. Please try again.';
      }
    } catch (error: any) {
      this.errorMessage = error.message || 'Invalid email or password';
    } finally {
      this.isLoading = false;
    }
  };

  onSignup = async (event?: Event) => {
    if (event) {
      event.preventDefault();
    }

    // Trim whitespace from inputs
    const name = (this.signupForm.name || '').trim();
    const email = (this.signupForm.email || '').trim();
    const password = (this.signupForm.password || '').trim();
    const confirmPassword = (this.signupForm.confirmPassword || '').trim();

    // Validate fields
    if (!name || !email || !password || !confirmPassword) {
      this.errorMessage = 'Please fill in all fields';
      return;
    }

    if (password !== confirmPassword) {
      this.errorMessage = 'Passwords do not match';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    try {
      // Sign up with Supabase
      const { data, error } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
          data: {
            full_name: name // Store name in user metadata
          }
        }
      });

      if (error) {
        throw error;
      }

      // Check if email confirmation is required
      if (data.session?.access_token) {
        // User is immediately signed in (email confirmation disabled)
        this.authService.setToken(data.session.access_token);
        
        // Sync user to backend database
        await this.syncUserToBackend(data.session.access_token);
        
        this.router.navigate(['/dashboard']);
      } else {
        // Email confirmation required
        this.errorMessage = 'Please check your email to confirm your account before signing in.';
      }
    } catch (error: any) {
      this.errorMessage = error.message || 'Registration failed. Please try again.';
    } finally {
      this.isLoading = false;
    }
  };
  
  /**
   * Sync user to the Spring Boot backend database
   * This ensures the user exists in our DB after Supabase authentication
   */
  private async syncUserToBackend(token: string): Promise<void> {
    try {
      await this.http.post(`${API_BASE_URL}/api/auth/sync`, {}, {
        headers: { 'Authorization': `Bearer ${token}` }
      }).toPromise();
      console.log('User synced to backend successfully');
    } catch (error) {
      // Log but don't block - user can still proceed, sync will happen on next API call
      console.warn('Failed to sync user to backend:', error);
    }
  }
}
