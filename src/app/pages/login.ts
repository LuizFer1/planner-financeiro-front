import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { authService } from '../services/Auth';

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
  errorMessage = '';

  constructor(
    private formBuilder: FormBuilder,
    private router: Router
  ) {
    this.loginForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      remember_me: [false]
    });
  }

  // Getter para facilitar acesso aos campos do formulário
  get f() {
    return this.loginForm.controls;
  }

  onSubmit() {
    this.submitted = true;
    this.errorMessage = '';

    // Para se o formulário for inválido
    if (this.loginForm.invalid) {
      return;
    }

    this.loading = true;

    // Chamada ao serviço de autenticação
    authService.login(this.loginForm.value)
      .then(response => {
        console.log('Login realizado:', response);
        this.loading = false;
        // Redirecionar para dashboard após login
        this.router.navigate(['/dashboard']);
      })
      .catch(error => {
        this.loading = false;
        this.errorMessage = error.message || 'Erro ao fazer login. Verifique suas credenciais.';
        console.error('Erro no login:', error);
      });
  }
}
