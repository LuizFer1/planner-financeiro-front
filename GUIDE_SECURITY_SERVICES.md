# Guia de Uso - Novos Serviços de Segurança

Este guia explica como usar os novos serviços de segurança implementados no projeto.

## 🔐 CryptoService

Serviço para criptografar dados sensíveis no localStorage.

### Importação
```typescript
import { CryptoService } from './services/Crypto';
```

### Uso em Componentes

#### 1. Injetar o Serviço
```typescript
import { Component, inject } from '@angular/core';
import { CryptoService } from '../services/Crypto';

@Component({
  selector: 'app-meu-componente',
  // ...
})
export class MeuComponente {
  private cryptoService = inject(CryptoService);
}
```

#### 2. Armazenar Dados
```typescript
// Armazenar token
this.cryptoService.setSecureItem('auth_token', 'seu-token-aqui');

// Armazenar outros dados
this.cryptoService.setSecureItem('user_preferences', JSON.stringify(preferences));
```

#### 3. Recuperar Dados
```typescript
// Recuperar token
const token = this.cryptoService.getSecureItem('auth_token');

// Recuperar e parsear JSON
const preferencesStr = this.cryptoService.getSecureItem('user_preferences');
if (preferencesStr) {
  const preferences = JSON.parse(preferencesStr);
}
```

#### 4. Remover Dados
```typescript
// Remover item específico
this.cryptoService.removeSecureItem('auth_token');

// Limpar todos os dados do app
this.cryptoService.clearSecureStorage();
```

---

## 📝 LoggerService

Serviço para logs seguros e estruturados.

### Importação
```typescript
import { LoggerService } from './services/Logger';
```

### Uso em Componentes

#### 1. Injetar o Serviço
```typescript
import { Component, inject } from '@angular/core';
import { LoggerService } from '../services/Logger';

@Component({
  selector: 'app-meu-componente',
  // ...
})
export class MeuComponente {
  private logger = inject(LoggerService);
}
```

#### 2. Tipos de Log

##### Info - Informações gerais (apenas dev)
```typescript
this.logger.info('Usuário logado com sucesso');
this.logger.info('Dados carregados', { count: items.length });
```

##### Warn - Avisos (apenas dev)
```typescript
this.logger.warn('API retornou dados vazios');
this.logger.warn('Cache não encontrado', { key: 'user_data' });
```

##### Error - Erros (sanitizado em produção)
```typescript
this.logger.error('Erro ao carregar dados', error);
this.logger.error('Falha na autenticação');
```

##### Debug - Debug detalhado (apenas dev)
```typescript
this.logger.debug('Estado do componente', { 
  isLoading: this.isLoading,
  hasData: this.data.length > 0 
});
```

##### Group - Agrupar logs relacionados (apenas dev)
```typescript
this.logger.group('Processamento de dados', () => {
  this.logger.debug('Iniciando processamento');
  this.logger.debug('Validando dados');
  this.logger.debug('Salvando no banco');
  this.logger.info('Processamento concluído');
});
```

#### 3. Exemplo Completo
```typescript
loadData(): void {
  this.logger.info('Iniciando carregamento de dados');
  
  this.dataService.getData()
    .then(response => {
      this.logger.info('Dados carregados com sucesso', { 
        count: response.data.length 
      });
      this.data = response.data;
    })
    .catch(error => {
      this.logger.error('Erro ao carregar dados', error);
      this.errorMessage = 'Não foi possível carregar os dados';
    });
}
```

---

## 🔒 Boas Práticas

### ❌ NÃO FAZER
```typescript
// Nunca mais usar console.log diretamente
console.log('Dados do usuário:', user); // ❌

// Nunca logar dados sensíveis
this.logger.info('Senha:', password); // ❌
this.logger.info('Token:', token); // ❌

// Nunca armazenar dados sensíveis sem criptografia
localStorage.setItem('token', token); // ❌
```

### ✅ FAZER
```typescript
// Usar o logger para informações
this.logger.info('Usuário autenticado'); // ✅

// Omitir dados sensíveis nos logs
this.logger.info('Login realizado', { 
  userId: user.id, 
  email: user.email 
}); // ✅ (sem senha)

// Usar CryptoService para dados sensíveis
this.cryptoService.setSecureItem('auth_token', token); // ✅
```

