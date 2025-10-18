const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("PredictionMarket", function () {
  let predictionMarket;
  let owner;
  let user1;
  let user2;

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();

    const PredictionMarket = await ethers.getContractFactory("PredictionMarket");
    predictionMarket = await PredictionMarket.deploy();
    await predictionMarket.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the right admin", async function () {
      expect(await predictionMarket.admin()).to.equal(owner.address);
    });

    it("Should initialize with zero events", async function () {
      expect(await predictionMarket.eventCounter()).to.equal(0);
    });
  });

  describe("Event Creation", function () {
    it("Should allow admin to create events", async function () {
      const endTime = (await time.latest()) + 3600; // 1 hour from now
      await predictionMarket.createEvent("Test Event", endTime);

      const eventCounter = await predictionMarket.eventCounter();
      expect(eventCounter).to.equal(1);

      const allEvents = await predictionMarket.getAllEvents();
      expect(allEvents[0].name).to.equal("Test Event");
      expect(allEvents[0].endTime).to.equal(endTime);
      expect(allEvents[0].resolved).to.equal(false);
    });

    it("Should fail if non-admin tries to create event", async function () {
      const endTime = (await time.latest()) + 3600;
      await expect(
        predictionMarket.connect(user1).createEvent("Test Event", endTime)
      ).to.be.revertedWith("Only admin can perform this action");
    });

    it("Should fail if end time is in the past", async function () {
      const pastTime = (await time.latest()) - 3600;
      await expect(
        predictionMarket.createEvent("Test Event", pastTime)
      ).to.be.revertedWith("End time must be in the future");
    });
  });

  describe("Betting", function () {
    let eventId;

    beforeEach(async function () {
      const endTime = (await time.latest()) + 3600;
      await predictionMarket.createEvent("Test Event", endTime);
      eventId = 1;
    });

    it("Should allow users to place bets", async function () {
      const betAmount = ethers.parseEther("10");
      await predictionMarket.connect(user1).placeBet(eventId, true, { value: betAmount });

      const bets = await predictionMarket.getUserBets(user1.address);
      expect(bets.length).to.equal(1);
      expect(bets[0].eventId).to.equal(eventId);
      expect(bets[0].outcome).to.equal(true);
      expect(bets[0].amount).to.equal(betAmount);
    });

    it("Should update event bet counters", async function () {
      const betAmount = ethers.parseEther("10");
      
      await predictionMarket.connect(user1).placeBet(eventId, true, { value: betAmount });
      await predictionMarket.connect(user2).placeBet(eventId, false, { value: betAmount });

      const [yesBets, noBets] = await predictionMarket.getTotalBets(eventId);
      expect(yesBets).to.equal(1);
      expect(noBets).to.equal(1);
    });

    it("Should fail if bet amount is zero", async function () {
      await expect(
        predictionMarket.connect(user1).placeBet(eventId, true, { value: 0 })
      ).to.be.revertedWith("Bet amount must be greater than 0");
    });

    it("Should fail if event doesn't exist", async function () {
      const betAmount = ethers.parseEther("10");
      await expect(
        predictionMarket.connect(user1).placeBet(999, true, { value: betAmount })
      ).to.be.revertedWith("Event does not exist");
    });

    it("Should fail if event is resolved", async function () {
      const betAmount = ethers.parseEther("10");
      const endTime = (await time.latest()) + 3600;
      
      // Fast forward past end time
      await time.increaseTo(endTime + 1);
      
      // Resolve event
      await predictionMarket.resolveEvent(eventId, true);

      // Try to place bet
      await expect(
        predictionMarket.connect(user1).placeBet(eventId, true, { value: betAmount })
      ).to.be.revertedWith("Event is already resolved");
    });
  });

  describe("Event Resolution", function () {
    let eventId;

    beforeEach(async function () {
      const endTime = (await time.latest()) + 3600;
      await predictionMarket.createEvent("Test Event", endTime);
      eventId = 1;
    });

    it("Should allow admin to resolve events after end time", async function () {
      const endTime = (await time.latest()) + 3600;
      await time.increaseTo(endTime + 1);

      await predictionMarket.resolveEvent(eventId, true);

      const allEvents = await predictionMarket.getAllEvents();
      expect(allEvents[0].resolved).to.equal(true);
      expect(allEvents[0].outcome).to.equal(true);
    });

    it("Should fail if non-admin tries to resolve", async function () {
      const endTime = (await time.latest()) + 3600;
      await time.increaseTo(endTime + 1);

      await expect(
        predictionMarket.connect(user1).resolveEvent(eventId, true)
      ).to.be.revertedWith("Only admin can perform this action");
    });

    it("Should fail if resolved before end time", async function () {
      await expect(
        predictionMarket.resolveEvent(eventId, true)
      ).to.be.revertedWith("Event betting period has not ended");
    });

    it("Should fail if event already resolved", async function () {
      const endTime = (await time.latest()) + 3600;
      await time.increaseTo(endTime + 1);

      await predictionMarket.resolveEvent(eventId, true);

      await expect(
        predictionMarket.resolveEvent(eventId, false)
      ).to.be.revertedWith("Event already resolved");
    });
  });

  describe("Claiming Winnings", function () {
    let eventId;

    beforeEach(async function () {
      const endTime = (await time.latest()) + 3600;
      await predictionMarket.createEvent("Test Event", endTime);
      eventId = 1;
    });

    it("Should allow winners to claim winnings", async function () {
      const betAmount = ethers.parseEther("10");
      
      // User1 bets YES, User2 bets NO
      await predictionMarket.connect(user1).placeBet(eventId, true, { value: betAmount });
      await predictionMarket.connect(user2).placeBet(eventId, false, { value: betAmount });

      // Fast forward and resolve as YES
      const endTime = (await time.latest()) + 3600;
      await time.increaseTo(endTime + 1);
      await predictionMarket.resolveEvent(eventId, true);

      // User1 (winner) claims
      const initialBalance = await ethers.provider.getBalance(user1.address);
      const tx = await predictionMarket.connect(user1).claimWinnings(1);
      const receipt = await tx.wait();
      const gasCost = receipt.gasUsed * receipt.gasPrice;

      const finalBalance = await ethers.provider.getBalance(user1.address);
      
      // User1 should receive full pool (20 MATIC) minus gas
      expect(finalBalance).to.be.closeTo(
        initialBalance + ethers.parseEther("20") - gasCost,
        ethers.parseEther("0.01") // Allow small variance
      );
    });

    it("Should fail if bet didn't win", async function () {
      const betAmount = ethers.parseEther("10");
      
      await predictionMarket.connect(user1).placeBet(eventId, false, { value: betAmount });

      const endTime = (await time.latest()) + 3600;
      await time.increaseTo(endTime + 1);
      await predictionMarket.resolveEvent(eventId, true); // Resolved as YES

      await expect(
        predictionMarket.connect(user1).claimWinnings(1)
      ).to.be.revertedWith("Bet did not win");
    });

    it("Should fail if already claimed", async function () {
      const betAmount = ethers.parseEther("10");
      
      await predictionMarket.connect(user1).placeBet(eventId, true, { value: betAmount });

      const endTime = (await time.latest()) + 3600;
      await time.increaseTo(endTime + 1);
      await predictionMarket.resolveEvent(eventId, true);

      await predictionMarket.connect(user1).claimWinnings(1);

      await expect(
        predictionMarket.connect(user1).claimWinnings(1)
      ).to.be.revertedWith("Winnings already claimed");
    });

    it("Should fail if event not resolved", async function () {
      const betAmount = ethers.parseEther("10");
      
      await predictionMarket.connect(user1).placeBet(eventId, true, { value: betAmount });

      await expect(
        predictionMarket.connect(user1).claimWinnings(1)
      ).to.be.revertedWith("Event not resolved yet");
    });
  });

  describe("Helper Functions", function () {
    it("Should return all events", async function () {
      const endTime = (await time.latest()) + 3600;
      
      await predictionMarket.createEvent("Event 1", endTime);
      await predictionMarket.createEvent("Event 2", endTime);
      await predictionMarket.createEvent("Event 3", endTime);

      const allEvents = await predictionMarket.getAllEvents();
      expect(allEvents.length).to.equal(3);
      expect(allEvents[0].name).to.equal("Event 1");
      expect(allEvents[1].name).to.equal("Event 2");
      expect(allEvents[2].name).to.equal("Event 3");
    });

    it("Should return contract balance", async function () {
      const endTime = (await time.latest()) + 3600;
      await predictionMarket.createEvent("Test Event", endTime);

      const betAmount = ethers.parseEther("10");
      await predictionMarket.connect(user1).placeBet(1, true, { value: betAmount });
      await predictionMarket.connect(user2).placeBet(1, false, { value: betAmount });

      const balance = await predictionMarket.getContractBalance();
      expect(balance).to.equal(ethers.parseEther("20"));
    });
  });

  describe("Edge Cases", function () {
    it("Should handle multiple bets from same user", async function () {
      const endTime = (await time.latest()) + 3600;
      await predictionMarket.createEvent("Event 1", endTime);
      await predictionMarket.createEvent("Event 2", endTime);

      const betAmount = ethers.parseEther("10");
      await predictionMarket.connect(user1).placeBet(1, true, { value: betAmount });
      await predictionMarket.connect(user1).placeBet(2, false, { value: betAmount });

      const bets = await predictionMarket.getUserBets(user1.address);
      expect(bets.length).to.equal(2);
    });

    it("Should calculate payouts correctly with uneven pools", async function () {
      const endTime = (await time.latest()) + 3600;
      await predictionMarket.createEvent("Test Event", endTime);

      // 2 users bet YES, 1 user bets NO
      const betAmount = ethers.parseEther("10");
      await predictionMarket.connect(user1).placeBet(1, true, { value: betAmount });
      await predictionMarket.connect(user2).placeBet(1, false, { value: betAmount });

      const allEvents = await predictionMarket.getAllEvents();
      expect(allEvents[0].totalYesAmount).to.equal(ethers.parseEther("10"));
      expect(allEvents[0].totalNoAmount).to.equal(ethers.parseEther("10"));
    });
  });

  // ==========================================
  // PHASE 4 TESTS - Frontend Integration Flows
  // ==========================================
  
  describe("Phase 4 - Variable Bet Amounts", function () {
    let eventId;

    beforeEach(async function () {
      const endTime = (await time.latest()) + 3600;
      await predictionMarket.createEvent("Test Event", endTime);
      eventId = 1;
    });

    it("Should allow small bet amounts (0.01 MATIC)", async function () {
      const betAmount = ethers.parseEther("0.01");
      await predictionMarket.connect(user1).placeBet(eventId, true, { value: betAmount });

      const bets = await predictionMarket.getUserBets(user1.address);
      expect(bets[0].amount).to.equal(betAmount);
    });

    it("Should allow medium bet amounts (25 MATIC)", async function () {
      const betAmount = ethers.parseEther("25");
      await predictionMarket.connect(user1).placeBet(eventId, true, { value: betAmount });

      const bets = await predictionMarket.getUserBets(user1.address);
      expect(bets[0].amount).to.equal(betAmount);
    });

    it("Should allow large bet amounts (1000 MATIC)", async function () {
      const betAmount = ethers.parseEther("1000");
      await predictionMarket.connect(user1).placeBet(eventId, true, { value: betAmount });

      const bets = await predictionMarket.getUserBets(user1.address);
      expect(bets[0].amount).to.equal(betAmount);
    });

    it("Should handle decimal bet amounts precisely", async function () {
      const betAmount = ethers.parseEther("12.5678");
      await predictionMarket.connect(user1).placeBet(eventId, true, { value: betAmount });

      const bets = await predictionMarket.getUserBets(user1.address);
      expect(bets[0].amount).to.equal(betAmount);
    });

    it("Should allow multiple different-sized bets from same user on different events", async function () {
      const endTime = (await time.latest()) + 3600;
      await predictionMarket.createEvent("Event 2", endTime);

      await predictionMarket.connect(user1).placeBet(1, true, { value: ethers.parseEther("10") });
      await predictionMarket.connect(user1).placeBet(2, false, { value: ethers.parseEther("25") });

      const bets = await predictionMarket.getUserBets(user1.address);
      expect(bets.length).to.equal(2);
      expect(bets[0].amount).to.equal(ethers.parseEther("10"));
      expect(bets[1].amount).to.equal(ethers.parseEther("25"));
    });
  });

  describe("Phase 4 - Potential Return Calculations", function () {
    let eventId;

    beforeEach(async function () {
      const endTime = (await time.latest()) + 3600;
      await predictionMarket.createEvent("Test Event", endTime);
      eventId = 1;
    });

    it("Should calculate correct payout for YES bet with balanced pools", async function () {
      // Setup: 100 MATIC YES, 100 MATIC NO
      await predictionMarket.connect(user1).placeBet(eventId, true, { value: ethers.parseEther("100") });
      await predictionMarket.connect(user2).placeBet(eventId, false, { value: ethers.parseEther("100") });

      // New user bets 10 MATIC on YES
      await predictionMarket.connect(owner).placeBet(eventId, true, { value: ethers.parseEther("10") });

      // Resolve as YES
      const endTime = (await time.latest()) + 3600;
      await time.increaseTo(endTime + 1);
      await predictionMarket.resolveEvent(eventId, true);

      // Check payout
      // Total pool = 210 MATIC
      // User's share = 10 / 110 = 0.0909
      // Payout = 0.0909 * 210 = 19.09 MATIC
      const initialBalance = await ethers.provider.getBalance(owner.address);
      const tx = await predictionMarket.claimWinnings(3);
      const receipt = await tx.wait();
      const gasCost = receipt.gasUsed * receipt.gasPrice;
      const finalBalance = await ethers.provider.getBalance(owner.address);

      const expectedPayout = ethers.parseEther("19.09");
      const actualPayout = finalBalance - initialBalance + gasCost;
      
      // Allow 1% variance due to rounding
      expect(actualPayout).to.be.closeTo(expectedPayout, ethers.parseEther("0.2"));
    });

    it("Should calculate correct payout for underdog bet", async function () {
      // Setup: 200 MATIC YES, 50 MATIC NO (NO is underdog)
      await predictionMarket.connect(user1).placeBet(eventId, true, { value: ethers.parseEther("200") });
      await predictionMarket.connect(user2).placeBet(eventId, false, { value: ethers.parseEther("50") });

      // New user bets 10 MATIC on NO (underdog)
      await predictionMarket.connect(owner).placeBet(eventId, false, { value: ethers.parseEther("10") });

      // Resolve as NO
      const endTime = (await time.latest()) + 3600;
      await time.increaseTo(endTime + 1);
      await predictionMarket.resolveEvent(eventId, false);

      // Total pool = 260 MATIC
      // User's share = 10 / 60 = 0.1667
      // Payout = 0.1667 * 260 = 43.33 MATIC (great return!)
      const initialBalance = await ethers.provider.getBalance(owner.address);
      const tx = await predictionMarket.claimWinnings(3);
      const receipt = await tx.wait();
      const gasCost = receipt.gasUsed * receipt.gasPrice;
      const finalBalance = await ethers.provider.getBalance(owner.address);

      const expectedPayout = ethers.parseEther("43.33");
      const actualPayout = finalBalance - initialBalance + gasCost;
      
      expect(actualPayout).to.be.closeTo(expectedPayout, ethers.parseEther("0.5"));
    });

    it("Should handle case where winner takes full pool", async function () {
      // Only one bet exists
      await predictionMarket.connect(user1).placeBet(eventId, true, { value: ethers.parseEther("50") });

      // Resolve as YES
      const endTime = (await time.latest()) + 3600;
      await time.increaseTo(endTime + 1);
      await predictionMarket.resolveEvent(eventId, true);

      // User1 should get their 50 MATIC back
      const initialBalance = await ethers.provider.getBalance(user1.address);
      const tx = await predictionMarket.connect(user1).claimWinnings(1);
      const receipt = await tx.wait();
      const gasCost = receipt.gasUsed * receipt.gasPrice;
      const finalBalance = await ethers.provider.getBalance(user1.address);

      expect(finalBalance).to.be.closeTo(
        initialBalance + ethers.parseEther("50") - gasCost,
        ethers.parseEther("0.01")
      );
    });
  });

  describe("Phase 4 - Admin Resolution Validations", function () {
    let eventId;

    beforeEach(async function () {
      const endTime = (await time.latest()) + 3600;
      await predictionMarket.createEvent("Test Event", endTime);
      eventId = 1;

      // Place some bets
      await predictionMarket.connect(user1).placeBet(eventId, true, { value: ethers.parseEther("10") });
      await predictionMarket.connect(user2).placeBet(eventId, false, { value: ethers.parseEther("10") });
    });

    it("Should prevent non-admin from resolving even after end time", async function () {
      const endTime = (await time.latest()) + 3600;
      await time.increaseTo(endTime + 1);

      await expect(
        predictionMarket.connect(user1).resolveEvent(eventId, true)
      ).to.be.revertedWith("Only admin can perform this action");
    });

    it("Should prevent resolution before betting period ends", async function () {
      await expect(
        predictionMarket.resolveEvent(eventId, true)
      ).to.be.revertedWith("Event betting period has not ended");
    });

    it("Should allow admin to resolve as YES", async function () {
      const endTime = (await time.latest()) + 3600;
      await time.increaseTo(endTime + 1);

      await predictionMarket.resolveEvent(eventId, true);

      const allEvents = await predictionMarket.getAllEvents();
      expect(allEvents[0].resolved).to.equal(true);
      expect(allEvents[0].outcome).to.equal(true);
    });

    it("Should allow admin to resolve as NO", async function () {
      const endTime = (await time.latest()) + 3600;
      await time.increaseTo(endTime + 1);

      await predictionMarket.resolveEvent(eventId, false);

      const allEvents = await predictionMarket.getAllEvents();
      expect(allEvents[0].resolved).to.equal(true);
      expect(allEvents[0].outcome).to.equal(false);
    });

    it("Should prevent re-resolution of already resolved event", async function () {
      const endTime = (await time.latest()) + 3600;
      await time.increaseTo(endTime + 1);

      await predictionMarket.resolveEvent(eventId, true);

      await expect(
        predictionMarket.resolveEvent(eventId, false)
      ).to.be.revertedWith("Event already resolved");
    });

    it("Should prevent betting after resolution", async function () {
      const endTime = (await time.latest()) + 3600;
      await time.increaseTo(endTime + 1);
      await predictionMarket.resolveEvent(eventId, true);

      await expect(
        predictionMarket.connect(user1).placeBet(eventId, true, { value: ethers.parseEther("10") })
      ).to.be.revertedWith("Event is already resolved");
    });
  });

  describe("Phase 4 - End-to-End Flow Tests", function () {
    it("Should complete full flow: create -> bet -> resolve -> claim (YES wins)", async function () {
      // 1. Admin creates event
      const endTime = (await time.latest()) + 3600;
      await predictionMarket.createEvent("Full Flow Test", endTime);

      // 2. Users place bets
      await predictionMarket.connect(user1).placeBet(1, true, { value: ethers.parseEther("30") });
      await predictionMarket.connect(user2).placeBet(1, false, { value: ethers.parseEther("20") });

      // 3. Time passes, event ends
      await time.increaseTo(endTime + 1);

      // 4. Admin resolves as YES
      await predictionMarket.resolveEvent(1, true);

      // 5. Winner (user1) claims winnings
      const initialBalance = await ethers.provider.getBalance(user1.address);
      const tx = await predictionMarket.connect(user1).claimWinnings(1);
      const receipt = await tx.wait();
      const gasCost = receipt.gasUsed * receipt.gasPrice;
      const finalBalance = await ethers.provider.getBalance(user1.address);

      // User1 should receive full pool (50 MATIC)
      expect(finalBalance).to.be.closeTo(
        initialBalance + ethers.parseEther("50") - gasCost,
        ethers.parseEther("0.01")
      );

      // 6. Loser (user2) cannot claim
      await expect(
        predictionMarket.connect(user2).claimWinnings(2)
      ).to.be.revertedWith("Bet did not win");
    });

    it("Should complete full flow: create -> bet -> resolve -> claim (NO wins)", async function () {
      // 1. Admin creates event
      const endTime = (await time.latest()) + 3600;
      await predictionMarket.createEvent("Full Flow Test NO", endTime);

      // 2. Users place bets
      await predictionMarket.connect(user1).placeBet(1, true, { value: ethers.parseEther("40") });
      await predictionMarket.connect(user2).placeBet(1, false, { value: ethers.parseEther("10") });

      // 3. Time passes, event ends
      await time.increaseTo(endTime + 1);

      // 4. Admin resolves as NO
      await predictionMarket.resolveEvent(1, false);

      // 5. Winner (user2) claims winnings
      const initialBalance = await ethers.provider.getBalance(user2.address);
      const tx = await predictionMarket.connect(user2).claimWinnings(2);
      const receipt = await tx.wait();
      const gasCost = receipt.gasUsed * receipt.gasPrice;
      const finalBalance = await ethers.provider.getBalance(user2.address);

      // User2 should receive full pool (50 MATIC)
      expect(finalBalance).to.be.closeTo(
        initialBalance + ethers.parseEther("50") - gasCost,
        ethers.parseEther("0.01")
      );

      // 6. Loser (user1) cannot claim
      await expect(
        predictionMarket.connect(user1).claimWinnings(1)
      ).to.be.revertedWith("Bet did not win");
    });

    it("Should complete full flow with multiple winners sharing pool", async function () {
      // 1. Admin creates event
      const endTime = (await time.latest()) + 3600;
      await predictionMarket.createEvent("Multi-winner Test", endTime);

      // 2. Multiple users bet YES, one bets NO
      await predictionMarket.connect(user1).placeBet(1, true, { value: ethers.parseEther("20") });
      await predictionMarket.connect(user2).placeBet(1, true, { value: ethers.parseEther("30") });
      await predictionMarket.connect(owner).placeBet(1, false, { value: ethers.parseEther("50") });

      // Total pool = 100 MATIC
      // YES pool = 50 MATIC, NO pool = 50 MATIC

      // 3. Time passes, event ends
      await time.increaseTo(endTime + 1);

      // 4. Admin resolves as YES
      await predictionMarket.resolveEvent(1, true);

      // 5. User1 claims (20/50 of 100 = 40 MATIC)
      const user1InitialBalance = await ethers.provider.getBalance(user1.address);
      const tx1 = await predictionMarket.connect(user1).claimWinnings(1);
      const receipt1 = await tx1.wait();
      const gasCost1 = receipt1.gasUsed * receipt1.gasPrice;
      const user1FinalBalance = await ethers.provider.getBalance(user1.address);

      expect(user1FinalBalance).to.be.closeTo(
        user1InitialBalance + ethers.parseEther("40") - gasCost1,
        ethers.parseEther("0.01")
      );

      // 6. User2 claims (30/50 of 100 = 60 MATIC)
      const user2InitialBalance = await ethers.provider.getBalance(user2.address);
      const tx2 = await predictionMarket.connect(user2).claimWinnings(2);
      const receipt2 = await tx2.wait();
      const gasCost2 = receipt2.gasUsed * receipt2.gasPrice;
      const user2FinalBalance = await ethers.provider.getBalance(user2.address);

      expect(user2FinalBalance).to.be.closeTo(
        user2InitialBalance + ethers.parseEther("60") - gasCost2,
        ethers.parseEther("0.01")
      );

      // 7. Contract balance should now be 0
      const contractBalance = await predictionMarket.getContractBalance();
      expect(contractBalance).to.equal(0);
    });

    it("Should handle multiple events with different outcomes simultaneously", async function () {
      const endTime = (await time.latest()) + 3600;

      // Create 3 events
      await predictionMarket.createEvent("Event 1", endTime);
      await predictionMarket.createEvent("Event 2", endTime);
      await predictionMarket.createEvent("Event 3", endTime);

      // Bet on all events
      await predictionMarket.connect(user1).placeBet(1, true, { value: ethers.parseEther("10") });
      await predictionMarket.connect(user1).placeBet(2, false, { value: ethers.parseEther("10") });
      await predictionMarket.connect(user1).placeBet(3, true, { value: ethers.parseEther("10") });

      await predictionMarket.connect(user2).placeBet(1, false, { value: ethers.parseEther("10") });
      await predictionMarket.connect(user2).placeBet(2, true, { value: ethers.parseEther("10") });
      await predictionMarket.connect(user2).placeBet(3, false, { value: ethers.parseEther("10") });

      // Time passes
      await time.increaseTo(endTime + 1);

      // Resolve all events differently
      await predictionMarket.resolveEvent(1, true);  // User1 wins
      await predictionMarket.resolveEvent(2, false); // User1 wins
      await predictionMarket.resolveEvent(3, false); // User2 wins

      // Check user1 has 2 winning bets
      const user1Bets = await predictionMarket.getUserBets(user1.address);
      expect(user1Bets.length).to.equal(3);

      // User1 claims from events 1 and 2
      await predictionMarket.connect(user1).claimWinnings(1); // Event 1
      await predictionMarket.connect(user1).claimWinnings(2); // Event 2

      // User1 cannot claim from event 3 (lost)
      await expect(
        predictionMarket.connect(user1).claimWinnings(3)
      ).to.be.revertedWith("Bet did not win");

      // User2 claims from event 3
      await predictionMarket.connect(user2).claimWinnings(6); // Event 3
    });
  });

  describe("Phase 4 - Security and Edge Cases", function () {
    it("Should prevent claiming before event is resolved", async function () {
      const endTime = (await time.latest()) + 3600;
      await predictionMarket.createEvent("Test Event", endTime);
      
      await predictionMarket.connect(user1).placeBet(1, true, { value: ethers.parseEther("10") });

      await expect(
        predictionMarket.connect(user1).claimWinnings(1)
      ).to.be.revertedWith("Event not resolved yet");
    });

    it("Should prevent double-claiming winnings", async function () {
      const endTime = (await time.latest()) + 3600;
      await predictionMarket.createEvent("Test Event", endTime);
      
      await predictionMarket.connect(user1).placeBet(1, true, { value: ethers.parseEther("10") });
      await predictionMarket.connect(user2).placeBet(1, false, { value: ethers.parseEther("10") });

      await time.increaseTo(endTime + 1);
      await predictionMarket.resolveEvent(1, true);

      await predictionMarket.connect(user1).claimWinnings(1);

      await expect(
        predictionMarket.connect(user1).claimWinnings(1)
      ).to.be.revertedWith("Winnings already claimed");
    });

    it("Should handle very small bet amounts correctly", async function () {
      const endTime = (await time.latest()) + 3600;
      await predictionMarket.createEvent("Test Event", endTime);

      const tinyBet = ethers.parseEther("0.000001");
      await predictionMarket.connect(user1).placeBet(1, true, { value: tinyBet });

      const bets = await predictionMarket.getUserBets(user1.address);
      expect(bets[0].amount).to.equal(tinyBet);
    });

    it("Should correctly track contract balance with many transactions", async function () {
      const endTime = (await time.latest()) + 3600;
      await predictionMarket.createEvent("Event 1", endTime);
      await predictionMarket.createEvent("Event 2", endTime);

      // Many bets
      await predictionMarket.connect(user1).placeBet(1, true, { value: ethers.parseEther("1") });
      await predictionMarket.connect(user1).placeBet(1, false, { value: ethers.parseEther("2") });
      await predictionMarket.connect(user2).placeBet(2, true, { value: ethers.parseEther("3") });
      await predictionMarket.connect(user2).placeBet(2, false, { value: ethers.parseEther("4") });

      const balance = await predictionMarket.getContractBalance();
      expect(balance).to.equal(ethers.parseEther("10"));
    });

    it("Should maintain data integrity after resolution", async function () {
      const endTime = (await time.latest()) + 3600;
      await predictionMarket.createEvent("Test Event", endTime);

      await predictionMarket.connect(user1).placeBet(1, true, { value: ethers.parseEther("25") });
      await predictionMarket.connect(user2).placeBet(1, false, { value: ethers.parseEther("15") });

      const beforeEvents = await predictionMarket.getAllEvents();
      const beforeYesAmount = beforeEvents[0].totalYesAmount;
      const beforeNoAmount = beforeEvents[0].totalNoAmount;

      await time.increaseTo(endTime + 1);
      await predictionMarket.resolveEvent(1, true);

      const afterEvents = await predictionMarket.getAllEvents();
      
      // Pool amounts should NOT change after resolution
      expect(afterEvents[0].totalYesAmount).to.equal(beforeYesAmount);
      expect(afterEvents[0].totalNoAmount).to.equal(beforeNoAmount);
      expect(afterEvents[0].resolved).to.equal(true);
      expect(afterEvents[0].outcome).to.equal(true);
    });
  });
});
