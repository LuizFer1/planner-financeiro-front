import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { SidebarComponent } from '../shared/components/sidebar/sidebar';
import { authService } from '../services/Auth';
import { marketService } from '../services/Market';
import { cryptoService } from '../services/CryptoService';
import type { Stock } from '../services/Market';
import type { Crypto } from '../services/CryptoService';
import type { CryptoResponse} from '../services/CryptoService'

interface MarketAsset {
  uuid: string;
  stock_symbol?: string;
  stock_name?: string;
  symbol: string;
  name: string;
  sector?: string;
  type: 'stock' | 'crypto' | 'index';
  current_price: string;
  previous_close?: string;
  variation_percent?: string;
  price: number;
  change: number;
  changePercent: number;
  volume?: number;
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
  }

  ngOnInit(): void {
    this.checkMarketStatus();
    this.loadStats();
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
    
    const marketOpen = 10 * 60;
    const marketClose = 17 * 60 + 55;
    
    this.isMarketOpen = dayOfWeek >= 1 && dayOfWeek <= 5 && currentTime >= marketOpen && currentTime <= marketClose;
  }

  loadStats(): void {
    marketService.getVariation()
      .then(response => {
        const statsData = response.data;
        this.stats = {
          up: parseInt(String(statsData?.up || 0), 10) || 0,
          down: parseInt(String(statsData?.down || 0), 10) || 0,
          total_assets: parseInt(String(statsData?.total_assets || 0), 10) || 0
        };
        this.cdr.markForCheck();
      })
      .catch(error => {
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
      .catch(() => {
      })
      .finally(() => {
        this.stocksLoading = false;
      });
  }
  loadCryptos(): void {
    this.cryptosLoading = true;
    cryptoService.list()
      .then((response: CryptoResponse) => {
        const apiData = response.data;
        const data = apiData || [];
        
        this.cryptos = data.map((crypto: Crypto) => this.mapAsset(crypto, 'crypto'));
        this.cdr.markForCheck();
      })
      .catch(() => {
      })
      .finally(() => {
        this.cryptosLoading = false;
      });
  }

  mapAsset(asset: any, defaultType: 'stock' | 'crypto' | 'index'): MarketAsset {
    const symbol = asset.stock_symbol || asset.symbol || '';
    const name = asset.stock_name || asset.name || '';
    
    // Preço: current_price (stocks) ou latest_price (cryptos)
    const rawPrice = asset.current_price ?? asset.latest_price ?? asset.price ?? '0';
    const price = typeof rawPrice === 'number' ? rawPrice : parseFloat(String(rawPrice)) || 0;
    
    // Variação percentual: variation_percent, change_percent, price_change_percent, changePercent
    const rawChangePercent = asset.variation_percent ?? 
                            asset.change_percent ?? 
                            asset.price_change_percent ?? 
                            asset.changePercent ?? 
                            '0';
    const changePercent = typeof rawChangePercent === 'number' ? rawChangePercent : parseFloat(String(rawChangePercent)) || 0;
    
    // Variação absoluta: price_change (cryptos) ou calculada (stocks)
    let change = 0;
    if (asset.price_change !== undefined && asset.price_change !== null) {
      change = typeof asset.price_change === 'number' ? asset.price_change : parseFloat(String(asset.price_change)) || 0;
    } else {
      // Cálculo: se temos o preço anterior em algum campo
      const previousPrice = asset.previous_close || asset.previous_price;
      if (previousPrice) {
        const prev = typeof previousPrice === 'number' ? previousPrice : parseFloat(String(previousPrice));
        change = price - prev;
      } else {
        change = price * (changePercent / 100);
      }
    }

    const volume = parseInt(String(asset.volume || asset.trade_volume || '0'), 10) || 0;

    return {
      ...asset,
      uuid: asset.uuid,
      symbol,
      name,
      type: defaultType,
      price,
      current_price: String(price),
      change,
      changePercent,
      volume
    } as any;
  }

  getStocksPageNumbers(): number[] {
    return this.getPageNumbers(this.stocksPage, this.stocksTotalPages);
  }

  goToStocksPage(page: number): void {
    this.loadStocks(page);
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
      .then(() => {
        // TODO: Mostrar modal ou navegar para página de detalhes
      })
      .catch(() => {
        // Erro ao carregar detalhes
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
