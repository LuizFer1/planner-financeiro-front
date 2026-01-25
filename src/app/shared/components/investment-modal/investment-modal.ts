import { Component, EventEmitter, Output, ViewChild, ElementRef, NgZone, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import {
    Investment,
    InvestmentInput,
    InvestmentUpdateInput,
    InvestmentType,
} from '../../../services/investment.models';
import { investmentService } from '../../../services/Investiments';
import { ToastService } from '../../../services/Toast';
import { Stock } from '../../../services/Market';
import { MarketService } from '../../../services/Market';

@Component({
    selector: 'app-investment-modal',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './investment-modal.html',
    styleUrls: ['./investment-modal.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InvestmentModalComponent {
    @ViewChild('modal', { static: false }) modal?: ElementRef;
    @Output() onSuccess = new EventEmitter<Investment>();
    @Output() onCancel = new EventEmitter<void>();

    form!: FormGroup;
    isOpen = false;
    isLoading = false;
    isEditing = false;
    editingUuid?: string;
    investmentType: InvestmentType = 'rendafixa';
    
    // Busca de ações
    stockSearchResults: Stock[] = [];
    isSearchingStocks = false;
    showStockDropdown = false;
    searchTimeout: any;
    
    // Campo de exibição do ticker
    stockTickerDisplay = '';
    selectedStockUuid = '';

    private marketService = new MarketService();

    constructor(private fb: FormBuilder, private toastService: ToastService, private ngZone: NgZone, private cdr: ChangeDetectorRef) {
            this.initializeForm();
    }

    /**
     * Inicializar formulário reativo
     */
    initializeForm(): void {
        this.form = this.fb.group({
            amount: [0, [Validators.required, Validators.min(0.01)]],
            description: [''],
            purchase_date: [this.getTodayDate(), Validators.required],
            sale_date: [null],

            name: [''],
            yield_rate: [0],
            tax_exempt: [false],

            stock_uuid: [''],
            quantity: [0],
            unit_price: [0],
        });

        this.form.get('amount')?.valueChanges.subscribe(() => {
            this.updateValidators();
        });

        this.form.get('stock_uuid')?.valueChanges.subscribe((value) => {
            this.onStockSearchChange(value);
        });
    }

    /**
     * Atualizar validadores conforme o tipo de investimento
     */
    updateValidators(): void {
        const nameControl = this.form.get('name');
        const yield_rateControl = this.form.get('yield_rate');
        const stock_uuidControl = this.form.get('stock_uuid');
        const quantityControl = this.form.get('quantity');
        const unit_priceControl = this.form.get('unit_price');

        if (this.investmentType === 'rendafixa') {
            nameControl?.setValidators([Validators.required, Validators.minLength(3)]);
            yield_rateControl?.setValidators([Validators.required, Validators.min(0)]);
            stock_uuidControl?.clearValidators();
            quantityControl?.clearValidators();
            unit_priceControl?.clearValidators();
        } else if (this.investmentType === 'rendavariavel') {
            nameControl?.clearValidators();
            yield_rateControl?.clearValidators();
            stock_uuidControl?.setValidators([Validators.required, Validators.minLength(1)]);
            quantityControl?.setValidators([
                Validators.required,
                Validators.min(1),
                Validators.pattern(/^\d+$/),
            ]);
            unit_priceControl?.setValidators([Validators.required, Validators.min(0.01)]);
        }

        nameControl?.updateValueAndValidity();
        yield_rateControl?.updateValueAndValidity();
        stock_uuidControl?.updateValueAndValidity();
        quantityControl?.updateValueAndValidity();
        unit_priceControl?.updateValueAndValidity();
    }

    /**
     * Obter data de hoje no formato YYYY-MM-DD
     */
    getTodayDate(): string {
        const today = new Date();
        return today.toISOString().split('T')[0];
    }

    /**
     * Abrir modal para criar novo investimento
     */
    open(type: InvestmentType = 'rendafixa'): void {
        this.isEditing = false;
        this.editingUuid = undefined;
        this.investmentType = type;
        this.stockTickerDisplay = '';
        this.selectedStockUuid = '';
        this.stockSearchResults = [];
        this.showStockDropdown = false;
        this.form.reset({
            amount: 0,
            description: '',
            purchase_date: this.getTodayDate(),
            sale_date: null,
            name: '',
            yield_rate: 0,
            tax_exempt: false,
            stock_uuid: '',
            quantity: 0,
            unit_price: 0,
        });
        this.updateValidators();
        this.isOpen = true;
        this.cdr.markForCheck();
        setTimeout(() => {
            this.modal?.nativeElement?.showModal();
            this.cdr.markForCheck();
        }, 0);
    }

    /**
     * Abrir modal para editar investimento existente
     */
    openEdit(investment: Investment): void {
        this.isEditing = true;
        this.editingUuid = investment.uuid;
        this.investmentType = investment.investment_type;
        
        // Resetar campos de busca de ação
        this.stockSearchResults = [];
        this.showStockDropdown = false;

        // Formatar data de compra para o formato do input date (YYYY-MM-DD)
        const purchaseDate = investment.purchase_date 
            ? investment.purchase_date.split(' ')[0] 
            : this.getTodayDate();
        
        const saleDate = investment.sale_date 
            ? investment.sale_date.split(' ')[0] 
            : null;

        const formData: any = {
            amount: investment.amount,
            description: investment.description || '',
            purchase_date: purchaseDate,
            sale_date: saleDate,
        };

        if (investment.investment_type === 'rendafixa') {
            formData.name = investment.fixed_income?.name || '';
            formData.yield_rate = Number(investment.fixed_income?.yield_rate) || 0;
            formData.tax_exempt = investment.fixed_income?.tax_exempt === '1' ? true : false;
            this.stockTickerDisplay = '';
            this.selectedStockUuid = '';
        } else {
            this.selectedStockUuid = investment.variable_income?.stock_uuid || '';
            if (investment.stock_symbol) {
                this.stockTickerDisplay = investment.stock_symbol;
                formData.stock_uuid = investment.stock_symbol;
            } else if (investment.variable_income?.stock_uuid) {
                this.marketService.get(investment.variable_income.stock_uuid).then((response: any) => {
                    const stock = response.data;
                    if (stock) {
                        this.stockTickerDisplay = stock.stock_symbol;
                        this.form.patchValue({ stock_uuid: stock.stock_symbol });
                    }
                    this.cdr.markForCheck();
                });
                this.stockTickerDisplay = investment.variable_income.stock_uuid;
                formData.stock_uuid = investment.variable_income.stock_uuid;
            } else {
                this.stockTickerDisplay = '';
                formData.stock_uuid = '';
            }
            formData.quantity = Number(investment.variable_income?.quantity) || 0;
            formData.unit_price = Number(investment.variable_income?.unit_price) || 0;
        }

        this.form.patchValue(formData);
        this.updateValidators();
        this.isOpen = true;
        this.cdr.markForCheck();
        setTimeout(() => {
            this.modal?.nativeElement?.showModal();
            this.cdr.markForCheck();
        }, 0);
    }

    /**
     * Fechar modal
     */
    close(): void {
        this.isOpen = false;
        this.cdr.markForCheck();
        if (this.modal) {
            this.modal.nativeElement?.close();
        }
        this.form.reset();
    }

    /**
     * Submeter formulário
     */
    async onSubmit(): Promise<void> {
        if (!this.form.valid) {
            this.toastService.error('Por favor, preencha todos os campos obrigatórios');
            return;
        }

        this.isLoading = true;
        this.cdr.markForCheck();

        try {
            const formValue = this.form.value;
            let payload: any;

            if (this.investmentType === 'rendafixa') {
                payload = {
                    amount: parseFloat(formValue.amount),
                    investment_type: 'rendafixa',
                    name: formValue.name,
                    yield_rate: parseFloat(formValue.yield_rate),
                    tax_exempt: formValue.tax_exempt,
                    description: formValue.description || undefined,
                    purchase_date: formValue.purchase_date,
                    sale_date: formValue.sale_date || null,
                };
            } else {
                payload = {
                    amount: parseFloat(formValue.amount),
                    investment_type: 'rendavariavel',
                    stock_uuid: this.selectedStockUuid || formValue.stock_uuid,
                    quantity: parseInt(formValue.quantity, 10),
                    unit_price: parseFloat(formValue.unit_price),
                    description: formValue.description || undefined,
                    purchase_date: formValue.purchase_date,
                    sale_date: formValue.sale_date || null,
                };
            }

            let result;
            if (this.isEditing && this.editingUuid) {
                const updatePayload: InvestmentUpdateInput = {
                    amount: payload.amount,
                    description: payload.description,
                    purchase_date: payload.purchase_date,
                    sale_date: payload.sale_date,
                };

                if (this.investmentType === 'rendafixa') {
                    updatePayload.name = payload.name;
                    updatePayload.yield_rate = payload.yield_rate;
                    updatePayload.tax_exempt = payload.tax_exempt;
                } else {
                    updatePayload.quantity = payload.quantity;
                    updatePayload.unit_price = payload.unit_price;
                }

                result = await investmentService.update(this.editingUuid, updatePayload);
            } else {
                result = await investmentService.create(payload as InvestmentInput);
            }

            if (result.status === 'success' && result.data) {
                this.stockSearchResults = [];
                this.showStockDropdown = false;
                this.isSearchingStocks = false;

                this.toastService.success(
                    this.isEditing
                        ? 'Investimento atualizado com sucesso!'
                        : 'Investimento criado com sucesso!'
                );
                this.onSuccess.emit(result.data as Investment);
                this.close();
            } else {
                this.toastService.error(result.message || 'Erro ao salvar investimento');
            }
        } catch (error) {
            console.error('Erro ao salvar investimento:', error);
            this.toastService.error('Erro ao salvar investimento');
        } finally {
            this.isLoading = false;
            this.cdr.markForCheck();
        }
    }

    /**
     * Cancelar modal
     */
    onCancelClick(): void {
        this.onCancel.emit();
        this.close();
    }

    /**
     * Alternar tipo de investimento
     */
    toggleInvestmentType(): void {
        this.investmentType = this.investmentType === 'rendafixa' ? 'rendavariavel' : 'rendafixa';
        this.updateValidators();
        // Limpar campos específicos
        this.form.patchValue({
            name: '',
            yield_rate: 0,
            tax_exempt: false,
            stock_uuid: '',
            quantity: 0,
            unit_price: 0,
        });
    }

    /**
     * Verificar se um campo é inválido e foi tocado
     */
    isFieldInvalid(fieldName: string): boolean {
        const field = this.form.get(fieldName);
        return !!(field && field.invalid && (field.dirty || field.touched));
    }

    /**
     * Obter mensagem de erro de um campo
     */
    getErrorMessage(fieldName: string): string {
        const field = this.form.get(fieldName);
        if (!field || !field.errors) return '';

        if (field.errors['required']) return 'Campo obrigatório';
        if (field.errors['min']) return `Valor mínimo: ${field.errors['min'].min}`;
        if (field.errors['minLength'])
            return `Mínimo ${field.errors['minLength'].requiredLength} caracteres`;
        if (field.errors['pattern']) return 'Formato inválido';

        return 'Campo inválido';
    }

    /**
     * Manipular mudanças no campo de busca de ações
     */
    onStockSearchChange(searchTerm: string): void {
        if (this.searchTimeout) {
            clearTimeout(this.searchTimeout);
        }

        // Se o ticker mudou, limpar o uuid selecionado
        if (searchTerm !== this.stockTickerDisplay) {
            this.selectedStockUuid = '';
        }

        if (!searchTerm || searchTerm.length < 3) {
            this.stockSearchResults = [];
            this.showStockDropdown = false;
            return;
        }

        this.searchTimeout = setTimeout(() => {
            this.ngZone.run(() => {
                this.searchStocks(searchTerm);
            });
        }, 300);
    }

    /**
     * Buscar ações pela term de busca
     */
    private async searchStocks(searchTerm: string): Promise<void> {
        this.isSearchingStocks = true;
        this.showStockDropdown = true;
        this.cdr.markForCheck();

        try {
            const searchResult = await this.marketService.search(searchTerm);
            
            if (searchResult.status && searchResult.data) {
                if (Array.isArray(searchResult.data)) {
                    this.stockSearchResults = searchResult.data.slice(0, 10);
                } else {
                    this.stockSearchResults = [searchResult.data];
                }
            } else {
                this.stockSearchResults = [];
            }
        } catch (error) {
            console.error('Erro ao buscar ações:', error);
            this.stockSearchResults = [];
        } finally {
            this.isSearchingStocks = false;
            this.cdr.markForCheck();
        }
    }

    /**
     * Selecionar uma ação da lista de resultados
     */
    selectStock(stock: Stock): void {
        this.stockTickerDisplay = stock.stock_symbol;
        this.selectedStockUuid = stock.uuid;
        this.form.patchValue({
            stock_uuid: stock.stock_symbol, // Exibe o ticker no campo
        });
        this.stockSearchResults = [];
        this.showStockDropdown = false;
        this.cdr.markForCheck();
    }

    /**
     * Fechar dropdown de ações
     */
    closeStockDropdown(): void {
        setTimeout(() => {
            this.showStockDropdown = false;
        }, 100);
    }
}