/**
 * Modelos e interfaces para gestão de investimentos
 */

/**
 * Tipo de investimento
 */
export type InvestmentType = 'rendafixa' | 'rendavariavel';

/**
 * Dados de renda fixa (aninhados na resposta da API)
 */
export interface FixedIncomeData {
  id: string;
  uuid: string;
  investment_uuid: string;
  name: string;
  tax_exempt: string | boolean;
  yield_rate: string | number;
  created_at: string;
  updated_at: string;
}

/**
 * Dados de renda variável (aninhados na resposta da API)
 */
export interface VariableIncomeData {
    id: string;
    uuid: string;
    investment_uuid: string;
    stock_uuid: string;
    quantity: string;
    unit_price: string;
    created_at: string;
    updated_at: string;
    stock?: {
      id: string;
      uuid: string;
      stock_symbol: string;
      stock_name: string;
      current_price: string;
      volume: string;
      market_cap?: string | null;
      logo?: string;
      market?: string | null;
      sector?: string | null;
      type?: string;
      created_at: string;
      updated_at: string;
      deleted_at?: string | null;
    };
}

/**
 * Interface base para todos os investimentos (resposta da API)
 */
export interface InvestmentApiResponse {
  id: string;
  uuid: string;
  user_uuid: string;
  amount: string | number;
  investment_type: InvestmentType;
  description?: string | null;
  purchase_date: string;
  sale_date?: string | null;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
  fixed_income?: FixedIncomeData;
  variable_income?: {
    id: string;
    uuid: string;
    investment_uuid: string;
    stock_uuid: string;
    quantity: string;
    current_price: string;
    unit_price: string;
    created_at: string;
    updated_at: string;
    stock?: {
      id: string;
      uuid: string;
      stock_symbol: string;
      stock_name: string;
      volume: string;
      market_cap?: string | null;
      logo?: string;
      market?: string | null;
      sector?: string | null;
      type?: string;
      created_at: string;
      updated_at: string;
      deleted_at?: string | null;
    };
  };
}

/**
 * Interface normalizada para uso no frontend
 */
export interface Investment {
  id: string;
  uuid: string;
  user_uuid: string;
  amount: number | string;
  investment_type: 'rendafixa' | 'rendavariavel';
  description?: string | null;
  purchase_date: string;
  sale_date?: string | null;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
  // Adicione as propriedades abaixo:
  fixed_income?: {
    id: string;
    uuid: string;
    investment_uuid: string;
    name: string;
    yield_rate: string;
    tax_exempt: string;
    created_at: string;
    updated_at: string;
  };
  variable_income?: {
    id: string;
    uuid: string;
    investment_uuid: string;
    stock_uuid: string;
    current_price: string;
    quantity: string;
    unit_price: string;
    created_at: string;
    updated_at: string;
    stock?: {
      id: string;
      uuid: string;
      stock_symbol: string;
      stock_name: string;
      volume: string;
      market_cap?: string | null;
      logo?: string;
      market?: string | null;
      sector?: string | null;
      type?: string;
      created_at: string;
      updated_at: string;
      deleted_at?: string | null;
    };
  };
  currentValue?: number;
  profit?: number;
  profitPercent?: number;
  stock_symbol?: string;
}

/**
 * Interface específica para investimentos de Renda Fixa
 */
export interface FixedIncomeInvestment extends Investment {
  investment_type: 'rendafixa';
  name: string;
  yield_rate: number;
  tax_exempt: boolean;
}

/**
 * Interface específica para investimentos de Renda Variável
 */
export interface VariableIncomeInvestment extends Investment {
  investment_type: 'rendavariavel';
  stock_uuid: string;
  quantity: number;
  unit_price: number;
}

/**
 * Dados de entrada para criar investimento de renda fixa
 */
export interface InvestmentFixedIncomeInput {
  amount: number;
  investment_type: 'rendafixa';
  name: string;
  yield_rate: number;
  tax_exempt?: boolean;
  description?: string;
  purchase_date?: string;
  sale_date?: string | null;
}

/**
 * Dados de entrada para criar investimento de renda variável
 */
export interface InvestmentVariableIncomeInput {
  amount: number;
  investment_type: 'rendavariavel';
  stock_uuid: string;
  quantity: number;
  unit_price: number;
  description?: string;
  purchase_date?: string;
  sale_date?: string | null;
}

/**
 * Tipo union para dados de entrada de investimento
 */
export type InvestmentInput =
  | InvestmentFixedIncomeInput
  | InvestmentVariableIncomeInput;

/**
 * Dados para atualizar investimento
 */
export interface InvestmentUpdateInput {
  amount?: number;
  description?: string;
  purchase_date?: string;
  sale_date?: string | null;
  name?: string; // Renda Fixa
  yield_rate?: number; // Renda Fixa
  tax_exempt?: boolean; // Renda Fixa
  quantity?: number; // Renda Variável
  unit_price?: number; // Renda Variável
}

/**
 * Resumo consolidado de investimentos
 */
export interface InvestmentSummary {
  fixed_income: {
    total_invested: number;
    total_current_value: number;
    total_profit: number;
    total_profit_percent: number;
    count: number;
  };
  variable_income: {
    total_invested: number;
    total_current_value: number;
    total_profit: number;
    total_profit_percent: number;
    count: number;
  };
  total_invested: number;
  total_current_value: number;
  total_profit: number;
  total_profit_percent: number;
}

/**
 * Categoria de investimentos agrupados
 */
export interface InvestmentCategory {
  name: string;
  type: InvestmentType;
  investments: Investment[];
  totalInvested: number;
  totalCurrentValue: number;
  totalProfit: number;
  totalProfitPercent: number;
  isEmergencyReserve?: boolean;
}

/**
 * Resposta genérica da API
 */
export interface ApiResponse<T> {
  status: boolean;
  message?: string;
  data?: T;
}

/**
 * Ação individual em uma renda variável (ação)
 */
export interface StockPosition {
  stock_uuid: string;
  quantity: number;
  unit_price: number;
  currentValue?: number;
  profitPerUnit?: number;
  profitPercentUnit?: number;
  totalProfit?: number;
  totalProfitPercent?: number;
}
