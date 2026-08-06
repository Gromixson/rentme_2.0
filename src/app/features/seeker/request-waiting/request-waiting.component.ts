import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Button } from 'primeng/button';
import { Card } from 'primeng/card';
import { Tag } from 'primeng/tag';
import { ApiService } from '../../../core/api/api.service';
import { ServiceRequest } from '../../../core/models';
import { ToastService } from '../../../shared/services/toast.service';

@Component({
  selector: 'app-request-waiting',
  imports: [RouterLink, Card, Tag, Button],
  template: `
    <div class="page waiting-page" style="--rm-page-max: 480px">
      <div class="page-header" style="justify-content: center; text-align: center">
        <div>
          <h1>Oczekiwanie</h1>
          <p class="page-lede" style="margin-inline: auto">Czekamy na odpowiedź usługodawcy.</p>
        </div>
      </div>
      <p-card>
        @if (request(); as r) {
          <div class="waiting-body">
            <p-tag [value]="statusLabel(r.status)" [severity]="statusSeverity(r.status)" />
            <p class="timer" [class.urgent]="secondsLeft() <= 30 && r.status === 'PENDING'">
              {{ secondsLeft() }}s
            </p>
            <p class="timer-label">pozostało</p>
            <p class="message">„{{ r.message }}”</p>
            @if (r.status === 'ACCEPTED') {
              <a routerLink="/bookings"
                ><p-button label="Zobacz rezerwacje" styleClass="w-full"
              /></a>
            }
            @if (r.status === 'DECLINED' || r.status === 'TIMEOUT') {
              <a routerLink="/seeker/requests">
                <p-button label="Moje prośby" severity="secondary" styleClass="w-full" />
              </a>
            }
          </div>
        } @else {
          <p class="empty-state">Ładowanie…</p>
        }
      </p-card>
    </div>
  `,
  styles: `
    .waiting-body {
      text-align: center;
      padding: 0.5rem 0;
    }
    .timer {
      font-family: var(--rm-font-display);
      font-size: clamp(2.5rem, 8vw, 3.25rem);
      font-weight: 700;
      margin: 1rem 0 0;
      color: var(--rm-accent);
      animation: rm-pulse-soft 2.4s ease-in-out infinite;
    }
    .timer.urgent {
      color: var(--rm-warn);
    }
    .timer-label {
      margin: 0 0 1rem;
      color: var(--rm-ink-muted);
      font-size: 0.85rem;
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }
    .message {
      font-style: italic;
      color: var(--rm-ink-muted);
      margin-bottom: 1.25rem;
    }
  `,
})
export class RequestWaitingComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(ApiService);
  private readonly toast = inject(ToastService);

  readonly request = signal<ServiceRequest | null>(null);
  readonly secondsLeft = signal(0);
  private intervalId?: ReturnType<typeof setInterval>;
  private pollId?: ReturnType<typeof setInterval>;
  requestId = '';

  ngOnInit(): void {
    this.requestId = this.route.snapshot.paramMap.get('id') ?? '';
    this.poll();
    this.pollId = setInterval(() => this.poll(), 3000);
    this.intervalId = setInterval(() => this.tick(), 1000);
  }

  ngOnDestroy(): void {
    if (this.intervalId) clearInterval(this.intervalId);
    if (this.pollId) clearInterval(this.pollId);
  }

  poll(): void {
    this.api.getRequest(this.requestId).subscribe({
      next: (r) => {
        this.request.set(r);
        this.updateSeconds(r);
        if (r.status !== 'PENDING') {
          if (this.pollId) clearInterval(this.pollId);
          if (r.status === 'ACCEPTED') {
            this.toast.success('Zaakceptowano!', 'Rezerwacja została utworzona');
          } else if (r.status === 'DECLINED') {
            this.toast.info('Odrzucono');
          } else if (r.status === 'TIMEOUT') {
            this.toast.info('Czas minął');
          }
        }
      },
    });
  }

  tick(): void {
    const r = this.request();
    if (r) this.updateSeconds(r);
  }

  private updateSeconds(r: ServiceRequest): void {
    const left = Math.max(0, Math.floor((new Date(r.expiresAt).getTime() - Date.now()) / 1000));
    this.secondsLeft.set(left);
  }

  statusLabel(status: string): string {
    const map: Record<string, string> = {
      PENDING: 'Oczekuje',
      ACCEPTED: 'Zaakceptowano',
      DECLINED: 'Odrzucono',
      TIMEOUT: 'Wygasło',
      CANCELLED: 'Anulowano',
    };
    return map[status] ?? status;
  }

  statusSeverity(status: string): 'success' | 'danger' | 'warn' | 'info' {
    if (status === 'ACCEPTED') return 'success';
    if (status === 'DECLINED' || status === 'CANCELLED') return 'danger';
    if (status === 'TIMEOUT') return 'warn';
    return 'info';
  }
}
