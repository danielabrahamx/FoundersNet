import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { PredictionMarket } from "../target/types/prediction_market";
import { assert, expect } from "chai";
import { PublicKey, SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js";

describe("Prediction Market", () => {
  // Configure the client to use the local cluster
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.PredictionMarket as Program<PredictionMarket>;
  
  // Test accounts
  const admin = provider.wallet.publicKey;
  let programStatePDA: PublicKey;
  let programStateBump: number;
  
  let eventId = 1;
  let betId = 1;

  before(async () => {
    // Derive program state PDA
    [programStatePDA, programStateBump] = PublicKey.findProgramAddressSync(
      [Buffer.from("program_state")],
      program.programId
    );
  });

  it("Initializes the program", async () => {
    try {
      await program.methods
        .initialize(admin)
        .accounts({
          programState: programStatePDA,
          payer: admin,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      // Fetch program state
      const state = await program.account.programState.fetch(programStatePDA);
      
      assert.equal(state.admin.toString(), admin.toString());
      assert.equal(state.eventCounter.toNumber(), 0);
      assert.equal(state.betCounter.toNumber(), 0);
      
      console.log("✅ Program initialized successfully");
    } catch (error) {
      console.error("Error initializing program:", error);
      throw error;
    }
  });

  it("Creates a new event", async () => {
    const eventName = "Will Startup X reach $1M ARR?";
    const endTime = new anchor.BN(Date.now() / 1000 + 86400); // 24 hours from now

    // Derive event PDA
    const [eventPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("event"), Buffer.from(eventId.toString().padStart(8, '0'))],
      program.programId
    );

    // Derive escrow PDA
    const [escrowPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("escrow"), Buffer.from(eventId.toString().padStart(8, '0'))],
      program.programId
    );

    try {
      await program.methods
        .createEvent(eventName, endTime)
        .accounts({
          programState: programStatePDA,
          event: eventPDA,
          eventEscrow: escrowPDA,
          admin: admin,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      // Fetch event
      const event = await program.account.event.fetch(eventPDA);
      
      assert.equal(event.name, eventName);
      assert.equal(event.resolved, false);
      assert.equal(event.totalYesBets.toNumber(), 0);
      assert.equal(event.totalNoBets.toNumber(), 0);
      
      console.log("✅ Event created successfully:", event.name);
    } catch (error) {
      console.error("Error creating event:", error);
      throw error;
    }
  });

  it("Places a YES bet on the event", async () => {
    const betAmount = new anchor.BN(0.1 * LAMPORTS_PER_SOL); // 0.1 SOL

    // Derive PDAs
    const [eventPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("event"), Buffer.from(eventId.toString().padStart(8, '0'))],
      program.programId
    );

    const [betPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("bet"), Buffer.from(betId.toString().padStart(8, '0'))],
      program.programId
    );

    const [escrowPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("escrow"), Buffer.from(eventId.toString().padStart(8, '0'))],
      program.programId
    );

    try {
      await program.methods
        .placeBet(new anchor.BN(eventId), true, betAmount)
        .accounts({
          programState: programStatePDA,
          event: eventPDA,
          bet: betPDA,
          eventEscrow: escrowPDA,
          bettor: admin,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      // Fetch bet
      const bet = await program.account.bet.fetch(betPDA);
      
      assert.equal(bet.outcome, true);
      assert.equal(bet.amount.toNumber(), betAmount.toNumber());
      assert.equal(bet.claimed, false);
      
      // Fetch updated event
      const event = await program.account.event.fetch(eventPDA);
      assert.equal(event.totalYesBets.toNumber(), 1);
      assert.equal(event.totalYesAmount.toNumber(), betAmount.toNumber());
      
      console.log("✅ Bet placed successfully");
      betId++;
    } catch (error) {
      console.error("Error placing bet:", error);
      throw error;
    }
  });

  it("Places a NO bet on the event", async () => {
    const betAmount = new anchor.BN(0.2 * LAMPORTS_PER_SOL); // 0.2 SOL
    
    // Create a new bettor account
    const bettor = anchor.web3.Keypair.generate();
    
    // Airdrop SOL to bettor
    const signature = await provider.connection.requestAirdrop(
      bettor.publicKey,
      2 * LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(signature);

    // Derive PDAs
    const [eventPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("event"), Buffer.from(eventId.toString().padStart(8, '0'))],
      program.programId
    );

    const [betPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("bet"), Buffer.from(betId.toString().padStart(8, '0'))],
      program.programId
    );

    const [escrowPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("escrow"), Buffer.from(eventId.toString().padStart(8, '0'))],
      program.programId
    );

    try {
      await program.methods
        .placeBet(new anchor.BN(eventId), false, betAmount)
        .accounts({
          programState: programStatePDA,
          event: eventPDA,
          bet: betPDA,
          eventEscrow: escrowPDA,
          bettor: bettor.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([bettor])
        .rpc();

      // Fetch bet
      const bet = await program.account.bet.fetch(betPDA);
      
      assert.equal(bet.outcome, false);
      assert.equal(bet.amount.toNumber(), betAmount.toNumber());
      
      // Fetch updated event
      const event = await program.account.event.fetch(eventPDA);
      assert.equal(event.totalNoBets.toNumber(), 1);
      assert.equal(event.totalNoAmount.toNumber(), betAmount.toNumber());
      
      console.log("✅ NO bet placed successfully");
      betId++;
    } catch (error) {
      console.error("Error placing NO bet:", error);
      throw error;
    }
  });

  it("Resolves the event with YES outcome", async () => {
    // Derive event PDA
    const [eventPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("event"), Buffer.from(eventId.toString().padStart(8, '0'))],
      program.programId
    );

    try {
      await program.methods
        .resolveEvent(new anchor.BN(eventId), true)
        .accounts({
          programState: programStatePDA,
          event: eventPDA,
          admin: admin,
        })
        .rpc();

      // Fetch resolved event
      const event = await program.account.event.fetch(eventPDA);
      
      assert.equal(event.resolved, true);
      assert.equal(event.outcome, true);
      
      console.log("✅ Event resolved successfully with outcome: YES");
    } catch (error) {
      console.error("Error resolving event:", error);
      throw error;
    }
  });

  it("Claims winnings for the winning bet", async () => {
    const winningBetId = 1; // First bet (YES bet)

    // Derive PDAs
    const [eventPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("event"), Buffer.from(eventId.toString().padStart(8, '0'))],
      program.programId
    );

    const [betPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("bet"), Buffer.from(winningBetId.toString().padStart(8, '0'))],
      program.programId
    );

    const [escrowPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("escrow"), Buffer.from(eventId.toString().padStart(8, '0'))],
      program.programId
    );

    try {
      // Get initial balance
      const initialBalance = await provider.connection.getBalance(admin);
      
      await program.methods
        .claimWinnings(new anchor.BN(eventId), new anchor.BN(winningBetId))
        .accounts({
          event: eventPDA,
          bet: betPDA,
          eventEscrow: escrowPDA,
          bettor: admin,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      // Fetch updated bet
      const bet = await program.account.bet.fetch(betPDA);
      assert.equal(bet.claimed, true);
      
      // Check balance increased
      const finalBalance = await provider.connection.getBalance(admin);
      assert.isTrue(finalBalance > initialBalance);
      
      console.log("✅ Winnings claimed successfully");
    } catch (error) {
      console.error("Error claiming winnings:", error);
      throw error;
    }
  });

  it("Prevents non-admin from creating events", async () => {
    const nonAdmin = anchor.web3.Keypair.generate();
    
    // Airdrop SOL to non-admin
    const signature = await provider.connection.requestAirdrop(
      nonAdmin.publicKey,
      2 * LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(signature);

    const eventName = "Unauthorized Event";
    const endTime = new anchor.BN(Date.now() / 1000 + 86400);
    const newEventId = eventId + 1;

    // Derive event PDA
    const [eventPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("event"), Buffer.from(newEventId.toString().padStart(8, '0'))],
      program.programId
    );

    const [escrowPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("escrow"), Buffer.from(newEventId.toString().padStart(8, '0'))],
      program.programId
    );

    try {
      await program.methods
        .createEvent(eventName, endTime)
        .accounts({
          programState: programStatePDA,
          event: eventPDA,
          eventEscrow: escrowPDA,
          admin: nonAdmin.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([nonAdmin])
        .rpc();
      
      assert.fail("Should have thrown an error");
    } catch (error) {
      assert.include(error.toString(), "Unauthorized");
      console.log("✅ Correctly prevented non-admin from creating event");
    }
  });

  it("Prevents betting on resolved event", async () => {
    const betAmount = new anchor.BN(0.1 * LAMPORTS_PER_SOL);

    const [eventPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("event"), Buffer.from(eventId.toString().padStart(8, '0'))],
      program.programId
    );

    const [betPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("bet"), Buffer.from(betId.toString().padStart(8, '0'))],
      program.programId
    );

    const [escrowPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("escrow"), Buffer.from(eventId.toString().padStart(8, '0'))],
      program.programId
    );

    try {
      await program.methods
        .placeBet(new anchor.BN(eventId), true, betAmount)
        .accounts({
          programState: programStatePDA,
          event: eventPDA,
          bet: betPDA,
          eventEscrow: escrowPDA,
          bettor: admin,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
      
      assert.fail("Should have thrown an error");
    } catch (error) {
      assert.include(error.toString(), "EventAlreadyResolved");
      console.log("✅ Correctly prevented betting on resolved event");
    }
  });

  it("Prevents double claiming", async () => {
    const winningBetId = 1;

    const [eventPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("event"), Buffer.from(eventId.toString().padStart(8, '0'))],
      program.programId
    );

    const [betPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("bet"), Buffer.from(winningBetId.toString().padStart(8, '0'))],
      program.programId
    );

    const [escrowPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("escrow"), Buffer.from(eventId.toString().padStart(8, '0'))],
      program.programId
    );

    try {
      await program.methods
        .claimWinnings(new anchor.BN(eventId), new anchor.BN(winningBetId))
        .accounts({
          event: eventPDA,
          bet: betPDA,
          eventEscrow: escrowPDA,
          bettor: admin,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
      
      assert.fail("Should have thrown an error");
    } catch (error) {
      assert.include(error.toString(), "AlreadyClaimed");
      console.log("✅ Correctly prevented double claiming");
    }
  });
});
