/**
 * Phase 7: Comprehensive End-to-End Integration Tests
 * 
 * This test suite validates the complete Solana prediction market flow:
 * 1. Initialize program state
 * 2. Create prediction events (admin)
 * 3. Place bets on events (users)
 * 4. Resolve events (admin)
 * 5. Claim winnings (users)
 * 
 * Run with: anchor test
 * 
 * @author Solana Migration Team
 * @date October 27, 2025
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Connection, Keypair, LAMPORTS_PER_SOL, PublicKey, SystemProgram } from '@solana/web3.js';
import { AnchorProvider, Program, setProvider, BN } from '@coral-xyz/anchor';
import NodeWallet from '@coral-xyz/anchor/dist/cjs/nodewallet';
import type { PredictionMarket } from '../target/types/prediction_market';
import idl from '../target/idl/prediction_market.json';

// Constants
const PROGRAM_ID = new PublicKey('Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS');
const RPC_URL = 'http://127.0.0.1:8899';
const WS_URL = 'ws://127.0.0.1:8900';

// Helper function to derive PDAs
function deriveProgramStatePDA(): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('program_state')],
    PROGRAM_ID
  );
}

function deriveEventPDA(eventId: number | BN): [PublicKey, number] {
  const eventIdBuffer = typeof eventId === 'number' 
    ? new BN(eventId).toBuffer('le', 8)
    : eventId.toBuffer('le', 8);
  return PublicKey.findProgramAddressSync(
    [Buffer.from('event'), eventIdBuffer],
    PROGRAM_ID
  );
}

function deriveBetPDA(betId: number | BN): [PublicKey, number] {
  const betIdBuffer = typeof betId === 'number'
    ? new BN(betId).toBuffer('le', 8)
    : betId.toBuffer('le', 8);
  return PublicKey.findProgramAddressSync(
    [Buffer.from('bet'), betIdBuffer],
    PROGRAM_ID
  );
}

function deriveEscrowPDA(eventId: number | BN): [PublicKey, number] {
  const eventIdBuffer = typeof eventId === 'number'
    ? new BN(eventId).toBuffer('le', 8)
    : eventId.toBuffer('le', 8);
  return PublicKey.findProgramAddressSync(
    [Buffer.from('escrow'), eventIdBuffer],
    PROGRAM_ID
  );
}

describe.skip('Phase 7: E2E Integration Tests - Prediction Market', () => {
  let provider: AnchorProvider;
  let program: Program<PredictionMarket>;
  let admin: Keypair;
  let user1: Keypair;
  let user2: Keypair;
  let programStateKey: PublicKey;
  let programStateBump: number;

  beforeAll(async () => {
    // Initialize Solana provider
    const connection = new Connection(RPC_URL, 'confirmed');
    admin = Keypair.generate();
    const wallet = new NodeWallet(admin);
    provider = new AnchorProvider(connection, wallet, {
      commitment: 'confirmed',
      preflightCommitment: 'confirmed',
    });
    setProvider(provider);

    // Load program
    program = new Program<PredictionMarket>(idl as any, provider);

    // Generate test users
    user1 = Keypair.generate();
    user2 = Keypair.generate();

    // Derive PDAs
    [programStateKey, programStateBump] = deriveProgramStatePDA();

    // Airdrop SOL to all accounts
    console.log('⏳ Airdropping SOL to test accounts...');
    const airdropSignatures = await Promise.all([
      provider.connection.requestAirdrop(admin.publicKey, 100 * LAMPORTS_PER_SOL),
      provider.connection.requestAirdrop(user1.publicKey, 50 * LAMPORTS_PER_SOL),
      provider.connection.requestAirdrop(user2.publicKey, 50 * LAMPORTS_PER_SOL),
    ]);

    // Wait for airdrops
    await Promise.all(
      airdropSignatures.map(sig => provider.connection.confirmTransaction(sig, 'confirmed'))
    );

    console.log('✅ Airdrops complete');
  });

  // ============================================================================
  // Test 1: Initialize Program State
  // ============================================================================

  it('should initialize program state', async () => {
    console.log('\n🧪 Test 1: Initialize Program State');

    const adminBalanceBefore = await provider.connection.getBalance(admin.publicKey);
    console.log(`   Admin balance before: ${adminBalanceBefore / LAMPORTS_PER_SOL} SOL`);

    // Initialize
    const tx = await program.methods
      .initialize(admin.publicKey)
      .accounts({
        program_state: programStateKey,
        payer: admin.publicKey,
        system_program: SystemProgram.programId,
      })
      .signers([admin])
      .rpc({ commitment: 'confirmed' });

    console.log(`   ✅ Initialization TX: ${tx}`);

    // Verify state
    const state = await program.account.programState.fetch(programStateKey);
    expect(state.admin.toString()).toBe(admin.publicKey.toString());
    expect(state.eventCounter.toNumber()).toBe(0);
    expect(state.betCounter.toNumber()).toBe(0);

    console.log('   ✅ Program state verified');
  });

  // ============================================================================
  // Test 2: Create Prediction Event
  // ============================================================================

  it('should create a prediction event', async () => {
    console.log('\n🧪 Test 2: Create Prediction Event');

    const eventName = 'Will Bitcoin reach $100k by end of 2024?';
    const now = new BN(Math.floor(Date.now() / 1000));
    const endTime = now.add(new BN(3600)); // 1 hour from now

    // Derive event PDA (next event ID should be 1)
    const [eventKey, eventBump] = deriveEventPDA(1);
    const [escrowKey, escrowBump] = deriveEscrowPDA(1);

    console.log(`   Event ID: 1`);
    console.log(`   Event PDA: ${eventKey.toString()}`);
    console.log(`   Escrow PDA: ${escrowKey.toString()}`);

    const tx = await program.methods
      .createEvent(eventName, endTime)
      .accounts({
        program_state: programStateKey,
        event: eventKey,
        event_escrow: escrowKey,
        admin: admin.publicKey,
        system_program: SystemProgram.programId,
      })
      .signers([admin])
      .rpc({ commitment: 'confirmed' });

    console.log(`   ✅ Create Event TX: ${tx}`);

    // Verify event
    const event = await program.account.event.fetch(eventKey);
    expect(event.eventId.toNumber()).toBe(1);
    expect(event.name).toBe(eventName);
    expect(event.endTime.eq(endTime)).toBe(true);
    expect(event.resolved).toBe(false);
    expect(event.totalYesBets.toNumber()).toBe(0);
    expect(event.totalNoBets.toNumber()).toBe(0);

    console.log(`   ✅ Event verified: ${event.name}`);
  });

  // ============================================================================
  // Test 3: Place Bets on Event
  // ============================================================================

  it('should allow users to place bets', async () => {
    console.log('\n🧪 Test 3: Place Bets on Event');

    // Bet amounts
    const user1BetAmount = new BN(1 * LAMPORTS_PER_SOL); // 1 SOL on YES
    const user2BetAmount = new BN(2 * LAMPORTS_PER_SOL); // 2 SOL on NO

    // Derive PDAs
    const [eventKey] = deriveEventPDA(1);
    const [escrowKey] = deriveEscrowPDA(1);
    const [bet1Key] = deriveBetPDA(1);
    const [bet2Key] = deriveBetPDA(2);

    // User 1 places bet (YES outcome = true)
    console.log('   Placing bet for User 1 (1 SOL on YES)...');
    let tx = await program.methods
      .placeBet(new BN(1), true, user1BetAmount)
      .accounts({
        program_state: programStateKey,
        event: eventKey,
        bet: bet1Key,
        event_escrow: escrowKey,
        bettor: user1.publicKey,
        system_program: SystemProgram.programId,
      })
      .signers([user1])
      .rpc({ commitment: 'confirmed' });

    console.log(`   ✅ User 1 Bet TX: ${tx}`);

    // Verify bet 1
    const bet1 = await program.account.bet.fetch(bet1Key);
    expect(bet1.betId.toNumber()).toBe(1);
    expect(bet1.eventId.toNumber()).toBe(1);
    expect(bet1.bettor.toString()).toBe(user1.publicKey.toString());
    expect(bet1.outcome).toBe(true); // YES
    expect(bet1.amount.eq(user1BetAmount)).toBe(true);
    expect(bet1.claimed).toBe(false);

    console.log('   ✅ Bet 1 verified');

    // User 2 places bet (NO outcome = false)
    console.log('   Placing bet for User 2 (2 SOL on NO)...');
    tx = await program.methods
      .placeBet(new BN(1), false, user2BetAmount)
      .accounts({
        program_state: programStateKey,
        event: eventKey,
        bet: bet2Key,
        event_escrow: escrowKey,
        bettor: user2.publicKey,
        system_program: SystemProgram.programId,
      })
      .signers([user2])
      .rpc({ commitment: 'confirmed' });

    console.log(`   ✅ User 2 Bet TX: ${tx}`);

    // Verify bet 2
    const bet2 = await program.account.bet.fetch(bet2Key);
    expect(bet2.betId.toNumber()).toBe(2);
    expect(bet2.eventId.toNumber()).toBe(1);
    expect(bet2.bettor.toString()).toBe(user2.publicKey.toString());
    expect(bet2.outcome).toBe(false); // NO
    expect(bet2.amount.eq(user2BetAmount)).toBe(true);
    expect(bet2.claimed).toBe(false);

    console.log('   ✅ Bet 2 verified');

    // Verify event totals
    const event = await program.account.event.fetch(eventKey);
    expect(event.totalYesBets.toNumber()).toBe(1);
    expect(event.totalNoBets.toNumber()).toBe(1);
    expect(event.totalYesAmount.eq(user1BetAmount)).toBe(true);
    expect(event.totalNoAmount.eq(user2BetAmount)).toBe(true);

    console.log(`   ✅ Event totals verified: ${event.totalYesBets} YES bets, ${event.totalNoBets} NO bets`);

    // Verify escrow balance
    const escrowBalance = await provider.connection.getBalance(escrowKey);
    const totalBet = user1BetAmount.add(user2BetAmount).toNumber();
    expect(escrowBalance).toBe(totalBet);

    console.log(`   ✅ Escrow balance verified: ${escrowBalance / LAMPORTS_PER_SOL} SOL`);
  });

  // ============================================================================
  // Test 4: Resolve Event
  // ============================================================================

  it('should resolve event with outcome', async () => {
    console.log('\n🧪 Test 4: Resolve Event');

    const [eventKey] = deriveEventPDA(1);
    const outcomeYES = true;

    console.log(`   Resolving event with outcome: ${outcomeYES ? 'YES' : 'NO'}`);

    const tx = await program.methods
      .resolveEvent(new BN(1), outcomeYES)
      .accounts({
        program_state: programStateKey,
        event: eventKey,
        admin: admin.publicKey,
      })
      .signers([admin])
      .rpc({ commitment: 'confirmed' });

    console.log(`   ✅ Resolve Event TX: ${tx}`);

    // Verify event is resolved
    const event = await program.account.event.fetch(eventKey);
    expect(event.resolved).toBe(true);
    expect(event.outcome).toBe(outcomeYES);

    console.log('   ✅ Event resolved successfully');
  });

  // ============================================================================
  // Test 5: Claim Winnings
  // ============================================================================

  it('should allow winners to claim winnings', async () => {
    console.log('\n🧪 Test 5: Claim Winnings');

    const [eventKey] = deriveEventPDA(1);
    const [bet1Key] = deriveBetPDA(1); // User 1's winning bet
    const [escrowKey] = deriveEscrowPDA(1);

    // Get user1's balance before claiming
    const user1BalanceBefore = await provider.connection.getBalance(user1.publicKey);
    console.log(`   User 1 balance before claiming: ${user1BalanceBefore / LAMPORTS_PER_SOL} SOL`);

    // Claim winnings
    const tx = await program.methods
      .claimWinnings(new BN(1), new BN(1))
      .accounts({
        event: eventKey,
        bet: bet1Key,
        event_escrow: escrowKey,
        bettor: user1.publicKey,
        system_program: SystemProgram.programId,
      })
      .signers([user1])
      .rpc({ commitment: 'confirmed' });

    console.log(`   ✅ Claim Winnings TX: ${tx}`);

    // Verify bet is claimed
    const bet = await program.account.bet.fetch(bet1Key);
    expect(bet.claimed).toBe(true);

    console.log('   ✅ Bet marked as claimed');

    // Verify user1's balance increased
    const user1BalanceAfter = await provider.connection.getBalance(user1.publicKey);
    const winnings = user1BalanceAfter - user1BalanceBefore;

    console.log(`   User 1 balance after claiming: ${user1BalanceAfter / LAMPORTS_PER_SOL} SOL`);
    console.log(`   Winnings received: ${winnings / LAMPORTS_PER_SOL} SOL`);

    // User 1 bet 1 SOL on YES (winning outcome)
    // Total pool: 1 SOL (YES) + 2 SOL (NO) = 3 SOL
    // Winning pool (YES): 1 SOL
    // Payout: (1 SOL * 3 SOL) / 1 SOL = 3 SOL
    expect(winnings).toBeGreaterThan(0);

    console.log('   ✅ Winnings verified');
  });

  // ============================================================================
  // Test 6: Losing Bet Cannot Claim
  // ============================================================================

  it('should prevent losers from claiming winnings', async () => {
    console.log('\n🧪 Test 6: Prevent Losers from Claiming');

    const [eventKey] = deriveEventPDA(1);
    const [bet2Key] = deriveBetPDA(2); // User 2's losing bet
    const [escrowKey] = deriveEscrowPDA(1);

    console.log('   Attempting to claim winnings for losing bet...');

    // Try to claim (should fail)
    try {
      await program.methods
        .claimWinnings(new BN(1), new BN(2))
        .accounts({
          event: eventKey,
          bet: bet2Key,
          event_escrow: escrowKey,
          bettor: user2.publicKey,
          system_program: SystemProgram.programId,
        })
        .signers([user2])
        .rpc({ commitment: 'confirmed' });

      throw new Error('Should have failed - losing bet cannot claim');
    } catch (error: any) {
      expect(error.message).toContain('LosingBet');
      console.log('   ✅ Correctly rejected losing bet claim');
    }
  });

  // ============================================================================
  // Test 7: Create Second Event for Multi-Event Testing
  // ============================================================================

  it('should create a second event', async () => {
    console.log('\n🧪 Test 7: Create Second Event');

    const eventName = 'Will Solana reach 200 TPS by 2025?';
    const now = new BN(Math.floor(Date.now() / 1000));
    const endTime = now.add(new BN(7200)); // 2 hours from now

    // Derive PDAs for event 2
    const [eventKey] = deriveEventPDA(2);
    const [escrowKey] = deriveEscrowPDA(2);

    console.log(`   Event ID: 2`);

    const tx = await program.methods
      .createEvent(eventName, endTime)
      .accounts({
        program_state: programStateKey,
        event: eventKey,
        event_escrow: escrowKey,
        admin: admin.publicKey,
        system_program: SystemProgram.programId,
      })
      .signers([admin])
      .rpc({ commitment: 'confirmed' });

    console.log(`   ✅ Create Event 2 TX: ${tx}`);

    // Verify event
    const event = await program.account.event.fetch(eventKey);
    expect(event.eventId.toNumber()).toBe(2);
    expect(event.name).toBe(eventName);
    expect(event.resolved).toBe(false);

    console.log(`   ✅ Event 2 verified: ${event.name}`);
  });

  // ============================================================================
  // Test 8: Query Program State
  // ============================================================================

  it('should query final program state', async () => {
    console.log('\n🧪 Test 8: Query Program State');

    const state = await program.account.programState.fetch(programStateKey);

    console.log('   Program State:');
    console.log(`     Admin: ${state.admin.toString()}`);
    console.log(`     Event Counter: ${state.eventCounter.toNumber()}`);
    console.log(`     Bet Counter: ${state.betCounter.toNumber()}`);

    expect(state.eventCounter.toNumber()).toBe(2);
    expect(state.betCounter.toNumber()).toBe(2);

    console.log('   ✅ Program state verified');
  });

  // ============================================================================
  // Test 9: Fetch All Events
  // ============================================================================

  it('should fetch all events using getProgramAccounts', async () => {
    console.log('\n🧪 Test 9: Fetch All Events');

    // Get all events
    const events = await program.account.event.all();

    console.log(`   Found ${events.length} events`);
    expect(events.length).toBeGreaterThanOrEqual(2);

    events.forEach((e, i) => {
      console.log(`     Event ${i + 1}: ${e.account.name} (ID: ${e.account.eventId.toNumber()})`);
    });

    console.log('   ✅ Events fetched successfully');
  });

  // ============================================================================
  // Test 10: Fetch User Bets
  // ============================================================================

  it('should fetch user bets', async () => {
    console.log('\n🧪 Test 10: Fetch User Bets');

    // Get all bets
    const allBets = await program.account.bet.all();

    console.log(`   Found ${allBets.length} total bets`);

    // Filter bets for user1
    const user1Bets = allBets.filter(b => b.account.bettor.equals(user1.publicKey));
    console.log(`   User 1 has ${user1Bets.length} bet(s)`);

    user1Bets.forEach((bet, i) => {
      console.log(`     Bet ${i + 1}: ${bet.account.amount.toString()} lamports on ${bet.account.outcome ? 'YES' : 'NO'}`);
    });

    expect(user1Bets.length).toBeGreaterThan(0);

    console.log('   ✅ User bets fetched successfully');
  });
});