---

## 🧪 Testando em Desenvolvimento

### Verificar Logs
1. Abra o DevTools (F12)
2. Vá para a aba Console
3. Os logs aparecerão com prefixos:
   - `[INFO]` - Informações
   - `[WARN]` - Avisos
   - `[ERROR]` - Erros
   - `[DEBUG]` - Debug

### Verificar Criptografia
1. Abra o DevTools (F12)
2. Vá para Application → Local Storage
3. Verifique que os itens começam com `planner_`
4. Os valores devem estar criptografados (não legíveis)

**Exemplo:**
```
Key: planner_auth_token
Value: a7f2b8.SGVsbG8gV29ybGQ=... (criptografado)
```

---

## 🔄 Migração de Código Existente

### Substituir localStorage
```typescript
// ANTES
localStorage.setItem('token', token);
const token = localStorage.getItem('token');
localStorage.removeItem('token');

// DEPOIS
this.cryptoService.setSecureItem('auth_token', token);
const token = this.cryptoService.getSecureItem('auth_token');
this.cryptoService.removeSecureItem('auth_token');
```

### Substituir console.log
```typescript
// ANTES
console.log('Dados carregados:', data);
console.error('Erro:', error);
console.warn('Aviso:', message);

// DEPOIS
this.logger.info('Dados carregados', { count: data.length });
this.logger.error('Erro ao carregar', error);
this.logger.warn('Aviso', message);
```

---

## 🚀 Produção

### O que acontece em produção:
1. **Logs Desabilitados**: `info()`, `warn()`, `debug()` não geram output
2. **Erros Sanitizados**: `error()` remove dados sensíveis automaticamente
3. **Criptografia Ativa**: Todos os dados sensíveis são criptografados

### Verificar Ambiente
```typescript
import { environment } from '../environments/environment';

if (environment.production) {
  // Código específico para produção
} else {
  // Código apenas para desenvolvimento
}
```

---

## 📚 Exemplos Práticos

### Exemplo 1: Login Component
```typescript
export class LoginComponent {
  private logger = inject(LoggerService);
  private cryptoService = inject(CryptoService);

  login(): void {
    this.logger.info('Tentativa de login');
    
    authService.login(this.credentials)
      .then(response => {
        this.logger.info('Login realizado com sucesso');
        // Token já é armazenado criptografado pelo authService
        this.router.navigate(['/dashboard']);
      })
      .catch(error => {
        this.logger.error('Falha no login', error);
        this.errorMessage = 'Credenciais inválidas';
      });
  }
}
```

### Exemplo 2: Dashboard Component
```typescript
export class DashboardComponent {
  private logger = inject(LoggerService);

  loadDashboardData(): void {
    this.logger.group('Carregando Dashboard', () => {
      this.logger.debug('Buscando receitas');
      this.logger.debug('Buscando despesas');
      this.logger.debug('Buscando investimentos');
    });

    Promise.all([
      revenueService.list(),
      expenseService.list(),
      investmentService.list()
    ])
      .then(([revenues, expenses, investments]) => {
        this.logger.info('Dashboard carregado', {
          revenues: revenues.data.length,
          expenses: expenses.data.length,
          investments: investments.data.length
        });
        this.processData(revenues, expenses, investments);
      })
      .catch(error => {
        this.logger.error('Erro ao carregar dashboard', error);
        this.showError();
      });
  }
}
```

---

## 🆘 Troubleshooting

### Problema: Logs não aparecem no console
**Solução**: Verifique se está em modo de desenvolvimento:
```typescript
// environment.ts deve ter:
export const environment = {
  production: false,
  // ...
};
```

### Problema: Erro ao descriptografar
**Solução**: Dados corrompidos no localStorage. Limpar:
```typescript
this.cryptoService.clearSecureStorage();
```

### Problema: Token não é enviado nas requisições
**Solução**: Verifique se o interceptor está registrado no `app.config.ts`:
```typescript
provideHttpClient(withInterceptors([authInterceptor]))
```

---

## 📖 Documentação Adicional

- [SECURITY.md](./SECURITY.md) - Documentação completa de segurança
- [Angular Security Guide](https://angular.io/guide/security)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
