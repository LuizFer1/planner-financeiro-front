import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

/**
 * Serviço de logging seguro
 * - Em produção: desabilita todos os logs
 * - Em desenvolvimento: permite logs estruturados
 */
@Injectable({
  providedIn: 'root'
})
export class LoggerService {
  private isProduction = environment.production;

  /**
   * Log informativo - apenas em desenvolvimento
   */
  info(message: string, data?: any): void {
    if (!this.isProduction) {
      console.log(`[INFO] ${message}`, data ?? '');
    }
  }

  /**
   * Log de aviso - apenas em desenvolvimento
   */
  warn(message: string, data?: any): void {
    if (!this.isProduction) {
      console.warn(`[WARN] ${message}`, data ?? '');
    }
  }

  /**
   * Log de erro - registra em ambos os ambientes mas sanitiza dados sensíveis
   */
  error(message: string, error?: any): void {
    const sanitizedError = this.sanitizeError(error);
    
    if (this.isProduction) {
      // Em produção, apenas registra sem expor detalhes sensíveis
      console.error(`[ERROR] ${message}`);
      // TODO: Aqui você pode integrar com serviços de monitoramento como Sentry, LogRocket, etc.
    } else {
      console.error(`[ERROR] ${message}`, sanitizedError);
    }
  }

  /**
   * Log de debug - apenas em desenvolvimento
   */
  debug(message: string, data?: any): void {
    if (!this.isProduction) {
      console.debug(`[DEBUG] ${message}`, data ?? '');
    }
  }

  /**
   * Remove dados sensíveis de erros antes de logar
   */
  private sanitizeError(error: any): any {
    if (!error) return null;

    // Se for um objeto Error padrão
    if (error instanceof Error) {
      return {
        name: error.name,
        message: error.message,
        stack: this.isProduction ? undefined : error.stack
      };
    }

    // Se for um objeto com propriedades sensíveis
    if (typeof error === 'object') {
      const sanitized: any = { ...error };
      
      // Lista de propriedades sensíveis a remover
      const sensitiveKeys = ['password', 'token', 'authorization', 'auth', 'apiKey', 'secret'];
      
      for (const key of sensitiveKeys) {
        if (key in sanitized) {
          sanitized[key] = '[REDACTED]';
        }
      }

      return sanitized;
    }

    return error;
  }

  /**
   * Agrupa logs relacionados (apenas em desenvolvimento)
   */
  group(label: string, callback: () => void): void {
    if (!this.isProduction) {
      console.group(label);
      callback();
      console.groupEnd();
    }
  }
}
