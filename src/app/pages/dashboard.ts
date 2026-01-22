import { Component, OnInit, ViewChild, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SidebarComponent } from '../shared/components/sidebar/sidebar';
import { LoadingSpinnerComponent } from '../shared/components/loading-spinner/loading-spinner';
import { ErrorMessageComponent } from '../shared/components/error-message/error-message';
import { EmptyStateComponent } from '../shared/components/empty-state/empty-state';
import { TransactionModalComponent } from '../shared/components/transaction-modal/transaction-modal';
import { authService } from '../services/Auth';
import { revenueService } from '../services/Revenue';
import { expenseService } from '../services/Expense';
import { investmentService } from '../services/Investiments';
import type { Transaction } from '../services/Revenue';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, SidebarComponent, LoadingSpinnerComponent, ErrorMessageComponent, EmptyStateComponent, TransactionModalComponent],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class DashboardComponent implements OnInit {
  @ViewChild(TransactionModalComponent) transactionModal!: TransactionModalComponent;

  isLoading = false;
  hasError = false;
  errorMessage = '';
  developmentMessage = '';

  balance = 0;
  received = 0;
  spent = 0;
  invested = 0;

  transactions: any[] = [];

  // Gráfico de linhas
  chartPeriod: 'week' | 'month' | 'year' = 'month';
  chartData: { label: string; revenues: number; expenses: number }[] = [];
  
  // Gráfico de pizza
  pieChartData: { category: string; amount: number; percentage: number; color: string }[] = [];
  
  // Top categorias
  topRevenueCategories: { category: string; amount: number }[] = [];
  topExpenseCategories: { category: string; amount: number }[] = [];
  
  // Arrays de categorias
  revenueCategories = [
    { uuid: 'cat-1', name: 'Salário' },
    { uuid: 'cat-3', name: 'Outros' }
  ];

  expenseCategories: { uuid?: string; name: string; color?: string; value?: number }[] = [
    { uuid: 'exp-1', name: 'Alimentação' },
    { uuid: 'exp-2', name: 'Transporte' },
    { uuid: 'exp-3', name: 'Moradia' },
    { uuid: 'exp-4', name: 'Saúde' },
    { uuid: 'exp-5', name: 'Lazer' },
    { uuid: 'exp-6', name: 'Outros' }
  ];
  
  // Tooltip
  tooltipVisible = false;
  tooltipContent = '';
  tooltipX = 0;
  tooltipY = 0;
  
  // Expor Math para o template
  Math = Math;
  
  // Getters para dados dos gráficos
  get expensesData(): number[] {
    return this.chartData.map(d => d.expenses);
  }
  
  get revenuesData(): number[] {
    return this.chartData.map(d => d.revenues);
  }
  
  constructor(
    private router: Router,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone
  ) {}

  formatCurrency(value: number | string): string {
    let numValue = 0;
    
    if (typeof value === 'string') {
      const cleanValue = value.replace(/[^\d,.-]/g, '');
      if (cleanValue.includes(',')) {
        numValue = parseFloat(cleanValue.replace(/\./g, '').replace(',', '.')) || 0;
      } else {
        numValue = parseFloat(cleanValue) || 0;
      }
    } else {
      numValue = parseFloat(String(value)) || 0;
    }
    
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(numValue);
  }

  getCategoryName(categoryUuid: string, type: 'income' | 'expense'): string {
    const categories = type === 'income' ? this.revenueCategories : this.expenseCategories;
    const category = categories.find(cat => cat.uuid === categoryUuid);
    return category ? category.name : 'Outros';
  }

  calculateChartData(revenues?: any[], expenses?: any[]): void {
    const now = new Date();
    const labels: string[] = [];
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      labels.push(date.toLocaleDateString('pt-BR', { weekday: 'short' }));
    }
    
    if (revenues && expenses) {
      this.chartData = labels.map((label, index) => {
        const periodData = this.getDataForPeriod(index, revenues, expenses);
        return {
          label,
          revenues: periodData.revenues,
          expenses: periodData.expenses
        };
      });
    } else {
      this.chartData = labels.map((label, index) => ({
        label,
        revenues: Math.random() * 5000 + 1000,
        expenses: Math.random() * 4000 + 1000
      }));
    }
    
    console.log('[DASHBOARD] Chart data calculated:', this.chartData.length, 'points');
    this.cdr.detectChanges();
  }

  getDataForPeriod(periodIndex: number, revenues: any[], expenses: any[]): { revenues: number; expenses: number } {
    const now = new Date();
    
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - (6 - periodIndex));
    startDate.setHours(0, 0, 0, 0);
    
    const endDate = new Date(startDate);
    endDate.setHours(23, 59, 59, 999);
    
    const periodRevenues = revenues.filter((r: any) => {
      const date = new Date(r.transaction_date || r.date);
      return date >= startDate && date <= endDate;
    }).reduce((sum: number, r: any) => sum + parseFloat(String(r.amount || 0)), 0);
    
    const periodExpenses = expenses.filter((e: any) => {
      const date = new Date(e.transaction_date || e.date);
      return date >= startDate && date <= endDate;
    }).reduce((sum: number, e: any) => sum + parseFloat(String(e.amount || 0)), 0);
    
    return { revenues: periodRevenues, expenses: periodExpenses };
  }

  calculatePieChartData(expenses: any[]): void {
    if (!expenses || expenses.length === 0) {
      this.pieChartData = [{
        category: 'Sem dados',
        amount: this.spent || 50,
        percentage: 100,
        color: '#e2e8f0'
      }];
      console.log('[DASHBOARD] Pie chart with default data');
      this.cdr.detectChanges();
      return;
    }
    
    const categories = new Map<string, number>();
    
    expenses.forEach((expense: any) => {
      const categoryName = this.getCategoryName(expense.category_uuid, 'expense');
      const amount = parseFloat(String(expense.amount || 0));
      categories.set(categoryName, (categories.get(categoryName) || 0) + amount);
    });
    
    const total = Array.from(categories.values()).reduce((sum, val) => sum + val, 0);
    
    if (total === 0) {
      this.pieChartData = [{
        category: 'Sem dados',
        amount: this.spent || 50,
        percentage: 100,
        color: '#e2e8f0'
      }];
      console.log('[DASHBOARD] Pie chart with default data (zero total)');
      this.cdr.detectChanges();
      return;
    }
    
    const colors = ['#0066cc', '#10b981', '#6366f1', '#f59e0b', '#ef4444', '#8b5cf6'];
    
    this.pieChartData = Array.from(categories.entries())
      .map(([category, amount], index) => ({
        category,
        amount,
        percentage: (amount / total) * 100,
        color: colors[index % colors.length]
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 6);
    
    console.log('[DASHBOARD] Pie chart data calculated:', this.pieChartData.length, 'categories');
    this.cdr.detectChanges();
  }

  calculateTopCategories(revenues: any[], expenses: any[]): void {
    // Top Receitas
    const revenueCategories = new Map<string, number>();
    revenues.forEach((revenue: any) => {
      const categoryName = this.getCategoryName(revenue.category_uuid, 'income');
      const amount = parseFloat(String(revenue.amount || 0));
      revenueCategories.set(categoryName, (revenueCategories.get(categoryName) || 0) + amount);
    });
    
    this.topRevenueCategories = Array.from(revenueCategories.entries())
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
    
    // Top Despesas
    const expenseCategories = new Map<string, number>();
    expenses.forEach((expense: any) => {
      const categoryName = this.getCategoryName(expense.category_uuid, 'expense');
      const amount = parseFloat(String(expense.amount || 0));
      expenseCategories.set(categoryName, (expenseCategories.get(categoryName) || 0) + amount);
    });
    
    this.topExpenseCategories = Array.from(expenseCategories.entries())
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
    
    console.log('[DASHBOARD] Top categories calculated: revenues:', this.topRevenueCategories.length, 'expenses:', this.topExpenseCategories.length);
    this.cdr.detectChanges();
  }

  getChartPoints(data: number[], maxHeight: number = 150): string {
    if (data.length === 0) {
      console.log('[DASHBOARD] getChartPoints: no data');
      return '';
    }
    
    const max = Math.max(...data, 1);
    const width = 87; // 95 - 8 (margem)
    const step = width / (data.length - 1 || 1);
    const offsetX = 8; // margem esquerda
    const minY = 10; // topo
    const maxY = 80; // fundo
    const chartHeight = maxY - minY;
    
    const points = data.map((value, index) => {
      const x = offsetX + (index * step);
      const normalizedValue = value / max;
      const y = maxY - (normalizedValue * chartHeight);
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    }).join(' ');
    
    console.log('[DASHBOARD] getChartPoints:', data.length, 'points, max:', max.toFixed(2));
    return points;
  }

  getChartPointX(index: number): number {
    if (this.chartData.length === 0) return 0;
    const width = 87;
    const step = width / (this.chartData.length - 1 || 1);
    return index * step;
  }

  getChartPointY(value: number, maxValue: number): number {
    if (maxValue === 0) return 80;
    const minY = 10;
    const maxY = 80;
    const chartHeight = maxY - minY;
    const normalizedValue = value / maxValue;
    return maxY - (normalizedValue * chartHeight);
  }

  // Métodos para gráfico de barras
  getMaxValue(): number {
    if (this.chartData.length === 0) return 1;
    const maxRevenue = Math.max(...this.chartData.map(d => d.revenues), 0);
    const maxExpense = Math.max(...this.chartData.map(d => d.expenses), 0);
    return Math.max(maxRevenue, maxExpense, 1);
  }

  getBarWidth(): number {
    const totalWidth = 143; // 155 - 12 (largura útil)
    const groupCount = this.chartData.length || 1;
    const groupWidth = totalWidth / groupCount;
    const barWidth = (groupWidth * 0.35); // 35% do espaço do grupo para cada barra
    return barWidth;
  }

  getBarX(index: number, barIndex: number): number {
    const totalWidth = 143;
    const groupCount = this.chartData.length || 1;
    const groupWidth = totalWidth / groupCount;
    const barWidth = this.getBarWidth();
    const groupStart = 12 + (index * groupWidth);
    const spacing = barWidth * 0.15; // espaçamento entre barras
    return groupStart + (barIndex * (barWidth + spacing)) + (groupWidth * 0.15);
  }

  getBarY(value: number, maxValue: number): number {
    if (maxValue === 0) return 80;
    const minY = 10;
    const maxY = 80;
    const chartHeight = maxY - minY;
    const normalizedValue = value / maxValue;
    return maxY - (normalizedValue * chartHeight);
  }

  getBarHeight(value: number, maxValue: number): number {
    if (maxValue === 0) return 0;
    const minY = 10;
    const maxY = 80;
    const chartHeight = maxY - minY;
    const normalizedValue = value / maxValue;
    return normalizedValue * chartHeight;
  }

  getBarGroupCenter(index: number): number {
    const totalWidth = 143;
    const groupCount = this.chartData.length || 1;
    const groupWidth = totalWidth / groupCount;
    return 12 + (index * groupWidth) + (groupWidth / 2);
  }

  getMaxRevenues(): number {
    if (this.chartData.length === 0) return 1;
    return Math.max(...this.chartData.map(d => d.revenues), 1);
  }

  getMaxExpenses(): number {
    if (this.chartData.length === 0) return 1;
    return Math.max(...this.chartData.map(d => d.expenses), 1);
  }

  getPieSlicePath(index: number): string {
    if (this.pieChartData.length === 0) {
      console.log('[DASHBOARD] getPieSlicePath: no pie data');
      return '';
    }
    
    let startAngle = 0;
    for (let i = 0; i < index; i++) {
      startAngle += (this.pieChartData[i].percentage / 100) * 2 * Math.PI;
    }
    
    const angle = (this.pieChartData[index].percentage / 100) * 2 * Math.PI;
    const endAngle = startAngle + angle;
    
    const radius = 80;
    const cx = 100;
    const cy = 100;
    
    const x1 = cx + radius * Math.cos(startAngle - Math.PI / 2);
    const y1 = cy + radius * Math.sin(startAngle - Math.PI / 2);
    const x2 = cx + radius * Math.cos(endAngle - Math.PI / 2);
    const y2 = cy + radius * Math.sin(endAngle - Math.PI / 2);
    
    const largeArc = angle > Math.PI ? 1 : 0;
    
    const path = `M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;
    console.log(`[DASHBOARD] getPieSlicePath[${index}]:`, path.substring(0, 30) + '...');
    return path;
  }

  showTooltip(event: MouseEvent, content: string): void {
    this.tooltipVisible = true;
    this.tooltipContent = content;
    this.tooltipX = event.clientX + 10;
    this.tooltipY = event.clientY + 10;
  }

  hideTooltip(): void {
    this.tooltipVisible = false;
  }

  ngOnInit(): void {
    // Inicializar dados dos gráficos imediatamente
    this.calculateChartData();
    
    // Verificar se há mensagem de desenvolvimento vinda do guard
    const navigation = this.router.getCurrentNavigation();
    if (navigation?.extras?.state?.['message']) {
      this.developmentMessage = navigation.extras.state['message'];
      // Limpar mensagem após 5 segundos
      setTimeout(() => {
        this.developmentMessage = '';
        this.cdr.detectChanges();
      }, 5000);
    }
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    this.isLoading = true;
    this.hasError = false;
    this.errorMessage = '';

    Promise.allSettled([
      revenueService.list(),
      expenseService.list(),
      investmentService.list()
    ])
      .then(([revenuesResult, expensesResult, investmentsResult]) => {
        this.ngZone.run(() => {
          try {
            const revenuesResponse = revenuesResult.status === 'fulfilled' ? revenuesResult.value : null;
            const expensesResponse = expensesResult.status === 'fulfilled' ? expensesResult.value : null;
            const investmentsResponse = investmentsResult.status === 'fulfilled' ? investmentsResult.value : null;

            this.received = revenuesResponse?.data ? revenuesResponse.data.reduce((sum: number, t: any) => sum + parseFloat(String(t.amount || 0)), 0) : 0;
            this.spent = expensesResponse?.data ? expensesResponse.data.reduce((sum: number, t: any) => sum + parseFloat(String(t.amount || 0)), 0) : 0;
            this.invested = investmentsResponse?.data ? investmentsResponse.data.reduce((sum: number, t: any) => sum + parseFloat(String(t.amount || 0)), 0) : 0;
            this.balance = this.received - this.spent;

            const allTransactions = [
              ...(revenuesResponse?.data?.slice(0, 3).map((r: any) => ({ ...r, type: 'income' })) || []),
              ...(expensesResponse?.data?.slice(0, 3).map((e: any) => ({ ...e, type: 'expense' })) || [])
            ].sort((a: any, b: any) => 
              new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime()
            );
            
            this.transactions = allTransactions.slice(0, 5);
            
            // Calcular dados dos gráficos com dados reais
            this.calculateChartData(
              revenuesResponse?.data || [],
              expensesResponse?.data || []
            );
            
            if (expensesResponse?.data) {
              this.calculatePieChartData(expensesResponse.data);
            } else {
              this.calculatePieChartData([]);
            }
            
            // Calcular top categorias
            this.calculateTopCategories(
              revenuesResponse?.data || [],
              expensesResponse?.data || []
            );
            
            if (revenuesResult.status === 'rejected' || expensesResult.status === 'rejected' || investmentsResult.status === 'rejected') {
              this.hasError = true;
              this.errorMessage = 'Alguns dados não puderam ser carregados';
            }
          } catch (error) {
            this.hasError = true;
            this.errorMessage = 'Erro ao processar dados do dashboard';
          } finally {
            this.isLoading = false;
            this.cdr.detectChanges();
          }
        });
      })
      .catch(error => {
        this.ngZone.run(() => {
          this.hasError = true;
          this.errorMessage = 'Erro ao carregar dados do dashboard';
          this.isLoading = false;
          this.cdr.detectChanges();
        });
      });
  }

  retryLoad(): void {
    this.loadDashboardData();
  }

  addTransaction(): void {
    this.transactionModal.open('revenue');
  }

  onTransactionSuccess(): void {
    this.loadDashboardData();
  }

  logout(): void {
    authService.logout()
      .then(() => {
        this.router.navigate(['/login']);
      })
      .catch(() => {
        this.router.navigate(['/login']);
      });
  }
}
