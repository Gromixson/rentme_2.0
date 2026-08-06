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
    <div class="page" style="--rm-page-max: 720px">
      <a routerLink="/seeker" class="back-link">← Kategorie</a>
      <div class="page-header">
        <div>
          <h1>Usługodawcy online</h1>
          <p class="page-lede">Wyślij prośbę do osoby dostępnej w tej chwili.</p>
        </div>
      </div>
      @if (loading()) {
        <p class="empty-state">Ładowanie…</p>
      } @else if (providers().length === 0) {
        <div class="empty-state">
          <p>Nikt nie jest online w tej kategorii.</p>
          <p-button label="Szukam!" severity="warn" (onClick)="expressInterest()" class="mt-2" />
        </div>
      } @else {
        <div class="page-stack">
          @for (p of providers(); track p.id) {
            <p-card>
              <div class="provider-row">
                <div>
                  <h3>{{ p.name }}</h3>
                  <p class="bio">{{ p.bio || 'Bez opisu' }}</p>
                  <p-tag [value]="p.averageRating + ' ★ (' + p.ratingCount + ')'" />
                </div>
                <div class="provider-cta">
                  <p class="rate">{{ p.hourlyRate }} zł/h</p>
                  <p-button label="Wyślij prośbę" (onClick)="goRequest(p.id)" />
                </div>
              </div>
            </p-card>
          }
        </div>
      }
    </div>
  `,
  styles: `
    h3 {
      margin: 0 0 0.35rem;
      font-family: var(--rm-font-display);
      font-size: 1.15rem;
    }
    .bio {
      margin: 0 0 0.65rem;
      color: var(--rm-ink-muted);
    }
    .provider-row {
      display: flex;
      justify-content: space-between;
      gap: 1rem;
      flex-wrap: wrap;
      align-items: flex-end;
    }
    .provider-cta {
      text-align: right;
    }
    .rate {
      font-weight: 700;
      font-size: 1.15rem;
      margin: 0 0 0.5rem;
      color: var(--rm-accent);
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
