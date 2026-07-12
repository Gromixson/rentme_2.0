import { Component, inject, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
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
        <h1>Kategorie usług</h1>
        <p-button label="Załaduj kategorie" severity="secondary" size="small" (onClick)="seed()" />
      </div>
      @if (loading()) {
        <p>Ładowanie…</p>
      } @else if (categories().length === 0) {
        <p-card>
          <p>Brak kategorii w bazie. Kliknij „Załaduj kategorie”.</p>
        </p-card>
      } @else {
        <div class="grid">
          @for (cat of categories(); track cat.id) {
            <p-card class="cat-card">
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
    .page {
      padding: 1rem;
      max-width: 960px;
      margin: 0 auto;
    }
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }
    .grid {
      display: grid;
      gap: 1rem;
      grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    }
    .actions {
      display: flex;
      gap: 0.5rem;
      margin-top: 1rem;
      flex-wrap: wrap;
    }
    h3 {
      margin: 0 0 0.5rem;
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
