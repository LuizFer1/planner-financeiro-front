import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { CryptoService } from '../services/Crypto';
import { LoggerService } from '../services/Logger';

/**
 * Interceptor HTTP para gerenciar autenticação
 * - Adiciona token automaticamente às requisições
 * - Trata erros de autenticação
 * - Redireciona em caso de token expirado
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const cryptoService = inject(CryptoService);
  const router = inject(Router);
  const logger = inject(LoggerService);

  // Recupera o token de forma segura
  const token = cryptoService.getSecureItem('auth_token');

  // Clone a requisição e adiciona o token se existir
  let authReq = req;
  if (token) {
    authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  // Envia a requisição e trata erros
  return next(authReq).pipe(
    catchError(error => {
      // Se for erro 401 (não autorizado), redireciona para login
      if (error.status === 401) {
        logger.warn('Token expirado ou inválido, redirecionando para login');
        cryptoService.removeSecureItem('auth_token');
        router.navigate(['/login']);
      }

      // Se for erro 403 (proibido)
      if (error.status === 403) {
        logger.warn('Acesso negado');
      }

      // Log do erro (já sanitizado pelo logger)
      logger.error('Erro na requisição HTTP', error);

      return throwError(() => error);
    })
  );
};
