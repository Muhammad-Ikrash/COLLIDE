import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { supabase } from '../../core/services/supabase.client';

@Component({
  selector: 'app-account-info',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './account-info.html',
  styleUrls: ['./account-info.scss']
})
export class AccountInfo implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);

  user: any = null;
  username = '';
  email = '';
  
  // Password change fields
  oldPassword = '';
  newPassword = '';
  confirmPassword = '';
  
  isLoading = false;
  message = '';
  error = '';

  ngOnInit() {
    this.authService.currentUser$.subscribe(u => {
      this.user = u;
      if (u) {
        this.email = u.email;
        this.username = u.user_metadata?.full_name || '';
      }
    });
  }

  async updateProfile() {
    if (!this.username.trim()) return;
    
    this.isLoading = true;
    this.message = '';
    this.error = '';

    try {
      const { error } = await supabase.auth.updateUser({
        data: { full_name: this.username }
      });

      if (error) throw error;
      
      this.message = 'Profile updated successfully';
      // Force refresh user session in auth service if needed, 
      // though onAuthStateChange might handle it.
      // But update metadata doesn't always trigger onAuthStateChange immediately in all client versions.
      // We can manually update the local observable if we want instant feedback or reload session.
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
          // Manually updating the behavior subject in AuthService would require a public method or just rely on getSession
          // For now, let's assume AuthService might pick it up or we reload.
          // Actually, let's just reload the page or re-fetch session to be safe? 
          // Or better, let's add a refreshSession method to AuthService.
      }
    } catch (e: any) {
      this.error = e.message;
    } finally {
      this.isLoading = false;
    }
  }

  async updatePassword() {
    if (!this.newPassword || !this.confirmPassword) {
      this.error = 'Please enter a new password';
      return;
    }

    if (this.newPassword !== this.confirmPassword) {
      this.error = 'Passwords do not match';
      return;
    }

    this.isLoading = true;
    this.message = '';
    this.error = '';

    try {
        // Supabase update password doesn't strictly require old password if you are logged in,
        // but for security it's good practice. However, Supabase client API `updateUser` just takes new password.
        // If we want to verify old password, we'd have to try to signIn with it first.
        
        if (this.oldPassword) {
            const { error: signInError } = await supabase.auth.signInWithPassword({
                email: this.email,
                password: this.oldPassword
            });
            if (signInError) {
                throw new Error('Incorrect old password');
            }
        }

        const { error } = await supabase.auth.updateUser({
            password: this.newPassword
        });

        if (error) throw error;

        this.message = 'Password updated successfully';
        this.oldPassword = '';
        this.newPassword = '';
        this.confirmPassword = '';
    } catch (e: any) {
        this.error = e.message;
    } finally {
        this.isLoading = false;
    }
  }

  goBack() {
    this.router.navigate(['/dashboard']);
  }
}
