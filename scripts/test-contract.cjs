const hre = require("hardhat");

async function main() {
  console.log("🧪 Testing PredictionMarket Contract...\n");

  const contractAddress = "0x527679766DC45BdC0593B0C1bAE0e66CaC1C9008";
  const [deployer] = await hre.ethers.getSigners();

  console.log("📝 Connected account:", deployer.address);
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", hre.ethers.formatEther(balance), "MATIC\n");

  // Get contract instance
  const PredictionMarket = await hre.ethers.getContractFactory("PredictionMarket");
  const contract = PredictionMarket.attach(contractAddress);

  // Test 1: Check admin
  console.log("✅ Test 1: Verify Admin");
  const admin = await contract.admin();
  console.log("   Admin address:", admin);
  console.log("   Your address:", deployer.address);
  console.log("   Match:", admin.toLowerCase() === deployer.address.toLowerCase() ? "✅ YES" : "❌ NO");

  // Test 2: Check event counter
  console.log("\n✅ Test 2: Check Event Counter");
  const eventCounter = await contract.eventCounter();
  console.log("   Total events created:", eventCounter.toString());

  // Test 3: Get all events
  if (eventCounter > 0n) {
    console.log("\n✅ Test 3: Get All Events");
    const allEvents = await contract.getAllEvents();
    console.log("   Events found:", allEvents.length);
    allEvents.forEach((event, i) => {
      console.log(`   Event ${i + 1}:`, {
        id: event.id.toString(),
        name: event.name,
        endTime: new Date(Number(event.endTime) * 1000).toLocaleString(),
        resolved: event.resolved,
        totalYesBets: event.totalYesBets.toString(),
        totalNoBets: event.totalNoBets.toString(),
      });
    });
  } else {
    console.log("\n⚠️  No events found! This is why betting failed.");
    console.log("   You need to create an event first.");
  }

  // Test 4: Create a test event if none exist
  if (eventCounter === 0n) {
    console.log("\n✅ Test 4: Creating a Test Event...");
    const eventName = "TechFlow AI - Will they raise Series A?";
    const endTime = Math.floor(Date.now() / 1000) + (24 * 60 * 60); // 24 hours from now

    const tx = await contract.createEvent(eventName, endTime);
    console.log("   Transaction hash:", tx.hash);
    console.log("   Waiting for confirmation...");
    
    const receipt = await tx.wait();
    console.log("   ✅ Event created successfully!");
    console.log("   Gas used:", receipt.gasUsed.toString());

    // Get the new event
    const newEventCounter = await contract.eventCounter();
    const newEvent = await contract.getEvent(newEventCounter);
    console.log("\n   New Event Details:");
    console.log("   - ID:", newEvent.id.toString());
    console.log("   - Name:", newEvent.name);
    console.log("   - End Time:", new Date(Number(newEvent.endTime) * 1000).toLocaleString());
    console.log("   - Resolved:", newEvent.resolved);
  }

  // Test 5: Try to place a test bet (if events exist)
  const finalEventCounter = await contract.eventCounter();
  if (finalEventCounter > 0n) {
    console.log("\n✅ Test 5: Test Placing a Bet...");
    try {
      const betAmount = hre.ethers.parseEther("10"); // 10 MATIC
      const tx = await contract.placeBet(1, true, { value: betAmount }); // Bet YES on event 1
      console.log("   Transaction hash:", tx.hash);
      console.log("   Waiting for confirmation...");
      
      const receipt = await tx.wait();
      console.log("   ✅ Bet placed successfully!");
      console.log("   Gas used:", receipt.gasUsed.toString());

      // Get user bets
      const userBets = await contract.getUserBets(deployer.address);
      console.log("\n   Your bets:", userBets.length);
      userBets.forEach((bet, i) => {
        console.log(`   Bet ${i + 1}:`, {
          betId: bet.betId.toString(),
          eventId: bet.eventId.toString(),
          outcome: bet.outcome ? "YES" : "NO",
          amount: hre.ethers.formatEther(bet.amount) + " MATIC",
          claimed: bet.claimed,
        });
      });

    } catch (error) {
      console.log("   ❌ Bet failed:", error.message);
    }
  }

  console.log("\n✅ Contract testing complete!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Testing failed:", error);
    process.exit(1);
  });
