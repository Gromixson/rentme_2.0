import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Button } from 'primeng/button';
import { Card } from 'primeng/card';
import { Tag } from 'primeng/tag';
import { ApiService } from '../../../core/api/api.service';
import { ProviderListItem } from '../../../core/models';
import { ToastService } from '../../../shared/services/toast.service';

@Component({
  selector: 'app-providers',
  imports: [RouterLink, Card, Button, Tag],
  template: `
    <div class="page">
      <a routerLink="/seeker">← Kategorie</a>
      <h1>Usługodawcy online</h1>
      @if (loading()) {
        <p>Ładowanie…</p>
      } @else if (providers().length === 0) {
        <p-card>
          <p>Nikt nie jest online w tej kategorii.</p>
          <p-button label="Szukam!" severity="warn" (onClick)="expressInterest()" class="mt-2" />
        </p-card>
      } @else {
        <div class="grid">
          @for (p of providers(); track p.id) {
            <p-card>
              <h3>{{ p.name }}</h3>
              <p>{{ p.bio || 'Bez opisu' }}</p>
              <p-tag [value]="p.averageRating + ' ★ (' + p.ratingCount + ')'" />
              <p class="rate">{{ p.hourlyRate }} zł/h</p>
              <p-button label="Wyślij prośbę" (onClick)="goRequest(p.id)" />
            </p-card>
          }
        </div>
      }
    </div>
  `,
  styles: `
    .page {
      padding: 1rem;
      max-width: 720px;
      margin: 0 auto;
    }
    .grid {
      display: grid;
      gap: 1rem;
    }
    .rate {
      font-weight: 600;
      margin: 0.5rem 0;
    }
    .mt-2 {
      margin-top: 0.5rem;
    }
  `,
})
export class ProvidersComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly api = inject(ApiService);
  private readonly toast = inject(ToastService);

  readonly providers = signal<ProviderListItem[]>([]);
  readonly loading = signal(true);
  categoryId = '';

  ngOnInit(): void {
    this.categoryId = this.route.snapshot.paramMap.get('categoryId') ?? '';
    this.api.getOnlineProviders(this.categoryId).subscribe({
      next: (items) => {
        this.providers.set(items);
        this.loading.set(false);
      },
      error: () => {
        this.toast.error('Nie udało się załadować listy');
        this.loading.set(false);
      },
    });
  }

  goRequest(providerId: string): void {
    this.router.navigate(['/seeker/request', this.categoryId, providerId]);
  }

  expressInterest(): void {
    this.api.expressInterest(this.categoryId).subscribe({
      next: () => this.toast.info('Zapisano „Szukam!”'),
      error: () => this.toast.error('Błąd zapisu'),
    });
  }
}
