/**
 * Unit Tests for Solana Wallet Utilities
 * 
 * Tests for wallet connection, management, and utility functions.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PublicKey } from '@solana/web3.js';
import {
  SUPPORTED_WALLETS,
  WalletConnectionError,
  WalletOperationError,
  isWalletInstalled,
  getInstalledWallets,
  getWalletDownloadUrl,
  formatWalletError,
  isValidPublicKey,
  formatWalletAddress,
  getRecommendedWallet,
  saveWalletPreference,
  getSavedWalletPreference,
  clearWalletPreference,
  saveAutoConnectPreference,
  getAutoConnectPreference,
  getWalletInfo,
  getAllWalletInfo,
  waitForWallet,
} from '@/lib/solana-wallet';

// Mock window object for wallet detection
const mockWindow = (wallets: Partial<Record<string, any>> = {}) => {
  global.window = {
    phantom: wallets.phantom,
    solflare: wallets.solflare,
    backpack: wallets.backpack,
    glow: wallets.glow,
  } as any;
};

// Mock localStorage
const mockLocalStorage = () => {
  const storage: Record<string, string> = {};
  
  return {
    getItem: vi.fn((key: string) => storage[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      storage[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete storage[key];
    }),
    clear: vi.fn(() => {
      Object.keys(storage).forEach(key => delete storage[key]);
    }),
    storage,
  };
};

describe('Solana Wallet Utilities', () => {
  beforeEach(() => {
    // Reset window and localStorage before each test
    mockWindow({});
    const localStorage = mockLocalStorage();
    global.localStorage = localStorage as any;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('isWalletInstalled', () => {
    it('should detect Phantom wallet when installed', () => {
      mockWindow({
        phantom: { solana: { isPhantom: true } },
      });
      
      expect(isWalletInstalled(SUPPORTED_WALLETS.PHANTOM)).toBe(true);
    });

    it('should detect Solflare wallet when installed', () => {
      mockWindow({
        solflare: { isSolflare: true },
      });
      
      expect(isWalletInstalled(SUPPORTED_WALLETS.SOLFLARE)).toBe(true);
    });

    it('should detect Backpack wallet when installed', () => {
      mockWindow({
        backpack: { isBackpack: true },
      });
      
      expect(isWalletInstalled(SUPPORTED_WALLETS.BACKPACK)).toBe(true);
    });

    it('should detect Glow wallet when installed', () => {
      mockWindow({
        glow: {},
      });
      
      expect(isWalletInstalled(SUPPORTED_WALLETS.GLOW)).toBe(true);
    });

    it('should return false when wallet is not installed', () => {
      mockWindow({});
      
      expect(isWalletInstalled(SUPPORTED_WALLETS.PHANTOM)).toBe(false);
      expect(isWalletInstalled(SUPPORTED_WALLETS.SOLFLARE)).toBe(false);
    });
  });

  describe('getInstalledWallets', () => {
    it('should return empty array when no wallets installed', () => {
      mockWindow({});
      
      const installed = getInstalledWallets();
      expect(installed).toEqual([]);
    });

    it('should return only installed wallets', () => {
      mockWindow({
        phantom: { solana: { isPhantom: true } },
        solflare: { isSolflare: true },
      });
      
      const installed = getInstalledWallets();
      expect(installed).toContain(SUPPORTED_WALLETS.PHANTOM);
      expect(installed).toContain(SUPPORTED_WALLETS.SOLFLARE);
      expect(installed).not.toContain(SUPPORTED_WALLETS.BACKPACK);
    });

    it('should return all wallets when all installed', () => {
      mockWindow({
        phantom: { solana: { isPhantom: true } },
        solflare: { isSolflare: true },
        backpack: { isBackpack: true },
        glow: {},
      });
      
      const installed = getInstalledWallets();
      expect(installed).toHaveLength(4);
    });
  });

  describe('getWalletDownloadUrl', () => {
    it('should return correct URL for each wallet', () => {
      expect(getWalletDownloadUrl(SUPPORTED_WALLETS.PHANTOM)).toContain('phantom.app');
      expect(getWalletDownloadUrl(SUPPORTED_WALLETS.SOLFLARE)).toContain('solflare.com');
      expect(getWalletDownloadUrl(SUPPORTED_WALLETS.BACKPACK)).toContain('backpack.app');
      expect(getWalletDownloadUrl(SUPPORTED_WALLETS.GLOW)).toContain('glow.app');
    });
  });

  describe('formatWalletError', () => {
    it('should format user rejection error (4001)', () => {
      const error = { code: 4001, message: 'User rejected' } as any;
      const formatted = formatWalletError(error);
      
      expect(formatted).toContain('rejected');
      expect(formatted).not.toContain('4001');
    });

    it('should format pending request error (-32002)', () => {
      const error = { code: -32002, message: 'Request pending' } as any;
      const formatted = formatWalletError(error);
      
      expect(formatted).toContain('pending');
    });

    it('should format internal error (-32603)', () => {
      const error = { code: -32603, message: 'Internal error' } as any;
      const formatted = formatWalletError(error);
      
      expect(formatted).toContain('internal');
    });

    it('should return message for unknown error', () => {
      const error = new Error('Custom error message');
      const formatted = formatWalletError(error);
      
      expect(formatted).toBe('Custom error message');
    });

    it('should return default message for error without message', () => {
      const error = {} as any;
      const formatted = formatWalletError(error);
      
      expect(formatted).toContain('unknown');
    });
  });

  describe('isValidPublicKey', () => {
    it('should validate correct public key strings', () => {
      expect(isValidPublicKey('Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS')).toBe(true);
      expect(isValidPublicKey('11111111111111111111111111111111')).toBe(true);
    });

    it('should validate PublicKey objects', () => {
      const publicKey = new PublicKey('Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS');
      expect(isValidPublicKey(publicKey)).toBe(true);
    });

    it('should reject invalid addresses', () => {
      expect(isValidPublicKey('')).toBe(false);
      expect(isValidPublicKey('invalid')).toBe(false);
      expect(isValidPublicKey('123')).toBe(false);
    });
  });

  describe('formatWalletAddress', () => {
    it('should format address with default length', () => {
      const address = 'Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS';
      const formatted = formatWalletAddress(address);
      
      expect(formatted).toBe('Fg6P...sLnS');
    });

    it('should format PublicKey objects', () => {
      const publicKey = new PublicKey('Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS');
      const formatted = formatWalletAddress(publicKey);
      
      expect(formatted).toBe('Fg6P...sLnS');
    });

    it('should use custom start and end length', () => {
      const address = 'Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS';
      const formatted = formatWalletAddress(address, { start: 6, end: 5 });
      
      expect(formatted).toBe('Fg6PaF...FsLnS');
    });

    it('should return short addresses unchanged', () => {
      const shortAddress = '1234567';
      const formatted = formatWalletAddress(shortAddress);
      
      expect(formatted).toBe(shortAddress);
    });
  });

  describe('getRecommendedWallet', () => {
    it('should return null when no wallets installed', () => {
      mockWindow({});
      
      expect(getRecommendedWallet()).toBeNull();
    });

    it('should prefer Phantom when available', () => {
      mockWindow({
        phantom: { solana: { isPhantom: true } },
        solflare: { isSolflare: true },
      });
      
      expect(getRecommendedWallet()).toBe(SUPPORTED_WALLETS.PHANTOM);
    });

    it('should recommend Solflare when Phantom not available', () => {
      mockWindow({
        solflare: { isSolflare: true },
        backpack: { isBackpack: true },
      });
      
      expect(getRecommendedWallet()).toBe(SUPPORTED_WALLETS.SOLFLARE);
    });

    it('should return first available wallet as fallback', () => {
      mockWindow({
        backpack: { isBackpack: true },
      });
      
      expect(getRecommendedWallet()).toBe(SUPPORTED_WALLETS.BACKPACK);
    });
  });

  describe('Wallet Preferences', () => {
    it('should save and retrieve wallet preference', () => {
      saveWalletPreference(SUPPORTED_WALLETS.PHANTOM);
      const saved = getSavedWalletPreference();
      
      expect(saved).toBe(SUPPORTED_WALLETS.PHANTOM);
    });

    it('should clear wallet preference', () => {
      saveWalletPreference(SUPPORTED_WALLETS.PHANTOM);
      clearWalletPreference();
      const saved = getSavedWalletPreference();
      
      expect(saved).toBeNull();
    });

    it('should return null when no preference saved', () => {
      const saved = getSavedWalletPreference();
      expect(saved).toBeNull();
    });
  });

  describe('Auto-Connect Preferences', () => {
    it('should save and retrieve auto-connect preference', () => {
      saveAutoConnectPreference(true);
      const saved = getAutoConnectPreference();
      
      expect(saved).toBe(true);
    });

    it('should handle false auto-connect preference', () => {
      saveAutoConnectPreference(false);
      const saved = getAutoConnectPreference();
      
      expect(saved).toBe(false);
    });

    it('should return false when no preference saved', () => {
      const saved = getAutoConnectPreference();
      expect(saved).toBe(false);
    });
  });

  describe('getWalletInfo', () => {
    it('should return complete wallet info', () => {
      mockWindow({
        phantom: { solana: { isPhantom: true } },
      });
      
      const info = getWalletInfo(SUPPORTED_WALLETS.PHANTOM);
      
      expect(info.name).toBe(SUPPORTED_WALLETS.PHANTOM);
      expect(info.displayName).toBe('Phantom');
      expect(info.installed).toBe(true);
      expect(info.downloadUrl).toContain('phantom');
      expect(info.icon).toBeDefined();
    });

    it('should mark wallet as not installed', () => {
      mockWindow({});
      
      const info = getWalletInfo(SUPPORTED_WALLETS.PHANTOM);
      expect(info.installed).toBe(false);
    });
  });

  describe('getAllWalletInfo', () => {
    it('should return info for all supported wallets', () => {
      const allInfo = getAllWalletInfo();
      
      expect(allInfo).toHaveLength(4);
      expect(allInfo.map(w => w.name)).toContain(SUPPORTED_WALLETS.PHANTOM);
      expect(allInfo.map(w => w.name)).toContain(SUPPORTED_WALLETS.SOLFLARE);
      expect(allInfo.map(w => w.name)).toContain(SUPPORTED_WALLETS.BACKPACK);
      expect(allInfo.map(w => w.name)).toContain(SUPPORTED_WALLETS.GLOW);
    });
  });

  describe('waitForWallet', () => {
    it('should resolve immediately when wallet is already installed', async () => {
      mockWindow({
        phantom: { solana: { isPhantom: true } },
      });
      
      const result = await waitForWallet(SUPPORTED_WALLETS.PHANTOM, 100);
      expect(result).toBe(true);
    });

    it('should timeout when wallet is not installed', async () => {
      mockWindow({});
      
      const start = Date.now();
      const result = await waitForWallet(SUPPORTED_WALLETS.PHANTOM, 500);
      const elapsed = Date.now() - start;
      
      expect(result).toBe(false);
      expect(elapsed).toBeGreaterThanOrEqual(500);
    }, 10000);
  });

  describe('WalletOperationError', () => {
    it('should create error with code and message', () => {
      const error = new WalletOperationError(
        WalletConnectionError.USER_REJECTED,
        'User rejected connection'
      );
      
      expect(error).toBeInstanceOf(Error);
      expect(error.code).toBe(WalletConnectionError.USER_REJECTED);
      expect(error.message).toBe('User rejected connection');
      expect(error.name).toBe('WalletOperationError');
    });

    it('should store original error', () => {
      const originalError = new Error('Original error');
      const error = new WalletOperationError(
        WalletConnectionError.CONNECTION_FAILED,
        'Connection failed',
        originalError
      );
      
      expect(error.originalError).toBe(originalError);
    });
  });
});
