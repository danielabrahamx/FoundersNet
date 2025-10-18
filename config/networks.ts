/**
 * Network Configuration
 * 
 * Centralized network configuration for Algorand networks.
 * Follows Single Responsibility Principle - only handles network config.
 */

export type NetworkType = 'localnet' | 'testnet' | 'mainnet';

export interface NetworkConfig {
  readonly name: string;
  readonly algod: {
    readonly url: string;
    readonly port: number;
    readonly token: string;
  };
  readonly indexer: {
    readonly url: string;
    readonly port: number;
  };
  readonly explorer: {
    readonly url: string;
  };
  readonly chainId: number;
}

/**
 * Immutable network configurations
 */
export const NETWORK_CONFIGS: Readonly<Record<NetworkType, NetworkConfig>> = {
  localnet: {
    name: 'LocalNet',
    algod: {
      url: 'http://localhost',
      port: 4001,
      token: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    },
    indexer: {
      url: 'http://localhost',
      port: 8980,
    },
    explorer: {
      url: 'http://localhost:8980',
    },
    chainId: 1337, // Local development
  },
  testnet: {
    name: 'TestNet',
    algod: {
      url: 'https://testnet-api.algonode.cloud',
      port: 443,
      token: '',
    },
    indexer: {
      url: 'https://testnet-idx.algonode.cloud',
      port: 443,
    },
    explorer: {
      url: 'https://testnet.algoexplorer.io',
    },
    chainId: 416002, // TestNet
  },
  mainnet: {
    name: 'MainNet',
    algod: {
      url: 'https://mainnet-api.algonode.cloud',
      port: 443,
      token: '',
    },
    indexer: {
      url: 'https://mainnet-idx.algonode.cloud',
      port: 443,
    },
    explorer: {
      url: 'https://algoexplorer.io',
    },
    chainId: 416001, // MainNet
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
