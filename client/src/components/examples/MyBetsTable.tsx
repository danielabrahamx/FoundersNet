import MyBetsTable from '../MyBetsTable';

export default function MyBetsTableExample() {
  const mockBets = [
    {
      id: 1,
      eventId: 1,
      eventName: "TechFlow AI",
      emoji: "🚀",
      choice: "YES" as const,
      amount: 10,
      status: "RESOLVED" as const,
      outcome: "YES" as const,
      payout: 14.29,
      hasClaimed: false,
    },
    {
      id: 2,
      eventId: 2,
      eventName: "CloudScale Pro",
      emoji: "☁️",
      choice: "NO" as const,
      amount: 10,
      status: "RESOLVED" as const,
      outcome: "YES" as const,
    },
    {
      id: 3,
      eventId: 3,
      eventName: "DataSync Hub",
      emoji: "💾",
      choice: "YES" as const,
      amount: 10,
      status: "OPEN" as const,
    },
  ];

  return (
    <div className="p-4 bg-background max-w-4xl">
      <MyBetsTable 
        bets={mockBets}
        onClaim={(id) => console.log('Claim bet:', id)}
      />
    </div>
  );
}
