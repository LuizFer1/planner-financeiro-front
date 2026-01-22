import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-error-message',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="error-container">
      <div class="error-content">
        <i class="fa-solid fa-circle-exclamation error-icon"></i>
        <h3 class="error-title">{{ title }}</h3>
        <p class="error-message">{{ message }}</p>
        <button class="retry-btn" *ngIf="showRetry" (click)="onRetry()">
          <i class="fa-solid fa-rotate-right"></i> Tentar Novamente
        </button>
      </div>
    </div>
  `,
  styles: [`
    .error-container {
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 60px 20px;
    }

    .error-content {
      text-align: center;
      max-width: 400px;
    }

    .error-icon {
      font-size: 48px;
      color: #e74c3c;
      margin-bottom: 16px;
    }

    .error-title {
      font-size: 20px;
      font-weight: 700;
      color: #1a1a1a;
      margin: 0 0 8px 0;
    }

    .error-message {
      font-size: 14px;
      color: #6c757d;
      margin: 0 0 24px 0;
      line-height: 1.6;
    }

    .retry-btn {
      background: linear-gradient(135deg, #0066cc 0%, #0052a3 100%);
      color: #FFFFFF;
      border: none;
      padding: 12px 24px;
      border-radius: 12px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      box-shadow: 0 4px 12px rgba(0, 102, 204, 0.3);
      display: inline-flex;
      align-items: center;
      gap: 8px;
    }

    .retry-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(0, 102, 204, 0.4);
    }

    .retry-btn:active {
      transform: translateY(0);
    }
  `]
})
export class ErrorMessageComponent {
  @Input() title: string = 'Erro ao carregar dados';
  @Input() message: string = 'Ocorreu um erro ao carregar as informações. Por favor, tente novamente.';
  @Input() showRetry: boolean = true;
  @Output() retry = new EventEmitter<void>();

  onRetry(): void {
    this.retry.emit();
  }
}
