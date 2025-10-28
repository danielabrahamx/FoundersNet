/**
 * Algorand Client Library
 * 
 * Manages Algorand network connections and wallet integration for the frontend.
 * Supports both Pera Wallet (TestNet/MainNet) and LocalNet with programmatic signing.
 */

import algosdk from 'algosdk';
import { PeraWalletConnect } from '@perawallet/connect';
import { LOCALNET_ACCOUNTS, getActiveLocalNetAccount, getAccountByAddress } from './localnet-accounts';

// Network configuration
export type NetworkType = 'testnet' | 'mainnet' | 'localnet';

interface NetworkConfig {
  algodUrl: string;
  indexerUrl: string;
  port: string | number;
  token: string;
  explorer: string;
}

export const NETWORKS: Record<NetworkType, NetworkConfig> = {
  testnet: {
    algodUrl: 'https://testnet-api.algonode.cloud',
    indexerUrl: 'https://testnet-idx.algonode.cloud',
    port: 443,
    token: '',
    explorer: 'https://testnet.algoexplorer.io',
  },
  mainnet: {
    algodUrl: 'https://mainnet-api.algonode.cloud',
    indexerUrl: 'https://mainnet-idx.algonode.cloud',
    port: 443,
    token: '',
    explorer: 'https://algoexplorer.io',
  },
  localnet: {
    algodUrl: 'http://localhost',
    indexerUrl: 'http://localhost',
    port: 4001,
    token: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    explorer: 'http://localhost:8980',
  },
};

// Get active network from environment (default to testnet)
export const ACTIVE_NETWORK: NetworkType = 
  (import.meta.env.VITE_ALGORAND_NETWORK as NetworkType) || 'testnet';

// Check if we're on LocalNet
export const IS_LOCALNET = ACTIVE_NETWORK.toLowerCase() === 'localnet';

// Prediction Market App ID (set after deployment)
export const PREDICTION_MARKET_APP_ID = 
  parseInt(import.meta.env.VITE_ALGORAND_APP_ID || '0');

// Get network config
const networkConfig = NETWORKS[ACTIVE_NETWORK];

/**
 * Create Algod client for the active network
 */
export function createAlgodClient(): algosdk.Algodv2 {
  return new algosdk.Algodv2(
    networkConfig.token,
    networkConfig.algodUrl,
    networkConfig.port
  );
}

/**
 * Create Indexer client for the active network
 */
export function createIndexerClient(): algosdk.Indexer {
  return new algosdk.Indexer(
    networkConfig.token,
    networkConfig.indexerUrl,
    networkConfig.port
  );
}

/**
 * Pera Wallet instance (singleton)
 */
let peraWallet: PeraWalletConnect | null = null;

/**
 * Get or create Pera Wallet instance
 */
export function getPeraWallet(): PeraWalletConnect {
  if (!peraWallet) {
    peraWallet = new PeraWalletConnect({
      chainId: ACTIVE_NETWORK === 'mainnet' ? 416001 : 416002, // MainNet: 416001, TestNet: 416002
    });
  }
  return peraWallet;
}

/**
 * Reset Pera Wallet instance (for handling session errors)
 */
export function resetPeraWallet(): void {
  if (peraWallet) {
    try {
      peraWallet.disconnect();
    } catch (e) {
      // Ignore disconnect errors
    }
  }
  peraWallet = null;
}

/**
 * Connect to Pera Wallet
 * @returns Array of connected account addresses
 */
export async function connectWallet(): Promise<string[]> {
  const wallet = getPeraWallet();
  try {
    // Check if already connected
    const existingAccounts = wallet.connector?.accounts || [];
    if (existingAccounts.length > 0) {
      console.log('Wallet already connected, returning existing session');
      // Return existing accounts instead of trying to reconnect
      return existingAccounts;
    }
    
    // Not connected, initiate new connection
    const accounts = await wallet.connect();
    return accounts;
  } catch (error: any) {
    console.error('Failed to connect wallet:', error);
    
    // If session error, reset the wallet instance and try once more
    if (error?.message?.includes('Session currently connected')) {
      console.log('Session error detected, resetting wallet instance...');
      resetPeraWallet();
      const newWallet = getPeraWallet();
      const accounts = await newWallet.connect();
      return accounts;
    }
    
    throw error;
  }
}

