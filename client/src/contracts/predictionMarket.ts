/**
 * Prediction Market Smart Contract Configuration
 * 
 * This file contains the contract address and ABI for interacting with
 * the PredictionMarket smart contract deployed on Polygon Amoy testnet.
 */

import contractAbi from '@shared/PredictionMarket.json';

/**
 * Deployed contract address on Polygon Amoy testnet
 * Update this after deploying the contract
 */
export const predictionMarketAddress = "0x766e60Be7043976EFdD9bE349dd198667d247c76" as const;

/**
 * Contract ABI for interacting with the PredictionMarket contract
 * Includes all functions needed for:
 * - Placing bets
 * - Resolving markets (admin only)
 * - Reading event data
 * - Claiming winnings
 */
export const predictionMarketAbi = contractAbi;

/**
 * Admin wallet address
 * This address has special permissions to:
 * - Create new prediction events
 * - Resolve event outcomes
 * - Emergency withdraw funds
 */
export const adminAddress = "0x3c0973dc78549E824E49e41CBBAEe73502c5fC91" as const;

/**
 * Network configuration
 */
export const networkConfig = {
  chainId: 80002,
  chainName: "Polygon Amoy",
  rpcUrl: "https://rpc-amoy.polygon.technology/",
  blockExplorer: "https://amoy.polygonscan.com",
  nativeCurrency: {
    name: "ALGO",
    symbol: "ALGO",
    decimals: 18,
  },
} as const;

/**
 * Contract function selectors for easy reference
 */
export const contractFunctions = {
  // Write functions
  placeBet: 'placeBet',
  resolveEvent: 'resolveEvent',
  createEvent: 'createEvent',
  claimWinnings: 'claimWinnings',
  emergencyWithdraw: 'emergencyWithdraw',
  
  // Read functions
  getEvent: 'getEvent',
  getAllEvents: 'getAllEvents',
  getUserBets: 'getUserBets',
  getTotalBets: 'getTotalBets',
  admin: 'admin',
  betCounter: 'betCounter',
  eventCounter: 'eventCounter',
} as const;

/**
 * Default bet amount in ALGO
 */
export const DEFAULT_BET_AMOUNT = "0.01";

/**
 * Minimum bet amount in ALGO
 */
export const MIN_BET_AMOUNT = "0.01";
