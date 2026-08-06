import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, from, switchMap, timeout } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  Booking,
  Category,
  ProviderListItem,
  ProviderProfile,
  ServiceRequest,
  UserProfile,
  UserRole,
} from '../models';

const API_TIMEOUT_MS = 15_000;

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiUrl;
  private tokenGetter: (() => Promise<string | null>) | null = null;

  setTokenGetter(getter: () => Promise<string | null>): void {
    this.tokenGetter = getter;
  }

  private authHeaders(): Observable<HttpHeaders> {
    if (!this.tokenGetter) {
      return from(Promise.resolve(new HttpHeaders()));
    }
    return from(this.tokenGetter()).pipe(
      switchMap((token) => {
        const headers = token
          ? new HttpHeaders({ Authorization: `Bearer ${token}` })
          : new HttpHeaders();
        return from(Promise.resolve(headers));
      }),
    );
  }

  private get<T>(path: string): Observable<T> {
    return this.authHeaders().pipe(
      switchMap((headers) => this.http.get<T>(`${this.base}${path}`, { headers })),
      timeout(API_TIMEOUT_MS),
    );
  }

  private post<T>(path: string, body: unknown): Observable<T> {
    return this.authHeaders().pipe(
      switchMap((headers) => this.http.post<T>(`${this.base}${path}`, body, { headers })),
      timeout(API_TIMEOUT_MS),
    );
  }

  private put<T>(path: string, body: unknown): Observable<T> {
    return this.authHeaders().pipe(
      switchMap((headers) => this.http.put<T>(`${this.base}${path}`, body, { headers })),
      timeout(API_TIMEOUT_MS),
    );
  }

  register(email: string, password: string, name: string): Observable<unknown> {
    return this.http.post(`${this.base}/auth/register`, {
      email,
      password,
      name,
      roles: ['SEEKER', 'PROVIDER'],
    });
  }

  getMe(): Observable<UserProfile> {
    return this.get<UserProfile>('/auth/me');
  }

  setActiveRole(activeRole: UserRole): Observable<{ activeRole: UserRole }> {
    return this.post('/auth/active-role', { activeRole });
  }

  updateProfile(name: string): Observable<{ name: string }> {
    return this.put('/users/profile', { name });
  }

  getCategories(): Observable<Category[]> {
    return this.get<Category[]>('/categories');
  }

  seedCategories(): Observable<unknown> {
    return this.http.post(
      `${this.base}/categories/seed`,
      {},
      {
        headers: new HttpHeaders({ 'x-dev-seed': 'true' }),
      },
    );
  }

  getOnlineProviders(categoryId: string): Observable<ProviderListItem[]> {
    return this.get<ProviderListItem[]>(`/categories/${categoryId}/providers`);
  }

  getProviderProfile(): Observable<ProviderProfile> {
    return this.get<ProviderProfile>('/providers/me');
  }

  updateProvider(data: {
    categories?: string[];
    hourlyRate?: number;
    bio?: string;
  }): Observable<ProviderProfile> {
    return this.put<ProviderProfile>('/providers/categories', data);
  }

  setOnline(isOnline: boolean): Observable<{ isOnline: boolean }> {
    return this.put('/providers/status', { isOnline });
  }

  getPendingRequests(): Observable<ServiceRequest[]> {
    return this.get<ServiceRequest[]>('/providers/requests');
  }

  respondToRequest(id: string, action: 'accept' | 'decline'): Observable<unknown> {
    return this.post(`/providers/requests/${id}/respond`, { action });
  }

  createRequest(
    providerId: string,
    categoryId: string,
    message: string,
  ): Observable<ServiceRequest> {
    return this.post<ServiceRequest>('/requests', { providerId, categoryId, message });
  }

  getRequest(id: string): Observable<ServiceRequest> {
    return this.get<ServiceRequest>(`/requests/${id}`);
  }

  getMyRequests(): Observable<ServiceRequest[]> {
    return this.get<ServiceRequest[]>('/requests/my');
  }

  cancelRequest(id: string): Observable<{ status: 'CANCELLED' }> {
    return this.post<{ status: 'CANCELLED' }>(`/requests/${id}/cancel`, {});
  }

  getMyBookings(): Observable<Booking[]> {
    return this.get<Booking[]>('/bookings/my');
  }

  completeBooking(id: string): Observable<{ status: string }> {
    return this.post(`/bookings/${id}/complete`, {});
  }

  rateBooking(id: string, rating: number, comment?: string): Observable<unknown> {
    return this.post(`/bookings/${id}/rate`, { rating, comment });
  }

  expressInterest(categoryId: string): Observable<unknown> {
    return this.post(`/categories/${categoryId}/interests`, {});
  }

  getInterestCount(categoryId: string): Observable<{ count: number }> {
    return this.get(`/categories/${categoryId}/interests/count`);
  }
}
