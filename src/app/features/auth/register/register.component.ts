import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Button } from 'primeng/button';
import { Card } from 'primeng/card';
import { InputText } from 'primeng/inputtext';
import { Password } from 'primeng/password';
import { AuthService } from '../../../core/auth/auth.service';
import { TimeoutError } from 'rxjs';
import { ToastService } from '../../../shared/services/toast.service';

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, RouterLink, Card, InputText, Password, Button],
  template: `
    <div class="auth-page">
      <p-card header="Rejestracja">
        <form [formGroup]="form" (ngSubmit)="submit()">
          <label>Imię / pseudonim</label>
          <input pInputText formControlName="name" class="w-full" />
          <label>Email</label>
          <input pInputText formControlName="email" type="email" class="w-full" />
          <label>Hasło (min. 6 znaków)</label>
          <p-password formControlName="password" [feedback]="false" styleClass="w-full" inputStyleClass="w-full" />
          <p-button type="submit" label="Utwórz konto" [loading]="busy()" class="mt-3" />
        </form>
        <p class="mt-3">
          Masz konto? <a routerLink="/auth/login">Zaloguj się</a>
        </p>
      </p-card>
    </div>
  `,
  styles: `
    .auth-page {
      max-width: 400px;
      margin: 2rem auto;
      padding: 0 1rem;
    }
    label {
      display: block;
      margin: 0.75rem 0 0.25rem;
      font-weight: 500;
    }
    .w-full {
      width: 100%;
    }
    .mt-3 {
      margin-top: 1rem;
    }
  `,
})
export class RegisterComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  readonly busy = signal(false);
  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  async submit(): Promise<void> {
    if (this.form.invalid) return;
    this.busy.set(true);
    try {
      const { email, password, name } = this.form.getRawValue();
      await this.auth.register(email, password, name);
      this.toast.success('Konto utworzone');
      await this.router.navigate(['/seeker']);
    } catch (err: unknown) {
      let msg = 'Rejestracja nie powiodła się.';
      if (err instanceof TimeoutError) {
        msg =
          'API nie odpowiada (timeout). Sprawdź deploy Functions lub połączenie.';
      } else if (err instanceof HttpErrorResponse) {
        if (err.status === 0) {
          msg = 'Brak połączenia z API (CORS lub Functions niedostępne).';
        } else if (typeof err.error?.error === 'string') {
          msg = err.error.error;
        }
      } else if (err instanceof Error) {
        msg = err.message;
      }
      this.toast.error(msg);
    } finally {
      this.busy.set(false);
    }
  }
}
