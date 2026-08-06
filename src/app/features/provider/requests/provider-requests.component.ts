import { Component, inject, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Button } from 'primeng/button';
import { Card } from 'primeng/card';
import { Tag } from 'primeng/tag';
import { ApiService } from '../../../core/api/api.service';
import { ServiceRequest } from '../../../core/models';
import { ToastService } from '../../../shared/services/toast.service';

@Component({
  selector: 'app-provider-requests',
  imports: [RouterLink, Card, Button, Tag],
  template: `
    <div class="page" style="--rm-page-max: 640px">
      <a routerLink="/provider" class="back-link">← Panel</a>
      <div class="page-header">
        <div>
          <h1>Oczekujące prośby</h1>
          <p class="page-lede">Akceptacja tworzy rezerwację dla obu stron.</p>
        </div>
      </div>
      <div class="page-stack">
        @for (r of requests(); track r.id) {
          <p-card>
            <p-tag value="Oczekuje" severity="warn" />
            <p class="seeker">
              <strong>{{ r.seekerName ?? 'Klient' }}</strong>
            </p>
            <p class="msg">„{{ r.message }}”</p>
            <div class="actions">
              <p-button label="Akceptuj" severity="success" (onClick)="respond(r.id, 'accept')" />
              <p-button
                label="Odrzuć"
                severity="danger"
                [outlined]="true"
                (onClick)="respond(r.id, 'decline')"
              />
            </div>
          </p-card>
        } @empty {
          <p class="empty-state">Brak oczekujących próśb.</p>
        }
      </div>
    </div>
  `,
  styles: `
    .seeker {
      margin: 0.75rem 0 0.35rem;
    }
    .msg {
      margin: 0;
      color: var(--rm-ink-muted);
      font-style: italic;
    }
    .actions {
      display: flex;
      gap: 0.5rem;
      margin-top: 1rem;
      flex-wrap: wrap;
    }
  `,
})
export class ProviderRequestsComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  readonly requests = signal<ServiceRequest[]>([]);

  ngOnInit(): void {
    this.load();
    setInterval(() => this.load(), 5000);
  }

  load(): void {
    this.api.getPendingRequests().subscribe({
      next: (items) => this.requests.set(items),
      error: () => this.toast.error('Nie udało się załadować próśb'),
    });
  }

  respond(id: string, action: 'accept' | 'decline'): void {
    this.api.respondToRequest(id, action).subscribe({
      next: () => {
        if (action === 'accept') {
          this.toast.success('Zaakceptowano!', 'Rezerwacja została utworzona');
          void this.router.navigate(['/bookings']);
        } else {
          this.toast.success('Odrzucono');
          this.load();
        }
      },
      error: (err) => this.toast.error(err?.error?.error ?? 'Błąd'),
    });
  }
}
