import { BaseService, ApiResponse } from './BaseService';
import { TransactionData, Transaction } from './Revenue';

export class InvestmentService extends BaseService {
    /**
     * Listar investimentos
     * GET /investment
     */
    async list(): Promise<ApiResponse<Transaction[]>> {
        const response = await this.fetchWithTimeout(`${this.apiUrl}/investment`, {
            method: 'GET',
            headers: this.getHeaders(),
        });

        return this.handleResponse<Transaction[]>(response);
    }

    /**
     * Criar investimento
     * POST /investment
     */
    async create(data: TransactionData): Promise<ApiResponse<Transaction>> {
        const response = await this.fetchWithTimeout(`${this.apiUrl}/investment`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify(data),
        });

        return this.handleResponse<Transaction>(response);
    }

    /**
     * Detalhes de um investimento
     * GET /investment/{uuid}
     */
    async get(uuid: string): Promise<ApiResponse<Transaction>> {
        const response = await this.fetchWithTimeout(`${this.apiUrl}/investment/${uuid}`, {
            method: 'GET',
            headers: this.getHeaders(),
        });

        return this.handleResponse<Transaction>(response);
    }

    /**
     * Atualizar investimento
     * PUT /investment/{uuid}
     */
    async update(uuid: string, data: TransactionData): Promise<ApiResponse<Transaction>> {
        const response = await this.fetchWithTimeout(`${this.apiUrl}/investment/${uuid}`, {
            method: 'PUT',
            headers: this.getHeaders(),
            body: JSON.stringify(data),
        });

        return this.handleResponse<Transaction>(response);
    }

    /**
     * Remover investimento
     * DELETE /investment/{uuid}
     */
    async delete(uuid: string): Promise<ApiResponse<null>> {
        const response = await this.fetchWithTimeout(`${this.apiUrl}/investment/${uuid}`, {
            method: 'DELETE',
            headers: this.getHeaders(),
        });

        return this.handleResponse<null>(response);
    }
}

export const investmentService = new InvestmentService();
