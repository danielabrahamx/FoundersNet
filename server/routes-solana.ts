import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import * as anchor from '@coral-xyz/anchor';
import { Connection, PublicKey } from '@solana/web3.js';
import { Program } from '@coral-xyz/anchor';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Type definitions for Event and Bet structures
 */
interface Event {
  eventId: number;
  name: string;
  endTime: number;
  resolved: boolean;
  outcome: boolean;
  totalYesBets: number;
  totalNoBets: number;
  totalYesAmount: string;
  totalNoAmount: string;
  creator: string;
}

interface Bet {
  betId: string;
  eventId: string;
  bettor: string;
  outcome: boolean;
  amount: string;
  claimed: boolean;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Solana client configuration
  const getSolanaConnection = (): Connection => {
    const network = process.env.VITE_SOLANA_NETWORK || 'solana-localnet';
    
    let rpcUrl;
    if (network === 'solana-localnet') {
      rpcUrl = process.env.VITE_SOLANA_RPC_URL || 'http://localhost:8899';
      console.log(`🔗 Creating Solana connection for localnet: ${rpcUrl}`);
    } else if (network === 'solana-devnet') {
      rpcUrl = process.env.VITE_SOLANA_RPC_URL || 'https://api.devnet.solana.com';
      console.log(`🔗 Creating Solana connection for devnet: ${rpcUrl}`);
    } else if (network === 'solana-testnet') {
      rpcUrl = process.env.VITE_SOLANA_RPC_URL || 'https://api.testnet.solana.com';
      console.log(`🔗 Creating Solana connection for testnet: ${rpcUrl}`);
    } else if (network === 'solana-mainnet') {
      rpcUrl = process.env.VITE_SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';
      console.log(`🔗 Creating Solana connection for mainnet: ${rpcUrl}`);
    } else {
      throw new Error(`Unsupported network: ${network}`);
    }
    
    return new Connection(rpcUrl, 'confirmed');
  };

  const PROGRAM_ID_STR = process.env.VITE_SOLANA_PROGRAM_ID;
  if (!PROGRAM_ID_STR) {
    console.warn('⚠️  VITE_SOLANA_PROGRAM_ID not set');
  }

  /**
   * Load program IDL and create program instance
   */
  const loadProgram = (): Program | null => {
    if (!PROGRAM_ID_STR) {
      return null;
    }

    try {
      const connection = getSolanaConnection();
      const programId = new PublicKey(PROGRAM_ID_STR);

      // Load IDL
      const idlPath = path.join(__dirname, '../target/idl/prediction_market.json');
      if (!fs.existsSync(idlPath)) {
        console.warn('⚠️  Program IDL not found');
        return null;
      }

      const idl = JSON.parse(fs.readFileSync(idlPath, 'utf8'));
      
      // Create a minimal provider for read-only operations
      const provider = new anchor.AnchorProvider(
        connection,
        {} as any, // No wallet needed for read-only
        { commitment: 'confirmed' }
      );

      return new Program(idl as anchor.Idl, provider);
    } catch (error: any) {
      console.error('❌ Failed to load program:', error?.message || 'Unknown error');
      return null;
    }
  };

  /**
   * Get program state PDA
   */
  const getProgramStatePDA = (programId: PublicKey): PublicKey => {
    const [pda] = PublicKey.findProgramAddressSync(
      [Buffer.from('program_state')],
      programId
    );
    return pda;
  };

  /**
   * Get event PDA
   */
  const getEventPDA = (programId: PublicKey, eventId: number): PublicKey => {
    const [pda] = PublicKey.findProgramAddressSync(
      [Buffer.from('event'), new anchor.BN(eventId).toArrayLike(Buffer, 'le', 8)],
      programId
    );
    return pda;
  };

  /**
   * Get bet PDA
   */
  const getBetPDA = (programId: PublicKey, betId: number): PublicKey => {
    const [pda] = PublicKey.findProgramAddressSync(
      [Buffer.from('bet'), new anchor.BN(betId).toArrayLike(Buffer, 'le', 8)],
      programId
    );
    return pda;
  };

