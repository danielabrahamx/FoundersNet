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
  
  // Algorand Network
  readonly network: NetworkType;
  readonly appId: number;
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
  const network = getRequired('network', 'VITE_ALGORAND_NETWORK');
  if (!isValidNetwork(network)) {
    throw new ConfigValidationError(
      `Invalid VITE_ALGORAND_NETWORK: "${network}"\n` +
      `Must be one of: localnet, testnet, mainnet`
    );
  }

  // Parse app ID
  const appIdStr = getRequired('appId', 'VITE_ALGORAND_APP_ID');
  const appId = parseInt(appIdStr, 10);
  if (isNaN(appId) || appId <= 0) {
    throw new ConfigValidationError(
      `Invalid VITE_ALGORAND_APP_ID: "${appIdStr}"\n` +
      `Must be a positive integer.`
    );
  }

  // Parse admin address (basic validation)
  const adminAddress = getRequired('adminAddress', 'VITE_ALGORAND_ADMIN_ADDRESS');
  if (adminAddress.length !== 58) {
    throw new ConfigValidationError(
      `Invalid VITE_ALGORAND_ADMIN_ADDRESS: "${adminAddress}"\n` +
      `Algorand addresses must be 58 characters long.`
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
    appId,
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
        appId: config.appId,
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
