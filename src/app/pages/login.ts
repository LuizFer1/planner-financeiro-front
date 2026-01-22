import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { authService } from '../services/Auth';
import { ToastService } from '../services/Toast';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class LoginComponent {
  loginForm: FormGroup;
  submitted = false;
  loading = false;

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private toastService: ToastService,
    private cdr: ChangeDetectorRef
  ) {
    this.loginForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      remember_me: [false]
    });
  }

  get f() {
    return this.loginForm.controls;
  }

  onSubmit() {
    this.submitted = true;

    if (this.loginForm.invalid) {
      return;
    }

    this.loading = true;
    console.log('[LOGIN] Iniciando login, loading:', this.loading);

    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Tempo de requisição excedido. Tente novamente.')), 10000);
    });

    Promise.race([authService.login(this.loginForm.value), timeoutPromise])
      .then(() => {
        console.log('[LOGIN] Login bem-sucedido');
        this.toastService.success('Login realizado com sucesso!');
        setTimeout(() => {
          this.router.navigate(['/dashboard']);
        }, 500);
      })
      .catch(error => {
        console.log('[LOGIN] Erro no login:', error);
        const errorMsg = error.message || 'Erro ao fazer login. Verifique suas credenciais.';
        this.toastService.error(errorMsg);
      })
      .finally(() => {
        // Garante que o loading seja false e força detecção de mudanças
        this.loading = false;
        this.cdr.detectChanges();
        console.log('[LOGIN] Botão reativado, loading:', this.loading);
      });
  }
}
