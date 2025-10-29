/**
 * Solana Prediction Market Hooks
 * 
 * React hooks for interacting with the Solana PredictionMarket smart contract.
 * Replaces Algorand hooks with Solana-native implementations using Anchor.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { Program, AnchorProvider, BN, web3 } from '@coral-xyz/anchor';
import { getSolanaService } from '@/services/solana.service';
import type { PredictionMarket } from '../../../target/types/prediction_market';
import { useToast } from './use-toast';
import { useDemoAccount } from '@/contexts/DemoAccountContext';

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Event structure matching the Solana smart contract
 */
export interface SolanaEvent {
  eventId: BN;
  name: string;
  endTime: BN;
  resolved: boolean;
  outcome: boolean;
  totalYesBets: BN;
  totalNoBets: BN;
  totalYesAmount: BN;
  totalNoAmount: BN;
  creator: PublicKey;
  bump: number;
}

/**
 * Bet structure matching the Solana smart contract
 */
export interface SolanaBet {
  betId: BN;
  eventId: BN;
  bettor: PublicKey;
  outcome: boolean;
  amount: BN;
  claimed: boolean;
  bump: number;
}

/**
 * Hook return type for transaction operations
 */
interface TransactionHookReturn {
  execute: (...args: any[]) => Promise<string | null>;
  isLoading: boolean;
  error: Error | null;
  signature: string | null;
}

// ============================================================================
// Base Wallet & Connection Hooks
// ============================================================================

/**
 * Get the current connected wallet address as a string
 */
export function useWalletAddress(): string | null {
  const { publicKey } = useWallet();
  const demoCtx = useDemoAccount();
  const isDemoMode = (import.meta as any).env?.VITE_DEMO_MODE === 'true';
  // In demo mode, return the selected demo account address
  if (isDemoMode) {
    return demoCtx.currentAccount.address;
  }
  return publicKey?.toBase58() || null;
}

/**
 * Get the wallet's SOL balance
 */
export function useAccountBalance(address?: string | PublicKey | null): {
  balance: number | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
} {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const [balance, setBalance] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const targetAddress = useMemo(() => {
    if (address) {
      return typeof address === 'string' ? address : address.toBase58();
    }
    return publicKey?.toBase58() || null;
  }, [address, publicKey]);

  const fetchBalance = useCallback(async () => {
    if (!targetAddress) {
      setBalance(null);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const pubKey = new PublicKey(targetAddress);
      const lamports = await connection.getBalance(pubKey);
      setBalance(lamports / LAMPORTS_PER_SOL);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch balance'));
      setBalance(null);
    } finally {
      setIsLoading(false);
    }
  }, [connection, targetAddress]);

  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  return { balance, isLoading, error, refetch: fetchBalance };
}

/**
 * Get the Solana connection and program instance
 */
export function useSolanaProgram(): {
  connection: web3.Connection;
  program: Program<PredictionMarket> | null;
  provider: AnchorProvider | null;
  isReady: boolean;
} {
  const { connection } = useConnection();
  const wallet = useWallet();
  const service = getSolanaService();

  const provider = useMemo(() => {
    if (!wallet.publicKey || !wallet.signTransaction) return null;
    
    return new AnchorProvider(
      connection,
      wallet as any,
      { commitment: 'confirmed' }
    );
  }, [connection, wallet]);

  const program = useMemo(() => {
    try {
      return service.getProgram();
    } catch {
      return null;
    }
  }, [service]);

  // Program is ready when we have program instance
  // Note: provider is only needed for write operations
  const isReady = program !== null;

  return { connection, program, provider, isReady };
}

// ============================================================================
// Initialize Program Hook
// ============================================================================

/**
 * Hook to initialize the program state (admin only, one-time setup)
 */
