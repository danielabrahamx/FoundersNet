import { useState } from "react";
import EventCard from "@/components/EventCard";
import BetModal from "@/components/BetModal";
import { Button } from "@/components/ui/button";
import { Filter } from "lucide-react";
import { hasWalletBet, getWalletBet, recordBet, getAllBetsForEvent } from "@/lib/wallets";

interface HomePageProps {
  walletAddress?: string;
}

//todo: remove mock functionality
const mockEvents = [
  {
    id: 1,
    emoji: "🚀",
    name: "TechFlow AI",
    description: "AI-powered workflow automation platform targeting SMBs with advanced no-code capabilities and enterprise-grade security",
    endTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    status: "OPEN" as const,
    yesBets: 45,
    noBets: 23,
    totalYesPool: 450,
    totalNoPool: 230,
  },
  {
    id: 2,
    emoji: "☁️",
    name: "CloudScale Pro",
    description: "Infrastructure management platform for multi-cloud deployments with automated cost optimization",
    endTime: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    status: "OPEN" as const,
    yesBets: 32,
    noBets: 18,
    totalYesPool: 320,
    totalNoPool: 180,
  },
  {
    id: 3,
    emoji: "💾",
    name: "DataSync Hub",
    description: "Real-time data synchronization service for distributed teams with end-to-end encryption",
    endTime: new Date(Date.now() - 1 * 60 * 60 * 1000),
    status: "CLOSED" as const,
    yesBets: 28,
    noBets: 22,
    totalYesPool: 280,
    totalNoPool: 220,
  },
  {
    id: 4,
    emoji: "🏢",
    name: "OfficeFlow",
    description: "Smart office management system with IoT integration for workplace optimization",
    endTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    status: "RESOLVED" as const,
    yesBets: 50,
    noBets: 30,
    totalYesPool: 500,
    totalNoPool: 300,
    outcome: "YES" as const,
  },
  {
    id: 5,
    emoji: "💡",
    name: "BrightIdeas",
    description: "Innovation management platform connecting employees with R&D teams for crowdsourced solutions",
    endTime: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    status: "RESOLVED" as const,
    yesBets: 20,
    noBets: 40,
    totalYesPool: 200,
    totalNoPool: 400,
    outcome: "NO" as const,
  },
  {
    id: 6,
    emoji: "🔐",
    name: "SecureVault Pro",
    description: "Zero-knowledge password manager for enterprises with biometric authentication",
    endTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    status: "OPEN" as const,
    yesBets: 15,
    noBets: 10,
    totalYesPool: 150,
    totalNoPool: 100,
  },
];

export default function HomePage({ walletAddress }: HomePageProps) {
  const [betModal, setBetModal] = useState<{ open: boolean; event?: typeof mockEvents[0] }>({
    open: false,
  });
  const [filter, setFilter] = useState<"ALL" | "OPEN" | "CLOSED" | "RESOLVED">("ALL");

  const filteredEvents = filter === "ALL" 
    ? mockEvents 
    : mockEvents.filter(e => e.status === filter);

  const handlePlaceBet = (choice: "YES" | "NO") => {
    if (betModal.event && walletAddress) {
      recordBet(walletAddress, betModal.event.id, choice);
      console.log('Bet placed:', choice, 'on event', betModal.event.id, 'by', walletAddress);
    }
  };

  return (
    <div className="container max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold tracking-tight mb-2">Startup Prediction Markets</h1>
        <p className="text-muted-foreground">
          Bet on which startups will raise Series A. All bets are 10 MATIC on Polygon testnet.
        </p>
      </div>

      <div className="flex items-center gap-2 mb-6">
        <Filter className="w-4 h-4 text-muted-foreground" />
        <div className="flex gap-2">
          {(["ALL", "OPEN", "CLOSED", "RESOLVED"] as const).map((status) => (
            <Button
              key={status}
              variant={filter === status ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(status)}
              data-testid={`button-filter-${status.toLowerCase()}`}
            >
              {status}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredEvents.map((event) => {
          const userBet = walletAddress ? getWalletBet(walletAddress, event.id) : undefined;
          const eventBets = getAllBetsForEvent(event.id);
          const yesBetsCount = eventBets.filter(b => b.choice === "YES").length;
          const noBetsCount = eventBets.filter(b => b.choice === "NO").length;

          return (
            <EventCard
              key={event.id}
              {...event}
              yesBets={yesBetsCount || event.yesBets}
              noBets={noBetsCount || event.noBets}
              totalYesPool={(yesBetsCount || event.yesBets) * 10}
              totalNoPool={(noBetsCount || event.noBets) * 10}
              userBet={userBet}
              onPlaceBet={() => setBetModal({ open: true, event })}
              onClaim={() => console.log('Claim payout for event', event.id)}
            />
          );
        })}
      </div>

      {betModal.event && (
        <BetModal
          open={betModal.open}
          onClose={() => setBetModal({ open: false })}
          eventName={betModal.event.name}
          yesBets={betModal.event.yesBets}
          noBets={betModal.event.noBets}
          onConfirm={handlePlaceBet}
        />
      )}
    </div>
  );
}
