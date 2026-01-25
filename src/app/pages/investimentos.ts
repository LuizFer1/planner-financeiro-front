import {
  Component,
  OnInit,
  ViewChild,
  ChangeDetectorRef,
  ChangeDetectionStrategy,
  NgZone,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { SidebarComponent } from '../shared/components/sidebar/sidebar';
import { InvestmentModalComponent } from '../shared/components/investment-modal/investment-modal';
import { LoadingSpinnerComponent } from '../shared/components/loading-spinner/loading-spinner';
import { EmptyStateComponent } from '../shared/components/empty-state/empty-state';
import { ErrorMessageComponent } from '../shared/components/error-message/error-message';
import { authService } from '../services/Auth';
import { investmentService } from '../services/Investiments';
import { ToastService } from '../services/Toast';
import {
  Investment,
  InvestmentType,
  InvestmentSummary,
  InvestmentCategory,
} from '../services/investment.models';

@Component({
  selector: 'app-investimentos',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    SidebarComponent,
    InvestmentModalComponent,
    LoadingSpinnerComponent,
    EmptyStateComponent,
    ErrorMessageComponent,
  ],
  templateUrl: './investimentos.html',
  styleUrl: './investimentos.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InvestimentosComponent implements OnInit {
  @ViewChild(InvestmentModalComponent) investmentModal!: InvestmentModalComponent;

  investments: Investment[] = [];
  summary?: InvestmentSummary;
  isLoading = false;
  errorMessage = '';

  constructor(
    private router: Router,
    private toastService: ToastService,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone,
  ) {}

  ngOnInit(): void {
    this.loadInvestments();
  }

  /**
   * Carregar todos os investimentos e resumo
   */
  loadInvestments(): void {
    this.errorMessage = '';
    this.isLoading = true;
    this.cdr.markForCheck();

    console.log('Loading investments...');
    investmentService
      .list()
      .then(async (investmentsResponse) => {
        this.ngZone.run(async () => {
          if (investmentsResponse.status !== 'success') {
            this.investments = [];
            this.summary = undefined;
            this.isLoading = false;
            this.cdr.markForCheck();
            return;
          }
          const data = investmentsResponse.data ?? [];
          const updatedInvestments = await Promise.all(
            data.map(async (inv) => {
              if (inv.investment_type === 'rendavariavel' && inv.variable_income?.stock_uuid) {
                try {
                  const variableIncome = inv.variable_income;
                  const stock = await import('../services/Market').then((m) =>
                    m.marketService.get(variableIncome.stock_uuid),
                  );
                  const currentPrice = parseFloat(stock.data?.current_price || '0');
                  const quantity = parseFloat(variableIncome?.quantity || '0');
                  const amount = parseFloat(String(inv.amount || '0'));
                  const valorAtual = inv.currentValue ?? (currentPrice * quantity);
                  const profit = valorAtual - amount;
                  const profitPercent = amount > 0 ? (profit / amount) * 100 : 0;
                  return {
                    ...inv,
                    stock_symbol: stock.data?.stock_symbol,
                    currentValue: valorAtual,
                    profit,
                    profitPercent,
                  };
                } catch (e) {
                  return {
                    ...inv,
                    profit: investmentService.calculateProfit(inv),
                    profitPercent: investmentService.calculateProfitPercent(inv),
                  };
                }
              } else {
                return {
                  ...inv,
                  currentValue: this.calculateCurrentValue(inv),
                  profit: investmentService.calculateProfit(inv),
                  profitPercent: investmentService.calculateProfitPercent(inv),
                };
              }
            }),
          );
          this.investments = updatedInvestments;
          this.isLoading = false;
          this.cdr.markForCheck();
        });
      })
      .catch((error) => {
        this.ngZone.run(() => {
          console.error('Erro ao carregar investimentos:', error);
          this.errorMessage = error?.message || 'Erro ao carregar investimentos. Tente novamente.';
          this.isLoading = false;
          this.cdr.markForCheck();
          if (error?.status === 401) {
            this.router.navigate(['/login']);
          }
        });
      });
  }

  /**
   * Calcular valor atual de um investimento
   */
  private calculateCurrentValue(investment: Investment): number {
    if (investment.investment_type === 'rendafixa') {
      const profit = investmentService.calculateProfit(investment);
      return Number(investment.amount) + profit;
    } else {
      return Number(investment.currentValue) || Number(investment.amount);
    }
  }

  /**
   * Obter investimentos de renda fixa agrupados
   */
  get fixedIncomeInvestments(): Investment[] {
    return this.investments.filter((inv) => inv.investment_type === 'rendafixa');
  }

  /**
   * Obter "Reserva de Emergência"
   */
  get emergencyReserve(): Investment | undefined {
    return investmentService.getEmergencyReserve(this.investments);
  }

  /**
   * Obter outros investimentos de renda fixa (sem Reserva de Emergência)
   */
  get otherFixedIncomeInvestments(): Investment[] {
    return investmentService.getOtherFixedIncome(this.investments);
  }

  /**
   * Obter investimentos de renda variável
   */
  get variableIncomeInvestments(): Investment[] {
    return this.investments.filter((inv) => inv.investment_type === 'rendavariavel');
  }

  /**
   * Calcular total de investimentos de renda fixa
   */
  get fixedIncomeTotal(): {
    invested: number;
    current: number;
    profit: number;
    profitPercent: number;
  } {
    return this.calculateCategoryTotal(this.fixedIncomeInvestments);
  }

  /**
   * Calcular total de investimentos de renda variável
   */
  get variableIncomeTotal(): {
    invested: number;
    current: number;
    profit: number;
    profitPercent: number;
  } {
    return this.calculateCategoryTotal(this.variableIncomeInvestments);
  }

  /**
   * Calcular total de uma categoria de investimentos
   */
  private calculateCategoryTotal(investments: Investment[]): {
    invested: number;
    current: number;
    profit: number;
    profitPercent: number;
  } {
    const invested = investments.reduce((sum, inv) => sum + Number(inv.amount), 0);
    const current = investments.reduce((sum, inv) => sum + (Number(inv.currentValue) || Number(inv.amount)), 0);
    const profit = current - invested;
    const profitPercent = invested > 0 ? (profit / invested) * 100 : 0;

    return { invested, current, profit, profitPercent };
  }

  /**
   * Calcular resumo geral da carteira
   */
  get portfolioSummary(): {
    total_invested: number;
    total_current_value: number;
    total_profit: number;
    total_profit_percent: number;
  } {
    const total_invested = this.investments.reduce((sum, inv) => sum + Number(inv.amount), 0);
    const total_current_value = this.investments.reduce(
      (sum, inv) => sum + (Number(inv.currentValue) || Number(inv.amount)),
      0,
    );
    const total_profit = total_current_value - total_invested;
    const total_profit_percent = total_invested > 0 ? (total_profit / total_invested) * 100 : 0;

    return { total_invested, total_current_value, total_profit, total_profit_percent };
  }

  /**
   * Abrir modal para novo investimento de renda fixa
   */
  openNewFixedIncome(): void {
    console.log('renda fixa');
    this.investmentModal.open('rendafixa');
  }

  /**
   * Abrir modal para novo investimento de renda variável
   */
  openNewVariableIncome(): void {
    this.investmentModal.open('rendavariavel');
  }

  /**
   * Abrir modal para editar investimento
   */
  editInvestment(investment: Investment): void {
    this.investmentModal.openEdit(investment);
  }

  /**
   * Deletar investimento
   */
  deleteInvestment(investment: Investment): void {
    const nomeInvestimento = investment.fixed_income?.name || investment.variable_income?.stock_uuid || 'este investimento';
    const confirmDelete = confirm(
      `Tem certeza que deseja remover "${nomeInvestimento}"?`,
    );

    if (!confirmDelete) {
      return;
    }

    investmentService
      .delete(investment.uuid)
      .then((response) => {
        if (response.status) {
          this.toastService.success('Investimento removido com sucesso!');
          this.loadInvestments();
        } else {
          this.toastService.error(response.message || 'Erro ao remover investimento');
        }
      })
      .catch((error) => {
        console.error('Erro ao deletar investimento:', error);
        this.toastService.error('Erro ao remover investimento');
      });
  }

  /**
   * Tratamento de sucesso ao criar/editar investimento
   */
  onInvestmentSuccess(): void {
    this.loadInvestments();
  }

  /**
   * Tratamento de cancelamento do modal
   */
  onInvestmentCancel(): void {
    // Nada a fazer
  }

  /**
   * Fazer logout
   */
  logout(): void {
    authService
      .logout()
      .then(() => {
        this.router.navigate(['/login']);
      })
      .catch(() => {
        this.router.navigate(['/login']);
      });
  }

  /**
   * Formatar valor monetário
   */
  formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  }

  /**
   * Formatar percentual
   */
  formatPercent(value: number): string {
    return value.toFixed(2) + '%';
  }

  /**
   * Obter classe CSS para cor de lucro/perda
   */
  getProfitClass(profit: number): string {
    if (profit > 0) return 'profit-positive';
    if (profit < 0) return 'profit-negative';
    return 'profit-neutral';
  }
}
