/**
 * Solana Service
 * 
 * Clean service layer for Solana blockchain interactions.
 * Replaces Algorand service with Solana-native implementation.
 * Uses Dependency Injection pattern for better testability.
 */

import { 
  Connection, 
  PublicKey, 
  Transaction, 
  VersionedTransaction,
  SendOptions,
  Commitment,
  ConfirmOptions,
  Keypair,
  LAMPORTS_PER_SOL,
  TransactionSignature,
  AccountInfo,
  ParsedAccountData,
  RpcResponseAndContext,
  SignatureResult,
} from '@solana/web3.js';
import { Program, AnchorProvider, Wallet, BN } from '@coral-xyz/anchor';
import { getConfig, getNetworkConfig } from '@/../../config';
import type { PredictionMarket } from '../../../target/types/prediction_market';
import IDL from '../../../target/idl/prediction_market.json';

/**
 * Solana service interface
 * Defines the contract for all Solana blockchain operations
 */
export interface ISolanaService {
  // Connection management
  getConnection(): Connection;
  getProgramId(): PublicKey;
  getProgram(): Program<PredictionMarket>;
  
  // Wallet operations
  connectWallet(): Promise<PublicKey | null>;
  disconnectWallet(): Promise<void>;
  getConnectedWallet(): PublicKey | null;
  isWalletConnected(): boolean;
  
  // Transaction operations
  sendTransaction(
    transaction: Transaction | VersionedTransaction,
    options?: SendOptions
  ): Promise<TransactionSignature>;
  confirmTransaction(
    signature: TransactionSignature,
    commitment?: Commitment
  ): Promise<RpcResponseAndContext<SignatureResult>>;
  
  // Account operations
  getAccountInfo(publicKey: PublicKey): Promise<AccountInfo<Buffer> | null>;
  getBalance(publicKey: PublicKey): Promise<number>;
  requestAirdrop(publicKey: PublicKey, lamports: number): Promise<TransactionSignature>;
  
  // Program-specific operations
  getProgramAccounts(filters?: any[]): Promise<readonly any[]>;
  deriveEventPDA(eventId: number): [PublicKey, number];
  deriveEscrowPDA(eventId: number): [PublicKey, number];
  deriveBetPDA(betId: number): [PublicKey, number];
  deriveProgramStatePDA(): [PublicKey, number];
  
  // Utility operations
  formatAddress(address: PublicKey | string): string;
  getExplorerUrl(type: 'address' | 'tx' | 'block', value: string): string;
  lamportsToSol(lamports: number | BN): number;
  solToLamports(sol: number): number;
  formatSol(lamports: number | BN, decimals?: number): string;
}

/**
 * Solana service implementation
 */
export class SolanaService implements ISolanaService {
  private connection: Connection | null = null;
  private program: Program<PredictionMarket> | null = null;
  private programId: PublicKey | null = null;
  private connectedWallet: PublicKey | null = null;
  
  constructor() {
    // Lazy initialization - clients created on first use
  }

  /**
   * Get or create Solana connection
   */
  getConnection(): Connection {
    if (!this.connection) {
      const config = getConfig();
      const networkConfig = getNetworkConfig(config.network);
      
      const commitment: Commitment = 'confirmed';
      this.connection = new Connection(networkConfig.rpcUrl, {
        commitment,
        confirmTransactionInitialTimeout: 60000,
      });
    }
    return this.connection;
  }

  /**
   * Get program ID
   */
  getProgramId(): PublicKey {
    if (!this.programId) {
      const config = getConfig();
      this.programId = new PublicKey(config.programId);
    }
    return this.programId;
  }

