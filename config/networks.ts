/**
 * Network Configuration
 *
 * Centralized network configuration for Solana networks.
 * Follows Single Responsibility Principle - only handles network config.
 * Complete migration from Algorand to Solana - Phase 3.
 */

export type NetworkType = 'solana-localnet' | 'solana-devnet' | 'solana-testnet' | 'solana-mainnet-beta';

export interface NetworkConfig {
  readonly name: string;
  readonly rpcUrl: string;
  readonly wsUrl?: string;
  readonly explorerUrl: string;
  readonly cluster: string;
  readonly commitment: 'processed' | 'confirmed' | 'finalized';
}

/**
 * Immutable network configurations
 */
export const NETWORK_CONFIGS: Readonly<Record<NetworkType, NetworkConfig>> = {
  'solana-localnet': {
    name: 'Solana LocalNet',
    rpcUrl: 'http://localhost:8899',
    wsUrl: 'ws://localhost:8900',
    explorerUrl: 'https://explorer.solana.com/?cluster=custom&customUrl=http://localhost:8899',
    cluster: 'localnet',
    commitment: 'confirmed',
  },
  'solana-devnet': {
    name: 'Solana DevNet',
    rpcUrl: 'https://api.devnet.solana.com',
    wsUrl: 'wss://api.devnet.solana.com',
    explorerUrl: 'https://explorer.solana.com/?cluster=devnet',
    cluster: 'devnet',
    commitment: 'confirmed',
  },
  'solana-testnet': {
    name: 'Solana TestNet',
    rpcUrl: 'https://api.testnet.solana.com',
    wsUrl: 'wss://api.testnet.solana.com',
    explorerUrl: 'https://explorer.solana.com/?cluster=testnet',
    cluster: 'testnet',
    commitment: 'confirmed',
  },
  'solana-mainnet-beta': {
    name: 'Solana MainNet Beta',
    rpcUrl: 'https://api.mainnet-beta.solana.com',
    wsUrl: 'wss://api.mainnet-beta.solana.com',
    explorerUrl: 'https://explorer.solana.com',
    cluster: 'mainnet-beta',
    commitment: 'finalized',
  },
} as const;

/**
 * Validate network type
 */
export function isValidNetwork(network: string): network is NetworkType {
  return network in NETWORK_CONFIGS;
}

/**
 * Get network configuration with validation
 */
export function getNetworkConfig(network: NetworkType): NetworkConfig {
  const config = NETWORK_CONFIGS[network];
  if (!config) {
    throw new Error(`Invalid network: ${network}. Must be one of: ${Object.keys(NETWORK_CONFIGS).join(', ')}`);
  }
  return config;
}
