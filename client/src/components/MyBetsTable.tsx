import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import EventStatusBadge from "./EventStatusBadge";
import { cn } from "@/lib/utils";

type EventStatus = "OPEN" | "CLOSED" | "RESOLVED";

interface Bet {
  id: number;
  eventId: number;
  eventName: string;
  emoji: string;
  choice: "YES" | "NO";
  amount: number;
  status: EventStatus;
  outcome?: "YES" | "NO";
  payout?: number;
  hasClaimed?: boolean;
}

interface MyBetsTableProps {
  bets: Bet[];
  onClaim?: (betId: number) => void;
}

export default function MyBetsTable({ bets, onClaim }: MyBetsTableProps) {
  if (bets.length === 0) {
    return (
      <Card className="p-12 text-center">
        <p className="text-muted-foreground" data-testid="text-no-bets">No bets yet - explore events to get started!</p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {bets.map((bet) => {
        const isWinner = bet.status === "RESOLVED" && bet.choice === bet.outcome;
        const isLoser = bet.status === "RESOLVED" && bet.choice !== bet.outcome;

        return (
          <Card key={bet.id} className="p-4 sm:p-6" data-testid={`card-bet-${bet.id}`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <span className="text-2xl flex-shrink-0">{bet.emoji}</span>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold mb-1" data-testid="text-bet-event-name">{bet.eventName}</h3>
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="text-muted-foreground">Your bet:</span>
                    <span className={cn(
                      "font-semibold",
                      bet.choice === "YES" ? "text-bet-yes" : "text-bet-no"
                    )} data-testid="text-bet-choice">
                      {bet.choice}
                    </span>
                    <span className="text-muted-foreground">•</span>
                    <span className="font-mono text-muted-foreground" data-testid="text-bet-amount">{bet.amount} ALGO</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <EventStatusBadge status={bet.status} />
                
                {isWinner && !bet.hasClaimed && onClaim && (
                  <Button size="sm" onClick={() => onClaim(bet.id)} data-testid={`button-claim-${bet.id}`}>
                    Claim {bet.payout} ALGO
                  </Button>
                )}

                {isWinner && bet.hasClaimed && (
                  <div className="px-3 py-1.5 rounded-md bg-primary/10 text-primary text-sm font-medium" data-testid="text-claimed">
                    Claimed
                  </div>
                )}

                {isLoser && (
                  <div className="px-3 py-1.5 rounded-md bg-destructive/10 text-destructive text-sm font-medium" data-testid="text-lost">
                    Lost
                  </div>
                )}

                {bet.status === "OPEN" && (
                  <div className="text-sm text-muted-foreground" data-testid="text-pending">Pending</div>
                )}

                {bet.status === "CLOSED" && (
                  <div className="text-sm text-muted-foreground" data-testid="text-awaiting">Awaiting result</div>
                )}
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
