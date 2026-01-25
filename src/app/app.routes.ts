import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./pages/login').then(m => m.LoginComponent)
  },
  {
    path: 'register',
    loadComponent: () => import('./pages/register').then(m => m.RegisterComponent)
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./pages/dashboard').then(m => m.DashboardComponent),
    canActivate: [authGuard]
  },
  {
    path: 'movimentacoes',
    loadComponent: () => import('./pages/movimentacoes').then(m => m.MovimentacoesComponent),
    canActivate: [authGuard]
  },
  {
    path: 'investimentos',
    loadComponent: () => import('./pages/investimentos').then(m => m.InvestimentosComponent),
    canActivate: [authGuard]
  },
  {
    path: 'mercado',
    loadComponent: () => import('./pages/mercado').then(m => m.MercadoComponent),
    canActivate: [authGuard]
  },
  {
    path: '',
    redirectTo: '/login',
    pathMatch: 'full'
  }
];
