import { environment } from '../../environments/environment';

export interface ApiResponse<T = any> {
    status: boolean;
    message: string;
    data: T;
}

export abstract class BaseService {
    protected readonly apiUrl: string;
    protected readonly requestTimeout: number = 30000; // 30 segundos

    constructor() {
        this.apiUrl = `${environment.apiUrl}/api`;
    }

    protected getHeaders(includeAuth: boolean = true): HeadersInit {
        const headers: HeadersInit = {
            'Content-Type': 'application/json',
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
            return localStorage.getItem('auth_token');
        }
        return null;
    }

    protected setToken(token: string): void {
        if (typeof window !== 'undefined') {
            localStorage.setItem('auth_token', token);
        }
    }

    protected removeToken(): void {
        if (typeof window !== 'undefined') {
            localStorage.removeItem('auth_token');
        }
    }

    protected async fetchWithTimeout(url: string, options: RequestInit = {}): Promise<Response> {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.requestTimeout);

        try {
            const response = await fetch(url, {
                ...options,
                signal: controller.signal,
            });
            clearTimeout(timeoutId);
            return response;
        } catch (error) {
            clearTimeout(timeoutId);
            if (error instanceof Error && error.name === 'AbortError') {
                throw new Error('Requisição expirou. Tente novamente.');
            }
            throw error;
        }
    }

    protected async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
        try {
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || `Erro HTTP: ${response.status}`);
            }
            
            return data as ApiResponse<T>;
        } catch (error) {
            if (error instanceof SyntaxError) {
                throw new Error('Resposta inválida do servidor');
            }
            throw error;
        }
    }
}
