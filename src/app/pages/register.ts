import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { authService } from '../services/Auth';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './register.html',
  styleUrl: './register.css'
})
export class RegisterComponent {
  registerForm: FormGroup;
  submitted = false;
  loading = false;
  errorMessage = '';

  constructor(
    private formBuilder: FormBuilder,
    private router: Router
  ) {
    this.registerForm = this.formBuilder.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required]
    }, {
      validator: this.passwordMatchValidator
    });
  }

  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password');
    const confirmPassword = form.get('confirmPassword');
    
    if (password && confirmPassword && password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }
    return null;
  }

  // Getter para facilitar acesso aos campos do formulário
  get f() {
    return this.registerForm.controls;
  }

  onSubmit() {
    this.submitted = true;
    this.errorMessage = '';

    // Para se o formulário for inválido
    if (this.registerForm.invalid) {
      return;
    }

    this.loading = true;

    // Preparar dados para envio (remover confirmPassword)
    const { name, email, password } = this.registerForm.value;
    const registerData = { name, email, password };

    // Chamada ao serviço de autenticação
    authService.register(registerData)
      .then(response => {
        console.log('Cadastro realizado:', response);
        this.loading = false;
        // Redirecionar para dashboard após cadastro
        this.router.navigate(['/dashboard']);
      })
      .catch(error => {
        this.loading = false;
        this.errorMessage = error.message || 'Erro ao realizar cadastro. Tente novamente.';
        console.error('Erro no cadastro:', error);
      });
  }

  onReset() {
    this.submitted = false;
    this.registerForm.reset();
    this.errorMessage = '';
  }
}
