import { BaseService, ApiResponse } from './BaseService';
import {
    Investment,
    InvestmentApiResponse,
    InvestmentInput,
    InvestmentUpdateInput,
    InvestmentSummary,
    FixedIncomeInvestment,
    VariableIncomeInvestment,
} from './investment.models';

export class InvestmentService extends BaseService {
    /**
     * Normalizar dados do investimento da API para o formato do frontend
     */
    private normalizeInvestment(apiData: InvestmentApiResponse): Investment {
        const investment: Investment = {
            id: apiData.id,
            uuid: apiData.uuid,
            user_uuid: apiData.user_uuid,
            amount: typeof apiData.amount === 'string' ? parseFloat(apiData.amount) : apiData.amount,
            investment_type: apiData.investment_type,
            description: apiData.description,
            purchase_date: apiData.purchase_date,
            sale_date: apiData.sale_date,
            created_at: apiData.created_at,
            updated_at: apiData.updated_at,
            fixed_income: apiData.fixed_income
                ? {
                    id: apiData.fixed_income.id,
                    uuid: apiData.fixed_income.uuid,
                    investment_uuid: apiData.fixed_income.investment_uuid,
                    name: apiData.fixed_income.name,
                    yield_rate: String(apiData.fixed_income.yield_rate),
                    tax_exempt: String(apiData.fixed_income.tax_exempt),
                    created_at: apiData.fixed_income.created_at,
                    updated_at: apiData.fixed_income.updated_at,
                }
                : undefined,
            variable_income: apiData.variable_income
                ? {
                    id: apiData.variable_income.id,
                    uuid: apiData.variable_income.uuid,
                    investment_uuid: apiData.variable_income.investment_uuid,
                    stock_uuid: apiData.variable_income.stock_uuid,
                    current_price:
                        (apiData.variable_income as any).current_price ??
                        (apiData.variable_income as any).stock?.current_price ??
                        '',
                    quantity: String(apiData.variable_income.quantity),
                    unit_price: String(apiData.variable_income.unit_price),
                    created_at: apiData.variable_income.created_at,
                    updated_at: apiData.variable_income.updated_at,
                    stock: (apiData.variable_income as any).stock
                        ? {
                            id: (apiData.variable_income as any).stock.id,
                            uuid: (apiData.variable_income as any).stock.uuid,
                            stock_symbol: (apiData.variable_income as any).stock.stock_symbol,
                            stock_name: (apiData.variable_income as any).stock.stock_name,
                            volume: (apiData.variable_income as any).stock.volume,
                            market_cap: (apiData.variable_income as any).stock.market_cap,
                            logo: (apiData.variable_income as any).stock.logo,
                            market: (apiData.variable_income as any).stock.market,
                            sector: (apiData.variable_income as any).stock.sector,
                            type: (apiData.variable_income as any).stock.type,
                            created_at: (apiData.variable_income as any).stock.created_at,
                            updated_at: (apiData.variable_income as any).stock.updated_at,
                            deleted_at: (apiData.variable_income as any).stock.deleted_at,
                        }
                        : undefined,
                }
                : undefined,
            stock_symbol: (apiData.variable_income as any)?.stock?.stock_symbol || '',
        };
        
        if (investment.investment_type === 'rendavariavel' && investment.variable_income?.current_price) {
            investment.currentValue = parseFloat(investment.variable_income.current_price) * (parseFloat(investment.variable_income.quantity) || 0);
        }
        return investment;
    }

    /**
     * Listar todos os investimentos
     * GET /investment
     */
    async list(): Promise<ApiResponse<Investment[]>> {
        const response = await this.fetchWithTimeout(`${this.apiUrl}/investment`, {
            method: 'GET',
            headers: this.getHeaders(),
        });

        const apiResponse = await this.handleResponse<InvestmentApiResponse[]>(response);
        
        if (apiResponse.status === 'success' && apiResponse.data) {
            return {
                ...apiResponse,
                data: apiResponse.data.map(inv => this.normalizeInvestment(inv)),
            };
        }

        return apiResponse as ApiResponse<Investment[]>;
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
            const yieldRate = Number(investment.fixed_income?.yield_rate) || 0;
            return (Number(investment.amount) * (yieldRate / 100) * (daysElapsed / 365)) || 0;
        } else if (investment.investment_type === 'rendavariavel') {
            // Renda Variável: Lucro = (currentValue - amount)
            return (Number(investment.currentValue) || 0) - Number(investment.amount);
        }
        return 0;
    }

    /**
     * Calcular percentual de lucro de um investimento
     */
    calculateProfitPercent(investment: Investment): number {
        const profit = this.calculateProfit(investment);
        return Number(investment.amount) > 0 ? (profit / Number(investment.amount)) * 100 : 0;
    }

    /**
     * Filtrar e retornar apenas "Reserva de Emergência"
     */
    getEmergencyReserve(investments: Investment[]): Investment | undefined {
        return investments.find(
            (inv) => inv.investment_type === 'rendafixa' && 
                inv.fixed_income?.name?.toLowerCase().includes('reserva de emergencia') ||
                inv.fixed_income?.name?.toLowerCase().includes('reserva de emergência')
        );
    }

    /**
     * Obter investimentos de renda fixa excluindo "Reserva de Emergência"
     */
    getOtherFixedIncome(investments: Investment[]): Investment[] {
        return investments.filter(
            (inv) => inv.investment_type === 'rendafixa' && 
                !inv.fixed_income?.name?.toLowerCase().includes('reserva de emergencia') &&
                !inv.fixed_income?.name?.toLowerCase().includes('reserva de emergência')
        );
    }
}

export const investmentService = new InvestmentService();
