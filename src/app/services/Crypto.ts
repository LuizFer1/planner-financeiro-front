import { Injectable } from '@angular/core';

/**
 * Serviço de criptografia para dados sensíveis
 * Utiliza uma abordagem simples mas eficaz para proteger dados no localStorage
 */
@Injectable({
  providedIn: 'root'
})
export class CryptoService {
  private readonly KEY_PREFIX = 'planner_';
  private readonly STORAGE_ORDER: Array<'session' | 'local'> = ['session', 'local'];
  
  /**
   * Criptografa uma string usando Base64 com ofuscação
   * Nota: Para segurança máxima, considere usar bibliotecas como crypto-js
   */
  encrypt(text: string): string {
    try {
      const salt = this.generateSalt();
      const saltedText = salt + text;
      
      const encoded = btoa(encodeURIComponent(saltedText));
      
      const checksum = this.generateChecksum(encoded);
      
      return `${checksum}.${encoded}`;
    } catch (error) {
      throw new Error('Erro ao criptografar dados');
    }
  }

  /**
   * Descriptografa uma string
   */
  decrypt(encryptedText: string): string {
    try {
      const [checksum, encoded] = encryptedText.split('.');
      
      if (this.generateChecksum(encoded) !== checksum) {
        throw new Error('Dados corrompidos ou inválidos');
      }
      
      const decoded = decodeURIComponent(atob(encoded));
      
      return decoded.substring(8);
    } catch (error) {
      throw new Error('Erro ao descriptografar dados');
    }
  }

  /**
   * Gera um salt aleatório
   */
  private generateSalt(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let salt = '';
    for (let i = 0; i < 8; i++) {
      salt += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return salt;
  }

  /**
   * Gera um checksum simples para validação de integridade
   */
  private generateChecksum(text: string): string {
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Armazena dados criptografados no localStorage
   */
  setSecureItem(key: string, value: string, scope: 'local' | 'session' = 'local'): void {
    try {
      const encrypted = this.encrypt(value);
      this.getStorage(scope).setItem(this.KEY_PREFIX + key, encrypted);
    } catch (error) {
      throw new Error('Erro ao armazenar dados seguros');
    }
  }

  /**
   * Recupera e descriptografa dados do localStorage
   */
  getSecureItem(key: string, scope: 'local' | 'session' | 'any' = 'any'): string | null {
    try {
      const scopes = scope === 'any' ? this.STORAGE_ORDER : [scope];

      for (const currentScope of scopes) {
        const storage = this.getStorage(currentScope);
        const encrypted = storage.getItem(this.KEY_PREFIX + key);
        if (!encrypted) {
          continue;
        }

        return this.decrypt(encrypted);
      }

      return null;
    } catch (error) {
      // Se houver erro na descriptografia, remove o item corrompido
      this.removeSecureItem(key, 'any');
      return null;
    }
  }

  /**
   * Remove item do localStorage
   */
  removeSecureItem(key: string, scope: 'local' | 'session' | 'any' = 'any'): void {
    if (scope === 'any') {
      localStorage.removeItem(this.KEY_PREFIX + key);
      sessionStorage.removeItem(this.KEY_PREFIX + key);
      return;
    }

    this.getStorage(scope).removeItem(this.KEY_PREFIX + key);
  }

  /**
   * Limpa todos os itens do aplicativo do localStorage
   */
  clearSecureStorage(scope: 'local' | 'session' | 'any' = 'any'): void {
    if (scope === 'any') {
      this.clearSecureStorage('local');
      this.clearSecureStorage('session');
      return;
    }

    const storage = this.getStorage(scope);
    const keys = Object.keys(storage);
    keys.forEach(key => {
      if (key.startsWith(this.KEY_PREFIX)) {
        storage.removeItem(key);
      }
    });
  }

  private getStorage(scope: 'local' | 'session'): Storage {
    return scope === 'session' ? sessionStorage : localStorage;
  }
}
