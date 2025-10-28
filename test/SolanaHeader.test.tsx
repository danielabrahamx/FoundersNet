/**
 * Unit tests for SolanaHeader component
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { WalletProvider, useWallet, WalletContextState } from '@solana/wallet-adapter-react';
import { useAccountBalance } from '@/hooks/useSolanaPredictionMarket';
import SolanaHeader from '@/components/SolanaHeader';
import { PublicKey } from '@solana/web3.js';

// Mock dependencies
vi.mock('@/hooks/useSolanaPredictionMarket', () => ({
  useAccountBalance: vi.fn(),
}));

vi.mock('@/components/ui/wallet-multi-button', () => ({
    WalletMultiButton: () => <button>Select Wallet</button>,
}));

vi.mock('@solana/wallet-adapter-react', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@solana/wallet-adapter-react')>();
    return {
        ...actual,
        useWallet: vi.fn(),
    };
});

vi.mock('wouter', () => ({
  Link: ({ children, href }: any) => <a href={href}>{children}</a>,
  useLocation: () => ['/'],
}));

vi.mock('@/components/ThemeToggle', () => ({
  default: () => <div>Theme Toggle</div>,
}));

const mockWallet: WalletContextState = {
  publicKey: null,
  connected: false,
  wallet: null,
  connect: vi.fn(),
  disconnect: vi.fn(),
  connecting: false,
  disconnecting: false,
  sendTransaction: vi.fn(),
  signTransaction: vi.fn(),
  signAllTransactions: vi.fn(),
  signMessage: vi.fn(),
  autoConnect: false,
  wallets: [],
  select: vi.fn(),
  signIn: vi.fn(),
};

describe('SolanaHeader', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useWallet).mockReturnValue(mockWallet);
    vi.mocked(useAccountBalance).mockReturnValue({
      balance: null,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });
  });

  const renderWithProviders = (ui: React.ReactElement) => {
    return render(<WalletProvider wallets={[]}>{ui}</WalletProvider>);
  };

  it('renders the header with logo and navigation', () => {
    renderWithProviders(<SolanaHeader />);

    expect(screen.getByText('FoundersNet')).toBeTruthy();
    expect(screen.getAllByText('Home')[0]).toBeTruthy();
    expect(screen.getAllByText('My Bets')[0]).toBeTruthy();
  });

  it('renders connect wallet button when not connected', () => {
    renderWithProviders(<SolanaHeader />);
    expect(screen.getByText('Select Wallet')).toBeInTheDocument();
  });

  it('displays wallet info when connected', () => {
    const mockPublicKey = new PublicKey('7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU');

    vi.mocked(useWallet).mockReturnValue({
      ...mockWallet,
      connected: true,
      publicKey: new PublicKey('Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS'),
    });
    vi.mocked(useAccountBalance).mockReturnValue({
      balance: 10.5,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    renderWithProviders(<SolanaHeader />);

    // Text is split across elements, and there are multiple matches for mobile/desktop views
    const balanceElements = screen.getAllByText((content, element) => {
      return element?.textContent === '10.5000 SOL';
    });
    expect(balanceElements[0]).toBeTruthy();
    expect(screen.getAllByText('My Bets')[0]).toBeTruthy();
  });
});
