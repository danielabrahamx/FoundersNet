/**
 * Unit Tests for Algorand Prediction Market Hooks
 * 
 * Tests React hooks for interacting with the Algorand PredictionMarket contract
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import {
  useWalletAddress,
  usePlaceBet,
  useCreateEvent,
  useResolveEvent,
  useClaimWinnings,
} from '@/hooks/useAlgorandPredictionMarket';

// Mock the Algorand library
vi.mock('@/lib/algorand', () => ({
  algosdk: {
    encodeUint64: vi.fn((val) => new Uint8Array(8)),
    getApplicationAddress: vi.fn(() => 'MOCK_APP_ADDRESS'),
    makePaymentTxnWithSuggestedParamsFromObject: vi.fn(),
    makeApplicationNoOpTxnFromObject: vi.fn(),
    decodeAddress: vi.fn(() => ({ publicKey: new Uint8Array(32) })),
  },
  getPeraWallet: vi.fn(() => ({
    connector: {
      accounts: [],
      on: vi.fn(),
      off: vi.fn(),
    },
    isConnected: false,
    connect: vi.fn(),
    disconnect: vi.fn(),
  })),
  createAlgodClient: vi.fn(() => ({})),
  PREDICTION_MARKET_APP_ID: 123456,
  getSuggestedParams: vi.fn(async () => ({
    fee: 1000,
    firstRound: 1000,
    lastRound: 2000,
    genesisHash: 'SGO1GKSzyE7IEPItTxCByw9x8FmnrCDexi9/cOUJOiI=',
    genesisID: 'testnet-v1.0',
  })),
  signAndSendTransaction: vi.fn(async () => 'MOCK_TX_ID'),
  signAndSendTransactionGroup: vi.fn(async () => 'MOCK_TX_ID'),
  waitForConfirmation: vi.fn(async () => ({ 'confirmed-round': 1001 })),
  readBox: vi.fn(async () => null),
  algoToMicroAlgo: vi.fn((algo) => algo * 1_000_000),
}));

describe('Algorand Prediction Market Hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('useWalletAddress', () => {
    it('should return null when wallet is not connected', () => {
      const { result } = renderHook(() => useWalletAddress());
      expect(result.current).toBeNull();
    });

    it('should return address when wallet is connected', async () => {
      const mockAddress = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567ABCDEFGHIJKLMNOPQRSTUVWXYZ2345';
      
      const { getPeraWallet } = await import('@/lib/algorand');
      vi.mocked(getPeraWallet).mockReturnValue({
        connector: {
          accounts: [mockAddress],
          on: vi.fn(),
          off: vi.fn(),
        },
        isConnected: true,
      } as any);

      const { result } = renderHook(() => useWalletAddress());
      
      await waitFor(() => {
        expect(result.current).toBe(mockAddress);
      });
    });
  });

  describe('usePlaceBet', () => {
    it('should have initial state', () => {
      const { result } = renderHook(() => usePlaceBet());
      
      expect(result.current.isPending).toBe(false);
      expect(result.current.isSuccess).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.txId).toBeNull();
      expect(typeof result.current.placeBet).toBe('function');
    });

    it('should handle placing a bet', async () => {
      const { result } = renderHook(() => usePlaceBet());
      
      const eventId = 1;
      const outcome = true;
      const amount = 1.0;
      const senderAddress = 'SENDER_ADDRESS';

      await result.current.placeBet(eventId, outcome, amount, senderAddress);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
        expect(result.current.txId).toBe('MOCK_TX_ID');
      });
    });

    it('should handle errors when placing bet fails', async () => {
      const { signAndSendTransactionGroup } = await import('@/lib/algorand');
      vi.mocked(signAndSendTransactionGroup).mockRejectedValueOnce(
        new Error('Transaction failed')
      );

      const { result } = renderHook(() => usePlaceBet());

      try {
        await result.current.placeBet(1, true, 1.0, 'SENDER');
      } catch (error) {
        expect(error).toBeDefined();
      }

      await waitFor(() => {
        expect(result.current.isPending).toBe(false);
        expect(result.current.error).toBeDefined();
      });
    });
  });

  describe('useCreateEvent', () => {
    it('should have initial state', () => {
      const { result } = renderHook(() => useCreateEvent());
      
      expect(result.current.isPending).toBe(false);
      expect(result.current.isSuccess).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.txId).toBeNull();
      expect(typeof result.current.createEvent).toBe('function');
    });

    it('should handle creating an event', async () => {
      const { result } = renderHook(() => useCreateEvent());
      
      const name = 'Test Event';
      const endTime = Math.floor(Date.now() / 1000) + 3600;
      const senderAddress = 'ADMIN_ADDRESS';

      await result.current.createEvent(name, endTime, senderAddress);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
        expect(result.current.txId).toBe('MOCK_TX_ID');
      });
    });
  });

  describe('useResolveEvent', () => {
    it('should have initial state', () => {
      const { result } = renderHook(() => useResolveEvent());
      
      expect(result.current.isPending).toBe(false);
      expect(result.current.isSuccess).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.txId).toBeNull();
      expect(typeof result.current.resolveEvent).toBe('function');
    });

    it('should handle resolving an event', async () => {
      const { result } = renderHook(() => useResolveEvent());
      
      const eventId = 1;
      const outcome = true;
      const senderAddress = 'ADMIN_ADDRESS';

      await result.current.resolveEvent(eventId, outcome, senderAddress);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
        expect(result.current.txId).toBe('MOCK_TX_ID');
      });
    });
  });

  describe('useClaimWinnings', () => {
    it('should have initial state', () => {
      const { result } = renderHook(() => useClaimWinnings());
      
      expect(result.current.isPending).toBe(false);
      expect(result.current.isSuccess).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.txId).toBeNull();
      expect(typeof result.current.claimWinnings).toBe('function');
    });

    it('should handle claiming winnings', async () => {
      const { result } = renderHook(() => useClaimWinnings());
      
      const betId = 1;
      const senderAddress = 'USER_ADDRESS';

      await result.current.claimWinnings(betId, senderAddress);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
        expect(result.current.txId).toBe('MOCK_TX_ID');
      });
    });

    it('should throw error when app ID is not configured', async () => {
      const { PREDICTION_MARKET_APP_ID } = await import('@/lib/algorand');
      // Mock missing app ID
      vi.mocked(PREDICTION_MARKET_APP_ID).mockReturnValue(0);

      const { result } = renderHook(() => useClaimWinnings());

      await expect(
        result.current.claimWinnings(1, 'USER_ADDRESS')
      ).rejects.toThrow('App ID not configured');
    });
  });
});
