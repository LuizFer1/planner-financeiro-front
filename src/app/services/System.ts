import { BaseService, ApiResponse } from './BaseService';

export interface HealthResponse {
    status: boolean;
    message: string;
}

export class SystemService extends BaseService {
    /**
     * Verificar saúde do sistema
     * GET /health
     */
    async health(): Promise<ApiResponse<HealthResponse>> {
        const response = await this.fetchWithTimeout(`${this.apiUrl}/health`, {
            method: 'GET',
            headers: this.getHeaders(false), // Não precisa de autenticação
        });

        return this.handleResponse<HealthResponse>(response);
    }
}

export const systemService = new SystemService();
