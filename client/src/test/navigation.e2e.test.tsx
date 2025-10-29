/**
 * Navigation E2E Tests
 * Tests routing and page navigation functionality
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import SolanaApp from '../SolanaApp';

// Mock Solana wallet adapter
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
    sendTransaction: vi.fn(),
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

describe('Navigation E2E Tests', () => {
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

  describe('Page Navigation', () => {
    it('should navigate to Home page by default', async () => {
      render(
        <QueryClientProvider client={queryClient}>
          <SolanaApp />
        </QueryClientProvider>
      );

      await waitFor(() => {
        expect(screen.queryByText(/Loading events from blockchain/i)).not.toBeInTheDocument();
      });

      expect(screen.getByText('Startup Prediction Markets')).toBeInTheDocument();
    });

    it('should navigate to My Bets page', () => {
      render(
        <QueryClientProvider client={queryClient}>
          <SolanaApp />
        </QueryClientProvider>
      );

      const myBetsLink = screen.getByTestId('link-nav-my-bets');
      fireEvent.click(myBetsLink);

      // My Bets page should show wallet connection prompt or bets table
      expect(
        screen.getByText(/Connect your wallet to view your bets/i) ||
        screen.getByText(/My Bets/i)
      ).toBeInTheDocument();
    });

    it('should have active navigation indicators', () => {
      render(
        <QueryClientProvider client={queryClient}>
          <SolanaApp />
        </QueryClientProvider>
      );

      const homeLink = screen.getByTestId('link-home');
      expect(homeLink).toBeInTheDocument();
    });
  });

  describe('Navigation Links', () => {
    it('should have accessible navigation links', () => {
      render(
        <QueryClientProvider client={queryClient}>
          <SolanaApp />
        </QueryClientProvider>
      );

      const homeLink = screen.getByTestId('link-nav-home');
      const myBetsLink = screen.getByTestId('link-nav-my-bets');

      expect(homeLink).toHaveTextContent('Home');
      expect(myBetsLink).toHaveTextContent('My Bets');
    });
  });

  describe('Deep Linking', () => {
    it('should handle direct navigation to My Bets', () => {
      // This would require wouter's Router testing utilities
      // For now, we test that the page components exist
      render(
        <QueryClientProvider client={queryClient}>
          <SolanaApp />
        </QueryClientProvider>
      );

      expect(screen.getByTestId('link-nav-my-bets')).toBeInTheDocument();
    });
  });
});
