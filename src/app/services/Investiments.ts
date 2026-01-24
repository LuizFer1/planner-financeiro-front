import { BaseService, ApiResponse } from './BaseService';
import {
    Investment,
    InvestmentInput,
    InvestmentUpdateInput,
    InvestmentSummary,
    FixedIncomeInvestment,
    VariableIncomeInvestment,
} from './investment.models';

export class InvestmentService extends BaseService {
    /**
     * Listar todos os investimentos
     * GET /investment
     */
    async list(): Promise<ApiResponse<Investment[]>> {
        const response = await this.fetchWithTimeout(`${this.apiUrl}/investment`, {
            method: 'GET',
            headers: this.getHeaders(),
        });

        return this.handleResponse<Investment[]>(response);
    }

    /**
     * Listar investimentos de renda fixa
     * GET /investment/renda-fixa
     */
    async getFixedIncome(): Promise<ApiResponse<FixedIncomeInvestment[]>> {
        const response = await this.fetchWithTimeout(`${this.apiUrl}/investment/renda-fixa`, {
            method: 'GET',
            headers: this.getHeaders(),
        });

        return this.handleResponse<FixedIncomeInvestment[]>(response);
    }

    /**
     * Listar investimentos de renda variável
     * GET /investment/renda-variavel
     */
    async getVariableIncome(): Promise<ApiResponse<VariableIncomeInvestment[]>> {
        const response = await this.fetchWithTimeout(`${this.apiUrl}/investment/renda-variavel`, {
            method: 'GET',
            headers: this.getHeaders(),
        });

        return this.handleResponse<VariableIncomeInvestment[]>(response);
    }

    /**
     * Obter resumo consolidado de investimentos
     * GET /investment/resumo
     */
    async getSummary(): Promise<ApiResponse<InvestmentSummary>> {
        const response = await this.fetchWithTimeout(`${this.apiUrl}/investment/resumo`, {
            method: 'GET',
            headers: this.getHeaders(),
        });

        return this.handleResponse<InvestmentSummary>(response);
    }

    /**
     * Criar investimento
     * POST /investment
     */
    async create(data: InvestmentInput): Promise<ApiResponse<Investment>> {
        const sanitizedData = this.sanitizeData(data);
        
        const response = await this.fetchWithTimeout(`${this.apiUrl}/investment`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify(sanitizedData),
        });

        return this.handleResponse<Investment>(response);
    }

    /**
     * Detalhes de um investimento
     * GET /investment/{uuid}
     */
    async get(uuid: string): Promise<ApiResponse<Investment>> {
        const response = await this.fetchWithTimeout(`${this.apiUrl}/investment/${uuid}`, {
            method: 'GET',
            headers: this.getHeaders(),
        });

        return this.handleResponse<Investment>(response);
    }

    /**
     * Atualizar investimento
     * PUT /investment/{uuid}
     */
    async update(uuid: string, data: InvestmentUpdateInput): Promise<ApiResponse<Investment>> {
        const sanitizedData = this.sanitizeData(data);
        
        const response = await this.fetchWithTimeout(`${this.apiUrl}/investment/${uuid}`, {
            method: 'PUT',
            headers: this.getHeaders(),
            body: JSON.stringify(sanitizedData),
        });

        return this.handleResponse<Investment>(response);
    }

    /**
     * Remover investimento (soft delete)
     * DELETE /investment/{uuid}
     */
    async delete(uuid: string): Promise<ApiResponse<null>> {
        const response = await this.fetchWithTimeout(`${this.apiUrl}/investment/${uuid}`, {
            method: 'DELETE',
            headers: this.getHeaders(),
        });

        return this.handleResponse<null>(response);
    }

    /**
     * Calcular lucro estimado de um investimento
     */
    calculateProfit(investment: Investment): number {
        if (investment.investment_type === 'rendafixa') {
            // Renda Fixa: Lucro = amount * (yield_rate / 100) * (dias / 365)
            const purchaseDate = new Date(investment.purchase_date);
            const today = new Date();
            const daysElapsed = Math.floor(
                (today.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24)
            );
            return (investment.amount * (investment.yield_rate! / 100) * (daysElapsed / 365)) || 0;
        } else if (investment.investment_type === 'rendavariavel') {
            // Renda Variável: Lucro = (currentValue - amount) ou (preço_atual - unit_price) * quantity
            return (investment.currentValue || 0) - investment.amount;
        }
        return 0;
    }

    /**
     * Calcular percentual de lucro de um investimento
     */
    calculateProfitPercent(investment: Investment): number {
        const profit = this.calculateProfit(investment);
        return investment.amount > 0 ? (profit / investment.amount) * 100 : 0;
    }

    /**
     * Filtrar e retornar apenas "Reserva de Emergência"
     */
    getEmergencyReserve(investments: Investment[]): Investment | undefined {
        return investments.find(
            (inv) => inv.investment_type === 'rendafixa' && inv.name === 'Reserva de Emergência'
        );
    }

    /**
     * Obter investimentos de renda fixa excluindo "Reserva de Emergência"
     */
    getOtherFixedIncome(investments: Investment[]): Investment[] {
        return investments.filter(
            (inv) => inv.investment_type === 'rendafixa' && inv.name !== 'Reserva de Emergência'
        );
    }
}

export const investmentService = new InvestmentService();
