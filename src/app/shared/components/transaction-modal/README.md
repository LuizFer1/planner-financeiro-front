# Transaction Modal Component

## Descrição

Componente reutilizável de modal para adicionar transações (receitas e despesas) no aplicativo. O modal fornece um formulário completo com validação, feedback do usuário e integração com os serviços de receita e despesa.

## Recurso

- ✅ Modal com design responsivo
- ✅ Suporte para Receitas e Despesas
- ✅ Formulário com validação em tempo real
- ✅ Categorias pré-definidas
- ✅ Mensagens de sucesso/erro
- ✅ Seletor de data
- ✅ Campo de descrição opcional
- ✅ Animações suaves
- ✅ Loading state durante submissão

## Como Usar

### 1. Importar o Componente

```typescript
import { TransactionModalComponent } from '../shared/components/transaction-modal/transaction-modal';

@Component({
  selector: 'app-my-component',
  standalone: true,
  imports: [CommonModule, TransactionModalComponent],
  // ...
})
export class MyComponent {
  @ViewChild(TransactionModalComponent) transactionModal!: TransactionModalComponent;
}
```

### 2. Adicionar no Template

```html
<button (click)="openAddModal()">Adicionar Transação</button>

<!-- Modal Component -->
<app-transaction-modal 
  (onSuccess)="onTransactionSuccess()"
  (onClose)="onModalClose()">
</app-transaction-modal>
```

### 3. Implementar os Métodos

```typescript
// Abrir modal para adicionar receita
openAddModal(): void {
  this.transactionModal.open('revenue');
}

// Abrir modal para adicionar despesa
openExpenseModal(): void {
  this.transactionModal.open('expense');
}

// Callback após sucesso
onTransactionSuccess(): void {
  // Recarregar dados
  this.loadTransactions();
}

// Callback ao fechar
onModalClose(): void {
  console.log('Modal fechado');
}
```

## Configuração

### Adicionar Categorias Personalizadas

Para personalizar as categorias, edite as arrays no componente:

```typescript
revenueCategories = [
  { uuid: 'cat-1', name: 'Salário' },
  { uuid: 'cat-2', name: 'Freelance' },
  // Adicione mais categorias
];

expenseCategories = [
  { uuid: 'exp-1', name: 'Alimentação' },
  { uuid: 'exp-2', name: 'Transporte' },
  // Adicione mais categorias
];
```

### Alterar Timeout

Modifique o tempo de fechamento automático após sucesso:

```typescript
setTimeout(() => {
  this.transactionModal.close();
  this.onSuccess.emit();
}, 1500); // Tempo em milissegundos
```

## Eventos

### @Output Events

- `onClose`: Emitido quando o modal é fechado
- `onSuccess`: Emitido após adicionar uma transação com sucesso

## Validações

O formulário inclui as seguintes validações:

- **Valor**: Obrigatório, maior que 0
- **Categoria**: Obrigatória
- **Data**: Obrigatória
- **Descrição**: Opcional

## Componentes Utilizando Transaction Modal

1. **Dashboard** (`src/app/pages/dashboard.ts`)
2. **Movimentações** (`src/app/pages/movimentacoes.ts`)
3. **Investimentos** (`src/app/pages/investimentos.ts`)

## Estrutura de Arquivos

```
src/app/shared/components/transaction-modal/
├── transaction-modal.ts       # Lógica do componente
├── transaction-modal.html     # Template
└── transaction-modal.css      # Estilos
```

## Responsividade

O componente é totalmente responsivo:
- Desktop: Modal com largura máxima de 500px
- Tablet: Ajusta-se ao tamanho da tela
- Mobile: Modal ocupa 95% da largura com botões empilhados

## Estilo

O componente utiliza:
- Tailwind-like CSS personalizado
- Paleta de cores: Azul (#3b82f6), Verde (#27ae60), Vermelho (#ef4444)
- Animações suaves (fadeIn, slideUp)
- Ícones Font Awesome
