import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="empty-state-container">
      <div class="empty-state-content">
        <i [class]="icon + ' empty-icon'"></i>
        <h3 class="empty-title">{{ title }}</h3>
        <p class="empty-message">{{ message }}</p>

        <button class="action-btn" *ngIf="actionLabel" (click)="handleAction()">
          <i class="fa-solid fa-plus"></i> {{ actionLabel }}
        </button>
      </div>
    </div>
  `,
  styles: [
    `
      .empty-state-container {
        display: flex;
        justify-content: center;
        align-items: center;
        padding: 80px 20px;
      }
      .empty-state-content {
        text-align: center;
        max-width: 400px;
      }
      .empty-icon {
        font-size: 64px;
        color: #e8ecf1;
        margin-bottom: 24px;
      }
      .empty-title {
        font-size: 20px;
        font-weight: 700;
        color: #1a1a1a;
        margin: 0 0 8px 0;
      }
      .empty-message {
        font-size: 14px;
        color: #6c757d;
        margin: 0 0 24px 0;
        line-height: 1.6;
      }
      .action-btn {
        background: linear-gradient(135deg, #0066cc 0%, #0052a3 100%);
        color: #ffffff;
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
      .action-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 16px rgba(0, 102, 204, 0.4);
      }
      .action-btn:active {
        transform: translateY(0);
      }
    `,
  ],
})
export class EmptyStateComponent {
  @Input() icon = 'fa-solid fa-inbox';
  @Input() title = 'Nenhum dado encontrado';
  @Input() message = 'Não há informações para exibir no momento.';
  @Input() actionLabel = '';

  @Output() onAction = new EventEmitter<void>(); // 🔥 ESSENCIAL

  handleAction(): void {
    this.onAction.emit();
  }
}
