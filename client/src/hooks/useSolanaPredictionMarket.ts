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
} {
  const { connection } = useConnection();
  const wallet = useWallet();
  const service = getSolanaService();

  const provider = useMemo(() => {
    if (!wallet.publicKey) return null;
    
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

  return { connection, program, provider };
}

// ============================================================================
// Create Event Hook
// ============================================================================

/**
 * Hook to create a new prediction event (admin only)
 */
export function useCreateEvent(): TransactionHookReturn {
  const { program, provider } = useSolanaProgram();
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
      
      // Fetch current event counter
      const programState = await program.account.programState.fetch(programStatePDA);
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
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to create event');
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
// Place Bet Hook
// ============================================================================

/**
 * Hook to place a bet on an event
 */
export function usePlaceBet(): TransactionHookReturn {
  const { program, provider } = useSolanaProgram();
  const { publicKey } = useWallet();
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
  const [bets, setBets] = useState<SolanaBet[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const targetAddress = useMemo(() => {
    if (userAddress) {
      return typeof userAddress === 'string' ? new PublicKey(userAddress) : userAddress;
    }
    return publicKey;
  }, [userAddress, publicKey]);

  const fetchBets = useCallback(async () => {
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
  }, [program, targetAddress]);

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
