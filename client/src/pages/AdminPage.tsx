import AdminEventForm from "@/components/AdminEventForm";
import AdminEventsTable from "@/components/AdminEventsTable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";

//todo: remove mock functionality
const mockAdminEvents = [
  {
    id: 1,
    name: "TechFlow AI",
    emoji: "🚀",
    status: "OPEN" as const,
    yesBets: 45,
    noBets: 23,
    endTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
  },
  {
    id: 3,
    name: "DataSync Hub",
    emoji: "💾",
    status: "CLOSED" as const,
    yesBets: 28,
    noBets: 22,
    endTime: new Date(Date.now() - 1 * 60 * 60 * 1000),
  },
  {
    id: 4,
    name: "OfficeFlow",
    emoji: "🏢",
    status: "RESOLVED" as const,
    yesBets: 50,
    noBets: 30,
    endTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    outcome: "YES" as const,
  },
];

export default function AdminPage() {
  const stats = {
    totalEvents: mockAdminEvents.length,
    totalBets: mockAdminEvents.reduce((acc, e) => acc + e.yesBets + e.noBets, 0),
    totalPool: mockAdminEvents.reduce((acc, e) => acc + (e.yesBets + e.noBets) * 10, 0),
    activeEvents: mockAdminEvents.filter(e => e.status === "OPEN").length,
  };

  return (
    <div className="container max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold tracking-tight mb-2">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Manage events and monitor betting activity
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card className="p-4">
          <div className="text-2xl font-bold tabular-nums" data-testid="text-total-events">{stats.totalEvents}</div>
          <div className="text-sm text-muted-foreground">Total Events</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold tabular-nums" data-testid="text-active-events">{stats.activeEvents}</div>
          <div className="text-sm text-muted-foreground">Active Events</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold tabular-nums" data-testid="text-total-bets">{stats.totalBets}</div>
          <div className="text-sm text-muted-foreground">Total Bets</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold tabular-nums font-mono" data-testid="text-total-pool">{stats.totalPool}</div>
          <div className="text-sm text-muted-foreground">MATIC Pooled</div>
        </Card>
      </div>

      <Tabs defaultValue="events" className="space-y-6">
        <TabsList>
          <TabsTrigger value="events" data-testid="tab-manage-events">Manage Events</TabsTrigger>
          <TabsTrigger value="create" data-testid="tab-create-event">Create Event</TabsTrigger>
        </TabsList>

        <TabsContent value="events" className="space-y-4">
          <AdminEventsTable
            events={mockAdminEvents}
            onResolve={(id, outcome) => console.log('Resolve event:', id, 'with outcome:', outcome)}
          />
        </TabsContent>

        <TabsContent value="create">
          <AdminEventForm
            onSubmit={(data) => console.log('Create event:', data)}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
