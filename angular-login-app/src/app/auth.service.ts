import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUser: string | null = null;

  constructor() {
    // Restore session from localStorage on service initialization
    this.currentUser = localStorage.getItem('currentUser');
  }

  login(username: string, password: string): boolean {
    if (username === 'admin' && password === '123') {
      this.currentUser = username;
      localStorage.setItem('currentUser', username);
      return true;
    }
    return false;
  }

  logout(): void {
    this.currentUser = null;
    localStorage.removeItem('currentUser');
  }

  isLoggedIn(): boolean {
    return this.currentUser !== null;
  }

  getCurrentUser(): string | null {
    return this.currentUser;
  }
}
