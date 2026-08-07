import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';
import { guestGuard } from './core/auth/guest.guard';
import { roleGuard } from './core/auth/role.guard';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () => import('./features/home/home.component').then((m) => m.HomeComponent),
    canActivate: [authGuard],
  },
  {
    path: 'auth',
    canActivate: [guestGuard],
    children: [
      {
        path: 'login',
        loadComponent: () =>
          import('./features/auth/login/login.component').then((m) => m.LoginComponent),
      },
      {
        path: 'register',
        loadComponent: () =>
          import('./features/auth/register/register.component').then((m) => m.RegisterComponent),
      },
      { path: '', redirectTo: 'login', pathMatch: 'full' },
    ],
  },
  {
    path: 'seeker',
    canActivate: [authGuard, roleGuard('SEEKER')],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/seeker/categories/categories.component').then(
            (m) => m.CategoriesComponent,
          ),
      },
      {
        path: 'category/:categoryId',
        loadComponent: () =>
          import('./features/seeker/providers/providers.component').then(
            (m) => m.ProvidersComponent,
          ),
      },
      {
        path: 'request/:categoryId/:providerId',
        loadComponent: () =>
          import('./features/seeker/request-form/request-form.component').then(
            (m) => m.RequestFormComponent,
          ),
      },
      {
        path: 'waiting/:id',
        loadComponent: () =>
          import('./features/seeker/request-waiting/request-waiting.component').then(
            (m) => m.RequestWaitingComponent,
          ),
      },
      {
        path: 'requests',
        loadComponent: () =>
          import('./features/seeker/my-requests/my-requests.component').then(
            (m) => m.MyRequestsComponent,
          ),
      },
    ],
  },
  {
    path: 'provider',
    canActivate: [authGuard, roleGuard('PROVIDER')],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/provider/dashboard/provider-dashboard.component').then(
            (m) => m.ProviderDashboardComponent,
          ),
      },
      {
        path: 'profile',
        loadComponent: () =>
          import('./features/provider/profile/provider-profile.component').then(
            (m) => m.ProviderProfileComponent,
          ),
      },
      {
        path: 'requests',
        loadComponent: () =>
          import('./features/provider/requests/provider-requests.component').then(
            (m) => m.ProviderRequestsComponent,
          ),
      },
    ],
  },
  {
    path: 'bookings',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/bookings/bookings-list/bookings-list.component').then(
        (m) => m.BookingsListComponent,
      ),
  },
  { path: '**', redirectTo: '' },
];
