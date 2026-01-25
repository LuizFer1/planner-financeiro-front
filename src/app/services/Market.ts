import { BaseService, ApiResponse } from './BaseService';
export interface Stock {
  uuid: string;
  stock_symbol: string;
  stock_name: string;
  symbol?: string;
  name?: string;
  sector?: string;
  type: string;
  current_price: string;
  previous_close?: string;
  variation_percent: string;
  fixed_income?: Array<any>;
  variable_income?: Array<any>;
  volume?: string;
  market_cap?: string;
  updated_at?: string;
  created_at?: string;
}

export interface StockDetail extends Stock {
  price_history?: StockPrice[];
}

export interface StockPrice {
  uuid: string;
  stock_uuid: string;
  price: number;
  date: string;
  created_at: string;
}

export interface StocksListResponse {
  data: Stock[];
  pagination: {
    current_page: number;
    per_page: number;
    total: number;
    total_pages: number;
  };
}

export interface StockVariationResponse {
  up: number;
  down: number;
  total_assets: number;
}

export interface StocksQueryParams {
  page?: number;
  limit?: number;
  type?: 'stock' | 'bdr' | 'index';
  orderBy?: 'symbol' | 'name' | 'volume' | 'market_cap' | 'price' | 'variation';
  orderDirection?: 'ASC' | 'DESC';
}

export class MarketService extends BaseService {
  /**
   * Listar ações paginadas com preços e variações
   * GET /stocks
   */
  async list(params?: StocksQueryParams): Promise<ApiResponse<StocksListResponse>> {
    const queryParams = new URLSearchParams();

    if (params?.page) {
      queryParams.append('page', params.page.toString());
    }
    if (params?.limit) {
      queryParams.append('limit', params.limit.toString());
    }
    if (params?.type) {
      queryParams.append('type', params.type);
    }
    if (params?.orderBy) {
      queryParams.append('orderBy', params.orderBy);
    }
    if (params?.orderDirection) {
      queryParams.append('orderDirection', params.orderDirection);
    }

    const url = `${this.apiUrl}/stocks${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

    const response = await this.fetchWithTimeout(url, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    return this.handleResponse<StocksListResponse>(response);
  }

  /**
   * Obter estatísticas globais de variação
   * GET /stocks/variation
   */
  async getVariation(): Promise<ApiResponse<StockVariationResponse>> {
    const response = await this.fetchWithTimeout(`${this.apiUrl}/stocks/variation`, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    return this.handleResponse<StockVariationResponse>(response);
  }

  /**
   * Detalhes de uma ação específica
   * Busca detalhes de uma ação por UUID ou símbolo (ex: PETR4, VALE3)
   * GET /stocks/{identifier}
   */
  async get(identifier: string): Promise<ApiResponse<Stock>> {
    const response = await this.fetchWithTimeout(`${this.apiUrl}/stocks/${identifier}`, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    return this.handleResponse<Stock>(response);
  }

  async search(identifier: string): Promise<ApiResponse<Stock[] | Stock>> {
    const response = await this.fetchWithTimeout(`${this.apiUrl}/stocks/search/${identifier}`, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    return this.handleResponse<Stock[] | Stock>(response);
  }
}

export const marketService = new MarketService();
