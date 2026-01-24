import { Component, EventEmitter, Output, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import {
    Investment,
    InvestmentInput,
    InvestmentUpdateInput,
    InvestmentType,
} from '../../services/investment.models';
import { investmentService } from '../../services/Investiments';
import { toastService } from '../../services/Toast';

@Component({
    selector: 'app-investment-modal',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './investment-modal.html',
    styleUrls: ['./investment-modal.css'],
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

    constructor(private fb: FormBuilder) {
        this.initializeForm();
    }

    /**
     * Inicializar formulário reativo
     */
    private initializeForm(): void {
        this.form = this.fb.group({
            // Campos comuns
            amount: [0, [Validators.required, Validators.min(0.01)]],
            description: [''],
            purchase_date: [this.getTodayDate(), Validators.required],
            sale_date: [null],

            // Campos Renda Fixa
            name: [''],
            yield_rate: [0],
            tax_exempt: [false],

            // Campos Renda Variável
            stock_uuid: [''],
            quantity: [0],
            unit_price: [0],
        });

        // Atualizar validadores quando o tipo mudar
        this.form.get('amount')?.valueChanges.subscribe(() => {
            this.updateValidators();
        });
    }

    /**
     * Atualizar validadores conforme o tipo de investimento
     */
    private updateValidators(): void {
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
    private getTodayDate(): string {
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
        setTimeout(() => this.modal?.nativeElement?.showModal(), 0);
    }

    /**
     * Abrir modal para editar investimento existente
     */
    openEdit(investment: Investment): void {
        this.isEditing = true;
        this.editingUuid = investment.uuid;
        this.investmentType = investment.investment_type;

        const formData: any = {
            amount: investment.amount,
            description: investment.description || '',
            purchase_date: investment.purchase_date,
            sale_date: investment.sale_date || null,
        };

        if (investment.investment_type === 'rendafixa') {
            formData.name = investment.name || '';
            formData.yield_rate = investment.yield_rate || 0;
            formData.tax_exempt = investment.tax_exempt || false;
        } else {
            formData.stock_uuid = investment.stock_uuid || '';
            formData.quantity = investment.quantity || 0;
            formData.unit_price = investment.unit_price || 0;
        }

        this.form.patchValue(formData);
        this.updateValidators();
        this.isOpen = true;
        setTimeout(() => this.modal?.nativeElement?.showModal(), 0);
    }

    /**
     * Fechar modal
     */
    close(): void {
        this.isOpen = false;
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
            toastService.error('Por favor, preencha todos os campos obrigatórios');
            return;
        }

        this.isLoading = true;

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
                    stock_uuid: formValue.stock_uuid,
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

            if (result.status && result.data) {
                toastService.success(
                    this.isEditing
                        ? 'Investimento atualizado com sucesso!'
                        : 'Investimento criado com sucesso!'
                );
                this.onSuccess.emit(result.data as Investment);
                this.close();
            } else {
                toastService.error(result.message || 'Erro ao salvar investimento');
            }
        } catch (error) {
            console.error('Erro ao salvar investimento:', error);
            toastService.error('Erro ao salvar investimento');
        } finally {
            this.isLoading = false;
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
}
