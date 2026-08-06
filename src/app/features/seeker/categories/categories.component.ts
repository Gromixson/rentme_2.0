import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Button } from 'primeng/button';
import { Card } from 'primeng/card';
import { Tag } from 'primeng/tag';
import { ApiService } from '../../../core/api/api.service';
import { Category } from '../../../core/models';
import { ToastService } from '../../../shared/services/toast.service';

@Component({
  selector: 'app-categories',
  imports: [RouterLink, Card, Button, Tag],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h1>Kategorie usług</h1>
          <p class="page-lede">Wybierz kategorię albo daj znać usługodawcom, że szukasz pomocy.</p>
        </div>
        <p-button
          label="Załaduj kategorie"
          severity="secondary"
          size="small"
          [outlined]="true"
          (onClick)="seed()"
        />
      </div>
      @if (loading()) {
        <p class="empty-state">Ładowanie…</p>
      } @else if (categories().length === 0) {
        <div class="empty-state">
          <p>Brak kategorii w bazie. Kliknij „Załaduj kategorie”.</p>
        </div>
      } @else {
        <div class="page-grid">
          @for (cat of categories(); track cat.id; let i = $index) {
            <p-card
              styleClass="cat-card"
              [class.rm-motion-delay-1]="i % 3 === 1"
              [class.rm-motion-delay-2]="i % 3 === 2"
            >
              <h3>{{ cat.name }}</h3>
              <p-tag [value]="(cat.onlineCount ?? 0) + ' online'" severity="info" />
              <div class="actions">
                <a [routerLink]="['/seeker/category', cat.id]">
                  <p-button label="Wybierz" />
                </a>
                @if ((cat.onlineCount ?? 0) === 0) {
                  <p-button label="Szukam!" severity="warn" (onClick)="expressInterest(cat.id)" />
                }
              </div>
            </p-card>
          }
        </div>
      }
    </div>
  `,
  styles: `
    h3 {
      margin: 0 0 0.65rem;
      font-family: var(--rm-font-display);
      font-size: 1.2rem;
    }
    .actions {
      display: flex;
      gap: 0.5rem;
      margin-top: 1.1rem;
      flex-wrap: wrap;
    }
    :host ::ng-deep .cat-card {
      transition:
        transform 0.2s ease,
        box-shadow 0.2s ease;
    }
    :host ::ng-deep .cat-card:hover {
      transform: translateY(-3px);
    }
  `,
})
export class CategoriesComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly toast = inject(ToastService);

  readonly categories = signal<Category[]>([]);
  readonly loading = signal(true);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.api.getCategories().subscribe({
      next: (items) => {
        this.categories.set(items);
        this.loading.set(false);
      },
      error: () => {
        this.toast.error('Nie udało się załadować kategorii');
        this.loading.set(false);
      },
    });
  }

  seed(): void {
    this.api.seedCategories().subscribe({
      next: () => {
        this.toast.success('Kategorie zaseedowane');
        this.load();
      },
      error: (err) => this.toast.error('Seed nie powiódł się', err?.error?.error),
    });
  }

  expressInterest(categoryId: string): void {
    this.api.expressInterest(categoryId).subscribe({
      next: () => this.toast.info('Zapisano zainteresowanie', 'Usługodawcy zobaczą badge'),
      error: () => this.toast.error('Nie udało się zapisać'),
    });
  }
}
