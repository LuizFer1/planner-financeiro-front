import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private toastSubject = new Subject<Toast>();
  public toasts$ = this.toastSubject.asObservable();
  private toastId = 0;

  /**
   * Mostra um toast de sucesso
   */
  success(message: string, duration: number = 3000): void {
    this.show(message, 'success', duration);
  }

  /**
   * Mostra um toast de erro
   */
  error(message: string, duration: number = 4000): void {
    this.show(message, 'error', duration);
  }

  /**
   * Mostra um toast de aviso
   */
  warning(message: string, duration: number = 3000): void {
    this.show(message, 'warning', duration);
  }

  /**
   * Mostra um toast de informação
   */
  info(message: string, duration: number = 3000): void {
    this.show(message, 'info', duration);
  }

  /**
   * Mostra um toast personalizado
   */
  private show(message: string, type: Toast['type'], duration: number): void {
    const toast: Toast = {
      id: ++this.toastId,
      message,
      type,
      duration
    };

    console.log('[TOAST SERVICE] Emitindo toast:', toast);
    this.toastSubject.next(toast);
  }
}
