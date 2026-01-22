import { BaseService, ApiResponse } from './BaseService';

export class IntegrationService extends BaseService {
    /**
     * Forçar sincronização com Brapi
     * GET /brapi/sync
     */
    async syncBrapi(): Promise<ApiResponse<any>> {
        const response = await this.fetchWithTimeout(`${this.apiUrl}/brapi/sync`, {
            method: 'GET',
            headers: this.getHeaders(false), // Pode não precisar de autenticação
        });

        return this.handleResponse<any>(response);
    }
}

export const integrationService = new IntegrationService();
