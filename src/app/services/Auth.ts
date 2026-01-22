import { BaseService, ApiResponse } from './BaseService';

// Interfaces
export interface RegisterData {
    name: string;
    email: string;
    password: string;
}

export interface LoginData {
    email: string;
    password: string;
    remember_me?: boolean;
}

export interface AuthResponse {
    user: User;
    token: string;
    expires_at: string;
}

export interface User {
    uuid?: string;
    name: string;
    email: string;
    created_at?: string;
    updated_at?: string;
}

export class AuthService extends BaseService {
    /**
     * Registrar novo usuário
     * POST /auth/register
     */
    async register(data: RegisterData): Promise<ApiResponse<AuthResponse>> {
        const response = await this.fetchWithTimeout(`${this.apiUrl}/auth/register`, {
            method: 'POST',
            headers: this.getHeaders(false),
            body: JSON.stringify(data),
        });

        const result = await this.handleResponse<AuthResponse>(response);
        
        if (result.data.token) {
            this.setToken(result.data.token);
        }
        
        return result;
    }

    /**
     * Realizar login
     * POST /auth/login
     */
    async login(data: LoginData): Promise<ApiResponse<AuthResponse>> {
        const response = await this.fetchWithTimeout(`${this.apiUrl}/auth/login`, {
            method: 'POST',
            headers: this.getHeaders(false),
            body: JSON.stringify(data),
        });

        const result = await this.handleResponse<AuthResponse>(response);
        
        if (result.data.token) {
            this.setToken(result.data.token);
        }
        
        return result;
    }

    /**
     * Revogar token (Logout)
     * POST /auth/logout
     */
    async logout(): Promise<ApiResponse<null>> {
        const response = await this.fetchWithTimeout(`${this.apiUrl}/auth/logout`, {
            method: 'POST',
            headers: this.getHeaders(),
        });

        const result = await this.handleResponse<null>(response);
        this.removeToken();
        
        return result;
    }

    /**
     * Dados do usuário logado
     * GET /auth/me
     */
    async me(): Promise<ApiResponse<User>> {
        const response = await this.fetchWithTimeout(`${this.apiUrl}/auth/me`, {
            method: 'GET',
            headers: this.getHeaders(),
        });

        return this.handleResponse<User>(response);
    }

    /**
     * Verifica se o usuário está autenticado
     */
    isAuthenticated(): boolean {
        return this.getToken() !== null;
    }
}

export const authService = new AuthService();
