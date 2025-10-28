/**
 * Phase 4: Solana Prediction Market Hooks - Unit Tests
 * Comprehensive test suite with proper vitest mocking
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { BN } from '@coral-xyz/anchor';
import * as walletAdapter from '@solana/wallet-adapter-react';
import * as solanaService from '@/services/solana.service';

// Import hooks to test
import {
  useWalletAddress,
  useAccountBalance,
  useSolanaProgram,
  useGetAllEvents,
  useGetEvent,
  useGetUserBets,
  useGetProgramState,
} from '@/hooks/useSolanaPredictionMarket';

// Valid Solana addresses
const mockWalletKey = new PublicKey('11111111111111111111111111111111');
const mockEventPDA = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');
const mockProgramStatePDA = new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr');

// Mock wallet adapter
vi.mock('@solana/wallet-adapter-react', async () => {
  const actual = await vi.importActual('@solana/wallet-adapter-react');
  return {
    ...actual,
    useConnection: vi.fn(),
    useWallet: vi.fn(),
  };
});

// Mock solana service
vi.mock('@/services/solana.service', () => ({
  getSolanaService: vi.fn(),
}));

// Mock toast
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

describe('Phase 4: Solana Prediction Market Hooks', () => {
  let mockConnection: any;
  let mockProgram: any;
  let mockService: any;

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup mock connection
    mockConnection = {
      getBalance: vi.fn(async () => 5 * LAMPORTS_PER_SOL),
    };

    // Setup mock program
    mockProgram = {
      methods: {
        createEvent: vi.fn(() => ({
          accounts: vi.fn().mockReturnThis(),
          rpc: vi.fn(async () => 'mock-tx-signature'),
        })),
        placeBet: vi.fn(() => ({
          accounts: vi.fn().mockReturnThis(),
          rpc: vi.fn(async () => 'mock-tx-signature'),
        })),
      },
      account: {
        programState: {
          fetch: vi.fn(async () => ({
            admin: mockWalletKey,
            eventCounter: new BN(5),
            betCounter: new BN(10),
            bump: 255,
          })),
        },
        event: {
          fetch: vi.fn(async () => ({
            eventId: new BN(1),
            name: 'Test Event',
            endTime: new BN(Math.floor(Date.now() / 1000) + 86400),
            resolved: false,
            outcome: false,
            totalYesBets: new BN(5),
            totalNoBets: new BN(3),
            totalYesAmount: new BN(50 * LAMPORTS_PER_SOL),
            totalNoAmount: new BN(30 * LAMPORTS_PER_SOL),
            creator: mockWalletKey,
            bump: 255,
          })),
          all: vi.fn(async () => [
            {
              publicKey: mockEventPDA,
              account: {
                eventId: new BN(1),
                name: 'Event 1',
                endTime: new BN(Math.floor(Date.now() / 1000) + 86400),
                resolved: false,
                outcome: false,
                totalYesBets: new BN(5),
                totalNoBets: new BN(3),
                totalYesAmount: new BN(50 * LAMPORTS_PER_SOL),
                totalNoAmount: new BN(30 * LAMPORTS_PER_SOL),
                creator: mockWalletKey,
                bump: 255,
              },
            },
          ]),
        },
        bet: {
          all: vi.fn(async () => [
            {
              publicKey: new PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL'),
              account: {
                betId: new BN(1),
                eventId: new BN(1),
                bettor: mockWalletKey,
                outcome: true,
                amount: new BN(10 * LAMPORTS_PER_SOL),
                claimed: false,
                bump: 255,
              },
            },
          ]),
        },
      },
    };

    // Setup mock service
    mockService = {
      getConnection: vi.fn(() => mockConnection),
      getProgram: vi.fn(() => mockProgram),
      deriveProgramStatePDA: vi.fn(async () => [mockProgramStatePDA, 255]),
      deriveEventPDA: vi.fn(async () => [mockEventPDA, 255]),
      deriveBetPDA: vi.fn(async () => [new PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL'), 255]),
      deriveEscrowPDA: vi.fn(async () => [new PublicKey('Memo1UhkJRfHyvLMcVucJwxXeuD728EqVDDwQDxFMNo'), 255]),
    };

    // Apply mocks
    vi.mocked(walletAdapter.useConnection).mockReturnValue({
      connection: mockConnection,
    } as any);

    vi.mocked(walletAdapter.useWallet).mockReturnValue({
      publicKey: mockWalletKey,
      connected: true,
      wallet: null,
      connect: vi.fn(),
      disconnect: vi.fn(),
      connecting: false,
      disconnecting: false,
      select: vi.fn(),
      signTransaction: vi.fn(),
      signAllTransactions: vi.fn(),
      signMessage: vi.fn(),
      sendTransaction: vi.fn(),
      wallets: [],
    } as any);

    vi.mocked(solanaService.getSolanaService).mockReturnValue(mockService);
  });

  describe('useWalletAddress', () => {
    it('should return connected wallet address', () => {
      const { result } = renderHook(() => useWalletAddress());
      expect(result.current).toBe(mockWalletKey.toBase58());
    });

    it('should return null when wallet not connected', () => {
      vi.mocked(walletAdapter.useWallet).mockReturnValue({
        publicKey: null,
        connected: false,
      } as any);

      const { result } = renderHook(() => useWalletAddress());
      expect(result.current).toBeNull();
    });
  });

  describe('useAccountBalance', () => {
    it('should fetch wallet balance in SOL', async () => {
      const { result } = renderHook(() => useAccountBalance());

      await waitFor(() => {
        expect(result.current.balance).toBe(5);
      });

      expect(mockConnection.getBalance).toHaveBeenCalledWith(mockWalletKey);
    });

    it('should handle custom address', async () => {
      const customKey = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');
      const { result } = renderHook(() => useAccountBalance(customKey.toBase58()));

      await waitFor(() => {
        expect(result.current.balance).toBe(5);
      });

      expect(mockConnection.getBalance).toHaveBeenCalledWith(customKey);
    });

    it('should provide loading state', () => {
      const { result } = renderHook(() => useAccountBalance());
      expect(result.current.isLoading).toBeDefined();
    });
  });

  describe('useSolanaProgram', () => {
    it('should return connection and program', () => {
      const { result } = renderHook(() => useSolanaProgram());

      expect(result.current.connection).toBe(mockConnection);
      expect(result.current.program).toBe(mockProgram);
    });

    it('should return provider when wallet connected', () => {
      const { result } = renderHook(() => useSolanaProgram());
      expect(result.current.provider).toBeDefined();
    });
  });

  describe('useGetAllEvents', () => {
    it('should fetch all events', async () => {
      const { result } = renderHook(() => useGetAllEvents());

      await waitFor(() => {
        expect(result.current.events).toHaveLength(1);
      });

      expect(result.current.events[0].name).toBe('Event 1');
      expect(result.current.events[0].eventId.toNumber()).toBe(1);
    });

    it('should handle empty events list', async () => {
      mockProgram.account.event.all = vi.fn(async () => []);

      const { result } = renderHook(() => useGetAllEvents());

      await waitFor(() => {
        expect(result.current.events).toHaveLength(0);
      });
    });

    it('should provide refetch function', async () => {
      const { result } = renderHook(() => useGetAllEvents());

      await waitFor(() => {
        expect(result.current.events).toHaveLength(1);
      });

      expect(result.current.refetch).toBeInstanceOf(Function);
    });
  });

  describe('useGetEvent', () => {
    it('should fetch specific event by ID', async () => {
      const { result } = renderHook(() => useGetEvent(1));

      await waitFor(() => {
        expect(result.current.event).toBeDefined();
      });

      expect(result.current.event?.name).toBe('Test Event');
      expect(result.current.event?.eventId.toNumber()).toBe(1);
    });

    it('should return null when eventId is null', async () => {
      const { result } = renderHook(() => useGetEvent(null));

      await waitFor(() => {
        expect(result.current.event).toBeNull();
      });
    });

    it('should handle fetch errors gracefully', async () => {
      mockProgram.account.event.fetch = vi.fn(async () => {
        throw new Error('Not found');
      });

      const { result } = renderHook(() => useGetEvent(999));

      await waitFor(() => {
        expect(result.current.error).toBeDefined();
      });
    });
  });

  describe('useGetUserBets', () => {
    it('should fetch bets for connected wallet', async () => {
      const { result } = renderHook(() => useGetUserBets());

      await waitFor(() => {
        expect(result.current.bets).toHaveLength(1);
      });

      expect(result.current.bets[0].betId.toNumber()).toBe(1);
      expect(result.current.bets[0].amount.toNumber()).toBe(10 * LAMPORTS_PER_SOL);
    });

    it('should handle custom address', async () => {
      const customAddress = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';
      const { result } = renderHook(() => useGetUserBets(customAddress));

      await waitFor(() => {
        expect(result.current.bets).toBeDefined();
      });
    });

    it('should return empty array when no bets', async () => {
      mockProgram.account.bet.all = vi.fn(async () => []);

      const { result } = renderHook(() => useGetUserBets());

      await waitFor(() => {
        expect(result.current.bets).toHaveLength(0);
      });
    });
  });

  describe('useGetProgramState', () => {
    it('should fetch program state', async () => {
      const { result } = renderHook(() => useGetProgramState());

      await waitFor(() => {
        expect(result.current.admin).toBeDefined();
      });

      expect(result.current.admin?.toBase58()).toBe(mockWalletKey.toBase58());
      expect(result.current.eventCounter).toBe(5);
      expect(result.current.betCounter).toBe(10);
    });

    it('should provide refetch function', async () => {
      const { result } = renderHook(() => useGetProgramState());

      await waitFor(() => {
        expect(result.current.admin).toBeDefined();
      });

      expect(result.current.refetch).toBeInstanceOf(Function);
    });

    it('should handle errors', async () => {
      mockProgram.account.programState.fetch = vi.fn(async () => {
        throw new Error('Fetch failed');
      });

      const { result } = renderHook(() => useGetProgramState());

      await waitFor(() => {
        expect(result.current.error).toBeDefined();
      });
    });
  });
});
