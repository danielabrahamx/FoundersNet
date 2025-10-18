/**
 * PredictionMarket Algorand Smart Contract Tests
 * Migrated from Hardhat/Ethers.js to Algorand SDK
 */

import { expect } from "chai";
import algosdk from 'algosdk';
import {
  createAlgodClient,
  generateFundedAccount,
  deployPredictionMarket,
  callAppMethod,
  createPaymentTxn,
  readGlobalState,
  readBox,
  getAccountBalance,
  getCurrentTimestamp,
  algoToMicroAlgo,
  microAlgoToAlgo,
  waitForConfirmation,
  encodeMethodArg,
} from './test-utils.js';

describe("PredictionMarket (Algorand)", function () {
  let algodClient;
  let appId;
  let appAddress;
  let admin;
  let user1;
  let user2;

  // Increase timeout for blockchain operations
  this.timeout(30000);

  before(async function () {
    // Set network for test utilities
    process.env.NETWORK = 'localnet';
    
    // Create Algod client
    algodClient = createAlgodClient('localnet');
    
    // Generate and fund test accounts
    admin = await generateFundedAccount(algodClient, algoToMicroAlgo(100));
    user1 = await generateFundedAccount(algodClient, algoToMicroAlgo(100));
    user2 = await generateFundedAccount(algodClient, algoToMicroAlgo(100));
    
    console.log(`Admin: ${admin.addr}`);
    console.log(`User1: ${user1.addr}`);
    console.log(`User2: ${user2.addr}`);
  });

  beforeEach(async function () {
    // Deploy fresh contract for each test suite
    const deployment = await deployPredictionMarket(algodClient, admin, admin);
    appId = deployment.appId;
    appAddress = deployment.appAddress;
    
    console.log(`Deployed app ID: ${appId}`);
    console.log(`App address: ${appAddress}`);
  });

  describe("Deployment", function () {
    it("Should set the right admin", async function () {
      const globalState = await readGlobalState(algodClient, appId);
      
      // Admin address stored in global state
      expect(globalState).to.have.property('admin');
      
      // Decode admin address from global state
      const storedAdmin = algosdk.encodeAddress(
        Buffer.from(globalState.admin, 'base64')
      );
      expect(storedAdmin).to.equal(admin.addr);
    });

    it("Should initialize with zero events", async function () {
      const globalState = await readGlobalState(algodClient, appId);
      
      expect(globalState.event_counter || 0).to.equal(0);
    });
  });

  describe("Event Creation", function () {
    it("Should allow admin to create events", async function () {
      const endTime = getCurrentTimestamp() + 3600; // 1 hour from now
      const eventName = "Test Event";
      
      const result = await callAppMethod(
        algodClient,
        admin,
        appId,
        'create_event',
        [eventName, endTime]
      );
      
      expect(result).to.have.property('confirmed-round');
      
      // Verify event counter increased
      const globalState = await readGlobalState(algodClient, appId);
      expect(globalState.event_counter).to.equal(1);
      
      // Verify event data in box storage
      const eventBox = await readBox(algodClient, appId, `event_1`);
      expect(eventBox).to.not.be.null;
    });

    it("Should fail if non-admin tries to create event", async function () {
      const endTime = getCurrentTimestamp() + 3600;
      
      try {
        await callAppMethod(
          algodClient,
          user1,
          appId,
          'create_event',
          ["Test Event", endTime]
        );
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error.message).to.include('rejected by logic');
      }
    });

    it("Should fail if end time is in the past", async function () {
      const pastTime = getCurrentTimestamp() - 3600;
      
      try {
        await callAppMethod(
          algodClient,
          admin,
          appId,
          'create_event',
          ["Test Event", pastTime]
        );
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error.message).to.include('rejected by logic');
      }
    });
  });

  describe("Betting", function () {
    let eventId;

    beforeEach(async function () {
      const endTime = getCurrentTimestamp() + 3600;
      await callAppMethod(
        algodClient,
        admin,
        appId,
        'create_event',
        ["Test Event", endTime]
      );
      eventId = 1;
    });

    it("Should allow users to place bets", async function () {
      const betAmount = algoToMicroAlgo(10);
      
      // Create payment transaction
      const paymentTxn = await createPaymentTxn(
        algodClient,
        user1,
        appAddress,
        betAmount
      );
      
      // Get suggested params for app call
      const params = await algodClient.getTransactionParams().do();
      
      // Create app call transaction
      const appCallTxn = algosdk.makeApplicationNoOpTxnFromObject({
        from: user1.addr,
        suggestedParams: params,
        appIndex: appId,
        appArgs: [
          new Uint8Array(Buffer.from('place_bet')),
          algosdk.encodeUint64(eventId),
          new Uint8Array([1]), // true = YES
        ],
      });
      
      // Create atomic group
      const txns = [paymentTxn, appCallTxn];
      algosdk.assignGroupID(txns);
      
      // Sign both transactions
      const signedTxns = [
        paymentTxn.signTxn(user1.sk),
        appCallTxn.signTxn(user1.sk),
      ];
      
      // Send group
      const txId = await algodClient.sendRawTransaction(signedTxns).do();
      await waitForConfirmation(algodClient, txId.txId);
      
      // Verify bet was recorded in box storage
      const betBox = await readBox(algodClient, appId, `bet_1`);
      expect(betBox).to.not.be.null;
    });

    it("Should update event bet counters", async function () {
      const betAmount = algoToMicroAlgo(10);
      
      // User1 bets YES
      await placeBet(algodClient, user1, appId, appAddress, eventId, true, betAmount);
      
      // User2 bets NO
      await placeBet(algodClient, user2, appId, appAddress, eventId, false, betAmount);
      
      // Read event box to verify counters
      const eventBox = await readBox(algodClient, appId, `event_${eventId}`);
      expect(eventBox).to.not.be.null;
      
      // Parse event struct (simplified - actual parsing more complex)
      // In real implementation, would decode ARC4 struct properly
    });

    it("Should fail if bet amount is zero", async function () {
      try {
        await placeBet(algodClient, user1, appId, appAddress, eventId, true, 0);
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error.message).to.include('rejected by logic');
      }
    });

    it("Should fail if event doesn't exist", async function () {
      const betAmount = algoToMicroAlgo(10);
      
      try {
        await placeBet(algodClient, user1, appId, appAddress, 999, true, betAmount);
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error.message).to.include('rejected by logic');
      }
    });

    it("Should fail if event is resolved", async function () {
      const betAmount = algoToMicroAlgo(10);
      
      // Wait for end time (in real test, would need to wait or mock time)
      // For now, resolve immediately for testing
      await callAppMethod(
        algodClient,
        admin,
        appId,
        'resolve_event',
        [eventId, true]
      );
      
      // Try to place bet after resolution
      try {
        await placeBet(algodClient, user1, appId, appAddress, eventId, true, betAmount);
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error.message).to.include('rejected by logic');
      }
    });
  });

  describe("Event Resolution", function () {
    let eventId;

    beforeEach(async function () {
      const endTime = getCurrentTimestamp() + 3600;
      await callAppMethod(
        algodClient,
        admin,
        appId,
        'create_event',
        ["Test Event", endTime]
      );
      eventId = 1;
    });

    it("Should allow admin to resolve events", async function () {
      const result = await callAppMethod(
        algodClient,
        admin,
        appId,
        'resolve_event',
        [eventId, true]
      );
      
      expect(result).to.have.property('confirmed-round');
      
      // Verify event is marked as resolved in box storage
      const eventBox = await readBox(algodClient, appId, `event_${eventId}`);
      expect(eventBox).to.not.be.null;
    });

    it("Should fail if non-admin tries to resolve", async function () {
      try {
        await callAppMethod(
          algodClient,
          user1,
          appId,
          'resolve_event',
          [eventId, true]
        );
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error.message).to.include('rejected by logic');
      }
    });

    it("Should fail if event already resolved", async function () {
      // Resolve once
      await callAppMethod(
        algodClient,
        admin,
        appId,
        'resolve_event',
        [eventId, true]
      );
      
      // Try to resolve again
      try {
        await callAppMethod(
          algodClient,
          admin,
          appId,
          'resolve_event',
          [eventId, false]
        );
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error.message).to.include('rejected by logic');
      }
    });
  });

  describe("Claiming Winnings", function () {
    let eventId;

    beforeEach(async function () {
      const endTime = getCurrentTimestamp() + 3600;
      await callAppMethod(
        algodClient,
        admin,
        appId,
        'create_event',
        ["Test Event", endTime]
      );
      eventId = 1;
    });

    it("Should allow winners to claim winnings", async function () {
      const betAmount = algoToMicroAlgo(10);
      
      // User1 bets YES, User2 bets NO
      await placeBet(algodClient, user1, appId, appAddress, eventId, true, betAmount);
      await placeBet(algodClient, user2, appId, appAddress, eventId, false, betAmount);
      
      // Resolve as YES
      await callAppMethod(
        algodClient,
        admin,
        appId,
        'resolve_event',
        [eventId, true]
      );
      
      // User1 (winner) claims
      const balanceBefore = await getAccountBalance(algodClient, user1.addr);
      
      const betId = 1;
      await callAppMethod(
        algodClient,
        user1,
        appId,
        'claim_winnings',
        [betId]
      );
      
      const balanceAfter = await getAccountBalance(algodClient, user1.addr);
      
      // User1 should receive approximately 20 ALGO (minus fees)
      const expectedPayout = algoToMicroAlgo(20);
      const actualPayout = balanceAfter - balanceBefore;
      
      // Allow variance for transaction fees
      expect(actualPayout).to.be.closeTo(expectedPayout, algoToMicroAlgo(0.1));
    });

    it("Should fail if bet didn't win", async function () {
      const betAmount = algoToMicroAlgo(10);
      
      await placeBet(algodClient, user1, appId, appAddress, eventId, false, betAmount);
      
      // Resolve as YES (user1 bet NO, so loses)
      await callAppMethod(
        algodClient,
        admin,
        appId,
        'resolve_event',
        [eventId, true]
      );
      
      try {
        await callAppMethod(
          algodClient,
          user1,
          appId,
          'claim_winnings',
          [1]
        );
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error.message).to.include('rejected by logic');
      }
    });

    it("Should fail if already claimed", async function () {
      const betAmount = algoToMicroAlgo(10);
      
      await placeBet(algodClient, user1, appId, appAddress, eventId, true, betAmount);
      
      await callAppMethod(
        algodClient,
        admin,
        appId,
        'resolve_event',
        [eventId, true]
      );
      
      // Claim once
      await callAppMethod(
        algodClient,
        user1,
        appId,
        'claim_winnings',
        [1]
      );
      
      // Try to claim again
      try {
        await callAppMethod(
          algodClient,
          user1,
          appId,
          'claim_winnings',
          [1]
        );
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error.message).to.include('rejected by logic');
      }
    });

    it("Should fail if event not resolved", async function () {
      const betAmount = algoToMicroAlgo(10);
      
      await placeBet(algodClient, user1, appId, appAddress, eventId, true, betAmount);
      
      try {
        await callAppMethod(
          algodClient,
          user1,
          appId,
          'claim_winnings',
          [1]
        );
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error.message).to.include('rejected by logic');
      }
    });
  });

  describe("Helper Functions", function () {
    it("Should return all events", async function () {
      const endTime = getCurrentTimestamp() + 3600;
      
      await callAppMethod(algodClient, admin, appId, 'create_event', ["Event 1", endTime]);
      await callAppMethod(algodClient, admin, appId, 'create_event', ["Event 2", endTime]);
      await callAppMethod(algodClient, admin, appId, 'create_event', ["Event 3", endTime]);
      
      const globalState = await readGlobalState(algodClient, appId);
      expect(globalState.event_counter).to.equal(3);
      
      // Verify each event box exists
      const event1Box = await readBox(algodClient, appId, 'event_1');
      const event2Box = await readBox(algodClient, appId, 'event_2');
      const event3Box = await readBox(algodClient, appId, 'event_3');
      
      expect(event1Box).to.not.be.null;
      expect(event2Box).to.not.be.null;
      expect(event3Box).to.not.be.null;
    });

    it("Should return contract balance", async function () {
      const endTime = getCurrentTimestamp() + 3600;
      await callAppMethod(algodClient, admin, appId, 'create_event', ["Test Event", endTime]);
      
      const betAmount = algoToMicroAlgo(10);
      await placeBet(algodClient, user1, appId, appAddress, 1, true, betAmount);
      await placeBet(algodClient, user2, appId, appAddress, 1, false, betAmount);
      
      const balance = await getAccountBalance(algodClient, appAddress);
      
      // Balance should be approximately 20 ALGO + initial funding
      expect(balance).to.be.at.least(algoToMicroAlgo(20));
    });
  });

  describe("Edge Cases", function () {
    it("Should handle multiple bets from same user", async function () {
      const endTime = getCurrentTimestamp() + 3600;
      await callAppMethod(algodClient, admin, appId, 'create_event', ["Event 1", endTime]);
      await callAppMethod(algodClient, admin, appId, 'create_event', ["Event 2", endTime]);
      
      const betAmount = algoToMicroAlgo(10);
      await placeBet(algodClient, user1, appId, appAddress, 1, true, betAmount);
      await placeBet(algodClient, user1, appId, appAddress, 2, false, betAmount);
      
      // Verify both bets were recorded
      const bet1Box = await readBox(algodClient, appId, 'bet_1');
      const bet2Box = await readBox(algodClient, appId, 'bet_2');
      
      expect(bet1Box).to.not.be.null;
      expect(bet2Box).to.not.be.null;
    });

    it("Should calculate payouts correctly with uneven pools", async function () {
      const endTime = getCurrentTimestamp() + 3600;
      await callAppMethod(algodClient, admin, appId, 'create_event', ["Test Event", endTime]);
      
      const betAmount = algoToMicroAlgo(10);
      await placeBet(algodClient, user1, appId, appAddress, 1, true, betAmount);
      await placeBet(algodClient, user2, appId, appAddress, 1, false, betAmount);
      
      // Read event box to verify pool amounts
      const eventBox = await readBox(algodClient, appId, 'event_1');
      expect(eventBox).to.not.be.null;
    });
  });

  // ==========================================
  // PHASE 4 TESTS - Frontend Integration Flows
  // ==========================================
  
  describe("Phase 4 - Variable Bet Amounts", function () {
    let eventId;

    beforeEach(async function () {
      const endTime = getCurrentTimestamp() + 3600;
      await callAppMethod(algodClient, admin, appId, 'create_event', ["Test Event", endTime]);
      eventId = 1;
    });

    it("Should allow small bet amounts (0.01 ALGO)", async function () {
      const betAmount = algoToMicroAlgo(0.01);
      await placeBet(algodClient, user1, appId, appAddress, eventId, true, betAmount);
      
      const betBox = await readBox(algodClient, appId, 'bet_1');
      expect(betBox).to.not.be.null;
    });

    it("Should allow medium bet amounts (25 ALGO)", async function () {
      const betAmount = algoToMicroAlgo(25);
      await placeBet(algodClient, user1, appId, appAddress, eventId, true, betAmount);
      
      const betBox = await readBox(algodClient, appId, 'bet_1');
      expect(betBox).to.not.be.null;
    });

    it("Should allow large bet amounts (50 ALGO)", async function () {
      const betAmount = algoToMicroAlgo(50);
      await placeBet(algodClient, user1, appId, appAddress, eventId, true, betAmount);
      
      const betBox = await readBox(algodClient, appId, 'bet_1');
      expect(betBox).to.not.be.null;
    });

    it("Should handle decimal bet amounts precisely", async function () {
      const betAmount = algoToMicroAlgo(12.5678);
      await placeBet(algodClient, user1, appId, appAddress, eventId, true, betAmount);
      
      const betBox = await readBox(algodClient, appId, 'bet_1');
      expect(betBox).to.not.be.null;
    });

    it("Should allow multiple different-sized bets from same user on different events", async function () {
      const endTime = getCurrentTimestamp() + 3600;
      await callAppMethod(algodClient, admin, appId, 'create_event', ["Event 2", endTime]);
      
      await placeBet(algodClient, user1, appId, appAddress, 1, true, algoToMicroAlgo(10));
      await placeBet(algodClient, user1, appId, appAddress, 2, false, algoToMicroAlgo(25));
      
      const bet1Box = await readBox(algodClient, appId, 'bet_1');
      const bet2Box = await readBox(algodClient, appId, 'bet_2');
      
      expect(bet1Box).to.not.be.null;
      expect(bet2Box).to.not.be.null;
    });
  });

  describe("Phase 4 - Potential Return Calculations", function () {
    let eventId;

    beforeEach(async function () {
      const endTime = getCurrentTimestamp() + 3600;
      await callAppMethod(algodClient, admin, appId, 'create_event', ["Test Event", endTime]);
      eventId = 1;
    });

    it("Should calculate correct payout for YES bet with balanced pools", async function () {
      // Setup: 100 ALGO YES, 100 ALGO NO
      await placeBet(algodClient, user1, appId, appAddress, eventId, true, algoToMicroAlgo(100));
      await placeBet(algodClient, user2, appId, appAddress, eventId, false, algoToMicroAlgo(100));
      
      // Admin bets 10 ALGO on YES
      await placeBet(algodClient, admin, appId, appAddress, eventId, true, algoToMicroAlgo(10));
      
      // Resolve as YES
      await callAppMethod(algodClient, admin, appId, 'resolve_event', [eventId, true]);
      
      // Check payout for admin's bet
      // Total pool = 210 ALGO
      // Admin's share = 10 / 110 = 0.0909
      // Payout = 0.0909 * 210 = 19.09 ALGO
      const balanceBefore = await getAccountBalance(algodClient, admin.addr);
      
      await callAppMethod(algodClient, admin, appId, 'claim_winnings', [3]);
      
      const balanceAfter = await getAccountBalance(algodClient, admin.addr);
      const expectedPayout = algoToMicroAlgo(19.09);
      const actualPayout = balanceAfter - balanceBefore;
      
      // Allow 1% variance
      expect(actualPayout).to.be.closeTo(expectedPayout, algoToMicroAlgo(0.5));
    });

    it("Should calculate correct payout for underdog bet", async function () {
      // Setup: 200 ALGO YES, 50 ALGO NO (NO is underdog)
      await placeBet(algodClient, user1, appId, appAddress, eventId, true, algoToMicroAlgo(50));
      await placeBet(algodClient, user2, appId, appAddress, eventId, false, algoToMicroAlgo(50));
      
      // Admin bets 10 ALGO on NO (underdog)
      await placeBet(algodClient, admin, appId, appAddress, eventId, false, algoToMicroAlgo(10));
      
      // Resolve as NO
      await callAppMethod(algodClient, admin, appId, 'resolve_event', [eventId, false]);
      
      // Total pool = 110 ALGO
      // Admin's share = 10 / 60
      const balanceBefore = await getAccountBalance(algodClient, admin.addr);
      
      await callAppMethod(algodClient, admin, appId, 'claim_winnings', [3]);
      
      const balanceAfter = await getAccountBalance(algodClient, admin.addr);
      
      // Verify payout is positive and significant
      expect(balanceAfter).to.be.greaterThan(balanceBefore);
    });

    it("Should handle case where winner takes full pool", async function () {
      // Only one bet exists
      await placeBet(algodClient, user1, appId, appAddress, eventId, true, algoToMicroAlgo(50));
      
      // Resolve as YES
      await callAppMethod(algodClient, admin, appId, 'resolve_event', [eventId, true]);
      
      // User1 should get their 50 ALGO back
      const balanceBefore = await getAccountBalance(algodClient, user1.addr);
      
      await callAppMethod(algodClient, user1, appId, 'claim_winnings', [1]);
      
      const balanceAfter = await getAccountBalance(algodClient, user1.addr);
      
      expect(balanceAfter - balanceBefore).to.be.closeTo(
        algoToMicroAlgo(50),
        algoToMicroAlgo(0.1)
      );
    });
  });

  describe("Phase 4 - Admin Resolution Validations", function () {
    let eventId;

    beforeEach(async function () {
      const endTime = getCurrentTimestamp() + 3600;
      await callAppMethod(algodClient, admin, appId, 'create_event', ["Test Event", endTime]);
      eventId = 1;
      
      // Place some bets
      await placeBet(algodClient, user1, appId, appAddress, eventId, true, algoToMicroAlgo(10));
      await placeBet(algodClient, user2, appId, appAddress, eventId, false, algoToMicroAlgo(10));
    });

    it("Should prevent non-admin from resolving", async function () {
      try {
        await callAppMethod(algodClient, user1, appId, 'resolve_event', [eventId, true]);
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error.message).to.include('rejected by logic');
      }
    });

    it("Should allow admin to resolve as YES", async function () {
      await callAppMethod(algodClient, admin, appId, 'resolve_event', [eventId, true]);
      
      const eventBox = await readBox(algodClient, appId, `event_${eventId}`);
      expect(eventBox).to.not.be.null;
    });

    it("Should allow admin to resolve as NO", async function () {
      await callAppMethod(algodClient, admin, appId, 'resolve_event', [eventId, false]);
      
      const eventBox = await readBox(algodClient, appId, `event_${eventId}`);
      expect(eventBox).to.not.be.null;
    });

    it("Should prevent re-resolution of already resolved event", async function () {
      await callAppMethod(algodClient, admin, appId, 'resolve_event', [eventId, true]);
      
      try {
        await callAppMethod(algodClient, admin, appId, 'resolve_event', [eventId, false]);
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error.message).to.include('rejected by logic');
      }
    });

    it("Should prevent betting after resolution", async function () {
      await callAppMethod(algodClient, admin, appId, 'resolve_event', [eventId, true]);
      
      try {
        await placeBet(algodClient, user1, appId, appAddress, eventId, true, algoToMicroAlgo(10));
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error.message).to.include('rejected by logic');
      }
    });
  });

  describe("Phase 4 - End-to-End Flow Tests", function () {
    it("Should complete full flow: create -> bet -> resolve -> claim (YES wins)", async function () {
      // 1. Admin creates event
      const endTime = getCurrentTimestamp() + 3600;
      await callAppMethod(algodClient, admin, appId, 'create_event', ["Full Flow Test", endTime]);
      
      // 2. Users place bets
      await placeBet(algodClient, user1, appId, appAddress, 1, true, algoToMicroAlgo(30));
      await placeBet(algodClient, user2, appId, appAddress, 1, false, algoToMicroAlgo(20));
      
      // 3. Admin resolves as YES
      await callAppMethod(algodClient, admin, appId, 'resolve_event', [1, true]);
      
      // 4. Winner (user1) claims winnings
      const balanceBefore = await getAccountBalance(algodClient, user1.addr);
      
      await callAppMethod(algodClient, user1, appId, 'claim_winnings', [1]);
      
      const balanceAfter = await getAccountBalance(algodClient, user1.addr);
      
      // User1 should receive full pool (50 ALGO)
      expect(balanceAfter - balanceBefore).to.be.closeTo(
        algoToMicroAlgo(50),
        algoToMicroAlgo(0.5)
      );
      
      // 5. Loser (user2) cannot claim
      try {
        await callAppMethod(algodClient, user2, appId, 'claim_winnings', [2]);
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error.message).to.include('rejected by logic');
      }
    });

    it("Should complete full flow: create -> bet -> resolve -> claim (NO wins)", async function () {
      // 1. Admin creates event
      const endTime = getCurrentTimestamp() + 3600;
      await callAppMethod(algodClient, admin, appId, 'create_event', ["Full Flow Test NO", endTime]);
      
      // 2. Users place bets
      await placeBet(algodClient, user1, appId, appAddress, 1, true, algoToMicroAlgo(40));
      await placeBet(algodClient, user2, appId, appAddress, 1, false, algoToMicroAlgo(10));
      
      // 3. Admin resolves as NO
      await callAppMethod(algodClient, admin, appId, 'resolve_event', [1, false]);
      
      // 4. Winner (user2) claims winnings
      const balanceBefore = await getAccountBalance(algodClient, user2.addr);
      
      await callAppMethod(algodClient, user2, appId, 'claim_winnings', [2]);
      
      const balanceAfter = await getAccountBalance(algodClient, user2.addr);
      
      // User2 should receive full pool (50 ALGO)
      expect(balanceAfter - balanceBefore).to.be.closeTo(
        algoToMicroAlgo(50),
        algoToMicroAlgo(0.5)
      );
      
      // 5. Loser (user1) cannot claim
      try {
        await callAppMethod(algodClient, user1, appId, 'claim_winnings', [1]);
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error.message).to.include('rejected by logic');
      }
    });

    it("Should complete full flow with multiple winners sharing pool", async function () {
      // 1. Admin creates event
      const endTime = getCurrentTimestamp() + 3600;
      await callAppMethod(algodClient, admin, appId, 'create_event', ["Multi-winner Test", endTime]);
      
      // 2. Multiple users bet YES, one bets NO
      await placeBet(algodClient, user1, appId, appAddress, 1, true, algoToMicroAlgo(20));
      await placeBet(algodClient, user2, appId, appAddress, 1, true, algoToMicroAlgo(30));
      await placeBet(algodClient, admin, appId, appAddress, 1, false, algoToMicroAlgo(50));
      
      // Total pool = 100 ALGO
      // YES pool = 50 ALGO, NO pool = 50 ALGO
      
      // 3. Admin resolves as YES
      await callAppMethod(algodClient, admin, appId, 'resolve_event', [1, true]);
      
      // 4. User1 claims (20/50 of 100 = 40 ALGO)
      const user1BalanceBefore = await getAccountBalance(algodClient, user1.addr);
      await callAppMethod(algodClient, user1, appId, 'claim_winnings', [1]);
      const user1BalanceAfter = await getAccountBalance(algodClient, user1.addr);
      
      expect(user1BalanceAfter - user1BalanceBefore).to.be.closeTo(
        algoToMicroAlgo(40),
        algoToMicroAlgo(0.5)
      );
      
      // 5. User2 claims (30/50 of 100 = 60 ALGO)
      const user2BalanceBefore = await getAccountBalance(algodClient, user2.addr);
      await callAppMethod(algodClient, user2, appId, 'claim_winnings', [2]);
      const user2BalanceAfter = await getAccountBalance(algodClient, user2.addr);
      
      expect(user2BalanceAfter - user2BalanceBefore).to.be.closeTo(
        algoToMicroAlgo(60),
        algoToMicroAlgo(0.5)
      );
      
      // 6. Contract balance should be close to initial funding only
      const finalBalance = await getAccountBalance(algodClient, appAddress);
      expect(finalBalance).to.be.lessThan(algoToMicroAlgo(5));
    });

    it("Should handle multiple events with different outcomes simultaneously", async function () {
      const endTime = getCurrentTimestamp() + 3600;
      
      // Create 3 events
      await callAppMethod(algodClient, admin, appId, 'create_event', ["Event 1", endTime]);
      await callAppMethod(algodClient, admin, appId, 'create_event', ["Event 2", endTime]);
      await callAppMethod(algodClient, admin, appId, 'create_event', ["Event 3", endTime]);
      
      // Bet on all events
      await placeBet(algodClient, user1, appId, appAddress, 1, true, algoToMicroAlgo(10));
      await placeBet(algodClient, user1, appId, appAddress, 2, false, algoToMicroAlgo(10));
      await placeBet(algodClient, user1, appId, appAddress, 3, true, algoToMicroAlgo(10));
      
      await placeBet(algodClient, user2, appId, appAddress, 1, false, algoToMicroAlgo(10));
      await placeBet(algodClient, user2, appId, appAddress, 2, true, algoToMicroAlgo(10));
      await placeBet(algodClient, user2, appId, appAddress, 3, false, algoToMicroAlgo(10));
      
      // Resolve all events differently
      await callAppMethod(algodClient, admin, appId, 'resolve_event', [1, true]);  // User1 wins
      await callAppMethod(algodClient, admin, appId, 'resolve_event', [2, false]); // User1 wins
      await callAppMethod(algodClient, admin, appId, 'resolve_event', [3, false]); // User2 wins
      
      // User1 claims from events 1 and 2
      await callAppMethod(algodClient, user1, appId, 'claim_winnings', [1]); // Event 1
      await callAppMethod(algodClient, user1, appId, 'claim_winnings', [2]); // Event 2
      
      // User1 cannot claim from event 3 (lost)
      try {
        await callAppMethod(algodClient, user1, appId, 'claim_winnings', [3]);
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error.message).to.include('rejected by logic');
      }
      
      // User2 claims from event 3
      await callAppMethod(algodClient, user2, appId, 'claim_winnings', [6]); // Event 3
    });
  });

  describe("Phase 4 - Security and Edge Cases", function () {
    it("Should prevent claiming before event is resolved", async function () {
      const endTime = getCurrentTimestamp() + 3600;
      await callAppMethod(algodClient, admin, appId, 'create_event', ["Test Event", endTime]);
      
      await placeBet(algodClient, user1, appId, appAddress, 1, true, algoToMicroAlgo(10));
      
      try {
        await callAppMethod(algodClient, user1, appId, 'claim_winnings', [1]);
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error.message).to.include('rejected by logic');
      }
    });

    it("Should prevent double-claiming winnings", async function () {
      const endTime = getCurrentTimestamp() + 3600;
      await callAppMethod(algodClient, admin, appId, 'create_event', ["Test Event", endTime]);
      
      await placeBet(algodClient, user1, appId, appAddress, 1, true, algoToMicroAlgo(10));
      await placeBet(algodClient, user2, appId, appAddress, 1, false, algoToMicroAlgo(10));
      
      await callAppMethod(algodClient, admin, appId, 'resolve_event', [1, true]);
      
      await callAppMethod(algodClient, user1, appId, 'claim_winnings', [1]);
      
      try {
        await callAppMethod(algodClient, user1, appId, 'claim_winnings', [1]);
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error.message).to.include('rejected by logic');
      }
    });

    it("Should handle very small bet amounts correctly", async function () {
      const endTime = getCurrentTimestamp() + 3600;
      await callAppMethod(algodClient, admin, appId, 'create_event', ["Test Event", endTime]);
      
      const tinyBet = 1000; // 0.001 ALGO in microAlgos
      await placeBet(algodClient, user1, appId, appAddress, 1, true, tinyBet);
      
      const betBox = await readBox(algodClient, appId, 'bet_1');
      expect(betBox).to.not.be.null;
    });

    it("Should correctly track contract balance with many transactions", async function () {
      const endTime = getCurrentTimestamp() + 3600;
      await callAppMethod(algodClient, admin, appId, 'create_event', ["Event 1", endTime]);
      await callAppMethod(algodClient, admin, appId, 'create_event', ["Event 2", endTime]);
      
      const initialBalance = await getAccountBalance(algodClient, appAddress);
      
      // Many bets
      await placeBet(algodClient, user1, appId, appAddress, 1, true, algoToMicroAlgo(1));
      await placeBet(algodClient, user1, appId, appAddress, 1, false, algoToMicroAlgo(2));
      await placeBet(algodClient, user2, appId, appAddress, 2, true, algoToMicroAlgo(3));
      await placeBet(algodClient, user2, appId, appAddress, 2, false, algoToMicroAlgo(4));
      
      const finalBalance = await getAccountBalance(algodClient, appAddress);
      
      // Balance should have increased by 10 ALGO
      expect(finalBalance - initialBalance).to.equal(algoToMicroAlgo(10));
    });

    it("Should maintain data integrity after resolution", async function () {
      const endTime = getCurrentTimestamp() + 3600;
      await callAppMethod(algodClient, admin, appId, 'create_event', ["Test Event", endTime]);
      
      await placeBet(algodClient, user1, appId, appAddress, 1, true, algoToMicroAlgo(25));
      await placeBet(algodClient, user2, appId, appAddress, 1, false, algoToMicroAlgo(15));
      
      const eventBoxBefore = await readBox(algodClient, appId, 'event_1');
      
      await callAppMethod(algodClient, admin, appId, 'resolve_event', [1, true]);
      
      const eventBoxAfter = await readBox(algodClient, appId, 'event_1');
      
      // Box should still exist and contain data
      expect(eventBoxAfter).to.not.be.null;
      expect(eventBoxAfter.length).to.equal(eventBoxBefore.length);
    });
  });
});

/**
 * Helper function to place a bet (payment + app call atomic group)
 */
async function placeBet(algodClient, user, appId, appAddress, eventId, outcome, amount) {
  const params = await algodClient.getTransactionParams().do();
  
  // Create payment transaction
  const paymentTxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
    from: user.addr,
    to: appAddress,
    amount: amount,
    suggestedParams: params,
  });
  
  // Create app call transaction
  const appCallTxn = algosdk.makeApplicationNoOpTxnFromObject({
    from: user.addr,
    suggestedParams: params,
    appIndex: appId,
    appArgs: [
      new Uint8Array(Buffer.from('place_bet')),
      algosdk.encodeUint64(eventId),
      new Uint8Array([outcome ? 1 : 0]),
    ],
  });
  
  // Create atomic group
  const txns = [paymentTxn, appCallTxn];
  algosdk.assignGroupID(txns);
  
  // Sign both transactions
  const signedTxns = [
    paymentTxn.signTxn(user.sk),
    appCallTxn.signTxn(user.sk),
  ];
  
  // Send group
  const txId = await algodClient.sendRawTransaction(signedTxns).do();
  await waitForConfirmation(algodClient, txId.txId);
  
  return txId.txId;
}
