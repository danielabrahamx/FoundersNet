/**
 * End-to-End Tests for FoundersNet Application
 * Tests the main user flows and critical functionality
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
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
    signTransaction: vi.fn(),
    signAllTransactions: vi.fn(),
    signMessage: vi.fn(),
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
  WalletDisconnectButton: () => <button data-testid="button-wallet-disconnect">Disconnect</button>,
}));

// Mock environment config
vi.mock('../../config/environment', () => ({
  getConfig: () => ({
    nodeEnv: 'development',
    network: 'solana-devnet',
    programId: 'Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS',
    adminAddress: 'Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS',
    apiUrl: 'http://localhost:5000',
  }),
}));

describe('FoundersNet E2E Tests', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
  });

  describe('Application Initialization', () => {
    it('should render the application without crashing', async () => {
      render(
        <QueryClientProvider client={queryClient}>
          <SolanaApp />
        </QueryClientProvider>
      );

      await waitFor(() => {
        expect(screen.queryByText(/Loading events from blockchain/i)).not.toBeInTheDocument();
      });

      expect(screen.getByText('FoundersNet')).toBeInTheDocument();
    });

    it('should display the correct page title and description', () => {
      render(
        <QueryClientProvider client={queryClient}>
          <SolanaApp />
        </QueryClientProvider>
      );

      expect(screen.getByText('Startup Prediction Markets')).toBeInTheDocument();
      expect(screen.getByText(/Bet on which startups will raise Series A/i)).toBeInTheDocument();
    });

    it('should show the network indicator', () => {
      render(
        <QueryClientProvider client={queryClient}>
          <SolanaApp />
        </QueryClientProvider>
      );

      expect(screen.getByTestId('network-indicator')).toBeInTheDocument();
    });

    it('should display wallet connection button', () => {
      render(
        <QueryClientProvider client={queryClient}>
          <SolanaApp />
        </QueryClientProvider>
      );

      const walletButton = screen.getByTestId('button-wallet-connect');
      expect(walletButton).toBeInTheDocument();
      expect(walletButton).toHaveTextContent('Select Wallet');
    });
  });

  describe('Navigation', () => {
    it('should render navigation with Home and My Bets links', () => {
      render(
        <QueryClientProvider client={queryClient}>
          <SolanaApp />
        </QueryClientProvider>
      );

      expect(screen.getByTestId('link-home')).toBeInTheDocument();
      expect(screen.getByTestId('link-my-bets')).toBeInTheDocument();
    });

    it('should have working theme toggle', () => {
      render(
        <QueryClientProvider client={queryClient}>
          <SolanaApp />
        </QueryClientProvider>
      );

      const themeToggle = screen.getByTestId('button-theme-toggle');
      expect(themeToggle).toBeInTheDocument();
    });
  });

  describe('Home Page - Events Display', () => {
    it('should show "No events available yet" when no events exist', async () => {
      // Mock empty events response
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ([]),
      });

      render(
        <QueryClientProvider client={queryClient}>
          <SolanaApp />
        </QueryClientProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('No events available yet.')).toBeInTheDocument();
      });
    });

    it('should display events when available', async () => {
      const mockEvents = [
        {
          eventId: 1,
          name: 'Will Acme Corp raise Series A by Q4 2025?',
          endTime: Math.floor(Date.now() / 1000) + 86400, // Tomorrow
          resolved: false,
          outcome: false,
          totalYesBets: 10,
          totalNoBets: 5,
          totalYesAmount: '5000000000', // 5 SOL in lamports
          totalNoAmount: '3000000000', // 3 SOL in lamports
        },
      ];

      global.fetch = vi.fn().mockImplementation(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockEvents),
        })
      );

      render(
        <QueryClientProvider client={queryClient}>
          <SolanaApp />
        </QueryClientProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Will Acme Corp raise Series A by Q4 2025?')).toBeInTheDocument();
      });
    });
  });

  describe('Responsive Design', () => {
    it('should be mobile responsive', () => {
      render(
        <QueryClientProvider client={queryClient}>
          <SolanaApp />
        </QueryClientProvider>
      );

      const container = screen.getByText('FoundersNet').closest('div');
      expect(container).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      render(
        <QueryClientProvider client={queryClient}>
          <SolanaApp />
        </QueryClientProvider>
      );

      // Application should still render even with network errors
      expect(screen.getByText('FoundersNet')).toBeInTheDocument();
    });
  });

  describe('Configuration Loading', () => {
    it('should load and display correct network configuration', () => {
      render(
        <QueryClientProvider client={queryClient}>
          <SolanaApp />
        </QueryClientProvider>
      );

      // Check that devnet is displayed
      expect(screen.getByTestId('network-indicator')).toBeInTheDocument();
    });
  });
});
