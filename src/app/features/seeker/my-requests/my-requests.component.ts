import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Card } from 'primeng/card';
import { Tag } from 'primeng/tag';
import { ApiService } from '../../../core/api/api.service';
import { ServiceRequest } from '../../../core/models';
import { ToastService } from '../../../shared/services/toast.service';

@Component({
  selector: 'app-my-requests',
  imports: [RouterLink, Card, Tag],
  template: `
    <div class="page">
      <h1>Moje prośby</h1>
      @for (r of requests(); track r.id) {
        <p-card class="item">
          <p-tag [value]="r.status" />
          <p>{{ r.message }}</p>
          <a [routerLink]="['/seeker/waiting', r.id]">Szczegóły</a>
        </p-card>
      } @empty {
        <p>Brak próśb.</p>
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
  `,
})
export class MyRequestsComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly toast = inject(ToastService);

  readonly requests = signal<ServiceRequest[]>([]);

  ngOnInit(): void {
    this.api.getMyRequests().subscribe({
      next: (items) => this.requests.set(items),
      error: () => this.toast.error('Nie udało się załadować'),
    });
  }
}
