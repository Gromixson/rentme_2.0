import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
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
    <div class="page">
      <a routerLink="/provider">← Panel</a>
      <h1>Oczekujące prośby</h1>
      @for (r of requests(); track r.id) {
        <p-card class="item">
          <p-tag value="PENDING" severity="warn" />
          <p><strong>{{ r.seekerName ?? 'Klient' }}</strong></p>
          <p>„{{ r.message }}”</p>
          <div class="actions">
            <p-button label="Akceptuj" severity="success" (onClick)="respond(r.id, 'accept')" />
            <p-button label="Odrzuć" severity="danger" (onClick)="respond(r.id, 'decline')" />
          </div>
        </p-card>
      } @empty {
        <p>Brak oczekujących próśb.</p>
      }
    </div>
  `,
  styles: `
    .page {
      padding: 1rem;
      max-width: 640px;
      margin: 0 auto;
    }
    .item {
      margin-bottom: 0.75rem;
    }
    .actions {
      display: flex;
      gap: 0.5rem;
      margin-top: 0.75rem;
    }
  `,
})
export class ProviderRequestsComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly toast = inject(ToastService);

  readonly requests = signal<ServiceRequest[]>([]);

  ngOnInit(): void {
    this.load();
    setInterval(() => this.load(), 5000);
  }

  load(): void {
    this.api.getPendingRequests().subscribe({
      next: (items) => this.requests.set(items),
    });
  }

  respond(id: string, action: 'accept' | 'decline'): void {
    this.api.respondToRequest(id, action).subscribe({
      next: () => {
        this.toast.success(action === 'accept' ? 'Zaakceptowano' : 'Odrzucono');
        this.load();
      },
      error: (err) => this.toast.error(err?.error?.error ?? 'Błąd'),
    });
  }
}
