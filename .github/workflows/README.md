# GitHub Actions - Workflow CI/CD

Este projeto usa GitHub Actions para CI/CD automático.

## 🔧 Configuração de Secrets

Para que o deploy funcione, você precisa configurar os seguintes secrets no GitHub:

1. Acesse: `Settings` → `Secrets and variables` → `Actions` → `New repository secret`

2. Adicione os seguintes secrets:

| Secret | Descrição | Exemplo |
|--------|-----------|---------|
| `FTP_USERNAME` | Usuário FTP | `seu-usuario@dominio.com` |
| `FTP_PASSWORD` | Senha FTP | `sua-senha-segura` |
| `FTP_SERVER` | Servidor FTP | `ftp.seudominio.com` |
| `FTP_DEPLOY_PATH` | Caminho no servidor | `/public_html/app` ou `/httpdocs` |

### ⚠️ Importante sobre FTP_DEPLOY_PATH
- **NÃO** adicione barra no final: ✅ `/public_html/app` ❌ `/public_html/app/`
- Use o caminho completo a partir da raiz do seu servidor FTP
- Comum: `/public_html`, `/httpdocs`, `/www`, `/web`

### 🧪 Testar conexão FTP localmente
```bash
lftp -u usuario,senha ftp.seudominio.com -e "ls; bye"
```

## 📋 Jobs do Workflow

### 1. **build-and-test**
- Instala dependências Node.js
- Executa lint (se disponível)
- Faz build de desenvolvimento
- Roda testes (se disponível)

### 2. **deploy** (apenas branch main)
- Faz build otimizado de produção
- Envia arquivos via FTP para o servidor

## 🚀 Como funciona

### Push para qualquer branch
```bash
git push origin sua-branch
```
- ✅ Roda build-and-test

### Push ou Merge para main
```bash
git push origin main
```
- ✅ Roda build-and-test
- ✅ Faz deploy automático via FTP

### Execução manual
1. Acesse `Actions` → `CI` → `Run workflow`
2. Escolha a branch
3. Clique em `Run workflow`

## 📁 Arquivos enviados no deploy

O workflow envia apenas os arquivos necessários:
- ✅ Conteúdo de `dist/planner-financeiro-front/browser/`
- ❌ Exclui: node_modules, src, configs, .git, etc.

## ⚠️ Importante

Antes do primeiro deploy:
1. **Atualize a URL da API** em `src/environments/environment.production.ts`
2. **Configure os secrets** no GitHub
3. **Teste o build local**: `npm run build`
4. **Verifique o caminho FTP** no servidor

## 🔍 Monitoramento

Acompanhe os deploys em:
- GitHub → Actions → CI workflow

## 🛠️ Personalização

### Mudar servidor de deploy

Edite `.github/workflows/ci.yaml` e substitua a seção de deploy por outra plataforma (Vercel, Netlify, etc.)

### Adicionar testes

Se adicionar testes no futuro, eles serão executados automaticamente no job `build-and-test`.
