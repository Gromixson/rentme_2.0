import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Button } from 'primeng/button';
import { Card } from 'primeng/card';
import { ToggleSwitch } from 'primeng/toggleswitch';
import { Tag } from 'primeng/tag';
import { ApiService } from '../../../core/api/api.service';
import { ProviderProfile } from '../../../core/models';
import { ToastService } from '../../../shared/services/toast.service';

@Component({
  selector: 'app-provider-dashboard',
  imports: [FormsModule, RouterLink, Card, ToggleSwitch, Button, Tag],
  template: `
    <div class="page">
      <h1>Panel usługodawcy</h1>
      @if (profile(); as p) {
        <p-card>
          <div class="online-row">
            <span>Status online</span>
            <p-toggleswitch [(ngModel)]="online" (ngModelChange)="toggleOnline()" [disabled]="!canGoOnline() && !p.isOnline" />
          </div>
          @if (!canGoOnline()) {
            <p class="warn">
              Uzupełnij <a routerLink="/provider/profile">profil</a> (kategorie + stawka &gt; 0), aby przejść online.
            </p>
          }
          <p>Stawka: {{ p.hourlyRate }} zł/h · Kategorie: {{ p.categories.length }}</p>
          <p-tag [value]="'★ ' + p.averageRating + ' (' + p.ratingCount + ' ocen)'" />
          <div class="actions">
            <a routerLink="/provider/requests"><p-button label="Oczekujące prośby" /></a>
            <a routerLink="/provider/profile"><p-button label="Edytuj profil" severity="secondary" /></a>
          </div>
        </p-card>
      }
    </div>
  `,
  styles: `
    .page {
      padding: 1rem;
      max-width: 520px;
      margin: 0 auto;
    }
    .online-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }
    .warn {
      color: #b45309;
      font-size: 0.9rem;
    }
    .actions {
      display: flex;
      gap: 0.5rem;
      margin-top: 1rem;
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
