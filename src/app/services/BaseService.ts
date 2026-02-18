import { environment } from '../../environments/environment';
import { CryptoService } from './Crypto';
import { LoggerService } from './Logger';

export interface ApiResponse<T = any> {
    status: string;
    message: string;
    data: T;
}

export type ApiError = Error & {
    status?: number;
    data?: unknown;
};

export abstract class BaseService {
    protected readonly apiUrl: string;
    protected readonly requestTimeout: number = 30000; // 30 segundos
    protected cryptoService: CryptoService;
    protected logger: LoggerService;

    constructor() {
        this.apiUrl = `${environment.apiUrl}/api`;
        // Injeção manual de dependências para classes não-Angular
        this.cryptoService = new CryptoService();
        this.logger = new LoggerService();
    }

    protected getHeaders(includeAuth: boolean = true): HeadersInit {
        const headers: HeadersInit = {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        };

        if (includeAuth) {
            const token = this.getToken();
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }
        }

        return headers;
    }

    protected getToken(): string | null {
        if (typeof window !== 'undefined') {
            return this.cryptoService.getSecureItem('auth_token', 'any');
        }
        return null;
    }

    protected setToken(token: string, remember: boolean = false): void {
        if (typeof window !== 'undefined') {
            const scope = remember ? 'local' : 'session';
            this.cryptoService.removeSecureItem('auth_token', 'any');
            this.cryptoService.setSecureItem('auth_token', token, scope);
        }
    }

    protected removeToken(): void {
        if (typeof window !== 'undefined') {
            this.cryptoService.removeSecureItem('auth_token', 'any');
        }
    }

    protected async fetchWithTimeout(url: string, options: RequestInit = {}): Promise<Response> {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.requestTimeout);

        try {
            this.logger.debug('Requisição HTTP', { url, method: options.method || 'GET' });
            
            const response = await fetch(url, {
                ...options,
                signal: controller.signal,
            });
            
            clearTimeout(timeoutId);
            
            this.logger.debug('Resposta HTTP', { 
                url, 
                status: response.status, 
                statusText: response.statusText 
            });
            
            return response;
        } catch (error) {
            clearTimeout(timeoutId);
            if (error instanceof Error && error.name === 'AbortError') {
                this.logger.error('Requisição expirou', { url });
                throw new Error('Requisição expirou. Tente novamente.');
            }
            this.logger.error('Erro na requisição', { url, error });
            throw error;
        }
    }

    protected async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
        try {
            if (response.status === 204) {
                return {
                    status: 'success',
                    message: '',
                    data: undefined as T
                };
            }

            const raw = await response.text();
            const data = raw ? JSON.parse(raw) : null;
            
            if (!response.ok) {
                const errorMessage = data?.message || `Erro HTTP: ${response.status}`;
                this.logger.error('Erro na resposta da API', { 
                    status: response.status, 
                    message: errorMessage 
                });

                const apiError: ApiError = new Error(errorMessage);
                apiError.status = response.status;
                apiError.data = data;
                throw apiError;
            }
            
            if (!data) {
                throw new Error('Resposta vazia do servidor');
            }

            return data as ApiResponse<T>;
        } catch (error) {
            if (error instanceof SyntaxError) {
                this.logger.error('Resposta inválida do servidor');
                throw new Error('Resposta inválida do servidor');
            }
            throw error;
        }
    }

    /**
     * Sanitiza dados antes de enviar para a API
     * Remove campos vazios e normaliza dados
     */
    protected sanitizeData<T extends Record<string, any>>(data: T): Partial<T> {
        const sanitized: Partial<T> = {};
        
        for (const key in data) {
            const value = data[key];
            
            // Remove valores nulos, undefined ou strings vazias
            if (value !== null && value !== undefined && value !== '') {
                // Se for string, faz trim
                if (typeof value === 'string') {
                    sanitized[key] = value.trim() as any;
                } else {
                    sanitized[key] = value;
                }
            }
        }
        
        return sanitized;
    }
}