/**
 * Disconnect from Pera Wallet
 */
export async function disconnectWallet(): Promise<void> {
  const wallet = getPeraWallet();
  await wallet.disconnect();
}

/**
 * Check if wallet is connected
 */
export function isWalletConnected(): boolean {
  const wallet = getPeraWallet();
  return wallet.isConnected;
}

/**
 * Get connected accounts
 */
export function getConnectedAccounts(): string[] {
  const wallet = getPeraWallet();
  return wallet.connector?.accounts || [];
}

/**
 * Convert ALGO to microAlgos
 */
export function algoToMicroAlgo(algo: number): number {
  return Math.floor(algo * 1_000_000);
}

/**
 * Convert microAlgos to ALGO
 */
export function microAlgoToAlgo(microAlgo: number): number {
  return microAlgo / 1_000_000;
}

/**
 * Format Algorand address (first 6 and last 4 characters)
 */
export function formatAddress(address: string): string {
  if (!address || address.length < 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/**
 * Get account balance
 */
export async function getAccountBalance(address: string): Promise<number> {
  const algodClient = createAlgodClient();
  try {
    const accountInfo = await algodClient.accountInformation(address).do();
    return Number(accountInfo.amount); // Convert BigInt to Number
  } catch (error) {
    console.error('Failed to get account balance:', error);
    return 0;
  }
}

/**
 * Get app account address
 */
export function getAppAddress(appId: number): string {
  const addr = algosdk.getApplicationAddress(appId);
  return algosdk.encodeAddress(addr.publicKey);
}

/**
 * Wait for transaction confirmation
 */
export async function waitForConfirmation(
  txId: string,
  timeout: number = 10
): Promise<algosdk.modelsv2.PendingTransactionResponse> {
  const algodClient = createAlgodClient();
  const statusResponse = await algodClient.status().do();
  const startRound = Number(statusResponse.lastRound);
  let currentRound = startRound;

  while (currentRound < startRound + timeout) {
    try {
      const pendingInfo = await algodClient
        .pendingTransactionInformation(txId)
        .do();
      
      if (pendingInfo.confirmedRound) {
        return pendingInfo;
      }
      
      if (pendingInfo.poolError) {
        throw new Error(`Transaction error: ${pendingInfo.poolError}`);
      }
      
      await algodClient.statusAfterBlock(currentRound).do();
      currentRound++;
    } catch (error) {
      if ((error as Error).message.includes('transaction not found')) {
        await algodClient.statusAfterBlock(currentRound).do();
        currentRound++;
        continue;
      }
      throw error;
    }
  }

  throw new Error(`Transaction not confirmed after ${timeout} rounds`);
}

/**
 * Sign and send transaction group
 * Automatically uses LocalNet signing or Pera Wallet based on active network
 */
export async function signAndSendTransactionGroup(
  txns: algosdk.Transaction[],
  signerAddress: string
): Promise<string> {
  const algodClient = createAlgodClient();

  // Assign group ID
  const groupedTxns = algosdk.assignGroupID(txns);
  
  let signedTxns: Uint8Array[];

  // LocalNet: Sign with mnemonic programmatically
  if (IS_LOCALNET) {
    // Use the signerAddress parameter to find the correct account
    const account = getAccountByAddress(signerAddress);
    
    if (!account) {
      throw new Error(`LocalNet account not found for address: ${signerAddress}. Make sure you're using one of the pre-configured LocalNet accounts.`);
    }

    // Convert mnemonic to account
    const signerAccount = algosdk.mnemonicToSecretKey(account.mnemonic);
    
    // Get address as string (algosdk v3 returns Address objects)
    const signerAddr = typeof signerAccount.addr === 'string' 
      ? signerAccount.addr 
      : algosdk.encodeAddress(signerAccount.addr.publicKey);
    
    // Verify the address matches
    if (signerAddr !== signerAddress) {
      throw new Error(`Mnemonic derivation mismatch. Expected ${signerAddress}, got ${signerAddr}`);
    }
    
    // Sign each transaction
    signedTxns = groupedTxns.map((txn: algosdk.Transaction) => {
      return txn.signTxn(signerAccount.sk);
    });
  } 
  // TestNet/MainNet: Use Pera Wallet
  else {
    const wallet = getPeraWallet();
    
    // Encode transactions for signing
    const txnsToSign = groupedTxns.map((txn: algosdk.Transaction) => {
      return {
        txn: txn,
        signers: [signerAddress],
      };
    });

    // Sign with Pera Wallet
    signedTxns = await wallet.signTransaction([txnsToSign]);
  }

  // Send to network
  const result = await algodClient.sendRawTransaction(signedTxns).do();
  const txId = result.txid; // algosdk v3 uses lowercase 'txid'

  return txId;
}

/**
 * Sign and send single transaction
 */
export async function signAndSendTransaction(
  txn: algosdk.Transaction,
  signerAddress: string
): Promise<string> {
  return signAndSendTransactionGroup([txn], signerAddress);
}

/**
 * Get suggested transaction parameters
 */
export async function getSuggestedParams(): Promise<algosdk.SuggestedParams> {
  const algodClient = createAlgodClient();
  return await algodClient.getTransactionParams().do();
}

/**
 * Read global state of application
 */
export async function readGlobalState(
  appId: number
): Promise<Record<string, any>> {
  const algodClient = createAlgodClient();
  try {
    const appInfo = await algodClient.getApplicationByID(appId).do();
    const globalState: Record<string, any> = {};

    // algosdk v3 uses camelCase 'globalState' instead of hyphenated 'global-state'
    if (appInfo.params.globalState) {
      for (const item of appInfo.params.globalState) {
        // algosdk v3 returns Uint8Array directly, not base64 string
        const key = new TextDecoder().decode(item.key);
        const value = item.value;

        if (value.type === 1) {
          // bytes - algosdk v3 returns Uint8Array directly
          globalState[key] = value.bytes;
        } else if (value.type === 2) {
          // uint
          globalState[key] = Number(value.uint); // Convert BigInt to Number
        }
      }
    }

    return globalState;
  } catch (error) {
    console.error('Failed to read global state:', error);
    return {};
  }
}

/**
 * Read box storage
 */
export async function readBox(
  appId: number,
  boxName: Uint8Array
): Promise<Uint8Array | null> {
  const algodClient = createAlgodClient();
  try {
    console.log('🔍 Reading box:', {
      appId,
      boxNameHex: Buffer.from(boxName).toString('hex'),
      boxNameBase64: Buffer.from(boxName).toString('base64'),
      boxNameLength: boxName.length,
      boxNameArray: Array.from(boxName)
    });
    
    const boxResponse = await algodClient.getApplicationBoxByName(appId, boxName).do();
    
    console.log('✅ Box read successful:', {
      valueLength: boxResponse.value?.length,
      valueHex: boxResponse.value ? Buffer.from(boxResponse.value).toString('hex') : 'null'
    });
    
    return boxResponse.value;
  } catch (error: any) {
    console.error('❌ Box read failed:', {
      error: error.message,
      status: error.status,
      response: error.response,
      appId,
      boxNameHex: Buffer.from(boxName).toString('hex')
    });
    
    // Only return null for expected "not found" errors
    if (error.status === 404 || error.message?.includes('box not found')) {
      return null;
    }
    
    // Re-throw unexpected errors so we can see them
    throw error;
  }
}

/**
 * Get explorer URL for transaction
 */
export function getExplorerTxUrl(txId: string): string {
  return `${networkConfig.explorer}/tx/${txId}`;
}

/**
 * Get explorer URL for address
 */
export function getExplorerAddressUrl(address: string): string {
  return `${networkConfig.explorer}/address/${address}`;
}

/**
 * Get explorer URL for application
 */
export function getExplorerAppUrl(appId: number): string {
  return `${networkConfig.explorer}/application/${appId}`;
}

/**
 * Utility to create ABI method call transaction
 */
export async function createMethodCallTxn(
  appId: number,
  sender: string,
  method: algosdk.ABIMethod,
  args: any[],
  suggestedParams?: algosdk.SuggestedParams
): Promise<algosdk.Transaction> {
  const params = suggestedParams || await getSuggestedParams();
  
  // Create application call transaction
  return algosdk.makeApplicationNoOpTxnFromObject({
    sender: sender, // algosdk v3 uses 'sender' instead of 'from'
    appIndex: appId,
    appArgs: [method.getSelector(), ...args],
    suggestedParams: params,
  });
}

/**
 * Export algosdk for direct use
 */
export { algosdk };