  // GET /api/events - Get all events from Solana blockchain
  app.get("/api/events", async (req, res) => {
    console.log('🔵 GET /api/events - Fetching all events');
    
    try {
      const program = loadProgram();
      if (!program) {
        console.log('⚠️  Program not configured');
        return res.json([]);
      }

      const programId = program.programId;
      const programStatePDA = getProgramStatePDA(programId);

      console.log('🔗 Fetching program state...');
      
      // Fetch program state to get event counter
      let programState;
      try {
        programState = await (program.account as any).programState.fetch(programStatePDA);
        console.log('✅ Program state fetched successfully');
      } catch (fetchErr: any) {
        console.error('❌ Failed to fetch program state:', fetchErr.message);
        return res.json([]);
      }
      
      const eventCounter = programState.eventCounter.toNumber();
      console.log(`📊 Event counter: ${eventCounter}`);

      if (eventCounter === 0) {
        console.log('ℹ️  No events found');
        return res.json([]);
      }

      // Fetch all events
      const events: Event[] = [];
      const fetchPromises: Promise<void>[] = [];

      for (let i = 1; i <= eventCounter; i++) {
        const fetchPromise = (async (eventId: number) => {
          try {
            const eventPDA = getEventPDA(programId, eventId);
            
            console.log(`📦 Fetching event ${eventId} at ${eventPDA.toString()}`);

            const eventAccount = await (program.account as any).event.fetch(eventPDA);
            
            const eventData: Event = {
              eventId: eventAccount.eventId.toNumber(),
              name: eventAccount.name,
              endTime: eventAccount.endTime.toNumber(),
              resolved: eventAccount.resolved,
              outcome: eventAccount.outcome,
              totalYesBets: eventAccount.totalYesBets.toNumber(),
              totalNoBets: eventAccount.totalNoBets.toNumber(),
              totalYesAmount: eventAccount.totalYesAmount.toString(),
              totalNoAmount: eventAccount.totalNoAmount.toString(),
              creator: eventAccount.creator.toString(),
            };
            
            events.push(eventData);
            console.log(`✅ Event ${eventId} decoded:`, eventData.name);
          } catch (err: any) {
            // Account not found or decoding error - log but continue
            console.error(`❌ Error fetching event ${eventId}:`, err.message);
          }
        })(i);

        fetchPromises.push(fetchPromise);
      }

      // Wait for all events to be fetched
      await Promise.all(fetchPromises);

      // Sort events by ID
      events.sort((a, b) => a.eventId - b.eventId);

      console.log(`✅ Successfully fetched ${events.length} events`);
      res.json(events);

    } catch (error: any) {
      console.error('❌ Error in /api/events:', error.message);
      res.status(500).json({ 
        error: 'Failed to fetch events',
        message: error.message 
      });
    }
  });

  // GET /api/events/:id - Get specific event by ID
  app.get("/api/events/:id", async (req, res) => {
    console.log(`🔵 GET /api/events/${req.params.id}`);
    
    try {
      const eventId = parseInt(req.params.id);
      
      if (!eventId || isNaN(eventId) || eventId < 1) {
        return res.status(400).json({ error: 'Invalid event ID' });
      }

      const program = loadProgram();
      if (!program) {
        return res.status(500).json({ error: 'Program not configured' });
      }

      const programId = program.programId;
      const eventPDA = getEventPDA(programId, eventId);
      
      console.log(`📦 Fetching event ${eventId} at ${eventPDA.toString()}`);

      try {
        const eventAccount = await (program.account as any).event.fetch(eventPDA);
        
        const eventData: Event = {
          eventId: eventAccount.eventId.toNumber(),
          name: eventAccount.name,
          endTime: eventAccount.endTime.toNumber(),
          resolved: eventAccount.resolved,
          outcome: eventAccount.outcome,
          totalYesBets: eventAccount.totalYesBets.toNumber(),
          totalNoBets: eventAccount.totalNoBets.toNumber(),
          totalYesAmount: eventAccount.totalYesAmount.toString(),
          totalNoAmount: eventAccount.totalNoAmount.toString(),
          creator: eventAccount.creator.toString(),
        };
        
        console.log(`✅ Event ${eventId} found:`, eventData.name);
        res.json(eventData);
      } catch (error: any) {
        console.log(`⚠️  Event ${eventId} not found`);
        res.status(404).json({ error: 'Event not found' });
      }
      
    } catch (error: any) {
      console.error(`❌ Error fetching event ${req.params.id}:`, error.message);
      res.status(500).json({ 
        error: 'Failed to fetch event',
        message: error.message 
      });
    }
  });

