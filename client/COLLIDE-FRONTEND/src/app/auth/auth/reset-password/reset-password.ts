import { Component, inject, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { supabase } from '../../../core/services/supabase.client';

@Component({
  selector: 'app-reset-password',
  imports: [FormsModule, CommonModule, RouterLink],
  templateUrl: './reset-password.html',
  styleUrl: './reset-password.scss'
})
export class ResetPassword implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  password = '';
  confirmPassword = '';
  isLoading = false;
  errorMessage = '';
  successMessage = '';

  ngOnInit() {
    // Supabase adds hash fragments to the URL when redirecting from email
    // We need to handle the session recovery
    this.handlePasswordReset();
  }

  async handlePasswordReset() {
    // Check if we have hash fragments in the URL (from Supabase email link)
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = hashParams.get('access_token');
    const type = hashParams.get('type');

    // If we have a recovery token, set the session
    if (accessToken && type === 'recovery') {
      try {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: hashParams.get('refresh_token') || ''
        });

        if (error) {
          this.errorMessage = 'Invalid or expired reset link. Please request a new one.';
        }
        // If successful, user can now reset password
      } catch (error: any) {
        this.errorMessage = 'Invalid or expired reset link. Please request a new one.';
      }
    }
  }

  onSubmit = async (event?: Event) => {
    if (event) {
      event.preventDefault();
    }

    const passwordTrimmed = (this.password || '').trim();
    const confirmPasswordTrimmed = (this.confirmPassword || '').trim();

    if (!passwordTrimmed || !confirmPasswordTrimmed) {
      this.errorMessage = 'Please fill in all fields';
      return;
    }

    if (passwordTrimmed.length < 6) {
      this.errorMessage = 'Password must be at least 6 characters long';
      return;
    }

    if (passwordTrimmed !== confirmPasswordTrimmed) {
      this.errorMessage = 'Passwords do not match';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    try {
      // Update password using Supabase
      const { error } = await supabase.auth.updateUser({
        password: passwordTrimmed
      });

      if (error) {
        throw error;
      }

      // Success - redirect to login
      this.successMessage = 'Password reset successfully! Redirecting to login...';
      
      setTimeout(() => {
        this.router.navigate(['/auth']);
      }, 2000);
      
    } catch (error: any) {
      this.errorMessage = error.message || 'An error occurred. Please try again.';
    } finally {
      this.isLoading = false;
    }
  };
}

