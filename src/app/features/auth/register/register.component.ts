import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Button } from 'primeng/button';
import { InputText } from 'primeng/inputtext';
import { Password } from 'primeng/password';
import { TimeoutError } from 'rxjs';
import { AuthService } from '../../../core/auth/auth.service';
import { ToastService } from '../../../shared/services/toast.service';

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, RouterLink, InputText, Password, Button],
  template: `
    <div class="auth-shell">
      <div class="auth-inner">
        <a routerLink="/" class="auth-brand">RentMe</a>
        <p class="auth-tagline">Jedno konto — tryb klienta i usługodawcy.</p>
        <div class="auth-panel">
          <h2>Dołącz do RentMe</h2>
          <p class="auth-sub">Załóż konto i zacznij od roli klienta.</p>
          <form [formGroup]="form" (ngSubmit)="submit()">
            <label for="reg-name">Imię / pseudonim</label>
            <input
              id="reg-name"
              pInputText
              formControlName="name"
              class="w-full"
              autocomplete="nickname"
            />
            <label for="reg-email">Email</label>
            <input
              id="reg-email"
              pInputText
              formControlName="email"
              type="email"
              class="w-full"
              autocomplete="email"
            />
            <label for="reg-password">Hasło (min. 6 znaków)</label>
            <p-password
              inputId="reg-password"
              formControlName="password"
              [feedback]="false"
              styleClass="w-full"
              inputStyleClass="w-full"
              autocomplete="new-password"
            />
            <p-button
              type="submit"
              label="Utwórz konto"
              [loading]="busy()"
              styleClass="w-full mt-3"
            />
          </form>
          <p class="auth-footer">
            Masz konto?
            <a routerLink="/auth/login">Zaloguj się</a>
          </p>
        </div>
      </div>
    </div>
  `,
  styles: `
    :host ::ng-deep .p-password {
      width: 100%;
      display: block;
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
        msg = 'API nie odpowiada (timeout). Sprawdź deploy Functions lub połączenie.';
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
