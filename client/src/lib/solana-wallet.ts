/**
 * Solana Wallet Utilities
 * 
 * Utilities for Solana wallet connection, management, and integration.
 * Provides type-safe wrappers around @solana/wallet-adapter packages.
 */

import { WalletAdapter, WalletError, WalletName } from '@solana/wallet-adapter-base';
import { PublicKey } from '@solana/web3.js';

/**
 * Wallet connection state
 */
export interface WalletState {
  connected: boolean;
  connecting: boolean;
  disconnecting: boolean;
  publicKey: PublicKey | null;
  wallet: WalletAdapter | null;
}

/**
 * Supported wallet types
 */
export const SUPPORTED_WALLETS = {
  PHANTOM: 'Phantom' as WalletName,
  SOLFLARE: 'Solflare' as WalletName,
  BACKPACK: 'Backpack' as WalletName,
  GLOW: 'Glow' as WalletName,
} as const;

/**
 * Wallet connection error types
 */
export enum WalletConnectionError {
  WALLET_NOT_FOUND = 'WALLET_NOT_FOUND',
  USER_REJECTED = 'USER_REJECTED',
  CONNECTION_FAILED = 'CONNECTION_FAILED',
  ALREADY_CONNECTED = 'ALREADY_CONNECTED',
  NOT_CONNECTED = 'NOT_CONNECTED',
  NETWORK_MISMATCH = 'NETWORK_MISMATCH',
}

/**
 * Custom error class for wallet operations
 */
export class WalletOperationError extends Error {
  constructor(
    public code: WalletConnectionError,
    message: string,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'WalletOperationError';
  }
}

/**
 * Check if a specific wallet is installed
 */
export function isWalletInstalled(walletName: WalletName): boolean {
  if (typeof window === 'undefined') return false;
  
  switch (walletName) {
    case SUPPORTED_WALLETS.PHANTOM:
      return !!(window as any).phantom?.solana?.isPhantom;
    case SUPPORTED_WALLETS.SOLFLARE:
      return !!(window as any).solflare?.isSolflare;
    case SUPPORTED_WALLETS.BACKPACK:
      return !!(window as any).backpack?.isBackpack;
    case SUPPORTED_WALLETS.GLOW:
      return !!(window as any).glow;
    default:
      return false;
  }
}

/**
 * Get list of installed wallets
 */
export function getInstalledWallets(): WalletName[] {
  return Object.values(SUPPORTED_WALLETS).filter(isWalletInstalled);
}

/**
 * Get wallet download URL
 */
export function getWalletDownloadUrl(walletName: WalletName): string {
  switch (walletName) {
    case SUPPORTED_WALLETS.PHANTOM:
      return 'https://phantom.app/download';
    case SUPPORTED_WALLETS.SOLFLARE:
      return 'https://solflare.com/download';
    case SUPPORTED_WALLETS.BACKPACK:
      return 'https://backpack.app';
    case SUPPORTED_WALLETS.GLOW:
      return 'https://glow.app';
    default:
      return 'https://solana.com/wallets';
  }
}

/**
 * Format wallet error for user display
 */
export function formatWalletError(error: WalletError | Error): string {
  if ('code' in error && error.code) {
    switch (error.code) {
      case 4001: // User rejected request
        return 'Connection request was rejected. Please try again.';
      case -32002: // Request pending
        return 'Connection request is pending. Please check your wallet.';
      case -32603: // Internal error
        return 'An internal error occurred. Please try again.';
      default:
        return error.message || 'An unknown wallet error occurred.';
    }
  }
  return error.message || 'An unknown error occurred.';
}

/**
 * Validate public key
 */
