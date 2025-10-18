const hre = require("hardhat");

async function main() {
  console.log("🧪 Checking Contract State...\n");

  const contractAddress = "0x527679766DC45BdC0593B0C1bAE0e66CaC1C9008";
  const [deployer] = await hre.ethers.getSigners();

  // Get contract instance
  const PredictionMarket = await hre.ethers.getContractFactory("PredictionMarket");
  const contract = PredictionMarket.attach(contractAddress);

  // Check event counter
  const eventCounter = await contract.eventCounter();
  console.log("✅ Total events:", eventCounter.toString());

  // Get all events
  if (eventCounter > 0n) {
    console.log("\n📋 All Events:");
    const allEvents = await contract.getAllEvents();
    allEvents.forEach((event, i) => {
      console.log(`\nEvent ${i + 1}:`);
      console.log("  ID:", event.id.toString());
      console.log("  Name:", event.name);
      console.log("  End Time:", new Date(Number(event.endTime) * 1000).toLocaleString());
      console.log("  Resolved:", event.resolved);
      console.log("  YES bets:", event.totalYesBets.toString());
      console.log("  NO bets:", event.totalNoBets.toString());
      console.log("  YES amount:", hre.ethers.formatEther(event.totalYesAmount), "MATIC");
      console.log("  NO amount:", hre.ethers.formatEther(event.totalNoAmount), "MATIC");
    });
  }

  // Check user bets
  console.log("\n📊 Your Bets:");
  const userBets = await contract.getUserBets(deployer.address);
  console.log("  Total bets placed:", userBets.length);
  
  if (userBets.length > 0) {
    userBets.forEach((bet, i) => {
      console.log(`\n  Bet ${i + 1}:`);
      console.log("    Bet ID:", bet.betId.toString());
      console.log("    Event ID:", bet.eventId.toString());
      console.log("    Outcome:", bet.outcome ? "YES" : "NO");
      console.log("    Amount:", hre.ethers.formatEther(bet.amount), "MATIC");
      console.log("    Claimed:", bet.claimed);
    });
  }

  console.log("\n✅ Check complete!");
  console.log("\n🎯 Next step: Refresh your browser at http://localhost:5000");
  console.log("   The event should now appear and you can place bets!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  });
