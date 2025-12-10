import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  username: string = '';
  password: string = '';
  errorMessage: string = '';

  constructor(private authService: AuthService, private router: Router) { }

  onSubmit(): void {
    if (this.authService.login(this.username, this.password)) {
      this.router.navigate(['/main']);
    } else {
      this.errorMessage = 'Invalid username or password';
    }
  }

  onHellaAuth(): void {
    // Redirect to Hella SSO authorization endpoint
    const hellaAuthUrl = 'https://www.office.com/login?prompt=select_account';
    const clientId = 'popda1'; // Replace with actual client ID
    const redirectUri = encodeURIComponent(window.location.origin + '/auth/callback');
    const scope = 'openid profile email';
    
    const authUrl = `${hellaAuthUrl}?redirect_uri=${redirectUri}&response_type=code&scope=${scope}`;
    
    // Redirect to Hella SSO
    window.location.href = hellaAuthUrl;
  }
}
