/**
 * Configuration Index
 * 
 * Single source of truth for all application configuration.
 * Exports validated, type-safe configuration objects.
 */

export { 
  type NetworkType,
  type NetworkConfig,
  NETWORK_CONFIGS,
  getNetworkConfig,
  isValidNetwork,
} from './networks';

export {
  type EnvironmentConfig,
  getConfig,
  isDevelopment,
  isProduction,
  resetConfig,
} from './environment';

/**
 * Constants derived from configuration
 */
export const APP_NAME = 'Startup Prediction Markets' as const;
export const APP_VERSION = '1.0.0' as const;

/**
 * Feature flags
 */
export const FEATURES = {
  WALLET_CONNECT: false, // Not implemented yet
  ANALYTICS: false,
  DEBUG_MODE: true,
} as const;
