import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';
import { guestGuard } from './core/guards/guest.guard';

export const routes: Routes = [
  {
      path: 'auth',
      canActivate: [guestGuard],
      loadChildren: () => import('./auth/auth.routes').then(m => m.AUTH_ROUTES),
  },
  {
      path: 'public',
      loadChildren: () => import('./public/public.routes').then(m => m.PUBLIC_ROUTES),
  },
  {
      path: 'user',
      canActivate: [authGuard],
      loadChildren: () => import('./user/user.routes').then(m => m.USER_ROUTES),
  },
  {
      path: 'application',
      canActivate: [adminGuard],
      loadChildren: () => import('./application/application.routes').then(m => m.APPLICATION_ROUTES),
  },
  { path: '', pathMatch: 'full', redirectTo: '/welcome' },
  { path: 'welcome', canActivate: [authGuard], loadChildren: () => import('./pages/welcome/welcome.routes').then(m => m.WELCOME_ROUTES) },
  { path: '**', redirectTo: 'public/home' }
];
