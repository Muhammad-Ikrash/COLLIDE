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
  newUsername = '';
  email = '';
  
  // Password change fields
  oldPassword = '';
  newPassword = '';
  confirmPassword = '';
  
  // UI state
  isLoading = false;
  message = '';
  error = '';
  showDeleteModal = false;

  ngOnInit() {
    this.authService.currentUser$.subscribe(u => {
      this.user = u;
      if (u) {
        this.email = u.email;
        this.username = u.user_metadata?.full_name || '';
      }
    });
  }

  async updateUsername() {
    if (!this.newUsername.trim()) return;
    
    this.isLoading = true;
    this.clearMessages();

    try {
      const { error } = await supabase.auth.updateUser({
        data: { full_name: this.newUsername.trim() }
      });

      if (error) throw error;
      
      this.username = this.newUsername.trim();
      this.newUsername = '';
      this.message = 'Username updated successfully';
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
    this.clearMessages();

    try {
      if (this.oldPassword) {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: this.email,
          password: this.oldPassword
        });
        if (signInError) {
          throw new Error('Incorrect current password');
        }
      }

      const { error } = await supabase.auth.updateUser({
        password: this.newPassword
      });

      if (error) throw error;

      this.message = 'Password updated successfully';
      this.resetPasswordFields();
    } catch (e: any) {
      this.error = e.message;
    } finally {
      this.isLoading = false;
    }
  }

  resetPasswordFields() {
    this.oldPassword = '';
    this.newPassword = '';
    this.confirmPassword = '';
  }

  showDeleteConfirmation() {
    this.showDeleteModal = true;
  }

  cancelDelete() {
    this.showDeleteModal = false;
  }

  async confirmDeleteAccount() {
    this.isLoading = true;
    this.clearMessages();

    try {
      // Note: Supabase client-side doesn't allow self-deletion by default
      // This would need a server-side function or admin API
      // For now, we'll show an error message
      this.error = 'Account deletion requires contacting support. This feature is coming soon.';
      this.showDeleteModal = false;
    } catch (e: any) {
      this.error = e.message;
    } finally {
      this.isLoading = false;
    }
  }

  clearMessages() {
    this.message = '';
    this.error = '';
  }

  goBack() {
    this.router.navigate(['/dashboard']);
  }
}
