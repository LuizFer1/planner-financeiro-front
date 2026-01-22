import { BaseService, ApiResponse } from './BaseService';

// Interfaces
export interface TransactionData {
    amount: number;
    category_uuid: string;
    description?: string;
    transaction_date?: string;
}

export interface Transaction {
    uuid: string;
    amount: number;
    category_uuid: string;
    description?: string;
    transaction_date: string;
    created_at: string;
    updated_at: string;
    type?: string;
    name?: string;
    currentValue?: number;
    profit?: number;
    profitPercent?: number;
    category?: string;
    date?: string;
    count?: number;
    total?: number;
}

export class RevenueService extends BaseService {
    /**
     * Listar receitas
     * GET /revenue
     */
    async list(): Promise<ApiResponse<Transaction[]>> {
        const response = await this.fetchWithTimeout(`${this.apiUrl}/revenue`, {
            method: 'GET',
            headers: this.getHeaders(),
        });
        console.log(response)
        return this.handleResponse<Transaction[]>(response);
    }

    /**
     * Criar receita
     * POST /revenue
     */
    async create(data: TransactionData): Promise<ApiResponse<Transaction>> {
        const response = await this.fetchWithTimeout(`${this.apiUrl}/revenue`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify(data),
        });

        return this.handleResponse<Transaction>(response);
    }

    /**
     * Detalhes de uma receita
     * GET /revenue/{uuid}
     */
    async get(uuid: string): Promise<ApiResponse<Transaction>> {
        const response = await this.fetchWithTimeout(`${this.apiUrl}/revenue/${uuid}`, {
            method: 'GET',
            headers: this.getHeaders(),
        });

        return this.handleResponse<Transaction>(response);
    }

    /**
     * Atualizar receita
     * PUT /revenue/{uuid}
     */
    async update(uuid: string, data: TransactionData): Promise<ApiResponse<Transaction>> {
        const response = await this.fetchWithTimeout(`${this.apiUrl}/revenue/${uuid}`, {
            method: 'PUT',
            headers: this.getHeaders(),
            body: JSON.stringify(data),
        });

        return this.handleResponse<Transaction>(response);
    }

    /**
     * Remover receita
     * DELETE /revenue/{uuid}
     */
    async delete(uuid: string): Promise<ApiResponse<null>> {
        const response = await this.fetchWithTimeout(`${this.apiUrl}/revenue/${uuid}`, {
            method: 'DELETE',
            headers: this.getHeaders(),
        });

        return this.handleResponse<null>(response);
    }
}

export const revenueService = new RevenueService();