  /**
   * Get Anchor program instance
   */
  getProgram(): Program<PredictionMarket> {
    if (!this.program) {
      const connection = this.getConnection();
      const programId = this.getProgramId();
      
      // Create a dummy wallet for read-only operations
      const dummyKeypair = Keypair.generate();
      const dummyWallet = {
        publicKey: dummyKeypair.publicKey,
        signTransaction: async <T extends Transaction | VersionedTransaction>(tx: T): Promise<T> => tx,
        signAllTransactions: async <T extends Transaction | VersionedTransaction>(txs: T[]): Promise<T[]> => txs,
        payer: dummyKeypair,
      } as Wallet;
      
      const provider = new AnchorProvider(
        connection,
        dummyWallet,
        { commitment: 'confirmed' }
      );
      
      // Correct Program constructor: new Program(idl, provider)
      // The program ID comes from the IDL itself
      this.program = new Program(
        IDL as any,
        provider
      );
    }
    return this.program;
  }

  /**
   * Connect to Solana wallet
   * Note: Actual wallet integration will be done via React Context
   * This method is a placeholder for the service interface
   */
  async connectWallet(): Promise<PublicKey | null> {
    // This will be implemented with wallet adapter in Phase 4
    // For now, return null to indicate no wallet connected
    return null;
  }

  /**
   * Disconnect from Solana wallet
   */
  async disconnectWallet(): Promise<void> {
    this.connectedWallet = null;
  }

  /**
   * Get connected wallet public key
   */
  getConnectedWallet(): PublicKey | null {
    return this.connectedWallet;
  }

  /**
   * Check if wallet is connected
   */
  isWalletConnected(): boolean {
    return this.connectedWallet !== null;
  }

  /**
   * Send transaction
   */
  async sendTransaction(
    transaction: Transaction | VersionedTransaction,
    options?: SendOptions
  ): Promise<TransactionSignature> {
    const connection = this.getConnection();
    
    if (!this.connectedWallet) {
      throw new Error('Wallet not connected');
    }
    
    // This will need actual wallet signing in Phase 4
    throw new Error('Transaction signing not implemented - requires wallet adapter integration');
  }

  /**
   * Confirm transaction
   */
  async confirmTransaction(
    signature: TransactionSignature,
    commitment: Commitment = 'confirmed'
  ): Promise<RpcResponseAndContext<SignatureResult>> {
    const connection = this.getConnection();
    return await connection.confirmTransaction(signature, commitment);
  }

  /**
   * Get account info
   */
  async getAccountInfo(publicKey: PublicKey): Promise<AccountInfo<Buffer> | null> {
    const connection = this.getConnection();
    return await connection.getAccountInfo(publicKey);
  }

  /**
   * Get account balance in lamports
   */
  async getBalance(publicKey: PublicKey): Promise<number> {
    const connection = this.getConnection();
    return await connection.getBalance(publicKey);
  }

  /**
   * Request airdrop (devnet/testnet only)
   */
  async requestAirdrop(publicKey: PublicKey, lamports: number): Promise<TransactionSignature> {
    const connection = this.getConnection();
    const config = getConfig();
    
    // Only allow airdrops on devnet/testnet
    if (config.network === 'solana-mainnet-beta') {
      throw new Error('Airdrops not available on mainnet');
    }
    
    return await connection.requestAirdrop(publicKey, lamports);
  }

  /**
   * Get program accounts with optional filters
   */
  async getProgramAccounts(filters?: any[]): Promise<readonly any[]> {
    const program = this.getProgram();
    const programId = this.getProgramId();
    const connection = this.getConnection();
    
    const accounts = await connection.getProgramAccounts(programId, {
      filters: filters || [],
    });
    
    return accounts;
  }

  /**
   * Derive Event PDA
   */
  deriveEventPDA(eventId: number): [PublicKey, number] {
    const programId = this.getProgramId();
    const eventIdBuffer = new BN(eventId).toBuffer('le', 8);
    
    return PublicKey.findProgramAddressSync(
      [Buffer.from('event'), eventIdBuffer],
      programId
    );
  }

  /**
   * Derive Event Escrow PDA
   */
  deriveEscrowPDA(eventId: number): [PublicKey, number] {
    const programId = this.getProgramId();
    const eventIdBuffer = new BN(eventId).toBuffer('le', 8);
    
    return PublicKey.findProgramAddressSync(
      [Buffer.from('escrow'), eventIdBuffer],
      programId
    );
  }

