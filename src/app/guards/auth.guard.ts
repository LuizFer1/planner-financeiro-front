import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { authService } from '../services/Auth';

export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  
  if (authService.isAuthenticated()) {
    return true;
  }
  
  // Redireciona para login se não estiver autenticado
  router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
  return false;
};
