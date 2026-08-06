import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Button } from 'primeng/button';
import { Card } from 'primeng/card';
import { Tag } from 'primeng/tag';
import { ApiService } from '../../../core/api/api.service';
import { ServiceRequest } from '../../../core/models';
import { ToastService } from '../../../shared/services/toast.service';

@Component({
  selector: 'app-my-requests',
  imports: [RouterLink, Card, Button, Tag],
  template: `
    <div class="page" style="--rm-page-max: 640px">
      <div class="page-header">
        <div>
          <h1>Moje prośby</h1>
          <p class="page-lede">Historia próśb wysłanych do usługodawców.</p>
        </div>
      </div>
      <div class="page-stack">
        @for (r of requests(); track r.id) {
          <p-card>
            <div class="item-row">
              <div>
                <p-tag [value]="statusLabel(r.status)" [severity]="statusSeverity(r.status)" />
                <p class="msg">{{ r.message }}</p>
                @if (r.status === 'PENDING') {
                  <div class="actions">
                    <p-button
                      label="Anuluj"
                      severity="danger"
                      [outlined]="true"
                      size="small"
                      [loading]="cancellingId() === r.id"
                      (onClick)="cancel(r.id)"
                    />
                  </div>
                }
              </div>
              <a class="detail-link" [routerLink]="['/seeker/waiting', r.id]">Szczegóły →</a>
            </div>
          </p-card>
        } @empty {
          <p class="empty-state">Brak próśb.</p>
        }
      </div>
    </div>
  `,
  styles: `
    .item-row {
      display: flex;
      justify-content: space-between;
      gap: 1rem;
      align-items: flex-start;
      flex-wrap: wrap;
    }
    .msg {
      margin: 0.65rem 0 0;
      color: var(--rm-ink-muted);
    }
    .actions {
      margin-top: 0.75rem;
    }
    .detail-link {
      font-weight: 600;
      text-decoration: none;
      white-space: nowrap;
      color: var(--rm-accent);
    }
    .detail-link:hover {
      color: var(--rm-accent-hover);
    }
  `,
})
export class MyRequestsComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly toast = inject(ToastService);

  readonly requests = signal<ServiceRequest[]>([]);
  readonly cancellingId = signal<string | null>(null);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.api.getMyRequests().subscribe({
      next: (items) => this.requests.set(items),
      error: () => this.toast.error('Nie udało się załadować'),
    });
  }

  cancel(id: string): void {
    this.cancellingId.set(id);
    this.api.cancelRequest(id).subscribe({
      next: () => {
        this.toast.success('Anulowano prośbę');
        this.cancellingId.set(null);
        this.load();
      },
      error: (err) => {
        this.cancellingId.set(null);
        this.toast.error(err?.error?.error ?? 'Nie udało się anulować');
        this.load();
      },
    });
  }

  statusLabel(status: string): string {
    const map: Record<string, string> = {
      PENDING: 'Oczekuje',
      ACCEPTED: 'Zaakceptowano',
      DECLINED: 'Odrzucono',
      TIMEOUT: 'Wygasło',
      CANCELLED: 'Anulowano',
    };
    return map[status] ?? status;
  }

  statusSeverity(status: string): 'success' | 'danger' | 'warn' | 'info' {
    if (status === 'ACCEPTED') return 'success';
    if (status === 'DECLINED' || status === 'CANCELLED') return 'danger';
    if (status === 'TIMEOUT') return 'warn';
    return 'info';
  }
}
