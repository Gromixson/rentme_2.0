import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Button } from 'primeng/button';
import { Card } from 'primeng/card';
import { Dialog } from 'primeng/dialog';
import { InputNumber } from 'primeng/inputnumber';
import { Tag } from 'primeng/tag';
import { Textarea } from 'primeng/textarea';
import { ApiService } from '../../../core/api/api.service';
import { AuthService } from '../../../core/auth/auth.service';
import { Booking } from '../../../core/models';
import { ToastService } from '../../../shared/services/toast.service';

@Component({
  selector: 'app-bookings-list',
  imports: [ReactiveFormsModule, Card, Tag, Button, Dialog, InputNumber, Textarea],
  template: `
    <div class="page" style="--rm-page-max: 640px">
      <div class="page-header">
        <div>
          <h1>Moje rezerwacje</h1>
          <p class="page-lede">Potwierdzone i zakończone usługi.</p>
        </div>
      </div>
      <div class="page-stack">
        @for (b of bookings(); track b.id) {
          <p-card>
            <div class="item-row">
              <div>
                <p-tag [value]="statusLabel(b.status)" [severity]="statusSeverity(b.status)" />
                <p class="id">ID: {{ b.id.slice(0, 8) }}…</p>
              </div>
              <div class="actions">
                @if (b.status === 'CONFIRMED') {
                  <p-button label="Zakończ usługę" (onClick)="complete(b.id)" />
                }
                @if (b.status === 'COMPLETED' && isSeeker() && b.seekerId === myUid()) {
                  <p-button
                    label="Oceń"
                    severity="secondary"
                    [outlined]="true"
                    (onClick)="openRate(b.id)"
                  />
                }
              </div>
            </div>
          </p-card>
        } @empty {
          <p class="empty-state">Brak rezerwacji.</p>
        }
      </div>
    </div>

    <p-dialog
      header="Oceń usługę"
      [(visible)]="rateVisible"
      [modal]="true"
      styleClass="rate-dialog"
    >
      <form [formGroup]="rateForm" (ngSubmit)="submitRate()">
        <label for="rating">Ocena 1–5</label>
        <p-inputNumber inputId="rating" formControlName="rating" [min]="1" [max]="5" />
        <label for="comment">Komentarz (opcjonalnie)</label>
        <textarea
          id="comment"
          pTextarea
          formControlName="comment"
          rows="3"
          class="w-full"
        ></textarea>
        <p-button type="submit" label="Wyślij ocenę" styleClass="w-full mt-2" />
      </form>
    </p-dialog>
  `,
  styles: `
    .item-row {
      display: flex;
      justify-content: space-between;
      gap: 1rem;
      flex-wrap: wrap;
      align-items: center;
    }
    .id {
      margin: 0.5rem 0 0;
      font-size: 0.85rem;
      color: var(--rm-ink-muted);
      font-family: ui-monospace, monospace;
    }
    .actions {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
    }
  `,
})
export class BookingsListComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly auth = inject(AuthService);
  private readonly fb = inject(FormBuilder);
  private readonly toast = inject(ToastService);

  readonly bookings = signal<Booking[]>([]);
  rateVisible = false;
  rateBookingId = '';

  readonly rateForm = this.fb.nonNullable.group({
    rating: [5, [Validators.required, Validators.min(1), Validators.max(5)]],
    comment: [''],
  });

  ngOnInit(): void {
    this.load();
  }

  myUid(): string {
    return this.auth.user()?.uid ?? '';
  }

  isSeeker(): boolean {
    return this.auth.activeRole() === 'SEEKER';
  }

  load(): void {
    this.api.getMyBookings().subscribe({
      next: (items) => this.bookings.set(items),
      error: () => this.toast.error('Nie udało się załadować rezerwacji'),
    });
  }

  complete(id: string): void {
    this.api.completeBooking(id).subscribe({
      next: () => {
        this.toast.success('Usługa zakończona');
        this.load();
      },
      error: (err) => this.toast.error(err?.error?.error ?? 'Błąd'),
    });
  }

  openRate(id: string): void {
    this.rateBookingId = id;
    this.rateVisible = true;
  }

  submitRate(): void {
    const { rating, comment } = this.rateForm.getRawValue();
    this.api.rateBooking(this.rateBookingId, rating, comment || undefined).subscribe({
      next: () => {
        this.toast.success('Dziękujemy za ocenę');
        this.rateVisible = false;
        this.load();
      },
      error: (err) => this.toast.error(err?.error?.error ?? 'Błąd oceny'),
    });
  }

  statusLabel(status: string): string {
    const map: Record<string, string> = {
      CONFIRMED: 'Potwierdzona',
      COMPLETED: 'Zakończona',
      CANCELLED: 'Anulowana',
    };
    return map[status] ?? status;
  }

  statusSeverity(status: string): 'success' | 'danger' | 'warn' | 'info' {
    if (status === 'COMPLETED') return 'success';
    if (status === 'CANCELLED') return 'danger';
    return 'info';
  }
}
