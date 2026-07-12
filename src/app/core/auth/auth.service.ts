import { Injectable, inject, signal } from '@angular/core';
import {
  User,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { firstValueFrom } from 'rxjs';
import { FIREBASE_AUTH } from '../firebase';
import { ApiService } from '../api/api.service';
import { UserProfile, UserRole } from '../models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly auth = inject(FIREBASE_AUTH);
  private readonly api = inject(ApiService);

  readonly user = signal<User | null>(null);
  readonly profile = signal<UserProfile | null>(null);
  readonly loading = signal(true);

  constructor() {
    this.api.setTokenGetter(() => this.getIdToken());
    onAuthStateChanged(this.auth, async (firebaseUser) => {
      this.user.set(firebaseUser);
      if (firebaseUser) {
        try {
          const profile = await firstValueFrom(this.api.getMe());
          this.profile.set(profile);
        } catch {
          this.profile.set(null);
        }
      } else {
        this.profile.set(null);
      }
      this.loading.set(false);
    });
  }

  async getIdToken(): Promise<string | null> {
    const u = this.auth.currentUser;
    if (!u) return null;
    return u.getIdToken();
  }

  async register(email: string, password: string, name: string): Promise<void> {
    await firstValueFrom(this.api.register(email, password, name));
    await signInWithEmailAndPassword(this.auth, email, password);
    await this.refreshProfile();
  }

  async login(email: string, password: string): Promise<void> {
    await signInWithEmailAndPassword(this.auth, email, password);
    await this.refreshProfile();
  }

  async logout(): Promise<void> {
    await signOut(this.auth);
    this.profile.set(null);
  }

  async refreshProfile(): Promise<void> {
    if (!this.auth.currentUser) {
      this.profile.set(null);
      return;
    }
    const profile = await firstValueFrom(this.api.getMe());
    this.profile.set(profile);
  }

  async switchRole(role: UserRole): Promise<void> {
    await firstValueFrom(this.api.setActiveRole(role));
    await this.refreshProfile();
  }

  isLoggedIn(): boolean {
    return !!this.user();
  }

  activeRole(): UserRole {
    return this.profile()?.activeRole ?? 'SEEKER';
  }
}
