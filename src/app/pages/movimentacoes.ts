import { Component, OnInit, ViewChild, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { SidebarComponent } from '../shared/components/sidebar/sidebar';
import { LoadingSpinnerComponent } from '../shared/components/loading-spinner/loading-spinner';
import { TransactionModalComponent } from '../shared/components/transaction-modal/transaction-modal';
import { authService } from '../services/Auth';
import { revenueService } from '../services/Revenue';
import { expenseService } from '../services/Expense';
import type { Transaction } from '../services/Revenue';

interface DisplayTransaction extends Transaction {
  type: 'income' | 'expense';
}

@Component({
  selector: 'app-movimentacoes',
  standalone: true,
  imports: [CommonModule, RouterModule, SidebarComponent, LoadingSpinnerComponent, TransactionModalComponent],
  templateUrl: './movimentacoes.html',
  styleUrl: './movimentacoes.css'
})
export class MovimentacoesComponent implements OnInit {
  @ViewChild(TransactionModalComponent) transactionModal!: TransactionModalComponent;

  transactions: DisplayTransaction[] = [];
  isLoading = false;
  errorMessage = '';

  filterType: 'all' | 'income' | 'expense' = 'all';
  searchTerm: string = '';

  constructor(
    private router: Router,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone
  ) {}

  formatCurrency(value: number | string): string {
    // Garante que sempre seja um número válido, mesmo se vier como string
    // Remove pontos de milhar e troca vírgulas por pontos antes de converter
    let numValue = 0;
    
    if (typeof value === 'string') {
      // Remove espaços e símbolos de moeda
      const cleanValue = value.replace(/[^\d,.-]/g, '');
      // Se tiver vírgula, assume formato BR (1.234,56) e converte para formato US (1234.56)
      if (cleanValue.includes(',')) {
        numValue = parseFloat(cleanValue.replace(/\./g, '').replace(',', '.')) || 0;
      } else {
        numValue = parseFloat(cleanValue) || 0;
      }
    } else {
      numValue = parseFloat(String(value)) || 0;
    }
    
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(numValue);
  }

  ngOnInit(): void {
    this.loadTransactions();
  }

  loadTransactions(): void {
    this.isLoading = true;
    this.errorMessage = '';

    Promise.all([
      revenueService.list(),
      expenseService.list()
    ])
      .then(([revenuesResponse, expensesResponse]) => {
        this.ngZone.run(() => {
          // Verifica se os dados estão no formato correto
          const revenuesData = Array.isArray(revenuesResponse?.data) 
            ? revenuesResponse.data 
            : Array.isArray(revenuesResponse) 
              ? revenuesResponse 
              : [];

          const expensesData = Array.isArray(expensesResponse?.data) 
            ? expensesResponse.data 
            : Array.isArray(expensesResponse) 
              ? expensesResponse 
              : [];

          const revenues: DisplayTransaction[] = revenuesData.map((t: Transaction) => ({
            ...t,
            type: 'income' as const,
            date: new Date(t.transaction_date).toLocaleDateString('pt-BR'),
            category: 'Receita'
          }));

          const expenses: DisplayTransaction[] = expensesData.map((t: Transaction) => ({
            ...t,
            type: 'expense' as const,
            date: new Date(t.transaction_date).toLocaleDateString('pt-BR'),
            category: 'Despesa'
          }));

          this.transactions = [...revenues, ...expenses].sort((a, b) => 
            new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime()
          );

          this.cdr.detectChanges();
        });
      })
      .catch(error => {
        this.ngZone.run(() => {
          this.errorMessage = 'Erro ao carregar movimentações';
          this.cdr.detectChanges();
        });
      })
      .finally(() => {
        this.ngZone.run(() => {
          this.isLoading = false;
          this.cdr.detectChanges();
        });
      });
  }

  get filteredTransactions() {
    let filtered = this.transactions;
    
    if (this.filterType !== 'all') {
      filtered = filtered.filter(t => t.type === this.filterType);
    }
    
    if (this.searchTerm) {
      filtered = filtered.filter(t => 
        (t.description?.toLowerCase() || '').includes(this.searchTerm.toLowerCase()) ||
        (t.category_uuid?.toLowerCase() || '').includes(this.searchTerm.toLowerCase())
      );
    }
    
    return filtered;
  }

  get totalIncome() {
    return this.transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + parseFloat(String(t.amount || 0)), 0);
  }

  get totalExpense() {
    return this.transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + parseFloat(String(t.amount || 0)), 0);
  }

  get balance() {
    return this.totalIncome - this.totalExpense;
  }

  addTransaction() {
    this.transactionModal.open('revenue');
  }

  onTransactionSuccess(): void {
    this.loadTransactions();
  }

  editTransaction(transaction: DisplayTransaction) {
    // TODO: Implementar edição em modal separado
  }

  deleteTransaction(transaction: DisplayTransaction) {
    if (!confirm('Tem certeza que deseja deletar esta movimentação?')) {
      return;
    }

    const service = transaction.type === 'income' ? revenueService : expenseService;
    
    service.delete(transaction.uuid)
      .then(() => {
        this.loadTransactions();
      })
      .catch(() => {
        this.errorMessage = 'Erro ao deletar movimentação';
      });
  }

  logout() {
    authService.logout()
      .then(() => {
        this.router.navigate(['/login']);
      })
      .catch(() => {
        this.router.navigate(['/login']);
      });
  }
}
