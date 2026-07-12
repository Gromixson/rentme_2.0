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
  imports: [
    ReactiveFormsModule,
    Card,
    Tag,
    Button,
    Dialog,
    InputNumber,
    Textarea,
  ],
  template: `
    <div class="page">
      <h1>Moje rezerwacje</h1>
      @for (b of bookings(); track b.id) {
        <p-card class="item">
          <p-tag [value]="b.status" />
          <p>ID: {{ b.id.slice(0, 8) }}…</p>
          @if (b.status === 'CONFIRMED') {
            <p-button label="Zakończ usługę" (onClick)="complete(b.id)" class="mr-1" />
          }
          @if (b.status === 'COMPLETED' && isSeeker() && b.seekerId === myUid()) {
            <p-button label="Oceń" (onClick)="openRate(b.id)" />
          }
        </p-card>
      } @empty {
        <p>Brak rezerwacji.</p>
      }
    </div>

    <p-dialog header="Oceń usługę" [(visible)]="rateVisible" [modal]="true" styleClass="rate-dialog">
      <form [formGroup]="rateForm" (ngSubmit)="submitRate()">
        <label>Ocena 1–5</label>
        <p-inputNumber formControlName="rating" [min]="1" [max]="5" />
        <label>Komentarz (opcjonalnie)</label>
        <textarea pTextarea formControlName="comment" rows="3" class="w-full"></textarea>
        <p-button type="submit" label="Wyślij ocenę" class="mt-2" />
      </form>
    </p-dialog>
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
    .mr-1 {
      margin-right: 0.5rem;
    }
    .w-full {
      width: 100%;
    }
    .mt-2 {
      margin-top: 1rem;
    }
    label {
      display: block;
      margin: 0.5rem 0 0.25rem;
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
}
