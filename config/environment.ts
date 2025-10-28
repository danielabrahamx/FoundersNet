/**
 * Environment Configuration
 * 
 * Type-safe environment variable validation and access.
 * Follows Fail-Fast principle - validates all required vars at startup.
 */

import { NetworkType, isValidNetwork } from './networks';

/**
 * Environment variables interface with strict typing
 */
export interface EnvironmentConfig {
  // Application
  readonly nodeEnv: 'development' | 'production' | 'test';
  readonly apiUrl: string;
  
  // Solana Network
  readonly network: NetworkType;
  readonly programId: string;
  readonly adminAddress: string;
  
  // Optional
  readonly databaseUrl?: string;
  readonly walletConnectProjectId?: string;
}

/**
 * Validation errors
 */
class ConfigValidationError extends Error {
  constructor(message: string) {
    super(`Configuration Error: ${message}`);
    this.name = 'ConfigValidationError';
  }
}

/**
 * Parse and validate environment variables
 */
function parseEnvironment(): EnvironmentConfig {
  // Helper to get required env var
  const getRequired = (key: string, envKey: string = key): string => {
    const value = import.meta.env[envKey];
    if (!value || value === '') {
      throw new ConfigValidationError(
        `Missing required environment variable: ${envKey}\n` +
        `Please check your .env file.`
      );
    }
    return value;
  };

  // Helper to get optional env var
  const getOptional = (key: string, envKey: string = key): string | undefined => {
    const value = import.meta.env[envKey];
    return value && value !== '' ? value : undefined;
  };

  // Parse network
  const network = getRequired('network', 'VITE_SOLANA_NETWORK');
  if (!isValidNetwork(network)) {
    throw new ConfigValidationError(
      `Invalid VITE_SOLANA_NETWORK: "${network}"\n` +
      `Must be one of: solana-localnet, solana-devnet, solana-testnet, solana-mainnet-beta`
    );
  }

  // Parse program ID
  const programId = getRequired('programId', 'VITE_SOLANA_PROGRAM_ID');
  // Basic validation for Solana program ID (base58 string, typically 44 characters)
  if (programId.length < 32 || programId.length > 44) {
    throw new ConfigValidationError(
      `Invalid VITE_SOLANA_PROGRAM_ID: "${programId}"\n` +
      `Must be a valid Solana program ID (base58 encoded public key).`
    );
  }

  // Parse admin address (basic validation)
  const adminAddress = getRequired('adminAddress', 'VITE_SOLANA_ADMIN_ADDRESS');
  // Solana addresses are base58 encoded public keys, typically 32-44 characters
  if (adminAddress.length < 32 || adminAddress.length > 44) {
    throw new ConfigValidationError(
      `Invalid VITE_SOLANA_ADMIN_ADDRESS: "${adminAddress}"\n` +
      `Solana addresses must be valid base58 encoded public keys.`
    );
  }

  // Parse node env
  const nodeEnv = getOptional('nodeEnv', 'NODE_ENV') || 'development';
  if (!['development', 'production', 'test'].includes(nodeEnv)) {
    throw new ConfigValidationError(
      `Invalid NODE_ENV: "${nodeEnv}"\n` +
      `Must be one of: development, production, test`
    );
  }

  // Parse API URL
  const apiUrl = getOptional('apiUrl', 'VITE_API_URL') || 'http://localhost:5000';

  return {
    nodeEnv: nodeEnv as 'development' | 'production' | 'test',
    apiUrl,
    network,
    programId,
    adminAddress,
    databaseUrl: getOptional('databaseUrl', 'DATABASE_URL'),
    walletConnectProjectId: getOptional('walletConnectProjectId', 'VITE_WALLETCONNECT_PROJECT_ID'),
  };
}

/**
 * Singleton instance - validated once at startup
 */
let config: EnvironmentConfig | null = null;

/**
 * Get validated environment configuration
 * 
 * @throws {ConfigValidationError} If configuration is invalid
 */
export function getConfig(): EnvironmentConfig {
  if (!config) {
    config = parseEnvironment();
    
    // Log configuration in development (excluding sensitive data)
    if (config.nodeEnv === 'development') {
      console.log('🔧 Configuration loaded:', {
        nodeEnv: config.nodeEnv,
        network: config.network,
        programId: `${config.programId.slice(0, 8)}...${config.programId.slice(-6)}`,
        adminAddress: `${config.adminAddress.slice(0, 8)}...${config.adminAddress.slice(-6)}`,
        apiUrl: config.apiUrl,
      });
    }
  }
  return config;
}

/**
 * Reset configuration (for testing only)
 */
export function resetConfig(): void {
  config = null;
}

/**
 * Check if running in development mode
 */
export function isDevelopment(): boolean {
  return getConfig().nodeEnv === 'development';
}

/**
 * Check if running in production mode
 */
export function isProduction(): boolean {
  return getConfig().nodeEnv === 'production';
}
