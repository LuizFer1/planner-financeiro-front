# Investment Modal Component

Modal unificado para criação e edição de investimentos (Renda Fixa e Renda Variável).

## Funcionalidades

- ✅ Suporte para dois tipos de investimento: Renda Fixa e Renda Variável
- ✅ Validações dinâmicas baseadas no tipo selecionado
- ✅ Campos condicionais que aparecem conforme o tipo
- ✅ Integração com serviço de investimentos
- ✅ Estados de carregamento e erro
- ✅ Notificações via toast
- ✅ Modo edição de investimentos existentes

## Campos por Tipo

### Renda Fixa
- Nome ou Instituição
- Taxa de Rendimento Anual (%)
- Isento de Impostos (checkbox)
- Valor do Investimento
- Descrição
- Data de Compra
- Data de Venda (opcional)

### Renda Variável
- Ticker/UUID da Ação
- Quantidade de Ações
- Preço Unitário
- Valor do Investimento (calculado automaticamente)
- Descrição
- Data de Compra
- Data de Venda (opcional)

## Uso

### Importar o componente

```typescript
import { InvestmentModalComponent } from '@shared/components/investment-modal/investment-modal';

@Component({
    imports: [InvestmentModalComponent],
})
export class MinhaComponent {}
```

### Template HTML

```html
<!-- Referência ao modal -->
<app-investment-modal
    #investmentModal
    (onSuccess)="onInvestmentSuccess($event)"
    (onCancel)="onInvestmentCancel()"
></app-investment-modal>

<!-- Botões para abrir o modal -->
<button (click)="investmentModal.open('rendafixa')">
    Novo Investimento de Renda Fixa
</button>
<button (click)="investmentModal.open('rendavariavel')">
    Novo Investimento de Renda Variável
</button>

<!-- Abrir para editar -->
<button (click)="investmentModal.openEdit(investment)">
    Editar
</button>
```

### TypeScript

```typescript
export class MinhaComponent {
    @ViewChild(InvestmentModalComponent) investmentModal!: InvestmentModalComponent;

    onInvestmentSuccess(investment: Investment): void {
        console.log('Investimento criado/atualizado:', investment);
        // Recarregar lista, atualizar estado, etc.
    }

    onInvestmentCancel(): void {
        console.log('Modal cancelado');
    }
}
```

## API Pública

### Métodos

#### `open(type: InvestmentType = 'rendafixa'): void`
Abre o modal para criar um novo investimento do tipo especificado.

```typescript
this.investmentModal.open('rendafixa');
this.investmentModal.open('rendavariavel');
```

#### `openEdit(investment: Investment): void`
Abre o modal em modo edição preenchido com dados do investimento.

```typescript
this.investmentModal.openEdit(investmentData);
```

#### `close(): void`
Fecha o modal programaticamente.

```typescript
this.investmentModal.close();
```

### Eventos

#### `onSuccess: EventEmitter<Investment>`
Emitido quando um investimento é criado ou atualizado com sucesso.

```html
<app-investment-modal (onSuccess)="handleSuccess($event)"></app-investment-modal>
```

#### `onCancel: EventEmitter<void>`
Emitido quando o usuário cancela a operação.

```html
<app-investment-modal (onCancel)="handleCancel()"></app-investment-modal>
```

## Validações

### Campos Comuns
- **Valor do Investimento**: Obrigatório, mínimo 0.01
- **Data de Compra**: Obrigatório

### Renda Fixa
- **Nome**: Obrigatório, mínimo 3 caracteres
- **Taxa de Rendimento**: Obrigatório, mínimo 0%
- **Isento de Impostos**: Opcional (checkbox)

### Renda Variável
- **Ticker/UUID**: Obrigatório, mínimo 1 caractere
- **Quantidade**: Obrigatório, mínimo 1, apenas números inteiros
- **Preço Unitário**: Obrigatório, mínimo 0.01

## Estilos

O componente usa CSS modular com:
- Design responsivo (mobile-first)
- Animações suaves (slide in)
- Estados visuais (hover, focus, disabled, invalid)
- Paleta de cores consistente com o projeto
- Suporte a temas (preparado para integração futura)

### Classes Disponíveis para Override

```css
.investment-modal-dialog { }
.modal-header { }
.modal-body { }
.modal-footer { }
.form-group { }
.investment-type-selector { }
.type-btn { }
```

## Dependências

- `@angular/common`
- `@angular/forms`
- `InvestmentService`
- `ToastService`
- FontAwesome (para ícones)

## Observações Importantes

1. O modal usa `<dialog>` nativo do HTML5 para melhor acessibilidade
2. Validações ocorrem em tempo real durante o preenchimento
3. O serviço de investimentos é responsável pela comunicação com a API
4. Erros de requisição são tratados e exibidos via toast
5. Campos específicos do tipo são limpos ao alternar entre tipos
