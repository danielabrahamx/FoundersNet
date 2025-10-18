/**
 * Algorand Service
 * 
 * Clean service layer for Algorand blockchain interactions.
 * Uses Dependency Injection pattern for better testability.
 */

import algosdk from 'algosdk';
import { PeraWalletConnect } from '@perawallet/connect';
import { getConfig, getNetworkConfig } from '@/../../config';

/**
 * Algorand service interface
 */
export interface IAlgorandService {
  // Client access
  getAlgodClient(): algosdk.Algodv2;
  getIndexerClient(): algosdk.Indexer;
  
  // Wallet operations
  connectWallet(): Promise<string[]>;
  disconnectWallet(): Promise<void>;
  getConnectedAccounts(): string[];
  isWalletConnected(): boolean;
  
  // Utilities
  formatAddress(address: string): string;
  getExplorerUrl(type: 'address' | 'tx' | 'application', id: string): string;
}

/**
 * Algorand service implementation
 */
export class AlgorandService implements IAlgorandService {
  private algodClient: algosdk.Algodv2 | null = null;
  private indexerClient: algosdk.Indexer | null = null;
  private peraWallet: PeraWalletConnect | null = null;

  constructor() {
    // Lazy initialization - clients created on first use
  }

  /**
   * Get or create Algod client
   */
  getAlgodClient(): algosdk.Algodv2 {
    if (!this.algodClient) {
      const config = getConfig();
      const networkConfig = getNetworkConfig(config.network);
      
      this.algodClient = new algosdk.Algodv2(
        networkConfig.algod.token,
        networkConfig.algod.url,
        networkConfig.algod.port
      );
    }
    return this.algodClient;
  }

  /**
   * Get or create Indexer client
   */
  getIndexerClient(): algosdk.Indexer {
    if (!this.indexerClient) {
      const config = getConfig();
      const networkConfig = getNetworkConfig(config.network);
      
      this.indexerClient = new algosdk.Indexer(
        networkConfig.algod.token,
        networkConfig.indexer.url,
        networkConfig.indexer.port
      );
    }
    return this.indexerClient;
  }

  /**
   * Get or create Pera Wallet instance
   */
  private getPeraWallet(): PeraWalletConnect {
    if (!this.peraWallet) {
      const config = getConfig();
      const networkConfig = getNetworkConfig(config.network);
      
      this.peraWallet = new PeraWalletConnect({
        chainId: networkConfig.chainId,
      });
    }
    return this.peraWallet;
  }

  /**
   * Connect to Pera Wallet
   */
  async connectWallet(): Promise<string[]> {
    const wallet = this.getPeraWallet();
    
    try {
      // Check if already connected
      const existingAccounts = wallet.connector?.accounts || [];
      if (existingAccounts.length > 0) {
        return existingAccounts;
      }
      
      // Connect
      const accounts = await wallet.connect();
      return accounts;
    } catch (error: any) {
      // Handle session error by resetting wallet
      if (error?.message?.includes('Session currently connected')) {
        this.resetWallet();
        const newWallet = this.getPeraWallet();
        return await newWallet.connect();
      }
      throw error;
    }
  }

  /**
   * Disconnect from Pera Wallet
   */
  async disconnectWallet(): Promise<void> {
    const wallet = this.getPeraWallet();
    await wallet.disconnect();
  }

  /**
   * Check if wallet is connected
   */
  isWalletConnected(): boolean {
    return this.peraWallet?.isConnected ?? false;
  }

  /**
   * Get connected accounts
   */
  getConnectedAccounts(): string[] {
    return this.peraWallet?.connector?.accounts || [];
  }

  /**
   * Format address for display
   */
  formatAddress(address: string): string {
    if (address.length !== 58) return address;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }

  /**
   * Get explorer URL
   */
  getExplorerUrl(type: 'address' | 'tx' | 'application', id: string): string {
    const config = getConfig();
    const networkConfig = getNetworkConfig(config.network);
    const baseUrl = networkConfig.explorer.url;
    
    switch (type) {
      case 'address':
        return `${baseUrl}/address/${id}`;
      case 'tx':
        return `${baseUrl}/tx/${id}`;
      case 'application':
        return `${baseUrl}/application/${id}`;
      default:
        return baseUrl;
    }
  }

  /**
   * Reset wallet instance (for error recovery)
   */
  private resetWallet(): void {
    if (this.peraWallet) {
      try {
        this.peraWallet.disconnect();
      } catch {
        // Ignore errors
      }
    }
    this.peraWallet = null;
  }
}

/**
 * Singleton instance
 */
let serviceInstance: IAlgorandService | null = null;

/**
 * Get Algorand service instance
 */
export function getAlgorandService(): IAlgorandService {
  if (!serviceInstance) {
    serviceInstance = new AlgorandService();
  }
  return serviceInstance;
}

/**
 * Utility functions for conversions
 */
export const AlgorandUtils = {
  /**
   * Convert ALGO to microAlgos
   */
  algoToMicroAlgo(algo: number): number {
    return Math.floor(algo * 1_000_000);
  },

  /**
   * Convert microAlgos to ALGO
   */
  microAlgoToAlgo(microAlgo: number): number {
    return microAlgo / 1_000_000;
  },

  /**
   * Format microAlgos as ALGO string
   */
  formatAlgo(microAlgo: number, decimals: number = 2): string {
    return this.microAlgoToAlgo(microAlgo).toFixed(decimals);
  },
} as const;
