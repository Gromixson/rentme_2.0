import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Toast } from 'primeng/toast';
import { AppHeaderComponent } from './shared/layout/app-header.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Toast, AppHeaderComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {}