  // GET /api/users/:address/bets - Get all bets for a specific user
  app.get("/api/users/:address/bets", async (req, res) => {
    const userAddress = req.params.address;
    console.log(`🔵 GET /api/users/${userAddress}/bets`);
    
    try {
      if (!userAddress) {
        return res.status(400).json({ error: 'Invalid request' });
      }

      const program = loadProgram();
      if (!program) {
        return res.status(500).json({ error: 'Program not configured' });
      }

      const programId = program.programId;
      const connection = getSolanaConnection();

      // Validate user address
      let userPubkey;
      try {
        userPubkey = new PublicKey(userAddress);
      } catch (error) {
        return res.status(400).json({ error: 'Invalid Solana address' });
      }

      console.log('🔍 Fetching bets for user:', userPubkey.toString());

      // Fetch all bet accounts where bettor matches the user
      const bets = await (program.account as any).bet.all([
        {
          memcmp: {
            offset: 8 + 8, // Skip discriminator (8) and bet_id (8)
            bytes: userPubkey.toBase58(),
          }
        }
      ]);

      console.log(`✅ Found ${bets.length} bets for user`);

      const userBets: Bet[] = bets.map((bet: any) => ({
        betId: bet.account.betId.toString(),
        eventId: bet.account.eventId.toString(),
        bettor: bet.account.bettor.toString(),
        outcome: bet.account.outcome,
        amount: bet.account.amount.toString(),
        claimed: bet.account.claimed,
      }));

      res.json(userBets);

    } catch (error: any) {
      console.error(`❌ Error fetching user bets:`, error.message);
      res.status(500).json({ 
        error: 'Failed to fetch user bets',
        message: error.message 
      });
    }
  });

  // GET /api/events/:id/bets - Get all bets for a specific event
  app.get("/api/events/:id/bets", async (req, res) => {
    const eventId = parseInt(req.params.id);
    console.log(`🔵 GET /api/events/${eventId}/bets`);
    
    try {
      if (!eventId || isNaN(eventId) || eventId < 1) {
        return res.status(400).json({ error: 'Invalid event ID' });
      }

      const program = loadProgram();
      if (!program) {
        return res.status(500).json({ error: 'Program not configured' });
      }

      console.log('🔍 Fetching bets for event:', eventId);

      // Fetch all bet accounts where event_id matches
      const bets = await (program.account as any).bet.all([
        {
          memcmp: {
            offset: 8 + 8, // Skip discriminator (8) and bet_id (8)
            bytes: new anchor.BN(eventId).toArrayLike(Buffer, 'le', 8).toString('base64'),
          }
        }
      ]);

      console.log(`✅ Found ${bets.length} bets for event`);

      const eventBets: Bet[] = bets.map((bet: any) => ({
        betId: bet.account.betId.toString(),
        eventId: bet.account.eventId.toString(),
        bettor: bet.account.bettor.toString(),
        outcome: bet.account.outcome,
        amount: bet.account.amount.toString(),
        claimed: bet.account.claimed,
      }));

      res.json(eventBets);

    } catch (error: any) {
      console.error(`❌ Error fetching event bets:`, error.message);
      res.status(500).json({ 
        error: 'Failed to fetch event bets',
        message: error.message 
      });
    }
  });

  // GET /api/stats - Get general statistics
  app.get("/api/stats", async (req, res) => {
    console.log('🔵 GET /api/stats');
    
    try {
      const program = loadProgram();
      if (!program) {
        return res.json({
          eventCount: 0,
          betCount: 0,
          totalVolume: '0',
        });
      }

      const programId = program.programId;
      const programStatePDA = getProgramStatePDA(programId);

      const programState = await (program.account as any).programState.fetch(programStatePDA);

      const stats = {
        eventCount: programState.eventCounter.toNumber(),
        betCount: programState.betCounter.toNumber(),
        admin: programState.admin.toString(),
        network: process.env.VITE_SOLANA_NETWORK || 'solana-localnet',
      };

      res.json(stats);

    } catch (error: any) {
      console.error('❌ Error fetching stats:', error.message);
      res.status(500).json({ 
        error: 'Failed to fetch stats',
        message: error.message 
      });
    }
  });

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ 
      status: 'ok',
      network: process.env.VITE_SOLANA_NETWORK || 'solana-localnet',
      programId: process.env.VITE_SOLANA_PROGRAM_ID || 'not configured',
      timestamp: new Date().toISOString(),
    });
  });

  const httpServer = createServer(app);
  return httpServer;
}
