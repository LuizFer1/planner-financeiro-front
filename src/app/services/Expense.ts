import { BaseService, ApiResponse } from './BaseService';
import { TransactionData, Transaction } from './Revenue';

export class ExpenseService extends BaseService {
    /**
     * Listar despesas
     * GET /expense
     */
    async list(): Promise<ApiResponse<Transaction[]>> {
        const response = await this.fetchWithTimeout(`${this.apiUrl}/expense`, {
            method: 'GET',
            headers: this.getHeaders(),
        });

        console.log(response)
        return this.handleResponse<Transaction[]>(response);
    }

    /**
     * Criar despesa
     * POST /expense
     */
    async create(data: TransactionData): Promise<ApiResponse<Transaction>> {
        const response = await this.fetchWithTimeout(`${this.apiUrl}/expense`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify(data),
        });

        return this.handleResponse<Transaction>(response);
    }

    /**
     * Detalhes de uma despesa
     * GET /expense/{uuid}
     */
    async get(uuid: string): Promise<ApiResponse<Transaction>> {
        const response = await this.fetchWithTimeout(`${this.apiUrl}/expense/${uuid}`, {
            method: 'GET',
            headers: this.getHeaders(),
        });

        return this.handleResponse<Transaction>(response);
    }

    /**
     * Atualizar despesa
     * PUT /expense/{uuid}
     */
    async update(uuid: string, data: TransactionData): Promise<ApiResponse<Transaction>> {
        const response = await this.fetchWithTimeout(`${this.apiUrl}/expense/${uuid}`, {
            method: 'PUT',
            headers: this.getHeaders(),
            body: JSON.stringify(data),
        });

        return this.handleResponse<Transaction>(response);
    }

    /**
     * Remover despesa
     * DELETE /expense/{uuid}
     */
    async delete(uuid: string): Promise<ApiResponse<null>> {
        const response = await this.fetchWithTimeout(`${this.apiUrl}/expense/${uuid}`, {
            method: 'DELETE',
            headers: this.getHeaders(),
        });

        return this.handleResponse<null>(response);
    }
}

export const expenseService = new ExpenseService();
