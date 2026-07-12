import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Button } from 'primeng/button';
import { Card } from 'primeng/card';
import { InputNumber } from 'primeng/inputnumber';
import { MultiSelect } from 'primeng/multiselect';
import { Textarea } from 'primeng/textarea';
import { ApiService } from '../../../core/api/api.service';
import { Category } from '../../../core/models';
import { ToastService } from '../../../shared/services/toast.service';

@Component({
  selector: 'app-provider-profile',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    Card,
    InputNumber,
    Textarea,
    MultiSelect,
    Button,
  ],
  template: `
    <div class="page">
      <a routerLink="/provider">← Panel</a>
      <p-card header="Profil usługodawcy">
        <form [formGroup]="form" (ngSubmit)="save()">
          <label>Stawka za godzinę (zł)</label>
          <p-inputNumber formControlName="hourlyRate" [min]="1" class="w-full" />
          <label>Bio</label>
          <textarea pTextarea formControlName="bio" rows="3" class="w-full"></textarea>
          <label>Kategorie</label>
          <p-multiSelect
            formControlName="categories"
            [options]="categoryOptions()"
            optionLabel="name"
            optionValue="id"
            placeholder="Wybierz kategorie"
            class="w-full"
          />
          <p-button type="submit" label="Zapisz" [loading]="busy()" class="mt-2" />
        </form>
      </p-card>
    </div>
  `,
  styles: `
    .page {
      padding: 1rem;
      max-width: 480px;
      margin: 0 auto;
    }
    label {
      display: block;
      margin: 0.75rem 0 0.25rem;
      font-weight: 500;
    }
    .w-full {
      width: 100%;
    }
    .mt-2 {
      margin-top: 1rem;
    }
  `,
})
export class ProviderProfileComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(ApiService);
  private readonly toast = inject(ToastService);

  readonly categoryOptions = signal<Category[]>([]);
  readonly busy = signal(false);

  readonly form = this.fb.nonNullable.group({
    hourlyRate: [0, [Validators.required, Validators.min(1)]],
    bio: [''],
    categories: [[] as string[], Validators.required],
  });

  ngOnInit(): void {
    this.api.getCategories().subscribe({
      next: (cats) => this.categoryOptions.set(cats),
    });
    this.api.getProviderProfile().subscribe({
      next: (p) => {
        this.form.patchValue({
          hourlyRate: p.hourlyRate || 0,
          bio: p.bio ?? '',
          categories: p.categories,
        });
      },
    });
  }

  save(): void {
    if (this.form.invalid) return;
    this.busy.set(true);
    const v = this.form.getRawValue();
    this.api.updateProvider(v).subscribe({
      next: () => {
        this.toast.success('Profil zapisany');
        this.busy.set(false);
      },
      error: (err) => {
        this.toast.error(err?.error?.error ?? 'Błąd zapisu');
        this.busy.set(false);
      },
    });
  }
}
