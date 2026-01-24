import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { revenueService } from '../../../services/Revenue';
import { expenseService } from '../../../services/Expense';
import type { TransactionData } from '../../../services/Revenue';

@Component({
  selector: 'app-transaction-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './transaction-modal.html',
  styleUrl: './transaction-modal.css'
})
export class TransactionModalComponent {
  @Output() onClose = new EventEmitter<void>();
  @Output() onSuccess = new EventEmitter<void>();

  transactionForm: FormGroup;
  isOpen = false;
  isLoading = false;
  errorMessage = '';
  successMessage = '';

  transactionType: 'revenue' | 'expense' = 'revenue';
  
  revenueCategories = [
    { uuid: 'cat-1', name: 'Salário' },
    { uuid: 'cat-3', name: 'Outros' }
  ];

  expenseCategories = [
    { uuid: 'exp-1', name: 'Alimentação' },
    { uuid: 'exp-2', name: 'Transporte' },
    { uuid: 'exp-3', name: 'Moradia' },
    { uuid: 'exp-4', name: 'Saúde' },
    { uuid: 'exp-5', name: 'Lazer' },
    { uuid: 'exp-6', name: 'Outros' }
  ];

  get categories() {
    return this.transactionType === 'revenue' ? this.revenueCategories : this.expenseCategories;
  }

  constructor(private formBuilder: FormBuilder) {
    this.transactionForm = this.formBuilder.group({
      amount: ['', [Validators.required, Validators.min(0.01)]],
      category_uuid: ['', Validators.required],
      description: [''],
      transaction_date: [new Date().toISOString().split('T')[0], Validators.required]
    });
  }

  open(type: 'revenue' | 'expense' = 'revenue'): void {
    this.transactionType = type;
    this.isOpen = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.transactionForm.reset({
      transaction_date: new Date().toISOString().split('T')[0]
    });
  }

  close(): void {
    this.isOpen = false;
    this.onClose.emit();
  }

  async onSubmit(): Promise<void> {
    if (this.transactionForm.invalid) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    try {
      const formData: TransactionData = this.transactionForm.value;

      if (this.transactionType === 'revenue') {
        await revenueService.create(formData);
      } else {
        await expenseService.create(formData);
      }

      this.successMessage = `${this.transactionType === 'revenue' ? 'Receita' : 'Despesa'} adicionada com sucesso!`;
      
      setTimeout(() => {
        this.transactionForm.reset({
          transaction_date: new Date().toISOString().split('T')[0]
        });
        this.close();
        this.onSuccess.emit();
      }, 1500);
    } catch (error) {
      this.errorMessage = error instanceof Error ? error.message : 'Erro ao adicionar transação';
    } finally {
      this.isLoading = false;
    }
  }

  get f() {
    return this.transactionForm.controls;
  }

  switchType(type: 'revenue' | 'expense'): void {
    this.transactionType = type;
    this.transactionForm.patchValue({ category_uuid: '' });
    this.errorMessage = '';
  }
}
