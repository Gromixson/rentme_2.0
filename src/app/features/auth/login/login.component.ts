import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Button } from 'primeng/button';
import { Card } from 'primeng/card';
import { InputText } from 'primeng/inputtext';
import { Password } from 'primeng/password';
import { AuthService } from '../../../core/auth/auth.service';
import { ToastService } from '../../../shared/services/toast.service';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink, Card, InputText, Password, Button],
  template: `
    <div class="auth-page">
      <p-card header="Logowanie">
        <form [formGroup]="form" (ngSubmit)="submit()">
          <label>Email</label>
          <input pInputText formControlName="email" type="email" class="w-full" />
          <label>Hasło</label>
          <p-password formControlName="password" [feedback]="false" styleClass="w-full" inputStyleClass="w-full" />
          <p-button type="submit" label="Zaloguj" [loading]="busy()" class="mt-3" />
        </form>
        <p class="mt-3">
          Nie masz konta? <a routerLink="/auth/register">Zarejestruj się</a>
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
