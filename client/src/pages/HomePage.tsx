import { useState, useMemo } from "react";
import EventCard from "@/components/EventCard";
import BetModal from "@/components/BetModal";
import MockModeBanner from "@/components/MockModeBanner";
import { Button } from "@/components/ui/button";
import { Filter, Loader2 } from "lucide-react";
import { useAllEvents } from "@/hooks/useEvents";
import { useGetUserBets, useClaimWinnings } from "@/hooks/useAlgorandPredictionMarket";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

// Helper to format microAlgos to ALGO
const formatAlgo = (microAlgos: bigint): string => {
  return (Number(microAlgos) / 1_000_000).toFixed(2);
};

interface HomePageProps {
  walletAddress?: `0x${string}`;
}

type EventStatus = "OPEN" | "CLOSED" | "RESOLVED";

interface ContractEvent {
  eventId: number;  // Changed from id: bigint to match API response
  name: string;
  endTime: number;  // Changed from bigint
  resolved: boolean;
  outcome: boolean;
  totalYesBets: number;  // Changed from bigint
  totalNoBets: number;  // Changed from bigint
  totalYesAmount: string;  // Changed from bigint to string (API returns as string)
  totalNoAmount: string;  // Changed from bigint to string (API returns as string)
}

export default function HomePage({ walletAddress }: HomePageProps) {
  const [betModal, setBetModal] = useState<{ open: boolean; event?: ContractEvent }>({
    open: false,
  });
  const [filter, setFilter] = useState<"ALL" | "OPEN" | "CLOSED" | "RESOLVED">("ALL");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all events from contract
  const { data: events, isLoading, error } = useAllEvents();
  
  // Fetch user bets if wallet connected
  const { data: userBets } = useGetUserBets(walletAddress || null);
  
  // Hook for claiming winnings
  const { claimWinnings } = useClaimWinnings();

  // Determine event status based on contract data
  const getEventStatus = (event: ContractEvent): EventStatus => {
    if (event.resolved) {
      return "RESOLVED";
    }
    const now = Math.floor(Date.now() / 1000);
    const endTime = Number(event.endTime);
    return now >= endTime ? "CLOSED" : "OPEN";
  };

  // Get user's bet for a specific event
  const getUserBetForEvent = (eventId: number): { choice: "YES" | "NO"; betId: number; claimed: boolean } | undefined => {
    if (!userBets || !Array.isArray(userBets)) return undefined;
    
    const bet = userBets.find((b: any) => b.eventId === eventId);
    if (!bet) return undefined;
    
    return {
      choice: bet.outcome ? "YES" : "NO",
      betId: Number(bet.betId),
      claimed: bet.claimed,
    };
  };

  // Filter events based on selected filter
  const filteredEvents = useMemo(() => {
    if (!events || !Array.isArray(events)) return [];
    
    if (filter === "ALL") return events;
    
    return events.filter((event: ContractEvent) => {
      const status = getEventStatus(event);
      return status === filter;
    });
  }, [events, filter]);

  // Handle loading state
  if (isLoading) {
    return (
      <div className="container max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading events from blockchain...</p>
          </div>
        </div>
      </div>
    );
  }

  // Handle error state
  if (error) {
    return (
      <div className="container max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex flex-col items-center gap-4 text-center">
            <p className="text-destructive font-semibold">Error loading events</p>
            <p className="text-sm text-muted-foreground">
              Please make sure you're connected to Algorand LocalNet with Pera Wallet
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Handle no events
  if (!events || !Array.isArray(events) || events.length === 0) {
    return (
      <div className="container max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight mb-2">Startup Prediction Markets</h1>
          <p className="text-muted-foreground">
            Bet on which startups will raise Series A. All bets are on Algorand TestNet.
          </p>
        </div>
        <div className="flex items-center justify-center min-h-[400px]">
          <p className="text-muted-foreground">No events available yet.</p>
        </div>
      </div>
    );
  }

  const handlePlaceBet = (choice: "YES" | "NO") => {
    if (betModal.event && walletAddress) {
      console.log('Bet placed:', choice, 'on event', betModal.event.eventId, 'by', walletAddress);
    }
  };

  const handleClaimPayout = async (eventId: number) => {
    if (!walletAddress) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet to claim winnings.",
        variant: "destructive",
      });
      return;
    }

    const userBet = getUserBetForEvent(eventId);
    if (!userBet) {
      toast({
        title: "No Bet Found",
        description: "You don't have a bet on this event.",
        variant: "destructive",
      });
      return;
    }

    try {
      if (!walletAddress) {
        toast({
          title: "Wallet Not Connected",
          description: "Please connect your wallet.",
          variant: "destructive",
        });
        return;
      }

      await claimWinnings(Number(userBet.betId), walletAddress);
      
      toast({
        title: "Winnings Claimed! 🎉",
        description: "Your winnings have been transferred to your wallet.",
      });
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['userBets'] });
      queryClient.invalidateQueries({ queryKey: ['allEvents'] });
    } catch (error) {
      console.error('Error claiming winnings:', error);
      toast({
        title: "Claim Failed",
        description: error instanceof Error ? error.message : "Failed to claim winnings. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold tracking-tight mb-2">Startup Prediction Markets</h1>
        <p className="text-muted-foreground">
          Bet on which startups will raise Series A. All bets are on Algorand TestNet.
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
        {filteredEvents.map((event: ContractEvent) => {
          const status = getEventStatus(event);
          const userBetData = getUserBetForEvent(event.eventId);
          const eventId = event.eventId;

          return (
            <EventCard
              key={eventId}
              id={eventId}
              emoji="🚀"
              name={event.name}
              description={`Event #${eventId}`}
              endTime={Number(event.endTime)}
              status={status}
              yesBets={Number(event.totalYesBets)}
              noBets={Number(event.totalNoBets)}
              totalYesPool={parseFloat(event.totalYesAmount) / 1_000_000}
              totalNoPool={parseFloat(event.totalNoAmount) / 1_000_000}
              userBet={userBetData?.choice}
              outcome={event.resolved ? (event.outcome ? "YES" : "NO") : undefined}
              onPlaceBet={() => setBetModal({ open: true, event })}
              onClaim={() => handleClaimPayout(eventId)}
              hasClaimed={userBetData?.claimed}
            />
          );
        })}
      </div>

      {betModal.event && (
        <BetModal
          open={betModal.open}
          onClose={() => setBetModal({ open: false })}
          eventId={Number(betModal.event.eventId)}
          eventName={betModal.event.name}
          yesBets={Number(betModal.event.totalYesBets)}
          noBets={Number(betModal.event.totalNoBets)}
        />
      )}
    </div>
  );
}
