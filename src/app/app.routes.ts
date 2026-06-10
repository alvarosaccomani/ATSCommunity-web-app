import { Routes } from '@angular/router';

export const routes: Routes = [
  {
      path: 'public',
      loadChildren: () => import('./public/public.routes').then(m => m.PUBLIC_ROUTES),
  },
  { path: '', pathMatch: 'full', redirectTo: '/welcome' },
  { path: 'welcome', loadChildren: () => import('./pages/welcome/welcome.routes').then(m => m.WELCOME_ROUTES) }
];
