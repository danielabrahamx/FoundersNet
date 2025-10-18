import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { polygon, polygonAmoy } from 'wagmi/chains';

// Get WalletConnect Project ID from environment
const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID;

if (!projectId) {
  throw new Error('VITE_WALLETCONNECT_PROJECT_ID is not set');
}

// Configure chains - Using Polygon Amoy (current testnet)
export const chains = [polygonAmoy, polygon] as const;

// Configure Wagmi with RainbowKit
export const wagmiConfig = getDefaultConfig({
  appName: 'Startup Prediction Markets',
  projectId,
  chains,
  ssr: false, // We're not using SSR
});
