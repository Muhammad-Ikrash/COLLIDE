import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html', 
  styleUrls: ['./login.scss']
})
export class Login {
  email: string = '';
  password: string = '';
  selectedTab: string = 'login'; 


  setTab(tab: string) {
    this.selectedTab = tab;
  }

  onLogin() {
    console.log('Logging in...');
    console.log('Email:', this.email);
    console.log('Password:', this.password);
  }
   
}
