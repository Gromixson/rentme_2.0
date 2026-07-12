import { Component, computed, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { Button } from 'primeng/button';
import { Toolbar } from 'primeng/toolbar';
import { AuthService } from '../../core/auth/auth.service';
import { UserRole } from '../../core/models';
import { ToastService } from '../services/toast.service';

@Component({
  selector: 'app-header',
  imports: [RouterLink, RouterLinkActive, Toolbar, Button],
  template: `
    <header class="app-header" [class.role-seeker]="role() === 'SEEKER'" [class.role-provider]="role() === 'PROVIDER'">
      <p-toolbar>
        <ng-template #start>
          <a routerLink="/" class="brand">RentMe</a>
          <span class="role-badge">{{ role() === 'SEEKER' ? 'Klient' : 'Usługodawca' }}</span>
        </ng-template>
        <ng-template #end>
          @if (profile(); as p) {
            <span class="user-name">{{ p.name }}</span>
            <p-button
              [label]="role() === 'SEEKER' ? 'Tryb usługodawcy' : 'Tryb klienta'"
              severity="secondary"
              size="small"
              (onClick)="toggleRole()"
            />
            <p-button label="Wyloguj" severity="danger" size="small" text (onClick)="logout()" />
          }
        </ng-template>
      </p-toolbar>
      @if (profile()) {
        <nav class="nav-links">
          @if (role() === 'SEEKER') {
            <a routerLink="/seeker" routerLinkActive="active">Kategorie</a>
            <a routerLink="/seeker/requests" routerLinkActive="active">Moje prośby</a>
            <a routerLink="/bookings" routerLinkActive="active">Rezerwacje</a>
          } @else {
            <a routerLink="/provider" routerLinkActive="active">Panel</a>
            <a routerLink="/provider/requests" routerLinkActive="active">Prośby</a>
            <a routerLink="/provider/profile" routerLinkActive="active">Profil</a>
            <a routerLink="/bookings" routerLinkActive="active">Rezerwacje</a>
          }
        </nav>
      }
    </header>
  `,
  styles: `
    .app-header {
      --header-bg: #1e3a8a;
      --header-fg: #fff;
    }
    .app-header.role-provider {
      --header-bg: #c2410c;
    }
    .app-header.role-seeker {
      --header-bg: #1e40af;
    }
    :host ::ng-deep .p-toolbar {
      background: var(--header-bg);
      color: var(--header-fg);
      border: none;
      border-radius: 0;
    }
    .brand {
      color: inherit;
      font-weight: 700;
      font-size: 1.25rem;
      text-decoration: none;
      margin-right: 1rem;
    }
    .role-badge {
      font-size: 0.75rem;
      opacity: 0.9;
      background: rgba(255, 255, 255, 0.2);
      padding: 0.2rem 0.5rem;
      border-radius: 4px;
    }
    .user-name {
      margin-right: 0.75rem;
      font-size: 0.9rem;
    }
    .nav-links {
      display: flex;
      gap: 1rem;
      padding: 0.5rem 1rem;
      background: var(--header-bg);
      filter: brightness(0.92);
    }
    .nav-links a {
      color: #fff;
      text-decoration: none;
      font-size: 0.9rem;
      padding-bottom: 0.25rem;
    }
    .nav-links a.active {
      border-bottom: 2px solid #fff;
      font-weight: 600;
    }
  `,
})
export class AppHeaderComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  readonly profile = this.auth.profile;
  readonly role = computed(() => this.auth.activeRole());

  async toggleRole(): Promise<void> {
    const next: UserRole = this.role() === 'SEEKER' ? 'PROVIDER' : 'SEEKER';
    try {
      await this.auth.switchRole(next);
      await this.router.navigate([next === 'SEEKER' ? '/seeker' : '/provider']);
    } catch (err: unknown) {
      const message = (err as { error?: { error?: string } })?.error?.error;
      this.toast.error(message ?? 'Nie udało się zmienić roli');
    }
  }

  async logout(): Promise<void> {
    await this.auth.logout();
    await this.router.navigate(['/auth/login']);
  }
}
