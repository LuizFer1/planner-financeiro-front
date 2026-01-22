import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { SidebarComponent } from '../shared/components/sidebar/sidebar';
import { authService } from '../services/Auth';
import { marketService } from '../services/Market';
import type { Stock } from '../services/Market';

interface MarketAsset {
  uuid: string;
  stock_symbol: string;
  stock_name: string;
  symbol: string;
  name: string;
  sector?: string;
  type: 'stock' | 'crypto' | 'index';
  current_price: string;
  previous_close?: string;
  variation_percent: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  market_cap?: string;
  updated_at?: string;
  created_at?: string;
}

@Component({
  selector: 'app-mercado',
  standalone: true,
  imports: [CommonModule, RouterModule, SidebarComponent],
  templateUrl: './mercado.html',
  styleUrl: './mercado.css'
})
export class MercadoComponent implements OnInit {
  isLoading = true;
  errorMessage = '';
  stats: { up: number; down: number; total_assets: number } = { up: 0, down: 0, total_assets: 0 };
  isMarketOpen = false;
  
  stocks: MarketAsset[] = [];
  stocksPage = 1;
  stocksTotalPages = 1;
  stocksTotal = 0;
  stocksPerPage = 15;
  stocksLoading = false;
  
  indices: MarketAsset[] = [];
  indicesLoading = false;
  
  cryptos: MarketAsset[] = [];
  cryptosPage = 1;
  cryptosTotalPages = 1;
  cryptosPerPage = 5;
  cryptosLoading = false;

  constructor(private router: Router, private cdr: ChangeDetectorRef) {
    console.log('=== MercadoComponent Constructor ===');
  }

  ngOnInit(): void {
    console.log('=== ngOnInit Mercado ===');
    this.checkMarketStatus();
    this.loadStats();
    this.loadIndices();
    this.loadStocks();
    this.loadCryptos();
    
    setInterval(() => {
      this.checkMarketStatus();
    }, 60000);
  }

  checkMarketStatus(): void {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const currentTime = hours * 60 + minutes;
    
    const marketOpen = 10 * 60; // 10:00 = 600 minutos
    const marketClose = 17 * 60 + 55; // 17:55 = 1075 minutos
    
    this.isMarketOpen = dayOfWeek >= 1 && dayOfWeek <= 5 && currentTime >= marketOpen && currentTime <= marketClose;
    
    console.log('Status do mercado:', {
      dia: dayOfWeek,
      hora: `${hours}:${minutes}`,
      aberto: this.isMarketOpen
    });
  }

  loadStats(): void {
    console.log('=== Iniciando carregamento de estatísticas ===');
    console.log('marketService:', marketService);
    console.log('marketService.getVariation:', marketService.getVariation);
    
    marketService.getVariation()
      .then(response => {
        console.log('Stats response:', response);
        const statsData = response.data;
        this.stats = {
          up: parseInt(String(statsData?.up || 0), 10) || 0,
          down: parseInt(String(statsData?.down || 0), 10) || 0,
          total_assets: parseInt(String(statsData?.total_assets || 0), 10) || 0
        };
        console.log('Stats carregadas:', this.stats);
        this.cdr.markForCheck();
      })
      .catch(error => {
        console.error('Erro ao carregar estatísticas:', error);
        this.stats = { up: 0, down: 0, total_assets: 0 };
      });
  }

  loadStocks(page: number = 1): void {
    this.stocksLoading = true;
    this.stocksPage = page;

    marketService.list({ 
      page, 
      limit: this.stocksPerPage, 
      type: 'stock',
      orderBy: 'volume',
      orderDirection: 'DESC'
    })
      .then(response => {
        const apiData = response.data;
        const data = apiData?.data || [];
        
        this.stocks = data.map((stock: any) => this.mapAsset(stock, 'stock'));
        this.stocksTotalPages = apiData?.pagination?.total_pages || 1;
        this.stocksTotal = apiData?.pagination?.total || 0;
        this.cdr.markForCheck();
      })
      .catch(error => {
        console.error('Erro ao carregar ações:', error);
      })
      .finally(() => {
        this.stocksLoading = false;
      });
  }

  loadIndices(): void {
    this.indicesLoading = true;

    setTimeout(() => {
      this.indices = [];
      this.indicesLoading = false;
      this.cdr.markForCheck();
    }, 500);
  }

  loadCryptos(page: number = 1): void {
    this.cryptosLoading = true;
    this.cryptosPage = page;

    setTimeout(() => {
      this.cryptos = [];
      this.cryptosTotalPages = 0;
      this.cryptosLoading = false;
      this.cdr.markForCheck();
    }, 500);
  }

  mapAsset(stock: any, defaultType: 'stock' | 'crypto' | 'index'): MarketAsset {
    const symbol = stock.stock_symbol || stock.symbol || '';
    const name = stock.stock_name || stock.name || '';
    const price = parseFloat(stock.current_price || stock.price || '0');
    const variationPercent = parseFloat(stock.variation_percent || stock.changePercent || '0');
    const volume = parseInt(stock.volume || stock.trade_volume || '0', 10);
    const changeValue = price * (variationPercent / 100);

    return {
      ...stock,
      uuid: stock.uuid,
      symbol,
      name,
      type: defaultType,
      price,
      current_price: price,
      change: changeValue,
      changePercent: variationPercent,
      volume
    } as any;
  }

  getStocksPageNumbers(): number[] {
    return this.getPageNumbers(this.stocksPage, this.stocksTotalPages);
  }

  goToStocksPage(page: number): void {
    this.loadStocks(page);
  }

  getCryptosPageNumbers(): number[] {
    return this.getPageNumbers(this.cryptosPage, this.cryptosTotalPages);
  }

  goToCryptosPage(page: number): void {
    this.loadCryptos(page);
  }

  getPageNumbers(currentPage: number, totalPages: number): number[] {
    if (totalPages <= 1) return [];
    
    const pages: number[] = [];
    const maxVisible = 7;
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      const halfVisible = Math.floor(maxVisible / 2);
      let start = Math.max(1, currentPage - halfVisible);
      let end = Math.min(totalPages, currentPage + halfVisible);
      
      if (currentPage <= halfVisible) {
        end = maxVisible;
      }
      
      if (currentPage >= totalPages - halfVisible) {
        start = totalPages - maxVisible + 1;
      }
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
    }
    
    return pages;
  }

  get totalAssets(): number {
    return this.stats.total_assets;
  }

  viewDetails(asset: MarketAsset): void {
    marketService.get(asset.uuid)
      .then(response => {
        // TODO: Mostrar modal ou navegar para página de detalhes
      })
      .catch(error => {
        console.error('Erro ao carregar detalhes:', error);
      });
  }

  addToWatchlist(asset: MarketAsset): void {
    // TODO: Implementar lista de observação
  }

  trackByUuid(_index: number, asset: MarketAsset): string {
    return asset.uuid;
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
