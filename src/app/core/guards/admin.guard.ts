import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SessionService } from '../services/session.service';

export const adminGuard: CanActivateFn = (route, state) => {
  const sessionService = inject(SessionService);
  const router = inject(Router);

  if (!sessionService.getIdentity()) {
    return router.parseUrl('/auth/login');
  }

  const activeCompany = sessionService.getCompany();
  if (activeCompany && activeCompany.roles) {
    const isAdmin = activeCompany.roles.some((r: any) =>
      r.rol_name === 'Administrador' ||
      r.rol_name === 'Admin' ||
      r.rol_name === 'Administración'
    );
    if (isAdmin) {
      return true;
    }
  }

  return router.parseUrl('/welcome');
};
