import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Button } from 'primeng/button';
import { Card } from 'primeng/card';
import { Tag } from 'primeng/tag';
import { ToggleSwitch } from 'primeng/toggleswitch';
import { ApiService } from '../../../core/api/api.service';
import { ProviderProfile } from '../../../core/models';
import { ToastService } from '../../../shared/services/toast.service';

@Component({
  selector: 'app-provider-dashboard',
  imports: [FormsModule, RouterLink, Card, ToggleSwitch, Button, Tag],
  template: `
    <div class="page" style="--rm-page-max: 560px">
      <div class="page-header">
        <div>
          <h1>Panel usługodawcy</h1>
          <p class="page-lede">Zarządzaj dostępnością i przejdź do oczekujących próśb.</p>
        </div>
      </div>
      @if (profile(); as p) {
        <p-card>
          <div class="online-row">
            <div>
              <span class="online-label">Status online</span>
              <p class="online-hint">
                {{ p.isOnline ? 'Widoczny dla klientów' : 'Ukryty w listach' }}
              </p>
            </div>
            <p-toggleswitch
              [(ngModel)]="online"
              (ngModelChange)="toggleOnline()"
              [disabled]="!canGoOnline() && !p.isOnline"
            />
          </div>
          @if (!canGoOnline()) {
            <p class="warn">
              Uzupełnij <a routerLink="/provider/profile">profil</a> (kategorie + stawka &gt; 0),
              aby przejść online.
            </p>
          }
          <div class="meta">
            <span
              >Stawka: <strong>{{ p.hourlyRate }} zł/h</strong></span
            >
            <span
              >Kategorie: <strong>{{ p.categories.length }}</strong></span
            >
          </div>
          <p-tag [value]="'★ ' + p.averageRating + ' (' + p.ratingCount + ' ocen)'" />
          <div class="actions">
            <a routerLink="/provider/requests"><p-button label="Oczekujące prośby" /></a>
            <a routerLink="/provider/profile">
              <p-button label="Edytuj profil" severity="secondary" [outlined]="true" />
            </a>
          </div>
        </p-card>
      }
    </div>
  `,
  styles: `
    .online-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
      gap: 1rem;
    }
    .online-label {
      font-weight: 700;
      font-family: var(--rm-font-display);
    }
    .online-hint {
      margin: 0.15rem 0 0;
      font-size: 0.85rem;
      color: var(--rm-ink-muted);
    }
    .warn {
      color: var(--rm-warn);
      font-size: 0.9rem;
      background: rgba(217, 119, 6, 0.1);
      padding: 0.75rem 1rem;
      border-radius: var(--rm-radius);
    }
    .meta {
      display: flex;
      gap: 1.25rem;
      flex-wrap: wrap;
      margin: 1rem 0 0.75rem;
      color: var(--rm-ink-muted);
      font-size: 0.95rem;
    }
    .actions {
      display: flex;
      gap: 0.5rem;
      margin-top: 1.25rem;
      flex-wrap: wrap;
    }
  `,
})
export class ProviderDashboardComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly toast = inject(ToastService);

  readonly profile = signal<ProviderProfile | null>(null);
  online = false;

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.api.getProviderProfile().subscribe({
      next: (p) => {
        this.profile.set(p);
        this.online = p.isOnline;
      },
      error: () => this.toast.error('Nie udało się załadować profilu'),
    });
  }

  canGoOnline(): boolean {
    const p = this.profile();
    return !!p && p.hourlyRate > 0 && p.categories.length > 0;
  }

  toggleOnline(): void {
    const p = this.profile();
    if (!p || this.online === p.isOnline) return;
    const target = this.online;
    if (target && !this.canGoOnline()) {
      this.online = false;
      this.toast.error('Uzupełnij profil przed przejściem online');
      return;
    }
    this.api.setOnline(target).subscribe({
      next: () => {
        this.toast.success(target ? 'Jesteś online' : 'Jesteś offline');
        this.load();
      },
      error: (err) => {
        this.online = !target;
        this.toast.error(err?.error?.error ?? 'Błąd zmiany statusu');
      },
    });
  }
}
