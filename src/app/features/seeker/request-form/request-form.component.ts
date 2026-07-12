import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Button } from 'primeng/button';
import { Card } from 'primeng/card';
import { Textarea } from 'primeng/textarea';
import { ApiService } from '../../../core/api/api.service';
import { ToastService } from '../../../shared/services/toast.service';

@Component({
  selector: 'app-request-form',
  imports: [ReactiveFormsModule, RouterLink, Card, Textarea, Button],
  template: `
    <div class="page">
      <a [routerLink]="['/seeker/category', categoryId]">← Wróć</a>
      <p-card header="Wyślij prośbę">
        <form [formGroup]="form" (ngSubmit)="submit()">
          <label>Twoja wiadomość (10–500 znaków)</label>
          <textarea pTextarea formControlName="message" rows="5" class="w-full"></textarea>
          @if (form.controls.message.hasError('minlength')) {
            <small class="err">Minimum 10 znaków</small>
          }
          <p-button type="submit" label="Wyślij" [loading]="busy()" class="mt-2" />
        </form>
      </p-card>
    </div>
  `,
  styles: `
    .page {
      padding: 1rem;
      max-width: 520px;
      margin: 0 auto;
    }
    .w-full {
      width: 100%;
    }
    .mt-2 {
      margin-top: 1rem;
    }
    .err {
      color: #b91c1c;
    }
    label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: 500;
    }
  `,
})
export class RequestFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly api = inject(ApiService);
  private readonly toast = inject(ToastService);

  categoryId = this.route.snapshot.paramMap.get('categoryId') ?? '';
  providerId = this.route.snapshot.paramMap.get('providerId') ?? '';
  readonly busy = signal(false);

  readonly form = this.fb.nonNullable.group({
    message: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(500)]],
  });

  submit(): void {
    if (this.form.invalid) return;
    this.busy.set(true);
    const message = this.form.getRawValue().message;
    this.api.createRequest(this.providerId, this.categoryId, message).subscribe({
      next: (req) => {
        this.toast.success('Prośba wysłana');
        this.router.navigate(['/seeker/waiting', req.id]);
      },
      error: (err) => {
        this.toast.error('Błąd', err?.error?.error ?? 'Nie udało się wysłać');
        this.busy.set(false);
      },
    });
  }
}