export function isValidPublicKey(address: string | PublicKey): boolean {
  try {
    if (typeof address === 'string') {
      new PublicKey(address);
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Format wallet address for display
 */
export function formatWalletAddress(
  publicKey: PublicKey | string,
  length: { start?: number; end?: number } = { start: 4, end: 4 }
): string {
  const address = typeof publicKey === 'string' ? publicKey : publicKey.toBase58();
  const start = length.start || 4;
  const end = length.end || 4;
  
  if (address.length <= start + end) {
    return address;
  }
  
  return `${address.slice(0, start)}...${address.slice(-end)}`;
}

/**
 * Wait for wallet to be ready (useful for detecting wallet injection)
 */
export async function waitForWallet(
  walletName: WalletName,
  timeout: number = 3000
): Promise<boolean> {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    if (isWalletInstalled(walletName)) {
      return true;
    }
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  return false;
}

/**
 * Get recommended wallet based on user agent and availability
 */
export function getRecommendedWallet(): WalletName | null {
  const installed = getInstalledWallets();
  
  if (installed.length === 0) {
    return null;
  }
  
  // Prefer Phantom as it's most popular
  if (installed.includes(SUPPORTED_WALLETS.PHANTOM)) {
    return SUPPORTED_WALLETS.PHANTOM;
  }
  
  // Then Solflare
  if (installed.includes(SUPPORTED_WALLETS.SOLFLARE)) {
    return SUPPORTED_WALLETS.SOLFLARE;
  }
  
  // Return first available
  return installed[0];
}

/**
 * Local storage keys for wallet preferences
 */
export const STORAGE_KEYS = {
  SELECTED_WALLET: 'solana_selected_wallet',
  AUTO_CONNECT: 'solana_auto_connect',
} as const;

/**
 * Save wallet preference to local storage
 */
export function saveWalletPreference(walletName: WalletName): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEYS.SELECTED_WALLET, walletName);
  } catch (error) {
    console.warn('Failed to save wallet preference:', error);
  }
}

/**
 * Get saved wallet preference from local storage
 */
export function getSavedWalletPreference(): WalletName | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(STORAGE_KEYS.SELECTED_WALLET) as WalletName | null;
  } catch (error) {
    console.warn('Failed to get wallet preference:', error);
    return null;
  }
}

/**
 * Clear wallet preference from local storage
 */
export function clearWalletPreference(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEYS.SELECTED_WALLET);
  } catch (error) {
    console.warn('Failed to clear wallet preference:', error);
  }
}

/**
 * Save auto-connect preference
 */
export function saveAutoConnectPreference(autoConnect: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEYS.AUTO_CONNECT, String(autoConnect));
  } catch (error) {
    console.warn('Failed to save auto-connect preference:', error);
  }
}

/**
 * Get auto-connect preference
 */
export function getAutoConnectPreference(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const value = localStorage.getItem(STORAGE_KEYS.AUTO_CONNECT);
    return value === 'true';
  } catch (error) {
    console.warn('Failed to get auto-connect preference:', error);
    return false;
  }
}

/**
 * Wallet info for UI display
 */
export interface WalletInfo {
  name: WalletName;
  displayName: string;
  icon: string;
  installed: boolean;
  downloadUrl: string;
}

/**
 * Get wallet information for UI
 */
export function getWalletInfo(walletName: WalletName): WalletInfo {
  return {
    name: walletName,
    displayName: walletName,
    icon: getWalletIcon(walletName),
    installed: isWalletInstalled(walletName),
    downloadUrl: getWalletDownloadUrl(walletName),
  };
}

/**
 * Get wallet icon URL (placeholder - replace with actual URLs)
 */
function getWalletIcon(walletName: WalletName): string {
  const icons: Record<string, string> = {
    [SUPPORTED_WALLETS.PHANTOM]: 'https://phantom.app/img/logo.png',
    [SUPPORTED_WALLETS.SOLFLARE]: 'https://solflare.com/logo.png',
    [SUPPORTED_WALLETS.BACKPACK]: 'https://backpack.app/logo.png',
    [SUPPORTED_WALLETS.GLOW]: 'https://glow.app/logo.png',
  };
  return icons[walletName] || '';
}

/**
 * Get all supported wallets with info
 */
export function getAllWalletInfo(): WalletInfo[] {
  return Object.values(SUPPORTED_WALLETS).map(getWalletInfo);
}
