import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { usePlaceBet } from "@/hooks/useSolanaPredictionMarket";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Coins } from "lucide-react";

interface PlaceBetProps {
  eventId: number;
  eventName: string;
  eventEndTime: number;
  totalYesAmount: string;
  totalNoAmount: string;
  isResolved: boolean;
}

export function PlaceBet({
  eventId,
  eventName,
  eventEndTime,
  totalYesAmount,
  totalNoAmount,
  isResolved,
}: PlaceBetProps) {
  const [betAmount, setBetAmount] = useState<string>("");
  const [selectedOutcome, setSelectedOutcome] = useState<boolean | null>(null);
  const { toast } = useToast();
  const placeBet = usePlaceBet();

  const handlePlaceBet = async () => {
    if (!selectedOutcome || !betAmount) {
      toast({
        title: "Invalid Bet",
        description: "Please select an outcome and enter a bet amount.",
        variant: "destructive",
      });
      return;
    }

    const amount = parseFloat(betAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid bet amount.",
        variant: "destructive",
      });
      return;
    }

    try {
      await placeBet.execute(
        eventId,
        selectedOutcome,
        amount // Amount in SOL, hook converts to lamports
      );

      toast({
        title: "Bet Placed Successfully! 🎉",
        description: `You bet ${amount} SOL on ${selectedOutcome ? "YES" : "NO"} for "${eventName}"`,
      });

      // Reset form
      setBetAmount("");
      setSelectedOutcome(null);
    } catch (error) {
      console.error("Failed to place bet:", error);
      toast({
        title: "Bet Failed",
        description: error instanceof Error ? error.message : "Failed to place bet. Please try again.",
        variant: "destructive",
      });
    }
  };

  const totalYes = parseFloat(totalYesAmount) / 1_000_000_000;
  const totalNo = parseFloat(totalNoAmount) / 1_000_000_000;
  const totalPool = totalYes + totalNo;

  if (isResolved) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Event Resolved</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            This event has been resolved and is no longer accepting bets.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Place Your Bet</CardTitle>
        <p className="text-sm text-muted-foreground">
          Bet on "{eventName}"
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Pool Info */}
        <div className="grid grid-cols-2 gap-4 p-3 bg-muted rounded-lg">
          <div className="text-center">
            <p className="text-sm font-medium">YES Pool</p>
            <p className="text-lg font-bold text-green-600">{totalYes.toFixed(4)} SOL</p>
          </div>
          <div className="text-center">
            <p className="text-sm font-medium">NO Pool</p>
            <p className="text-lg font-bold text-red-600">{totalNo.toFixed(4)} SOL</p>
          </div>
        </div>

        {/* Outcome Selection */}
        <div className="space-y-2">
          <Label>Select Outcome</Label>
          <div className="flex gap-2">
            <Button
              variant={selectedOutcome === true ? "default" : "outline"}
              onClick={() => setSelectedOutcome(true)}
              className="flex-1"
            >
              YES
            </Button>
            <Button
              variant={selectedOutcome === false ? "default" : "outline"}
              onClick={() => setSelectedOutcome(false)}
              className="flex-1"
            >
              NO
            </Button>
          </div>
        </div>

        {/* Bet Amount */}
        <div className="space-y-2">
          <Label htmlFor="betAmount">Bet Amount (SOL)</Label>
          <div className="relative">
            <Coins className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="betAmount"
              type="number"
              placeholder="0.1"
              value={betAmount}
              onChange={(e) => setBetAmount(e.target.value)}
              className="pl-10"
              min="0"
              step="0.01"
            />
          </div>
        </div>

        {/* Place Bet Button */}
        <Button
          onClick={handlePlaceBet}
          disabled={!selectedOutcome || !betAmount || placeBet.isLoading}
          className="w-full"
        >
          {placeBet.isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Placing Bet...
            </>
          ) : (
            "Place Bet"
          )}
        </Button>
      </CardContent>
    </Card>
  );
}