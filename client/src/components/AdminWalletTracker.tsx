import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Wallet, TrendingUp, TrendingDown, Loader2, Activity } from "lucide-react";
import { useMemo } from "react";

// Helper to format microAlgos to ALGO
const formatAlgo = (microAlgos: bigint): string => {
  return (Number(microAlgos) / 1_000_000).toFixed(2);
};

interface AdminEvent {
  id: number;
  name: string;
  emoji: string;
  yesBets: number;
  noBets: number;
  totalYesAmount: bigint;
  totalNoAmount: bigint;
}

interface AdminWalletTrackerProps {
  events: AdminEvent[];
  eventId?: number;
}

export default function AdminWalletTracker({ events, eventId }: AdminWalletTrackerProps) {
  const isLoading = false; // Simplified - data comes from props

  // Calculate aggregate statistics from events
  const stats = useMemo(() => {
    if (eventId !== undefined) {
      const event = events.find(e => e.id === eventId);
      if (!event) return { yesBets: 0, noBets: 0, totalBets: 0, totalAmount: "0" };
      
      const totalAmount = formatAlgo(event.totalYesAmount + event.totalNoAmount);
      return {
        yesBets: event.yesBets,
        noBets: event.noBets,
        totalBets: event.yesBets + event.noBets,
        totalAmount,
      };
    }

    // Aggregate all events
    const totalYesBets = events.reduce((acc, e) => acc + e.yesBets, 0);
    const totalNoBets = events.reduce((acc, e) => acc + e.noBets, 0);
    const totalAmount = events.reduce((acc, e) => {
      return acc + Number(formatAlgo(e.totalYesAmount + e.totalNoAmount));
    }, 0);

    return {
      yesBets: totalYesBets,
      noBets: totalNoBets,
      totalBets: totalYesBets + totalNoBets,
      totalAmount: totalAmount.toFixed(2),
    };
  }, [events, eventId]);

  if (eventId === undefined) {
    // Show aggregate wallet activity across all events
    return (
      <Card className="p-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5" />
          Aggregate Betting Activity
        </h3>
        
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
            <span className="ml-2 text-muted-foreground">Loading data from blockchain...</span>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="p-4 rounded-md bg-primary/10 border">
                <div className="text-2xl font-bold">{stats.totalBets}</div>
                <div className="text-sm text-muted-foreground">Total Bets</div>
              </div>
              <div className="p-4 rounded-md bg-primary/10 border">
                <div className="text-2xl font-bold font-mono">{stats.totalAmount}</div>
                <div className="text-sm text-muted-foreground">ALGO Wagered</div>
              </div>
              <div className="p-4 rounded-md bg-bet-yes/10 border">
                <div className="text-2xl font-bold text-bet-yes">{stats.yesBets}</div>
                <div className="text-sm text-muted-foreground">YES Bets</div>
              </div>
              <div className="p-4 rounded-md bg-bet-no/10 border">
                <div className="text-2xl font-bold text-bet-no">{stats.noBets}</div>
                <div className="text-sm text-muted-foreground">NO Bets</div>
              </div>
            </div>

            <div className="border rounded-lg p-4">
              <h4 className="font-semibold mb-3">Events Breakdown</h4>
              <ScrollArea className="h-[400px]">
                <div className="space-y-2">
                  {events.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No events created yet
                    </div>
                  ) : (
                    events.map((event) => {
                      const eventTotal = formatAlgo(event.totalYesAmount + event.totalNoAmount);
                      const totalBets = event.yesBets + event.noBets;
                      
                      return (
                        <div
                          key={event.id}
                          className="flex items-center justify-between p-3 rounded-md hover-elevate border"
                          data-testid={`event-stats-${event.id}`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-xl">{event.emoji}</span>
                            <div>
                              <div className="font-medium">{event.name}</div>
                              <div className="text-xs text-muted-foreground">
                                Event #{event.id}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-sm">
                              <span className="text-bet-yes font-semibold">{event.yesBets}</span>
                              <span className="text-muted-foreground"> / </span>
                              <span className="text-bet-no font-semibold">{event.noBets}</span>
                            </div>
                            <Badge variant="outline">{totalBets} bets</Badge>
                            <div className="text-sm font-mono text-muted-foreground min-w-[80px] text-right">
                              {eventTotal} ALGO
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </ScrollArea>
            </div>
          </>
        )}
      </Card>
    );
  }

  // Show specific event betting activity
  const event = events.find(e => e.id === eventId);
  
  if (!event) {
    return (
      <Card className="p-6">
        <div className="text-center py-8 text-muted-foreground">
          Event not found
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h3 className="font-semibold mb-4 flex items-center gap-2">
        <span className="text-xl">{event.emoji}</span>
        {event.name} - Betting Activity
      </h3>
      
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <span className="ml-2 text-muted-foreground">Loading event data...</span>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="p-3 rounded-md bg-bet-yes/10 border">
              <div className="text-2xl font-bold text-bet-yes">{stats.yesBets}</div>
              <div className="text-sm text-muted-foreground">YES bets</div>
            </div>
            <div className="p-3 rounded-md bg-bet-no/10 border">
              <div className="text-2xl font-bold text-bet-no">{stats.noBets}</div>
              <div className="text-sm text-muted-foreground">NO bets</div>
            </div>
            <div className="p-3 rounded-md bg-primary/10 border">
              <div className="text-2xl font-bold">{stats.totalBets}</div>
              <div className="text-sm text-muted-foreground">Total Bets</div>
            </div>
            <div className="p-3 rounded-md bg-primary/10 border">
              <div className="text-2xl font-bold font-mono">{stats.totalAmount}</div>
              <div className="text-sm text-muted-foreground">ALGO Pool</div>
            </div>
          </div>

          <div className="border rounded-lg p-4">
            <h4 className="font-semibold mb-3">Bet Distribution</h4>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-bet-yes font-medium">YES Bets</span>
                  <span className="font-mono">{formatAlgo(event.totalYesAmount)} ALGO</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className="bg-bet-yes h-2 rounded-full transition-all"
                    style={{ 
                      width: stats.totalBets > 0 
                        ? `${(stats.yesBets / stats.totalBets) * 100}%` 
                        : '0%' 
                    }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-bet-no font-medium">NO Bets</span>
                  <span className="font-mono">{formatAlgo(event.totalNoAmount)} ALGO</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className="bg-bet-no h-2 rounded-full transition-all"
                    style={{ 
                      width: stats.totalBets > 0 
                        ? `${(stats.noBets / stats.totalBets) * 100}%` 
                        : '0%' 
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {stats.totalBets === 0 && (
            <div className="text-center py-8 text-muted-foreground mt-4">
              No bets placed on this event yet
            </div>
          )}
        </>
      )}
    </Card>
  );
}