  /**
   * Derive Bet PDA
   */
  deriveBetPDA(betId: number): [PublicKey, number] {
    const programId = this.getProgramId();
    const betIdBuffer = new BN(betId).toBuffer('le', 8);
    
    return PublicKey.findProgramAddressSync(
      [Buffer.from('bet'), betIdBuffer],
      programId
    );
  }

  /**
   * Derive Program State PDA
   */
  deriveProgramStatePDA(): [PublicKey, number] {
    const programId = this.getProgramId();
    
    return PublicKey.findProgramAddressSync(
      [Buffer.from('program_state')],
      programId
    );
  }

  /**
   * Format address for display (first 4 and last 4 characters)
   */
  formatAddress(address: PublicKey | string): string {
    const addressStr = typeof address === 'string' ? address : address.toBase58();
    if (addressStr.length < 8) return addressStr;
    return `${addressStr.slice(0, 4)}...${addressStr.slice(-4)}`;
  }

  /**
   * Get Solana explorer URL
   */
  getExplorerUrl(type: 'address' | 'tx' | 'block', value: string): string {
    const config = getConfig();
    const networkConfig = getNetworkConfig(config.network);
    const baseUrl = networkConfig.explorerUrl;
    
    switch (type) {
      case 'address':
        return `${baseUrl}/address/${value}`;
      case 'tx':
        return `${baseUrl}/tx/${value}`;
      case 'block':
        return `${baseUrl}/block/${value}`;
      default:
        return baseUrl;
    }
  }

  /**
   * Convert lamports to SOL
   */
  lamportsToSol(lamports: number | BN): number {
    const lamportsNum = typeof lamports === 'number' ? lamports : lamports.toNumber();
    return lamportsNum / LAMPORTS_PER_SOL;
  }

  /**
   * Convert SOL to lamports
   */
  solToLamports(sol: number): number {
    return Math.floor(sol * LAMPORTS_PER_SOL);
  }

  /**
   * Format lamports as SOL string
   */
  formatSol(lamports: number | BN, decimals: number = 4): string {
    return this.lamportsToSol(lamports).toFixed(decimals);
  }

  /**
   * Reset service state (for testing)
   */
  reset(): void {
    this.connection = null;
    this.program = null;
    this.programId = null;
    this.connectedWallet = null;
  }
}

/**
 * Singleton instance
 */
let serviceInstance: ISolanaService | null = null;

/**
 * Get Solana service instance
 */
export function getSolanaService(): ISolanaService {
  if (!serviceInstance) {
    serviceInstance = new SolanaService();
  }
  return serviceInstance;
}

/**
 * Reset service instance (for testing)
 */
export function resetSolanaService(): void {
  if (serviceInstance) {
    try {
      (serviceInstance as any).reset?.();
    } catch {
      // Ignore
    }
  }
  serviceInstance = null;
}

/**
 * Utility functions for Solana operations
 */
export const SolanaUtils = {
  /**
   * Convert lamports to SOL
   */
  lamportsToSol(lamports: number | BN): number {
    const lamportsNum = typeof lamports === 'number' ? lamports : lamports.toNumber();
    return lamportsNum / LAMPORTS_PER_SOL;
  },

  /**
   * Convert SOL to lamports
   */
  solToLamports(sol: number): number {
    return Math.floor(sol * LAMPORTS_PER_SOL);
  },

  /**
   * Format SOL with proper decimals
   */
  formatSol(lamports: number | BN, decimals: number = 4): string {
    return this.lamportsToSol(lamports).toFixed(decimals);
  },

  /**
   * Validate Solana address
   */
  isValidAddress(address: string): boolean {
    try {
      new PublicKey(address);
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Create PublicKey from string with validation
   */
  toPublicKey(address: string): PublicKey {
    try {
      return new PublicKey(address);
    } catch (error) {
      throw new Error(`Invalid Solana address: ${address}`);
    }
  },
} as const;
