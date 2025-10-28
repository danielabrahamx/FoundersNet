/**
 * Integration Tests for Phase 7: Testing & Verification
 *
 * This test suite covers the end-to-end flows of the application on a local Solana validator.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { Connection, Keypair, LAMPORTS_PER_SOL, PublicKey, SystemProgram } from '@solana/web3.js';
import { AnchorProvider, Program, setProvider, BN, Idl } from '@coral-xyz/anchor';
import NodeWallet from '@coral-xyz/anchor/dist/cjs/nodewallet';
import { PredictionMarket } from '../target/types/prediction_market';
import idl from '../target/idl/prediction_market.json';

describe('Phase 7: Integration Test Suite - Deprecated (Use phase7-e2e.test.ts)', () => {
  let provider: AnchorProvider;
  let program: Program<PredictionMarket>;
  let admin: Keypair;
  let user1: Keypair;
  let programState: PublicKey;
  let eventPubkey: PublicKey;
  let eventEscrow: PublicKey;
  let betPubkey: PublicKey;
  const eventId = new BN(1);
  const betId = new BN(1);

  beforeAll(async () => {
    // Configure the client to use the local cluster.
    admin = Keypair.generate();
    const wallet = new NodeWallet(admin);
    const connection = new Connection('http://127.0.0.1:8899', 'confirmed');
    provider = new AnchorProvider(connection, wallet, { preflightCommitment: 'confirmed' });
    setProvider(provider);

    // Load the program
    program = new Program<PredictionMarket>(idl as any, provider);

    // Generate new keypairs for user
    user1 = Keypair.generate();

    // Derive PDAs
    [programState] = PublicKey.findProgramAddressSync(
      [Buffer.from('program_state')],
      program.programId
    );
    [eventPubkey] = PublicKey.findProgramAddressSync(
      [Buffer.from('event'), eventId.toBuffer('le', 8)],
      program.programId
    );
    [eventEscrow] = PublicKey.findProgramAddressSync(
      [Buffer.from('escrow'), eventId.toBuffer('le', 8)],
      program.programId
    );
    [betPubkey] = PublicKey.findProgramAddressSync(
      [Buffer.from('bet'), betId.toBuffer('le', 8)],
      program.programId
    );

    // Airdrop SOL to the admin and user accounts
    await provider.connection.requestAirdrop(admin.publicKey, 100 * LAMPORTS_PER_SOL);
    await provider.connection.requestAirdrop(user1.publicKey, 50 * LAMPORTS_PER_SOL);
  });

  it.skip('should create a new prediction event', async () => {
    await program.methods
      .initialize(admin.publicKey)
      .accounts({
        program_state: programState,
        payer: admin.publicKey,
        system_program: SystemProgram.programId,
      })
      .signers([admin])
      .rpc();

    const now = new BN(Math.floor(Date.now() / 1000));
    const deadline = now.add(new BN(3600)); // 1 hour from now

    await program.methods
      .createEvent('Test Event', deadline)
      .accounts({
        program_state: programState,
        event: eventPubkey,
        event_escrow: eventEscrow,
        admin: admin.publicKey,
        system_program: SystemProgram.programId,
      })
      .signers([admin])
      .rpc();

    const eventAccount = await program.account.event.fetch(eventPubkey);
    expect(eventAccount.name).toBe('Test Event');
    expect(eventAccount.endTime.eq(deadline)).toBe(true);
  });

  it.skip('should allow a user to place a bet', async () => {
    const user1Wallet = new NodeWallet(user1);
    const user1Provider = new AnchorProvider(provider.connection, user1Wallet, { preflightCommitment: 'confirmed' });
    const user1Program = new Program<PredictionMarket>(idl as any, user1Provider);

    await user1Program.methods
      .placeBet(eventId, true, new BN(1 * LAMPORTS_PER_SOL))
      .accounts({
        program_state: programState,
        event: eventPubkey,
        bet: betPubkey,
        event_escrow: eventEscrow,
        bettor: user1.publicKey,
        system_program: SystemProgram.programId,
      })
      .signers([user1])
      .rpc();

    const betAccount = await program.account.bet.fetch(betPubkey);
    expect(betAccount.outcome).toBe(true);
    expect(betAccount.amount.eq(new BN(1 * LAMPORTS_PER_SOL))).toBe(true);
  });

  it.skip('should resolve the event and allow claiming winnings', async () => {
    // Resolve the event
    await program.methods
      .resolveEvent(eventId, true)
      .accounts({
        program_state: programState,
        event: eventPubkey,
        admin: admin.publicKey,
      })
      .signers([admin])
      .rpc();

    // User 1 claims winnings
    const user1Wallet = new NodeWallet(user1);
    const user1Provider = new AnchorProvider(provider.connection, user1Wallet, { preflightCommitment: 'confirmed' });
    const user1Program = new Program<PredictionMarket>(idl as any, user1Provider);

    const user1BalanceBefore = await provider.connection.getBalance(user1.publicKey);

    await user1Program.methods
      .claimWinnings(eventId, betId)
      .accounts({
        event: eventPubkey,
        bet: betPubkey,
        event_escrow: eventEscrow,
        bettor: user1.publicKey,
        system_program: SystemProgram.programId,
      })
      .signers([user1])
      .rpc();

    const user1BalanceAfter = await provider.connection.getBalance(user1.publicKey);
    expect(user1BalanceAfter).toBeGreaterThan(user1BalanceBefore);
  });
});
