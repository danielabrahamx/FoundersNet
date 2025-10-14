import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Wallet, TrendingUp, TrendingDown } from "lucide-react";
import { getAllBetsForEvent, getWalletStats, VOTER_WALLETS } from "@/lib/wallets";

interface AdminWalletTrackerProps {
  eventId?: number;
}

export default function AdminWalletTracker({ eventId }: AdminWalletTrackerProps) {
  if (eventId === undefined) {
    // Show all wallet stats
    return (
      <Card className="p-6">
        <h3 className="font-semibold mb-4">All Wallet Activity</h3>
        <ScrollArea className="h-[400px]">
          <div className="space-y-2">
            {VOTER_WALLETS.map((wallet, index) => {
              const stats = getWalletStats(wallet);
              return (
                <div
                  key={wallet}
                  className="flex items-center justify-between p-3 rounded-md hover-elevate border"
                  data-testid={`wallet-stats-${index + 1}`}
                >
                  <div className="flex items-center gap-3">
                    <Wallet className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium">Voter #{index + 1}</div>
                      <div className="font-mono text-xs text-muted-foreground">
                        {wallet.slice(0, 10)}...{wallet.slice(-4)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-sm">
                      <span className="text-bet-yes">{stats.yesBets} YES</span>
                      {" / "}
                      <span className="text-bet-no">{stats.noBets} NO</span>
                    </div>
                    <Badge variant="outline">{stats.totalBets} bets</Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </Card>
    );
  }

  // Show bets for specific event
  const eventBets = getAllBetsForEvent(eventId);
  const yesBets = eventBets.filter(b => b.choice === "YES");
  const noBets = eventBets.filter(b => b.choice === "NO");

  return (
    <Card className="p-6">
      <h3 className="font-semibold mb-4">Event Wallet Tracker</h3>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="p-3 rounded-md bg-bet-yes/10">
          <div className="text-2xl font-bold text-bet-yes">{yesBets.length}</div>
          <div className="text-sm text-muted-foreground">YES bets</div>
        </div>
        <div className="p-3 rounded-md bg-bet-no/10">
          <div className="text-2xl font-bold text-bet-no">{noBets.length}</div>
          <div className="text-sm text-muted-foreground">NO bets</div>
        </div>
      </div>

      <ScrollArea className="h-[300px]">
        <div className="space-y-2">
          {eventBets.map((bet, index) => {
            const walletIndex = VOTER_WALLETS.indexOf(bet.wallet);
            return (
              <div
                key={index}
                className="flex items-center justify-between p-2 rounded-md border"
                data-testid={`event-bet-${index}`}
              >
                <div className="flex items-center gap-2">
                  {bet.choice === "YES" ? (
                    <TrendingUp className="w-4 h-4 text-bet-yes" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-bet-no" />
                  )}
                  <span className="text-sm">
                    Voter #{walletIndex !== -1 ? walletIndex + 1 : "?"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-muted-foreground">
                    {bet.wallet.slice(0, 8)}...
                  </span>
                  <Badge 
                    variant="outline" 
                    className={bet.choice === "YES" ? "text-bet-yes" : "text-bet-no"}
                  >
                    {bet.choice}
                  </Badge>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </Card>
  );
}
