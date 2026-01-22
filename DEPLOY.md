# Planner Financeiro - Deploy Guide

## 📦 Build para Produção

### Build otimizado
```bash
npm run build
```

Os arquivos compilados estarão em: `dist/planner-financeiro-front/browser/`

### Build de desenvolvimento (para testes)
```bash
npm run build:dev
```

---

## 🌐 Configuração de Ambientes

### Desenvolvimento
- Arquivo: `src/environments/environment.ts`
- API URL: `http://localhost:8080`

### Produção
- Arquivo: `src/environments/environment.production.ts`
- **⚠️ IMPORTANTE**: Atualize a URL da API para o endereço real do seu backend

```typescript
export const environment = {
  production: true,
  apiUrl: 'https://sua-api-backend.com' // ALTERE AQUI
};
```

---

## 🚀 Opções de Deploy

### 1. Vercel (Recomendado)

**Configuração:**
```bash
# Instalar CLI
npm i -g vercel

# Deploy
vercel
```

**Variáveis de ambiente na Vercel:**
- Não são necessárias, o build usa `environment.production.ts`

**Build Settings na Vercel:**
- Framework Preset: Angular
- Build Command: `npm run build`
- Output Directory: `dist/planner-financeiro-front/browser`

---

### 2. Netlify

**netlify.toml** (criar na raiz):
```toml
[build]
  command = "npm run build"
  publish = "dist/planner-financeiro-front/browser"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

**Deploy:**
```bash
# Via CLI
npm install -g netlify-cli
netlify deploy --prod
```

---

### 3. GitHub Pages

**Passos:**
1. Instalar pacote:
```bash
npm install -g angular-cli-ghpages
```

2. Build e deploy:
```bash
npm run build
npx angular-cli-ghpages --dir=dist/planner-financeiro-front/browser
```

---

### 4. Servidor Próprio (Nginx)

**Configuração Nginx:**
```nginx
server {
    listen 80;
    server_name seu-dominio.com;
    root /var/www/planner-financeiro/browser;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache de assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

**Deploy:**
```bash
# Build
npm run build

# Copiar para servidor
scp -r dist/planner-financeiro-front/browser/* user@server:/var/www/planner-financeiro/
```

---

## ✅ Checklist de Deploy

- [ ] Atualizar URL da API em `src/environments/environment.production.ts`
- [ ] Testar build local: `npm run build`
- [ ] Verificar se não há erros no build
- [ ] Configurar CORS no backend para aceitar requisições do domínio de produção
- [ ] Configurar SSL/HTTPS no servidor
- [ ] Testar autenticação e localStorage em produção
- [ ] Verificar se todas as rotas funcionam (SPA routing)

---

## 🔧 Troubleshooting

### Erro 404 nas rotas
Configurar redirecionamento para index.html (veja configurações acima)

### API não responde
- Verificar CORS no backend
- Verificar URL da API em `environment.production.ts`
- Verificar se o backend está rodando

### Assets não carregam
- Verificar `base href` no index.html
- Verificar paths relativos vs absolutos
