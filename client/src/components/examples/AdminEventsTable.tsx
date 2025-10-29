import AdminEventsTable from '../AdminEventsTable';

export default function AdminEventsTableExample() {
  const mockEvents = [
    {
      id: 1,
      name: "TechFlow AI",
      emoji: "🚀",
      status: "CLOSED" as const,
      yesBets: 45,
      noBets: 23,
      endTime: Math.floor((Date.now() - 2 * 60 * 60 * 1000) / 1000),
    },
    {
      id: 2,
      name: "CloudScale Pro",
      emoji: "☁️",
      status: "OPEN" as const,
      yesBets: 12,
      noBets: 8,
      endTime: Math.floor((Date.now() + 3 * 24 * 60 * 60 * 1000) / 1000),
    },
    {
      id: 3,
      name: "DataSync Hub",
      emoji: "💾",
      status: "RESOLVED" as const,
      yesBets: 30,
      noBets: 15,
      endTime: Math.floor((Date.now() - 5 * 24 * 60 * 60 * 1000) / 1000),
      outcome: "YES" as const,
    },
  ];

  return (
    <div className="p-4 bg-background max-w-4xl">
      <AdminEventsTable
        events={mockEvents}
        onResolve={(id, outcome) => console.log('Resolve event:', id, outcome)}
      />
    </div>
  );
}
