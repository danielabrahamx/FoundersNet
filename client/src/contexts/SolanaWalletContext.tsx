/**
 * Solana Wallet Context
 * 
 * React Context for managing Solana wallet connections.
 * Integrates with @solana/wallet-adapter-react.
 * Provides wallet state and operations to the entire application.
 */

import React, { createContext, useContext, useMemo, ReactNode } from 'react';
import { ConnectionProvider, WalletProvider, useWallet } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { 
  PhantomWalletAdapter,
  SolflareWalletAdapter,
  UnsafeBurnerWalletAdapter,
} from '@solana/wallet-adapter-wallets';
import { WalletAdapterNetwork, WalletAdapter } from '@solana/wallet-adapter-base';
import { clusterApiUrl, Connection, PublicKey } from '@solana/web3.js';
import { getConfig, getNetworkConfig } from '@/../../config';

// Import wallet adapter styles
import '@solana/wallet-adapter-react-ui/styles.css';

/**
 * Solana wallet context interface
 */
export interface SolanaWalletContextValue {
  // Wallet state from useWallet hook
  connected: boolean;
  connecting: boolean;
  disconnecting: boolean;
  publicKey: PublicKey | null;
  wallet: any | null;
  
  // Wallet operations
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  select: (walletName: string | null) => void;
  
  // Connection
  connection: Connection;
  
  // Network info
  network: string;
  cluster: string;
}

/**
 * Context for Solana wallet
 */
const SolanaWalletContext = createContext<SolanaWalletContextValue | undefined>(undefined);

/**
 * Props for SolanaWalletProvider
 */
interface SolanaWalletProviderProps {
  children: ReactNode;
}

/**
 * Inner provider component that uses the wallet adapter
 */
function SolanaWalletInnerProvider({ children }: SolanaWalletProviderProps) {
  const walletContext = useWallet();
  const config = getConfig();
  const networkConfig = getNetworkConfig(config.network);
  
  const connection = useMemo(() => {
    return new Connection(networkConfig.rpcUrl, 'confirmed');
  }, [networkConfig.rpcUrl]);
  
  const value: SolanaWalletContextValue = {
    connected: walletContext.connected,
    connecting: walletContext.connecting,
    disconnecting: walletContext.disconnecting,
    publicKey: walletContext.publicKey,
    wallet: walletContext.wallet,
    connect: walletContext.connect,
    disconnect: walletContext.disconnect,
    select: (walletName: string | null) => walletContext.select(walletName as any),
    connection,
    network: config.network,
    cluster: networkConfig.cluster,
  };
  
  return (
    <SolanaWalletContext.Provider value={value}>
      {children}
    </SolanaWalletContext.Provider>
  );
}

/**
 * Solana wallet provider component
 * Sets up wallet adapters and provides wallet context to children
 */
export function SolanaWalletProvider({ children }: SolanaWalletProviderProps) {
  const config = getConfig();
  const networkConfig = getNetworkConfig(config.network);
  const enableBurner = (import.meta as any).env?.VITE_ENABLE_BURNER === 'true' || config.network === 'solana-localnet';
  
  // Get RPC endpoint
  const endpoint = useMemo(() => {
    return networkConfig.rpcUrl;
  }, [networkConfig.rpcUrl]);
  
  // Configure wallets
  const wallets = useMemo<WalletAdapter[]>(() => {
    const base: WalletAdapter[] = [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
    ];
    // Add an in-browser local wallet for local development; never use in production
    if (enableBurner) {
      base.unshift(new UnsafeBurnerWalletAdapter());
    }
    return base as WalletAdapter[];
  }, [enableBurner]);
  
  // Auto-connect configuration
  const autoConnect = useMemo(() => {
    // Check localStorage for auto-connect preference
    if (typeof window !== 'undefined') {
      try {
        return localStorage.getItem('solana_auto_connect') === 'true';
      } catch {
        return false;
      }
    }
    return false;
  }, []);
  
  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect={autoConnect}>
        <WalletModalProvider>
          <SolanaWalletInnerProvider>
            {children}
          </SolanaWalletInnerProvider>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}

/**
 * Hook to use Solana wallet context
 */
export function useSolanaWallet(): SolanaWalletContextValue {
  const context = useContext(SolanaWalletContext);
  if (!context) {
    throw new Error('useSolanaWallet must be used within SolanaWalletProvider');
  }
  return context;
}

/**
 * Hook to get wallet address as string
 */
export function useWalletAddress(): string | null {
  const { publicKey } = useSolanaWallet();
  return publicKey?.toBase58() ?? null;
}

/**
 * Hook to check if wallet is connected
 */
export function useIsWalletConnected(): boolean {
  const { connected } = useSolanaWallet();
  return connected;
}

/**
 * Hook to get connection instance
 */
export function useConnection(): Connection {
  const { connection } = useSolanaWallet();
  return connection;
}

/**
 * Hook to get wallet public key
 */
export function useWalletPublicKey(): PublicKey | null {
  const { publicKey } = useSolanaWallet();
  return publicKey;
}

/**
 * Export wallet modal hook for convenience
 */
export { useWalletModal } from '@solana/wallet-adapter-react-ui';
