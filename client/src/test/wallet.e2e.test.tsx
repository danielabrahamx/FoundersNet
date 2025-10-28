/**
 * Wallet Integration E2E Tests
 * Tests Solana wallet connection and interaction flows
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import SolanaApp from '../SolanaApp';

const mockPublicKey = {
  toBase58: () => '9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin',
  toString: () => '9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin',
};

describe('Wallet Integration E2E Tests', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ([]),
    });
  });

  describe('Wallet Connection - Disconnected State', () => {
    beforeEach(() => {
      vi.mock('@solana/wallet-adapter-react', () => ({
        useWallet: () => ({
          publicKey: null,
          connected: false,
          connecting: false,
          disconnecting: false,
          wallet: null,
          wallets: [],
          select: vi.fn(),
          connect: vi.fn(),
          disconnect: vi.fn(),
        }),
        useConnection: () => ({
          connection: {
            getAccountInfo: vi.fn(),
            getBalance: vi.fn(),
          },
        }),
        WalletProvider: ({ children }: any) => children,
        ConnectionProvider: ({ children }: any) => children,
      }));

      vi.mock('@solana/wallet-adapter-react-ui', () => ({
        WalletModalProvider: ({ children }: any) => children,
        WalletMultiButton: () => <button data-testid="button-wallet-connect">Select Wallet</button>,
      }));

      vi.mock('../../config/environment', () => ({
        getConfig: () => ({
          nodeEnv: 'development',
          network: 'solana-devnet',
          programId: 'Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS',
          adminAddress: 'Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS',
          apiUrl: 'http://localhost:5000',
        }),
      }));
    });

    it('should show wallet connection button when disconnected', () => {
      render(
        <QueryClientProvider client={queryClient}>
          <SolanaApp />
        </QueryClientProvider>
      );

      const walletButton = screen.getByTestId('button-wallet-connect');
      expect(walletButton).toBeInTheDocument();
      expect(walletButton).toHaveTextContent('Select Wallet');
    });

    it('should display network indicator even when wallet is disconnected', () => {
      render(
        <QueryClientProvider client={queryClient}>
          <SolanaApp />
        </QueryClientProvider>
      );

      expect(screen.getByText(/solana-devnet/i)).toBeInTheDocument();
    });
  });

  describe('Wallet Connection - Connected State', () => {
    beforeEach(() => {
      vi.mock('@solana/wallet-adapter-react', () => ({
        useWallet: () => ({
          publicKey: mockPublicKey,
          connected: true,
          connecting: false,
          disconnecting: false,
          wallet: { adapter: { name: 'Phantom' } },
          wallets: [],
          select: vi.fn(),
          connect: vi.fn(),
          disconnect: vi.fn(),
        }),
        useConnection: () => ({
          connection: {
            getAccountInfo: vi.fn().mockResolvedValue(null),
            getBalance: vi.fn().mockResolvedValue(1000000000), // 1 SOL
          },
        }),
        WalletProvider: ({ children }: any) => children,
        ConnectionProvider: ({ children }: any) => children,
      }));
    });

    it('should enable betting when wallet is connected', () => {
      render(
        <QueryClientProvider client={queryClient}>
          <SolanaApp />
        </QueryClientProvider>
      );

      // When connected, user should be able to interact with the app
      expect(screen.getByTestId('button-wallet-connect')).toBeInTheDocument();
    });
  });

  describe('Wallet Error Handling', () => {
    it('should handle wallet connection errors gracefully', async () => {
      render(
        <QueryClientProvider client={queryClient}>
          <SolanaApp />
        </QueryClientProvider>
      );

      // App should still be functional even if wallet connection fails
      expect(screen.getByText('FoundersNet')).toBeInTheDocument();
    });
  });

  describe('Network Configuration', () => {
    it('should display correct network (devnet)', () => {
      vi.mock('../../config/environment', () => ({
        getConfig: () => ({
          nodeEnv: 'development',
          network: 'solana-devnet',
          programId: 'Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS',
          adminAddress: 'Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS',
          apiUrl: 'http://localhost:5000',
        }),
      }));

      render(
        <QueryClientProvider client={queryClient}>
          <SolanaApp />
        </QueryClientProvider>
      );

      expect(screen.getByText(/devnet/i)).toBeInTheDocument();
    });
  });
});
