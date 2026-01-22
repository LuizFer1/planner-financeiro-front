import { Component, OnInit, ViewChild, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SidebarComponent } from '../shared/components/sidebar/sidebar';
import { LoadingSpinnerComponent } from '../shared/components/loading-spinner/loading-spinner';
import { ErrorMessageComponent } from '../shared/components/error-message/error-message';
import { EmptyStateComponent } from '../shared/components/empty-state/empty-state';
import { TransactionModalComponent } from '../shared/components/transaction-modal/transaction-modal';
import { authService } from '../services/Auth';
import { revenueService } from '../services/Revenue';
import { expenseService } from '../services/Expense';
import { investmentService } from '../services/Investiments';
import type { Transaction } from '../services/Revenue';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, SidebarComponent, LoadingSpinnerComponent, ErrorMessageComponent, EmptyStateComponent, TransactionModalComponent],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class DashboardComponent implements OnInit {
  @ViewChild(TransactionModalComponent) transactionModal!: TransactionModalComponent;

  isLoading = false;
  hasError = false;
  errorMessage = '';
  developmentMessage = '';

  balance = 0;
  received = 0;
  spent = 0;
  invested = 0;

  expenseCategories: any[] = [];

  transactions: any[] = [];

  constructor(
    private router: Router,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone
  ) {}

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  }

  ngOnInit(): void {
    // Verificar se há mensagem de desenvolvimento vinda do guard
    const navigation = this.router.getCurrentNavigation();
    if (navigation?.extras?.state?.['message']) {
      this.developmentMessage = navigation.extras.state['message'];
      // Limpar mensagem após 5 segundos
      setTimeout(() => {
        this.developmentMessage = '';
        this.cdr.detectChanges();
      }, 5000);
    }
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    this.isLoading = true;
    this.hasError = false;
    this.errorMessage = '';

    Promise.allSettled([
      revenueService.list(),
      expenseService.list(),
      investmentService.list()
    ])
      .then(([revenuesResult, expensesResult, investmentsResult]) => {
        this.ngZone.run(() => {
          try {
            const revenuesResponse = revenuesResult.status === 'fulfilled' ? revenuesResult.value : null;
            const expensesResponse = expensesResult.status === 'fulfilled' ? expensesResult.value : null;
            const investmentsResponse = investmentsResult.status === 'fulfilled' ? investmentsResult.value : null;

            this.received = revenuesResponse?.data ? revenuesResponse.data.reduce((sum: number, t: any) => sum + t.amount, 0) : 0;
            this.spent = expensesResponse?.data ? expensesResponse.data.reduce((sum: number, t: any) => sum + t.amount, 0) : 0;
            this.invested = investmentsResponse?.data ? investmentsResponse.data.reduce((sum: number, t: any) => sum + t.amount, 0) : 0;
            this.balance = this.received - this.spent;

            const allTransactions = [
              ...(revenuesResponse?.data?.slice(0, 3) || []),
              ...(expensesResponse?.data?.slice(0, 3) || [])
            ].sort((a: any, b: any) => 
              new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime()
            );
            
            this.transactions = allTransactions.slice(0, 5);
            
            if (revenuesResult.status === 'rejected' || expensesResult.status === 'rejected' || investmentsResult.status === 'rejected') {
              this.hasError = true;
              this.errorMessage = 'Alguns dados não puderam ser carregados';
            }
          } catch (error) {
            this.hasError = true;
            this.errorMessage = 'Erro ao processar dados do dashboard';
            console.error('Erro ao processar dados:', error);
          } finally {
            this.isLoading = false;
            this.cdr.detectChanges();
          }
        });
      })
      .catch(error => {
        this.ngZone.run(() => {
          this.hasError = true;
          this.errorMessage = 'Erro ao carregar dados do dashboard';
          this.isLoading = false;
          console.error('Erro:', error);
          this.cdr.detectChanges();
        });
      });
  }

  retryLoad(): void {
    this.loadDashboardData();
  }

  addTransaction(): void {
    this.transactionModal.open('revenue');
  }

  onTransactionSuccess(): void {
    this.loadDashboardData();
  }

  logout(): void {
    authService.logout()
      .then(() => {
        this.router.navigate(['/login']);
      })
      .catch(error => {
        console.error('Erro ao fazer logout:', error);
        this.router.navigate(['/login']);
      });
  }
}
