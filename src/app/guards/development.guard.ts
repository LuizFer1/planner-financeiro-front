import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';

export const developmentGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  
  // Redireciona para o dashboard com estado indicando que a página está em desenvolvimento
  router.navigate(['/dashboard'], { 
    state: { 
      message: 'Esta funcionalidade está em desenvolvimento e estará disponível em breve.',
      from: state.url 
    } 
  });
  
  return false;
};
