import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { supabase } from '../../../core/services/supabase.client';

@Component({
  selector: 'app-forgot-password',
  imports: [FormsModule, CommonModule, RouterLink],
  templateUrl: './forgot-password.html',
  styleUrl: './forgot-password.scss'
})
export class ForgotPassword {
  private router = inject(Router);

  email = '';
  isLoading = false;
  errorMessage = '';
  successMessage = '';

  onSubmit = async (event?: Event) => {
    if (event) {
      event.preventDefault();
    }

    const emailTrimmed = (this.email || '').trim();

    if (!emailTrimmed) {
      this.errorMessage = 'Please enter your email address';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    try {
      // Use Supabase password reset
      const { error } = await supabase.auth.resetPasswordForEmail(emailTrimmed, {
        redirectTo: 'http://localhost:4200/auth/reset-password'
      });

      if (error) {
        throw error;
      }

      // Success - Supabase will send the reset email
      this.successMessage = 'If an account exists with this email, a password reset link has been sent. Please check your email.';
      this.email = '';
      
    } catch (error: any) {
      this.errorMessage = error.message || 'An error occurred. Please try again.';
    } finally {
      this.isLoading = false;
    }
  };
}