export function useInitializeProgram(): TransactionHookReturn {
  const { program, provider, isReady } = useSolanaProgram();
  const { publicKey } = useWallet();
  const { toast } = useToast();
  const service = getSolanaService();
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [signature, setSignature] = useState<string | null>(null);

  const execute = useCallback(async (
    adminAddress: string
  ): Promise<string | null> => {
    if (!isReady || !program || !provider || !publicKey) {
      const err = new Error('Wallet not connected or program not ready');
      setError(err);
      toast({
        title: 'Error',
        description: err.message,
        variant: 'destructive',
      });
      return null;
    }

    try {
      setIsLoading(true);
      setError(null);

      const adminPubkey = new PublicKey(adminAddress);
      const [programStatePDA] = await service.deriveProgramStatePDA();

      // Initialize the program
      const tx = await program.methods
        .initialize(adminPubkey)
        .accountsPartial({
          programState: programStatePDA,
          payer: publicKey,
        })
        .rpc();

      setSignature(tx);
      
      toast({
        title: 'Success',
        description: 'Program initialized successfully!',
      });

      return tx;
    } catch (err: any) {
      const error = err instanceof Error ? err : new Error('Failed to initialize program');
      setError(error);
      
      let description = error.message;
      if (error.message.includes('already in use')) {
        description = 'Program is already initialized.';
      }
      
      toast({
        title: 'Initialization Failed',
        description,
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [program, provider, publicKey, isReady, service, toast]);

  return { execute, isLoading, error, signature };
}

/**
 * Hook to check if program is initialized
 */
export function useProgramInitialized(): {
  isInitialized: boolean | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
} {
  const { program } = useSolanaProgram();
  const service = getSolanaService();
  const [isInitialized, setIsInitialized] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const checkInitialized = useCallback(async () => {
    if (!program) {
      setIsInitialized(false);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      const [programStatePDA] = await service.deriveProgramStatePDA();
      await program.account.programState.fetch(programStatePDA);
      
      setIsInitialized(true);
    } catch (err: any) {
      if (err.message?.includes('Account does not exist')) {
        setIsInitialized(false);
      } else {
        setError(err instanceof Error ? err : new Error('Failed to check initialization'));
        setIsInitialized(null);
      }
    } finally {
      setIsLoading(false);
    }
  }, [program, service]);

  useEffect(() => {
    checkInitialized();
  }, [checkInitialized]);

  return { isInitialized, isLoading, error, refetch: checkInitialized };
}

// ============================================================================
// Create Event Hook
// ============================================================================

/**
 * Hook to create a new prediction event (admin only)
 */
export function useCreateEvent(): TransactionHookReturn {
  const { program, provider, isReady } = useSolanaProgram();
  const { publicKey } = useWallet();
  const { toast } = useToast();
  const service = getSolanaService();
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [signature, setSignature] = useState<string | null>(null);

  const execute = useCallback(async (
    name: string,
    endTime: number // Unix timestamp in seconds
  ): Promise<string | null> => {
    // Check if program is ready
    if (!isReady || !program) {
      const err = new Error('Program not initialized. Please check your deployment.');
      setError(err);
      toast({
        title: 'Program Error',
        description: 'The prediction market program is not initialized. Please contact support.',
        variant: 'destructive',
      });
      return null;
    }

    // Check wallet connection
    if (!publicKey) {
      const err = new Error('Please connect your wallet to create events');
      setError(err);
      toast({
        title: 'Wallet Not Connected',
        description: err.message,
        variant: 'destructive',
      });
      return null;
    }

    // Check provider (needed for signing)
    if (!provider) {
      const err = new Error('Wallet provider not ready. Please try reconnecting your wallet.');
      setError(err);
      toast({
        title: 'Provider Error',
        description: err.message,
        variant: 'destructive',
      });
      return null;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Get program state PDA
      const [programStatePDA] = await service.deriveProgramStatePDA();
      
      // Fetch current event counter
      let programState;
      try {
        programState = await program.account.programState.fetch(programStatePDA);
      } catch (fetchErr: any) {
        throw new Error(
          'Program state not initialized. The smart contract needs to be initialized first. ' +
          'Please run the initialize instruction or contact the administrator.'
        );
      }
      
      const nextEventId = programState.eventCounter.toNumber() + 1;

      // Derive PDAs for new event
      const [eventPDA] = await service.deriveEventPDA(nextEventId);
      const [escrowPDA] = await service.deriveEscrowPDA(nextEventId);

      // Create event instruction
      const tx = await program.methods
        .createEvent(name, new BN(endTime))
        .accounts({
          programState: programStatePDA,
          event: eventPDA,
          eventEscrow: escrowPDA,
          admin: publicKey,
        })
        .rpc();

      setSignature(tx);
      
      toast({
        title: 'Success',
        description: 'Event created successfully!',
      });

      return tx;
    } catch (err: any) {
      const error = err instanceof Error ? err : new Error('Failed to create event');
      setError(error);
      
      // Provide more helpful error messages
      let description = error.message;
      if (error.message.includes('User rejected')) {
        description = 'Transaction was cancelled in wallet.';
      } else if (error.message.includes('insufficient')) {
        description = 'Insufficient funds to complete transaction. Please add SOL to your wallet.';
      } else if (error.message.includes('Program state not initialized')) {
        description = error.message;
      }
      
      toast({
        title: 'Failed to Create Event',
        description,
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [program, provider, publicKey, isReady, service, toast]);

  return { execute, isLoading, error, signature };
}

// ============================================================================
// Place Bet Hook
// ============================================================================

/**
 * Hook to place a bet on an event
 */
export function usePlaceBet(): TransactionHookReturn {
  const { program, provider } = useSolanaProgram();
  const { publicKey } = useWallet();
  const demo = (import.meta as any).env?.VITE_DEMO_MODE === 'true';
  const demoAccount = useDemoAccount();
  const { toast } = useToast();
  const service = getSolanaService();
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [signature, setSignature] = useState<string | null>(null);

  const execute = useCallback(async (
    eventId: number,
    outcome: boolean, // true = YES, false = NO
    amount: number // Amount in SOL
  ): Promise<string | null> => {
    // Demo mode: call backend API instead of on-chain transaction
    if (demo) {
      try {
        setIsLoading(true);
        setError(null);
        const lamports = Math.round(amount * LAMPORTS_PER_SOL);
        const resp = await fetch('/api/bets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            eventId,
            bettor: demoAccount.currentAccount.address,
            outcome,
            amount: lamports,
          }),
        });
        if (!resp.ok) {
          const err = await resp.json().catch(() => ({}));
          throw new Error(err?.error || 'Failed to place bet (demo)');
        }
        const data = await resp.json();
        toast({ title: 'Bet Placed (Demo)', description: `${amount} SOL on ${outcome ? 'YES' : 'NO'}` });
        // Refresh balance after placing bet
        await demoAccount.refreshBalance();
        // Return a pseudo signature
        setSignature(`demo-bet-${Date.now()}`);
        return 'demo';
      } catch (err: any) {
        const error = err instanceof Error ? err : new Error('Failed to place bet (demo)');
        setError(error);
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
        return null;
      } finally {
        setIsLoading(false);
      }
    }

    if (!program || !provider || !publicKey) {
      const err = new Error('Wallet not connected or program not initialized');
      setError(err);
      toast({
        title: 'Error',
        description: err.message,
        variant: 'destructive',
      });
      return null;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Convert SOL to lamports
      const lamports = Math.floor(amount * LAMPORTS_PER_SOL);

      // Get program state PDA
      const [programStatePDA] = await service.deriveProgramStatePDA();
      
      // Fetch current bet counter
      const programState = await program.account.programState.fetch(programStatePDA);
      const nextBetId = programState.betCounter.toNumber() + 1;

      // Derive PDAs
      const [eventPDA] = await service.deriveEventPDA(eventId);
      const [betPDA] = await service.deriveBetPDA(nextBetId);
      const [escrowPDA] = await service.deriveEscrowPDA(eventId);

      // Place bet instruction
      const tx = await program.methods
        .placeBet(new BN(eventId), outcome, new BN(lamports))
        .accounts({
          programState: programStatePDA,
          event: eventPDA,
          bet: betPDA,
          eventEscrow: escrowPDA,
          bettor: publicKey,
        })
        .rpc();

      setSignature(tx);
      
      toast({
        title: 'Success',
        description: `Bet placed successfully! ${amount} SOL on ${outcome ? 'YES' : 'NO'}`,
      });

      return tx;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to place bet');
      setError(error);
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [program, provider, publicKey, service, toast]);

  return { execute, isLoading, error, signature };
}

// ============================================================================
// Resolve Event Hook
// ============================================================================

/**
 * Hook to resolve an event (admin only)
 */
export function useResolveEvent(): TransactionHookReturn {
  const { program, provider } = useSolanaProgram();
  const { publicKey } = useWallet();
  const { toast } = useToast();
  const service = getSolanaService();
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [signature, setSignature] = useState<string | null>(null);

  const execute = useCallback(async (
    eventId: number,
    outcome: boolean // true = YES, false = NO
  ): Promise<string | null> => {
    if (!program || !provider || !publicKey) {
      const err = new Error('Wallet not connected or program not initialized');
      setError(err);
      toast({
        title: 'Error',
        description: err.message,
        variant: 'destructive',
      });
      return null;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Get program state PDA
      const [programStatePDA] = await service.deriveProgramStatePDA();
      const [eventPDA] = await service.deriveEventPDA(eventId);

      // Resolve event instruction
      const tx = await program.methods
        .resolveEvent(new BN(eventId), outcome)
        .accounts({
          programState: programStatePDA,
          event: eventPDA,
          admin: publicKey,
        })
        .rpc();

      setSignature(tx);
      
      toast({
        title: 'Success',
        description: `Event resolved with outcome: ${outcome ? 'YES' : 'NO'}`,
      });

      return tx;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to resolve event');
      setError(error);
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [program, provider, publicKey, service, toast]);

  return { execute, isLoading, error, signature };
}

// ============================================================================
// Claim Winnings Hook
// ============================================================================

/**
 * Hook to claim winnings from a winning bet
 */
export function useClaimWinnings(): TransactionHookReturn {
  const { program, provider } = useSolanaProgram();
  const { publicKey } = useWallet();
  const { toast } = useToast();
  const service = getSolanaService();
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [signature, setSignature] = useState<string | null>(null);

  const execute = useCallback(async (
    eventId: number,
    betId: number
  ): Promise<string | null> => {
    if (!program || !provider || !publicKey) {
      const err = new Error('Wallet not connected or program not initialized');
      setError(err);
      toast({
        title: 'Error',
        description: err.message,
        variant: 'destructive',
      });
      return null;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Derive PDAs
      const [eventPDA] = await service.deriveEventPDA(eventId);
      const [betPDA] = await service.deriveBetPDA(betId);
      const [escrowPDA] = await service.deriveEscrowPDA(eventId);

      // Claim winnings instruction
      const tx = await program.methods
        .claimWinnings(new BN(eventId), new BN(betId))
        .accounts({
          event: eventPDA,
          bet: betPDA,
          eventEscrow: escrowPDA,
          bettor: publicKey,
        })
        .rpc();

      setSignature(tx);
      
      toast({
        title: 'Success',
        description: 'Winnings claimed successfully!',
      });

      return tx;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to claim winnings');
      setError(error);
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [program, provider, publicKey, service, toast]);

  return { execute, isLoading, error, signature };
}

// ============================================================================
// Data Fetching Hooks
// ============================================================================

/**
 * Hook to get all events
 */
export function useGetAllEvents(): {
  events: SolanaEvent[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
} {
  const { program } = useSolanaProgram();
  const [events, setEvents] = useState<SolanaEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchEvents = useCallback(async () => {
    if (!program) {
      setEvents([]);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const eventAccounts = await program.account.event.all();
      const fetchedEvents: SolanaEvent[] = eventAccounts.map((acc) => acc.account as SolanaEvent);
      
      setEvents(fetchedEvents);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch events'));
      setEvents([]);
    } finally {
      setIsLoading(false);
    }
  }, [program]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  return { events, isLoading, error, refetch: fetchEvents };
}

/**
 * Hook to get a specific event by ID
 */
export function useGetEvent(eventId: number | null): {
  event: SolanaEvent | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
} {
  const { program } = useSolanaProgram();
  const service = getSolanaService();
  const [event, setEvent] = useState<SolanaEvent | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchEvent = useCallback(async () => {
    if (!program || eventId === null) {
      setEvent(null);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const [eventPDA] = await service.deriveEventPDA(eventId);
      const fetchedEvent = await program.account.event.fetch(eventPDA);
      
      setEvent(fetchedEvent as SolanaEvent);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch event'));
      setEvent(null);
    } finally {
      setIsLoading(false);
    }
  }, [program, service, eventId]);

  useEffect(() => {
    fetchEvent();
  }, [fetchEvent]);

  return { event, isLoading, error, refetch: fetchEvent };
}

/**
 * Hook to get all bets for a user
 */
export function useGetUserBets(userAddress?: string | PublicKey | null): {
  bets: SolanaBet[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
} {
  const { program } = useSolanaProgram();
  const { publicKey } = useWallet();
  const demo = (import.meta as any).env?.VITE_DEMO_MODE === 'true';
  const demoAcc = useDemoAccount();
  const [bets, setBets] = useState<SolanaBet[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const targetAddress = useMemo(() => {
    if (userAddress) {
      return typeof userAddress === 'string' ? new PublicKey(userAddress) : userAddress;
    }
    // In demo mode, prefer the demo account address
    if (demo) {
      try {
        return new PublicKey(demoAcc.currentAccount.address);
      } catch {}
    }
    return publicKey;
  }, [userAddress, publicKey, demo, demoAcc.currentAccount.address]);

  const fetchBets = useCallback(async () => {
    // Demo: fetch from API
    if (demo) {
      const addr = demoAcc.currentAccount.address;
      try {
        setIsLoading(true);
        setError(null);
        const resp = await fetch(`/api/users/${addr}/bets`, { headers: { 'Cache-Control': 'no-cache' } });
        if (resp.status === 304) {
          // Not modified: keep current bets, do not treat as error
          return;
        }
        if (!resp.ok) throw new Error('Failed to fetch user bets (demo)');
        const data = await resp.json();
        // Store as-is; MyBetsPage handles formatting
        setBets(data as any);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch user bets (demo)'));
        setBets([] as any);
      } finally {
        setIsLoading(false);
      }
      return;
    }

    if (!program || !targetAddress) {
      setBets([]);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Fetch all bet accounts filtered by bettor
      const betAccounts = await program.account.bet.all([
        {
          memcmp: {
            offset: 8 + 8 + 8, // Skip discriminator, betId, eventId
            bytes: targetAddress.toBase58(),
          },
        },
      ]);

      const fetchedBets: SolanaBet[] = betAccounts.map((acc) => acc.account as SolanaBet);
      
      setBets(fetchedBets);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch user bets'));
      setBets([]);
    } finally {
      setIsLoading(false);
    }
  }, [program, targetAddress, demo, demoAcc.currentAccount.address]);

  useEffect(() => {
    fetchBets();
  }, [fetchBets]);

  return { bets, isLoading, error, refetch: fetchBets };
}

/**
 * Hook to get program state (admin, counters)
 */
export function useGetProgramState(): {
  admin: PublicKey | null;
  eventCounter: number;
  betCounter: number;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
} {
  const { program } = useSolanaProgram();
  const service = getSolanaService();
  const [admin, setAdmin] = useState<PublicKey | null>(null);
  const [eventCounter, setEventCounter] = useState(0);
  const [betCounter, setBetCounter] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchState = useCallback(async () => {
    if (!program) {
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const [programStatePDA] = await service.deriveProgramStatePDA();
      const state = await program.account.programState.fetch(programStatePDA);
      
      setAdmin(state.admin);
      setEventCounter(state.eventCounter.toNumber());
      setBetCounter(state.betCounter.toNumber());
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch program state'));
    } finally {
      setIsLoading(false);
    }
  }, [program, service]);

  useEffect(() => {
    fetchState();
  }, [fetchState]);

  return { admin, eventCounter, betCounter, isLoading, error, refetch: fetchState };
}
