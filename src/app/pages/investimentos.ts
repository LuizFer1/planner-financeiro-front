import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { SidebarComponent } from '../shared/components/sidebar/sidebar';
import { InvestmentModalComponent } from '../shared/components/investment-modal/investment-modal';
import { LoadingSpinnerComponent } from '../shared/components/loading-spinner/loading-spinner';
import { EmptyStateComponent } from '../shared/components/empty-state/empty-state';
import { ErrorMessageComponent } from '../shared/components/error-message/error-message';
import { authService } from '../services/Auth';
import { investmentService } from '../services/Investiments';
import { toastService } from '../services/Toast';
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
})
export class InvestimentosComponent implements OnInit {
    @ViewChild(InvestmentModalComponent) investmentModal!: InvestmentModalComponent;

    investments: Investment[] = [];
    summary?: InvestmentSummary;
    isLoading = false;
    errorMessage = '';

    constructor(private router: Router) {}

    ngOnInit(): void {
        this.loadInvestments();
    }

    /**
     * Carregar todos os investimentos e resumo
     */
    loadInvestments(): void {
        this.isLoading = true;
        this.errorMessage = '';

        Promise.all([investmentService.list(), investmentService.getSummary()])
            .then(([investmentsResponse, summaryResponse]) => {
                this.investments = (investmentsResponse.data || []).map((inv) => ({
                    ...inv,
                    currentValue: this.calculateCurrentValue(inv),
                    profit: investmentService.calculateProfit(inv),
                    profitPercent: investmentService.calculateProfitPercent(inv),
                }));
                this.summary = summaryResponse.data;
            })
            .catch((error) => {
                console.error('Erro ao carregar investimentos:', error);
                this.errorMessage = 'Erro ao carregar investimentos. Tente novamente.';
            })
            .finally(() => {
                this.isLoading = false;
            });
    }

    /**
     * Calcular valor atual de um investimento
     */
    private calculateCurrentValue(investment: Investment): number {
        if (investment.investment_type === 'rendafixa') {
            // Renda fixa: valor atual = valor investido + rendimento
            const profit = investmentService.calculateProfit(investment);
            return investment.amount + profit;
        } else {
            // Renda variável: usar currentValue da API ou calcular a partir do preço
            return investment.currentValue || investment.amount;
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
    private calculateCategoryTotal(
        investments: Investment[]
    ): {
        invested: number;
        current: number;
        profit: number;
        profitPercent: number;
    } {
        const invested = investments.reduce((sum, inv) => sum + inv.amount, 0);
        const current = investments.reduce(
            (sum, inv) => sum + (inv.currentValue || inv.amount),
            0
        );
        const profit = current - invested;
        const profitPercent = invested > 0 ? (profit / invested) * 100 : 0;

        return { invested, current, profit, profitPercent };
    }

    /**
     * Abrir modal para novo investimento de renda fixa
     */
    openNewFixedIncome(): void {
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
        const confirmDelete = confirm(
            `Tem certeza que deseja remover "${investment.name || 'este investimento'}"?`
        );

        if (!confirmDelete) {
            return;
        }

        investmentService
            .delete(investment.uuid)
            .then((response) => {
                if (response.status) {
                    toastService.success('Investimento removido com sucesso!');
                    this.loadInvestments();
                } else {
                    toastService.error(response.message || 'Erro ao remover investimento');
                }
            })
            .catch((error) => {
                console.error('Erro ao deletar investimento:', error);
                toastService.error('Erro ao remover investimento');
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
