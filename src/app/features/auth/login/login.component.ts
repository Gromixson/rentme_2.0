import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Button } from 'primeng/button';
import { InputText } from 'primeng/inputtext';
import { Password } from 'primeng/password';
import { AuthService } from '../../../core/auth/auth.service';
import { ToastService } from '../../../shared/services/toast.service';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink, InputText, Password, Button],
  template: `
    <div class="auth-shell">
      <div class="auth-inner">
        <a routerLink="/" class="auth-brand">RentMe</a>
        <p class="auth-tagline">Usługi on-demand — znajdź albo zaproponuj w kilka minut.</p>
        <div class="auth-panel">
          <h2>Zaloguj się</h2>
          <p class="auth-sub">Witaj ponownie. Wróć do próśb i rezerwacji.</p>
          <form [formGroup]="form" (ngSubmit)="submit()">
            <label for="login-email">Email</label>
            <input
              id="login-email"
              pInputText
              formControlName="email"
              type="email"
              class="w-full"
              autocomplete="email"
            />
            <label for="login-password">Hasło</label>
            <p-password
              inputId="login-password"
              formControlName="password"
              [feedback]="false"
              styleClass="w-full"
              inputStyleClass="w-full"
              autocomplete="current-password"
            />
            <p-button type="submit" label="Zaloguj" [loading]="busy()" styleClass="w-full mt-3" />
          </form>
          <p class="auth-footer">
            Nie masz konta?
            <a routerLink="/auth/register">Zarejestruj się</a>
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
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  readonly busy = signal(false);
  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  async submit(): Promise<void> {
    if (this.form.invalid) return;
    this.busy.set(true);
    try {
      const { email, password } = this.form.getRawValue();
      await this.auth.login(email, password);
      const role = this.auth.activeRole();
      await this.router.navigate([role === 'PROVIDER' ? '/provider' : '/seeker']);
    } catch {
      this.toast.error('Logowanie nie powiodło się', 'Sprawdź email i hasło');
    } finally {
      this.busy.set(false);
    }
  }
}
