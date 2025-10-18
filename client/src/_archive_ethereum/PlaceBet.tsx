import { useState } from 'react';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther } from 'viem';
import { PREDICTION_MARKET_ADDRESS, PREDICTION_MARKET_ABI } from '@shared/contracts';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { TrendingUp, TrendingDown, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface PlaceBetProps {
  eventId: number;
  eventName: string;
  eventEndTime: bigint;
  totalYesAmount: bigint;
  totalNoAmount: bigint;
  isResolved: boolean;
  className?: string;
}

export function PlaceBet({
  eventId,
  eventName,
  eventEndTime,
  totalYesAmount,
  totalNoAmount,
  isResolved,
  className
}: PlaceBetProps) {
  const [betChoice, setBetChoice] = useState<boolean | null>(null);
  const [betAmount, setBetAmount] = useState<string>('0.01');
  const { toast } = useToast();

  // Wagmi hooks for contract interaction
  const { 
    data: hash,
    isPending, 
    error,
    writeContract 
  } = useWriteContract();

  // Wait for transaction confirmation
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  // Check if betting is still allowed
  const now = Math.floor(Date.now() / 1000);
  const endTime = Number(eventEndTime);
  const isClosed = now >= endTime || isResolved;

  // Calculate potential returns
  const calculatePotentialReturn = (betOnSuccess: boolean): string => {
    if (!betAmount || parseFloat(betAmount) <= 0) return '0.00';
    
    const amount = parseFloat(betAmount);
    const totalYes = parseFloat(totalYesAmount.toString()) / 1e18;
    const totalNo = parseFloat(totalNoAmount.toString()) / 1e18;
    const totalPool = totalYes + totalNo + amount;

    if (betOnSuccess) {
      const successPool = totalYes + amount;
      if (successPool === 0) return amount.toFixed(4);
      return ((totalPool / successPool) * amount).toFixed(4);
    } else {
      const failPool = totalNo + amount;
      if (failPool === 0) return amount.toFixed(4);
      return ((totalPool / failPool) * amount).toFixed(4);
    }
  };

  const placeBet = (betOnSuccess: boolean) => {
    if (!betAmount || parseFloat(betAmount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid bet amount greater than 0.",
        variant: "destructive",
      });
      return;
    }

    try {
      writeContract({
        address: PREDICTION_MARKET_ADDRESS,
        abi: PREDICTION_MARKET_ABI,
        functionName: 'placeBet',
        args: [BigInt(eventId), betOnSuccess],
        value: parseEther(betAmount),
      });

      setBetChoice(betOnSuccess);
    } catch (err) {
      console.error('Error placing bet:', err);
      toast({
        title: "Transaction Error",
        description: "Failed to initiate transaction. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Show success message
  if (isSuccess && betChoice !== null) {
    setTimeout(() => {
      toast({
        title: "Bet Placed Successfully!",
        description: `Your ${betChoice ? 'YES' : 'NO'} bet of ${betAmount} ALGO has been confirmed.`,
      });
      setBetChoice(null);
      setBetAmount('0.01');
    }, 500);
  }

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <CardTitle>Place Your Bet</CardTitle>
        <CardDescription>{eventName}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Bet Amount Input */}
        <div className="space-y-2">
          <Label htmlFor="bet-amount">Bet Amount (ALGO)</Label>
          <Input
            id="bet-amount"
            type="number"
            step="0.01"
            min="0.01"
            value={betAmount}
            onChange={(e) => setBetAmount(e.target.value)}
            placeholder="0.01"
            disabled={isClosed || isPending || isConfirming}
            className="text-lg font-semibold"
          />
          <p className="text-xs text-muted-foreground">
            Minimum bet: 0.01 ALGO
          </p>
        </div>

        {/* Pool Information */}
        <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
          <div>
            <p className="text-xs text-muted-foreground mb-1">YES Pool</p>
            <p className="text-sm font-semibold text-green-600 dark:text-green-400">
              {(parseFloat(totalYesAmount.toString()) / 1e18).toFixed(4)} ALGO
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">NO Pool</p>
            <p className="text-sm font-semibold text-red-600 dark:text-red-400">
              {(parseFloat(totalNoAmount.toString()) / 1e18).toFixed(4)} ALGO
            </p>
          </div>
        </div>

        {/* Bet Buttons */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Button
              onClick={() => placeBet(true)}
              disabled={isClosed || isPending || isConfirming}
              className="w-full h-auto py-6 flex flex-col gap-2 bg-green-600 hover:bg-green-700 text-white"
            >
              <TrendingUp className="h-6 w-6" />
              <span className="font-bold">Bet: YES</span>
              {isPending && betChoice === true && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
            </Button>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Potential return:</p>
              <p className="text-sm font-semibold text-green-600">
                {calculatePotentialReturn(true)} ALGO
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Button
              onClick={() => placeBet(false)}
              disabled={isClosed || isPending || isConfirming}
              className="w-full h-auto py-6 flex flex-col gap-2 bg-red-600 hover:bg-red-700 text-white"
            >
              <TrendingDown className="h-6 w-6" />
              <span className="font-bold">Bet: NO</span>
              {isPending && betChoice === false && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
            </Button>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Potential return:</p>
              <p className="text-sm font-semibold text-red-600">
                {calculatePotentialReturn(false)} ALGO
              </p>
            </div>
          </div>
        </div>

        {/* Status Messages */}
        {isClosed && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {isResolved ? 'This event has been resolved.' : 'This event has ended. No more bets accepted.'}
            </AlertDescription>
          </Alert>
        )}

        {isPending && (
          <Alert>
            <Loader2 className="h-4 w-4 animate-spin" />
            <AlertDescription>
              Waiting for wallet confirmation...
            </AlertDescription>
          </Alert>
        )}

        {isConfirming && (
          <Alert>
            <Loader2 className="h-4 w-4 animate-spin" />
            <AlertDescription>
              Transaction pending... Waiting for blockchain confirmation.
            </AlertDescription>
          </Alert>
        )}

        {isSuccess && (
          <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800 dark:text-green-200">
              Bet placed successfully! Transaction confirmed.
            </AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error.message}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
