import type { Express } from "express";
import { createServer, type Server } from "http";
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
  // Demo mode flag (allows running without a live Solana program)
  const DEMO_MODE = (process.env.DEMO_MODE === 'true') || (process.env.VITE_DEMO_MODE === 'true');

  // In-memory demo state (used only when DEMO_MODE is true)
  type DemoAccount = { address: string; name: string; balance: string };
  let demoInitialized = false;
  let demoAdminAddress = process.env.VITE_SOLANA_ADMIN_ADDRESS || 'DEMOADMIN1111111111111111111111111111111111';
  let demoAccounts: Record<string, DemoAccount> = {};
  let demoEvents: Record<number, Event> = {};
  let demoBets: Bet[] = [];
  let demoCounters = { event: 0, bet: 0 };

  const LAMPORTS_PER_SOL = BigInt(1000000000);
  const toLamports = (v: string | number | bigint) => BigInt(v);
  const fromLamports = (v: bigint) => v.toString();

  const seedDemoState = () => {
    if (demoInitialized || !DEMO_MODE) return;
    demoInitialized = true;
    // Seed accounts with 100 SOL each
    const seed: DemoAccount[] = [
      { address: demoAdminAddress, name: 'Admin', balance: (BigInt(100) * LAMPORTS_PER_SOL).toString() },
      { address: 'Alice111111111111111111111111111111111111111', name: 'Alice', balance: (BigInt(100) * LAMPORTS_PER_SOL).toString() },
      { address: 'Bob22222222222222222222222222222222222222222', name: 'Bob', balance: (BigInt(100) * LAMPORTS_PER_SOL).toString() },
      { address: 'Charlie3333333333333333333333333333333333333', name: 'Charlie', balance: (BigInt(100) * LAMPORTS_PER_SOL).toString() },
    ];
    demoAccounts = Object.fromEntries(seed.map(a => [a.address, a]));

    // Initialize empty events - users create real startup prediction events
    demoCounters.event = 0;
    demoEvents = {};
    demoBets = [];
    demoCounters.bet = 0;
    console.log('🧪 Seeded demo accounts (Admin, Alice, Bob, Charlie with 100 SOL each)');
  };

  // Initialize demo state once at startup (lazy-safe)
  if (DEMO_MODE) {
    seedDemoState();
  }

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
      if (DEMO_MODE) {
        seedDemoState();
        console.log('🧪 DEMO_MODE enabled - returning in-memory events');
        const events = Object.values(demoEvents).sort((a, b) => a.eventId - b.eventId);
        return res.json(events);
      }

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

      if (DEMO_MODE) {
        seedDemoState();
        const ev = demoEvents[eventId];
        if (!ev) return res.status(404).json({ error: 'Event not found' });
        return res.json(ev);
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

      if (DEMO_MODE) {
        seedDemoState();
        const bets = demoBets.filter(b => b.bettor === userAddress);
        return res.json(bets);
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

      if (DEMO_MODE) {
        seedDemoState();
        const bets = demoBets.filter(b => Number(b.eventId) === eventId);
        return res.json(bets);
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
      if (DEMO_MODE) {
        seedDemoState();
        const eventCount = Object.keys(demoEvents).length;
        const betCount = demoBets.length;
  const totalVolume = demoBets.reduce((acc, b) => acc + toLamports(b.amount), BigInt(0));
        return res.json({
          eventCount,
          betCount,
          totalVolume: fromLamports(totalVolume),
          network: 'demo',
        });
      }

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

  // DEMO endpoints for mutations and accounts
  // GET /api/demo/accounts - list demo accounts and balances
  app.get("/api/demo/accounts", (req, res) => {
    if (!DEMO_MODE) return res.status(404).json({ error: 'Not available' });
    seedDemoState();
    res.json(Object.values(demoAccounts));
  });

  // POST /api/events - create a new event (admin only)
  app.post("/api/events", (req, res) => {
    if (!DEMO_MODE) return res.status(501).json({ error: 'Not implemented' });
    seedDemoState();
    const { name, endTime, adminAddress } = req.body || {};
    if (!name || typeof name !== 'string' || name.trim().length < 3) {
      return res.status(400).json({ error: 'Invalid name' });
    }
    const end = Number(endTime);
    if (!end || Number.isNaN(end)) {
      return res.status(400).json({ error: 'Invalid endTime' });
    }
    if (!adminAddress) {
      return res.status(403).json({ error: 'Admin address required' });
    }

    const eventId = ++demoCounters.event;
    const ev: Event = {
      eventId,
      name: name.trim(),
      endTime: end,
      resolved: false,
      outcome: false,
      totalYesBets: 0,
      totalNoBets: 0,
      totalYesAmount: '0',
      totalNoAmount: '0',
      creator: adminAddress,
    };
    demoEvents[eventId] = ev;
    console.log('🧪 Created demo event', ev);
    return res.json(ev);
  });

  // POST /api/bets - place a bet
  app.post("/api/bets", (req, res) => {
    if (!DEMO_MODE) return res.status(501).json({ error: 'Not implemented' });
    seedDemoState();
    const { eventId, bettor, outcome, amount } = req.body || {};
    const idNum = Number(eventId);
    if (!idNum || Number.isNaN(idNum) || !demoEvents[idNum]) {
      return res.status(400).json({ error: 'Invalid eventId' });
    }
    const ev = demoEvents[idNum];
    if (ev.resolved) return res.status(400).json({ error: 'Event already resolved' });
    if (!bettor || typeof bettor !== 'string') return res.status(400).json({ error: 'Invalid bettor' });
    let acct = demoAccounts[bettor];
    if (!acct) {
      // Auto-create demo account with 100 SOL starting balance
      acct = { address: bettor, name: `User-${bettor.slice(0, 4)}`, balance: (BigInt(100) * LAMPORTS_PER_SOL).toString() };
      demoAccounts[bettor] = acct;
      console.log('🧪 Auto-created demo account for', bettor);
    }
    const amt = (() => { try { return toLamports(amount); } catch { return null; } })();
  if (amt === null || amt <= BigInt(0)) return res.status(400).json({ error: 'Invalid amount' });
    const bal = toLamports(acct.balance);
    if (bal < amt) return res.status(400).json({ error: 'Insufficient balance' });
    const isYes = !!outcome;

    // Deduct balance
    acct.balance = fromLamports(bal - amt);

    // Create bet
    const betId = String(++demoCounters.bet);
    const bet: Bet = {
      betId,
      eventId: String(idNum),
      bettor,
      outcome: isYes,
      amount: fromLamports(amt),
      claimed: false,
    };
    demoBets.push(bet);

    // Update event aggregates
    if (isYes) {
      ev.totalYesBets += 1;
      ev.totalYesAmount = fromLamports(toLamports(ev.totalYesAmount) + amt);
    } else {
      ev.totalNoBets += 1;
      ev.totalNoAmount = fromLamports(toLamports(ev.totalNoAmount) + amt);
    }

    console.log(`🧪 Placed demo bet #${betId} on event ${idNum} by ${bettor}`);
    return res.json({ bet, balance: acct.balance, event: ev });
  });

  // POST /api/events/:id/resolve - resolve an event (admin only)
  app.post("/api/events/:id/resolve", (req, res) => {
    if (!DEMO_MODE) return res.status(501).json({ error: 'Not implemented' });
    seedDemoState();
    const eventId = Number(req.params.id);
    const { outcome, adminAddress } = req.body || {};
    if (!eventId || Number.isNaN(eventId) || !demoEvents[eventId]) {
      return res.status(400).json({ error: 'Invalid eventId' });
    }
    if (!adminAddress) {
      return res.status(403).json({ error: 'Admin address required' });
    }
    const ev = demoEvents[eventId];
    ev.resolved = true;
    ev.outcome = !!outcome;
    console.log(`🧪 Resolved demo event ${eventId} with outcome=${ev.outcome}`);
    return res.json(ev);
  });

  // POST /api/bets/claim - claim winnings for a resolved event
  app.post("/api/bets/claim", (req, res) => {
    if (!DEMO_MODE) return res.status(501).json({ error: 'Not implemented' });
    seedDemoState();
    const { eventId, bettor } = req.body || {};
    const idNum = Number(eventId);
    if (!idNum || Number.isNaN(idNum) || !demoEvents[idNum]) {
      return res.status(400).json({ error: 'Invalid eventId' });
    }
    const ev = demoEvents[idNum];
    if (!ev.resolved) return res.status(400).json({ error: 'Event not resolved' });
    const acct = demoAccounts[bettor];
    if (!acct) return res.status(400).json({ error: 'Unknown bettor account' });

    const winningPool = ev.outcome ? toLamports(ev.totalYesAmount) : toLamports(ev.totalNoAmount);
    const losingPool = ev.outcome ? toLamports(ev.totalNoAmount) : toLamports(ev.totalYesAmount);
    if (winningPool === BigInt(0)) {
      return res.json({ payout: '0', claimedBetIds: [], message: 'No winning bets' });
    }

    const candidateBets = demoBets.filter(b => Number(b.eventId) === idNum && b.bettor === bettor && b.outcome === ev.outcome && !b.claimed);
    if (candidateBets.length === 0) {
      return res.json({ payout: '0', claimedBetIds: [] });
    }

  let totalPayout = BigInt(0);
    const claimedIds: string[] = [];
    for (const b of candidateBets) {
      const principal = toLamports(b.amount);
      // Payout = principal + pro-rata share of losing pool
      const share = (principal * losingPool) / winningPool;
      const payout = principal + share;
      totalPayout += payout;
      b.claimed = true;
      claimedIds.push(b.betId);
    }

    // Credit account
    acct.balance = fromLamports(toLamports(acct.balance) + totalPayout);
    console.log(`🧪 Claimed ${fromLamports(totalPayout)} lamports for ${bettor} on event ${idNum}`);
    return res.json({ payout: fromLamports(totalPayout), claimedBetIds: claimedIds, balance: acct.balance });
  });

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ 
      status: 'ok',
      network: DEMO_MODE ? 'demo' : (process.env.VITE_SOLANA_NETWORK || 'solana-localnet'),
      programId: process.env.VITE_SOLANA_PROGRAM_ID || 'not configured',
      timestamp: new Date().toISOString(),
      demo: DEMO_MODE,
    });
  });

  // GET /api/accounts - get all demo accounts
  app.get("/api/accounts", (req, res) => {
    if (!DEMO_MODE) return res.status(404).json({ error: 'Demo mode disabled' });
    seedDemoState();
    const accounts = Object.values(demoAccounts).map(acc => ({
      address: acc.address,
      name: acc.name,
      balanceSOL: Number(acc.balance) / Number(LAMPORTS_PER_SOL),
    }));
    return res.json(accounts);
  });

  // GET /api/accounts/:address - get specific account balance
  app.get("/api/accounts/:address", (req, res) => {
    if (!DEMO_MODE) return res.status(404).json({ error: 'Demo mode disabled' });
    seedDemoState();
    const address = req.params.address;
    const acc = demoAccounts[address];
    if (!acc) {
      return res.status(404).json({ error: 'Account not found' });
    }
    return res.json({
      address: acc.address,
      name: acc.name,
      balanceSOL: Number(acc.balance) / Number(LAMPORTS_PER_SOL),
      balanceLamports: acc.balance,
    });
  });

  const httpServer = createServer(app);
  return httpServer;
}
