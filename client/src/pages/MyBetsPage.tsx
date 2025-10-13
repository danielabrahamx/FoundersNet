import MyBetsTable from "@/components/MyBetsTable";

//todo: remove mock functionality
const mockBets = [
  {
    id: 1,
    eventId: 4,
    eventName: "OfficeFlow",
    emoji: "🏢",
    choice: "YES" as const,
    amount: 10,
    status: "RESOLVED" as const,
    outcome: "YES" as const,
    payout: 16.25,
    hasClaimed: false,
  },
  {
    id: 2,
    eventId: 5,
    eventName: "BrightIdeas",
    emoji: "💡",
    choice: "NO" as const,
    amount: 10,
    status: "RESOLVED" as const,
    outcome: "NO" as const,
    payout: 15.0,
    hasClaimed: true,
  },
  {
    id: 3,
    eventId: 2,
    eventName: "CloudScale Pro",
    emoji: "☁️",
    choice: "YES" as const,
    amount: 10,
    status: "OPEN" as const,
  },
  {
    id: 4,
    eventId: 3,
    eventName: "DataSync Hub",
    emoji: "💾",
    choice: "YES" as const,
    amount: 10,
    status: "CLOSED" as const,
  },
];

export default function MyBetsPage() {
  return (
    <div className="container max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold tracking-tight mb-2">My Bets</h1>
        <p className="text-muted-foreground">
          Track your betting history and claim your winnings
        </p>
      </div>

      <MyBetsTable
        bets={mockBets}
        onClaim={(betId) => console.log('Claim bet:', betId)}
      />
    </div>
  );
}
