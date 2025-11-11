import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './signup.html',
  styleUrl: './signup.scss'
})
export class Signup {
  email: string = '';
  password: string = '';
  reEnterPassword: String = ''
  selectedTab: string = 'login';

  setTab(tab: string) {
    this.selectedTab = tab;
  }
  onSignUp(){
        console.log('Signing up...');
        console.log('Email:', this.email);
        console.log('Password:', this.password);
        console.log('reEnterPassword', this.reEnterPassword)
      }
 

}
