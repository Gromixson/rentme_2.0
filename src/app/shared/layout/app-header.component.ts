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
    <header
      class="app-header"
      [class.role-seeker]="role() === 'SEEKER'"
      [class.role-provider]="role() === 'PROVIDER'"
      [class.guest]="!profile()"
    >
      <p-toolbar styleClass="rm-toolbar">
        <ng-template #start>
          <a routerLink="/" class="brand">RentMe</a>
          @if (profile()) {
            <span class="role-badge">{{ role() === 'SEEKER' ? 'Klient' : 'Usługodawca' }}</span>
          }
        </ng-template>
        <ng-template #end>
          @if (profile(); as p) {
            <span class="user-name">{{ p.name }}</span>
            <p-button
              [label]="role() === 'SEEKER' ? 'Tryb usługodawcy' : 'Tryb klienta'"
              severity="secondary"
              size="small"
              [outlined]="true"
              (onClick)="toggleRole()"
            />
            <p-button label="Wyloguj" severity="danger" size="small" text (onClick)="logout()" />
          } @else {
            <a routerLink="/auth/login">
              <p-button label="Zaloguj" size="small" [outlined]="true" severity="secondary" />
            </a>
            <a routerLink="/auth/register">
              <p-button label="Dołącz" size="small" />
            </a>
          }
        </ng-template>
      </p-toolbar>
      @if (profile()) {
        <nav class="nav-links" aria-label="Główna nawigacja">
          @if (role() === 'SEEKER') {
            <a
              routerLink="/seeker"
              routerLinkActive="active"
              [routerLinkActiveOptions]="{ exact: true }"
              >Kategorie</a
            >
            <a routerLink="/seeker/requests" routerLinkActive="active">Moje prośby</a>
            <a routerLink="/bookings" routerLinkActive="active">Rezerwacje</a>
          } @else {
            <a
              routerLink="/provider"
              routerLinkActive="active"
              [routerLinkActiveOptions]="{ exact: true }"
              >Panel</a
            >
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
      --header-bg: #0f172a;
      --header-fg: #f8fafc;
      --header-accent: var(--rm-accent, #0d9488);
      position: sticky;
      top: 0;
      z-index: 100;
      backdrop-filter: blur(12px);
      box-shadow: 0 8px 28px rgba(15, 23, 42, 0.18);
    }
    .app-header.role-seeker {
      --header-accent: #0d9488;
      --header-bg: linear-gradient(105deg, #0f172a 0%, #134e4a 70%, #0f766e 100%);
    }
    .app-header.role-provider {
      --header-accent: #0891b2;
      --header-bg: linear-gradient(105deg, #0f172a 0%, #164e63 65%, #0e7490 100%);
    }
    .app-header.guest {
      --header-bg: linear-gradient(105deg, #0f172a 0%, #1e293b 100%);
    }
    :host ::ng-deep .rm-toolbar.p-toolbar,
    :host ::ng-deep .p-toolbar {
      background: var(--header-bg);
      color: var(--header-fg);
      border: none;
      border-radius: 0;
      padding: 0.65rem 1.25rem;
      min-height: 3.5rem;
    }
    .brand {
      color: inherit;
      font-family: var(--rm-font-display, 'Sora', sans-serif);
      font-weight: 700;
      font-size: 1.4rem;
      text-decoration: none;
      margin-right: 0.85rem;
      letter-spacing: -0.03em;
    }
    .role-badge {
      font-size: 0.7rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      background: color-mix(in srgb, var(--header-accent) 35%, transparent);
      border: 1px solid color-mix(in srgb, var(--header-accent) 55%, white);
      padding: 0.25rem 0.55rem;
      border-radius: 999px;
    }
    .user-name {
      margin-right: 0.65rem;
      font-size: 0.9rem;
      opacity: 0.9;
    }
    .nav-links {
      display: flex;
      gap: 0.25rem;
      padding: 0.35rem 1rem 0.55rem;
      background: color-mix(in srgb, #0f172a 55%, transparent);
      overflow-x: auto;
    }
    .nav-links a {
      color: rgba(248, 250, 252, 0.78);
      text-decoration: none;
      font-size: 0.9rem;
      font-weight: 600;
      padding: 0.45rem 0.85rem;
      border-radius: 999px;
      white-space: nowrap;
      transition:
        background 0.2s ease,
        color 0.2s ease;
    }
    .nav-links a:hover {
      color: #fff;
      background: rgba(255, 255, 255, 0.08);
    }
    .nav-links a.active {
      color: #fff;
      background: var(--header-accent);
    }
    :host ::ng-deep a {
      text-decoration: none;
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
