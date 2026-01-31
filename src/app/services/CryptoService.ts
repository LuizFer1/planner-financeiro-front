import { BaseService, ApiResponse } from './BaseService';

export interface Crypto {
    uuid: string;
    symbol: string;
    name: string;
    created_at: string;
    latest_price: string;
    last_update: string;
    previous_price: string | null;
    price_change: number;
    price_change_percent: number;
}
export interface CryptoResponse {
    data?: Crypto[];
    status: string;
    message?: string;
}

export class CryptoService extends BaseService {
     /**
       * Listar ações paginadas com preços e variações
       * GET /stocks
       */
      async list(): Promise<ApiResponse<Crypto[]>> {
        const url = `${this.apiUrl}/crypto`;
    
        const response = await this.fetchWithTimeout(url, {
          method: 'GET',
          headers: this.getHeaders(),
        });
    
        return this.handleResponse<Crypto[]>(response);
      }
    
      /**
       * Obter estatísticas globais de variação
       * GET /stocks/variation
       */
      async getVariation(): Promise<ApiResponse<Crypto[]>> {
        const response = await this.fetchWithTimeout(`${this.apiUrl}/crypto/hystory`, {
          method: 'GET',
          headers: this.getHeaders(),
        });
    
        return this.handleResponse<Crypto[]>(response);
      }
    
      /**
       * Detalhes de uma ação específica
       * Busca detalhes de uma ação por UUID ou símbolo (ex: PETR4, VALE3)
       * GET /stocks/{identifier}
       */  
      async get(identifier: string): Promise<ApiResponse<Crypto>> {
        const response = await this.fetchWithTimeout(`${this.apiUrl}/crypto/${identifier}`, {
          method: 'GET',
          headers: this.getHeaders(),
        });
    
        return this.handleResponse<Crypto>(response);
      }
}

export const cryptoService = new CryptoService();
