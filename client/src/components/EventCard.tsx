import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import EventStatusBadge from "./EventStatusBadge";
import CountdownTimer from "./CountdownTimer";
import { TrendingUp } from "lucide-react";

type EventStatus = "OPEN" | "CLOSED" | "RESOLVED";

interface EventCardProps {
  id: number;
  emoji: string;
  name: string;
  description: string;
  endTime: number; // UNIX timestamp in seconds
  status: EventStatus;
  yesBets: number;
  noBets: number;
  totalYesPool: number;
  totalNoPool: number;
  userBet?: "YES" | "NO";
  onPlaceBet?: () => void;
  onClaim?: () => void;
  outcome?: "YES" | "NO";
  hasClaimed?: boolean;
}

export default function EventCard({
  id,
  emoji,
  name,
  description,
  endTime,
  status,
  yesBets,
  noBets,
  totalYesPool,
  totalNoPool,
  userBet,
  onPlaceBet,
  onClaim,
  outcome,
  hasClaimed,
}: EventCardProps) {
  const totalBets = yesBets + noBets;
  const yesPercentage = totalBets > 0 ? (yesBets / totalBets) * 100 : 50;
  const noPercentage = totalBets > 0 ? (noBets / totalBets) * 100 : 50;

  const canClaim = status === "RESOLVED" && userBet === outcome && onClaim && !hasClaimed;
  const userLost = status === "RESOLVED" && userBet && userBet !== outcome;

  return (
    <Card className="p-6 hover-elevate" data-testid={`card-event-${id}`}>
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <span className="text-3xl flex-shrink-0" data-testid="emoji-startup">{emoji}</span>
            <div className="flex-1 min-w-0">
              <h3 className="text-xl font-semibold mb-1" data-testid="text-event-name">{name}</h3>
              <p className="text-sm text-muted-foreground line-clamp-2" data-testid="text-event-description">{description}</p>
            </div>
          </div>
          <EventStatusBadge status={status} />
        </div>

        {status !== "RESOLVED" && (
          <CountdownTimer endTime={endTime} />
        )}

        {status === "RESOLVED" && outcome && (
          <div className="flex items-center gap-2 p-3 rounded-md bg-primary/10 border border-primary/20">
            <TrendingUp className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium" data-testid="text-outcome">
              Outcome: <span className={outcome === "YES" ? "text-bet-yes" : "text-bet-no"}>{outcome}</span>
            </span>
          </div>
        )}

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">YES: {yesBets} bets</span>
            <span className="text-muted-foreground">NO: {noBets} bets</span>
          </div>
          
          <div className="flex h-2 rounded-full overflow-hidden bg-muted">
            <div 
              className="bg-bet-yes transition-all" 
              style={{ width: `${yesPercentage}%` }}
              data-testid="bar-yes-percentage"
            />
            <div 
              className="bg-bet-no transition-all" 
              style={{ width: `${noPercentage}%` }}
              data-testid="bar-no-percentage"
            />
          </div>

          <div className="flex items-center justify-between text-sm font-mono">
            <span className="text-bet-yes" data-testid="text-yes-pool">{totalYesPool} SOL</span>
            <span className="text-bet-no" data-testid="text-no-pool">{totalNoPool} SOL</span>
          </div>
        </div>

        {userBet && (
          <div className="p-2 rounded-md bg-accent/50 text-sm text-center" data-testid="text-user-bet">
            Your bet: <span className={userBet === "YES" ? "text-bet-yes font-semibold" : "text-bet-no font-semibold"}>{userBet}</span>
          </div>
        )}

        {userLost && (
          <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20 text-sm text-center text-destructive" data-testid="text-lost">
            You lost this bet
          </div>
        )}

        {hasClaimed && (
          <div className="p-3 rounded-md bg-primary/10 border border-primary/20 text-sm text-center text-primary font-medium" data-testid="text-claimed">
            ✓ Winnings Claimed
          </div>
        )}

        {canClaim && (
          <Button className="w-full" onClick={onClaim} data-testid="button-claim">
            Claim Payout
          </Button>
        )}

        {status === "OPEN" && !userBet && (
          <Button className="w-full" onClick={onPlaceBet} data-testid="button-place-bet">
            Place Bet (10 SOL)
          </Button>
        )}

        {status === "OPEN" && userBet && (
          <Button className="w-full" variant="outline" disabled data-testid="button-bet-placed">
            Bet Already Placed
          </Button>
        )}
      </div>
    </Card>
  );
}
