import MyBetsTable from "@/components/MyBetsTable";
import { useWalletAddress } from "@/hooks/useAlgorandPredictionMarket";
import { useGetUserBets, useClaimWinnings } from "@/hooks/useAlgorandPredictionMarket";
import { useAllEvents } from "@/hooks/useEvents";
import { useToast } from "@/hooks/use-toast";
import { useMemo } from "react";

// Helper to format microAlgos to ALGO
const formatAlgo = (microAlgos: bigint): string => {
  return (Number(microAlgos) / 1_000_000).toFixed(2);
};

export default function MyBetsPage() {
  const address = useWalletAddress();
  const { data: userBets, isLoading: betsLoading, error, refetch } = useGetUserBets(address);
  const { data: contractEvents, isLoading: eventsLoading } = useAllEvents();
  const { claimWinnings, isPending: isClaimPending } = useClaimWinnings();
  const { toast } = useToast();

  const isLoading = betsLoading || eventsLoading;

  // Transform contract data to component format
  const transformedBets = useMemo(() => {
    if (!userBets || !Array.isArray(userBets) || !contractEvents || !Array.isArray(contractEvents)) return [];

    return userBets.map((bet: any) => {
      const eventId = Number(bet.eventId);
      // API returns 'eventId' not 'id'
      const event = contractEvents.find((e: any) => Number(e.eventId || e.id) === eventId);
      
      if (!event) {
        return {
          id: Number(bet.betId),
          eventId,
          eventName: `Event ${eventId}`,
          emoji: "❓",
          choice: (bet.outcome ? "YES" : "NO") as "YES" | "NO",
          amount: parseFloat(formatAlgo(bet.amount)),
          status: "OPEN" as const,
          hasClaimed: bet.claimed,
        };
      }

      // Determine event status
      const now = Math.floor(Date.now() / 1000);
      const endTime = Number(event.endTime);
      let status: "OPEN" | "CLOSED" | "RESOLVED" = "OPEN";
      
      if (event.resolved) {
        status = "RESOLVED";
      } else if (now >= endTime) {
        status = "CLOSED";
      }

      // Calculate payout if bet won
      let payout: number | undefined;
      const betChoice: "YES" | "NO" = bet.outcome ? "YES" : "NO";
      const eventOutcome: "YES" | "NO" = event.outcome ? "YES" : "NO";
      const isWinner = status === "RESOLVED" && betChoice === eventOutcome;

      if (isWinner) {
        const betAmount = parseFloat(formatAlgo(bet.amount));
        const totalYesAmount = parseFloat(formatAlgo(event.totalYesAmount));
        const totalNoAmount = parseFloat(formatAlgo(event.totalNoAmount));
        const totalPool = totalYesAmount + totalNoAmount;
        
        if (betChoice === "YES" && totalYesAmount > 0) {
          payout = (betAmount / totalYesAmount) * totalPool;
        } else if (betChoice === "NO" && totalNoAmount > 0) {
          payout = (betAmount / totalNoAmount) * totalPool;
        }
      }
      
      return {
        id: Number(bet.betId),
        eventId,
        eventName: event.name,
        emoji: "🚀", // Could be extracted from name
        choice: betChoice,
        amount: parseFloat(formatAlgo(bet.amount)),
        status,
        outcome: event.resolved ? (eventOutcome as "YES" | "NO") : undefined,
        payout: payout ? parseFloat(payout.toFixed(4)) : undefined,
        hasClaimed: bet.claimed,
      };
    });
  }, [userBets, contractEvents]);

  const handleClaim = async (betId: number) => {
    if (!address) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet to claim winnings.",
        variant: "destructive",
      });
      return;
    }

    try {
      await claimWinnings(betId, address);
      
      toast({
        title: "Winnings Claimed!",
        description: "Your winnings have been transferred to your wallet.",
      });
      refetch(); // Refresh the bets list
    } catch (error) {
      console.error('Error claiming winnings:', error);
      toast({
        title: "Claim Failed",
        description: error instanceof Error ? error.message : "Failed to claim winnings. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (!address) {
    return (
      <div className="container max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight mb-2">My Bets</h1>
          <p className="text-muted-foreground">
            Please connect your wallet to view your bets
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight mb-2">My Bets</h1>
          <p className="text-muted-foreground">Loading your bets...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight mb-2">My Bets</h1>
          <p className="text-destructive">
            Error loading bets. Please make sure your wallet is connected to Algorand LocalNet.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold tracking-tight mb-2">My Bets</h1>
        <p className="text-muted-foreground">
          Track your betting history and claim your winnings
        </p>
      </div>

      {transformedBets.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p>You haven't placed any bets yet.</p>
          <p className="text-sm mt-2">Visit the home page to start betting!</p>
        </div>
      ) : (
        <MyBetsTable
          bets={transformedBets}
          onClaim={handleClaim}
        />
      )}
    </div>
  );
}
