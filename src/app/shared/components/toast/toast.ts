import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService, Toast } from '../../../services/Toast';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container">
      <div 
        *ngFor="let toast of toasts" 
        class="toast toast-{{toast.type}}"
      >
        <div class="toast-icon">
          <i class="fa-solid" [ngClass]="{
            'fa-check-circle': toast.type === 'success',
            'fa-exclamation-circle': toast.type === 'error',
            'fa-exclamation-triangle': toast.type === 'warning',
            'fa-info-circle': toast.type === 'info'
          }"></i>
        </div>
        <div class="toast-message">{{ toast.message }}</div>
        <button class="toast-close" (click)="removeToast(toast.id)">
          <i class="fa-solid fa-times"></i>
        </button>
      </div>
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed;
      top: 24px;
      right: 24px;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 12px;
      max-width: 400px;
    }

    .toast {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px 20px;
      border-radius: 12px;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
      backdrop-filter: blur(10px);
      animation: slideIn 0.3s ease-out;
      min-width: 320px;
    }

    @keyframes slideIn {
      from {
        transform: translateX(400px);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }

    .toast-success {
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: white;
    }

    .toast-error {
      background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
      color: white;
    }

    .toast-warning {
      background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
      color: white;
    }

    .toast-info {
      background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
      color: white;
    }

    .toast-icon {
      font-size: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .toast-message {
      flex: 1;
      font-size: 14px;
      font-weight: 500;
      line-height: 1.4;
    }

    .toast-close {
      background: transparent;
      border: none;
      color: white;
      font-size: 16px;
      cursor: pointer;
      padding: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0.8;
      transition: opacity 0.2s;
      border-radius: 4px;
    }

    .toast-close:hover {
      opacity: 1;
      background: rgba(255, 255, 255, 0.1);
    }

    @media (max-width: 768px) {
      .toast-container {
        top: 16px;
        right: 16px;
        left: 16px;
        max-width: none;
      }

      .toast {
        min-width: auto;
      }
    }
  `]
})
export class ToastComponent implements OnInit, OnDestroy {
  toasts: Toast[] = [];
  private subscription?: Subscription;

  constructor(
    private toastService: ToastService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.subscription = this.toastService.toasts$.subscribe(toast => {
      console.log('[TOAST] Novo toast recebido:', toast);
      this.toasts.push(toast);
      this.cdr.detectChanges();

      // Remove automaticamente após a duração
      if (toast.duration) {
        setTimeout(() => {
          this.removeToast(toast.id);
        }, toast.duration);
      }
    });
    console.log('[TOAST] Componente inicializado');
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
    console.log('[TOAST] Componente destruído');
  }

  removeToast(id: number): void {
    console.log('[TOAST] Removendo toast:', id);
    this.toasts = this.toasts.filter(t => t.id !== id);
    this.cdr.detectChanges();
  }
}
