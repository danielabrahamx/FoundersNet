import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface BetModalProps {
  open: boolean;
  onClose: () => void;
  eventName: string;
  yesBets: number;
  noBets: number;
  onConfirm: (choice: "YES" | "NO") => void;
}

export default function BetModal({ 
  open, 
  onClose, 
  eventName, 
  yesBets, 
  noBets,
  onConfirm 
}: BetModalProps) {
  const [choice, setChoice] = useState<"YES" | "NO" | null>(null);

  const totalBets = yesBets + noBets;
  const potentialReturn = choice 
    ? choice === "YES" 
      ? (10 + (10 / (yesBets * 10 + 10)) * (noBets * 10)).toFixed(2)
      : (10 + (10 / (noBets * 10 + 10)) * (yesBets * 10)).toFixed(2)
    : "0";

  const handleConfirm = () => {
    if (choice) {
      onConfirm(choice);
      setChoice(null);
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md" data-testid="modal-bet">
        <DialogHeader>
          <DialogTitle className="text-xl">Place Your Bet</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Will this startup reach $1M ARR?</p>
            <p className="font-semibold" data-testid="text-modal-event-name">{eventName}</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setChoice("YES")}
              className={cn(
                "p-6 rounded-lg border-2 transition-all hover-elevate",
                choice === "YES"
                  ? "border-bet-yes bg-bet-yes/10"
                  : "border-border hover:border-bet-yes/50"
              )}
              data-testid="button-choice-yes"
            >
              <TrendingUp className={cn(
                "w-8 h-8 mx-auto mb-2",
                choice === "YES" ? "text-bet-yes" : "text-muted-foreground"
              )} />
              <div className={cn(
                "text-2xl font-bold",
                choice === "YES" ? "text-bet-yes" : "text-foreground"
              )}>YES</div>
              <div className="text-xs text-muted-foreground mt-1">{yesBets} bets</div>
            </button>

            <button
              onClick={() => setChoice("NO")}
              className={cn(
                "p-6 rounded-lg border-2 transition-all hover-elevate",
                choice === "NO"
                  ? "border-bet-no bg-bet-no/10"
                  : "border-border hover:border-bet-no/50"
              )}
              data-testid="button-choice-no"
            >
              <TrendingDown className={cn(
                "w-8 h-8 mx-auto mb-2",
                choice === "NO" ? "text-bet-no" : "text-muted-foreground"
              )} />
              <div className={cn(
                "text-2xl font-bold",
                choice === "NO" ? "text-bet-no" : "text-foreground"
              )}>NO</div>
              <div className="text-xs text-muted-foreground mt-1">{noBets} bets</div>
            </button>
          </div>

          <div className="space-y-3 p-4 rounded-lg bg-muted/50">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Bet Amount</span>
              <span className="font-mono font-semibold" data-testid="text-bet-amount">10 MATIC (fixed)</span>
            </div>
            {choice && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Potential Return</span>
                <span className="font-mono font-semibold text-primary" data-testid="text-potential-return">~{potentialReturn} MATIC</span>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={onClose} data-testid="button-cancel">
              Cancel
            </Button>
            <Button 
              className="flex-1" 
              onClick={handleConfirm}
              disabled={!choice}
              data-testid="button-confirm-bet"
            >
              Confirm Bet
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
