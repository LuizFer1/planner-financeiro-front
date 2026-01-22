import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { SidebarComponent } from '../shared/components/sidebar/sidebar';
import { TransactionModalComponent } from '../shared/components/transaction-modal/transaction-modal';
import { authService } from '../services/Auth';
import { investmentService } from '../services/Investiments';
import type { Transaction } from '../services/Revenue';

interface Investment {
  id: number;
  name: string;
  type: string;
  amount: number;
  currentValue: number;
  profit: number;
  profitPercent: number;
}

@Component({
  selector: 'app-investimentos',
  standalone: true,
  imports: [CommonModule, RouterModule, SidebarComponent, TransactionModalComponent],
  templateUrl: './investimentos.html',
  styleUrl: './investimentos.css'
})
export class InvestimentosComponent implements OnInit {
  @ViewChild(TransactionModalComponent) transactionModal!: TransactionModalComponent;
  investments: Transaction[] = [];
  isLoading = false;
  errorMessage = '';

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.loadInvestments();
  }

  loadInvestments(): void {
    this.isLoading = true;
    this.errorMessage = '';

    investmentService.list()
      .then(response => {
        this.investments = (response.data || []).map((inv: any) => ({
          uuid: inv.uuid,
          amount: parseFloat(inv.amount || '0'),
          category_uuid: inv.category_uuid,
          description: inv.description,
          transaction_date: inv.transaction_date,
          created_at: inv.created_at,
          updated_at: inv.updated_at,
          // Campos adicionais para exibição
          name: inv.description || 'Investimento',
          type: 'investment',
          currentValue: parseFloat(inv.amount || '0'),
          profit: 0,
          profitPercent: 0
        }));
      })
      .catch(error => {
        this.errorMessage = 'Erro ao carregar investimentos';
      })
      .finally(() => {
        this.isLoading = false;
      });
  }

  get totalInvested() {
    return this.investments.reduce((sum, inv) => sum + inv.amount, 0);
  }

  get totalCurrentValue() {
    // Como a API não retorna valor atual, usar o valor investido
    return this.totalInvested;
  }

  get totalProfit() {
    return 0; // Calculado quando tiver integração com preços
  }

  get totalProfitPercent() {
    return 0; // Calculado quando tiver integração com preços
  }

  get investmentsByType() {
    // Agrupar por categoria ou descrição
    interface GroupedInvestment {
      [key: string]: { type: string; total: number; count: number };
    }
    
    const grouped: GroupedInvestment = this.investments.reduce((acc: GroupedInvestment, inv) => {
      const type = inv.description || inv.category_uuid || 'Outros';
      if (!acc[type]) {
        acc[type] = { type, total: 0, count: 0 };
      }
      acc[type].total += inv.amount;
      acc[type].count += 1;
      return acc;
    }, {});
    
    return Object.values(grouped);
  }

  addInvestment() {
    this.transactionModal.open('revenue');
  }

  onTransactionSuccess(): void {
    this.loadInvestments();
  }

  editInvestment(investment: Transaction) {
    // TODO: Implementar edição em modal separado
  }

  deleteInvestment(investment: Transaction) {
    if (!confirm('Tem certeza que deseja deletar este investimento?')) {
      return;
    }

    investmentService.delete(investment.uuid)
      .then(() => {
        this.loadInvestments();
      })
      .catch(() => {
        this.errorMessage = 'Erro ao deletar investimento';
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
