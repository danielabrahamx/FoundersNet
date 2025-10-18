import { useState, useEffect } from 'react';
import { useResolveEvent, useWalletAddress } from '@/hooks/useAlgorandPredictionMarket';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Loader2, CheckCircle2, AlertCircle, TrendingUp, TrendingDown, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

// Admin address from environment
const ADMIN_ADDRESS = import.meta.env.VITE_ALGORAND_ADMIN_ADDRESS || '';

interface AdminResolveProps {
  eventId: number;
  eventName: string;
  eventEndTime: bigint;
  isResolved: boolean;
  totalYesBets: bigint;
  totalNoBets: bigint;
  totalYesAmount: bigint;
  totalNoAmount: bigint;
  className?: string;
}

export function AdminResolve({
  eventId,
  eventName,
  eventEndTime,
  isResolved,
  totalYesBets,
  totalNoBets,
  totalYesAmount,
  totalNoAmount,
  className
}: AdminResolveProps) {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [selectedOutcome, setSelectedOutcome] = useState<boolean | null>(null);
  const address = useWalletAddress();
  const { toast } = useToast();

  // Algorand hooks for contract interaction
  const { 
    resolveEvent,
    isPending, 
    isSuccess,
    error
  } = useResolveEvent();

  // Check if connected wallet is admin
  const isAdmin = address?.toLowerCase() === ADMIN_ADDRESS.toLowerCase();
  
  console.log('🔐 AdminResolve - Admin check:', {
    connectedAddress: address,
    adminAddress: ADMIN_ADDRESS,
    isAdmin,
    eventId
  });

  // Check if event has ended
  const now = Math.floor(Date.now() / 1000);
  const endTime = Number(eventEndTime);
  const hasEnded = now >= endTime;

  const handleResolveClick = (outcome: boolean) => {
    if (!isAdmin) {
      toast({
        title: "Access Denied",
        description: "Only the admin can resolve events.",
        variant: "destructive",
      });
      return;
    }

    if (!hasEnded) {
      toast({
        title: "Event Not Ended",
        description: "You can only resolve events after they have ended.",
        variant: "destructive",
      });
      return;
    }

    setSelectedOutcome(outcome);
    setShowConfirmDialog(true);
  };

  const confirmResolve = async () => {
    if (selectedOutcome === null || !address) return;

    try {
      console.log('🎯 Resolving event:', { eventId, outcome: selectedOutcome, senderAddress: address });
      await resolveEvent(eventId, selectedOutcome, address);

      setShowConfirmDialog(false);
      
      toast({
        title: "Event Resolved Successfully!",
        description: `Event "${eventName}" has been resolved as ${selectedOutcome ? 'YES' : 'NO'}.`,
      });
      
      setSelectedOutcome(null);
      
      // Reload page after short delay to refresh data
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (err) {
      console.error('Error resolving event:', err);
      toast({
        title: "Transaction Error",
        description: err instanceof Error ? err.message : "Failed to resolve event. Please try again.",
        variant: "destructive",
      });
      setShowConfirmDialog(false);
    }
  };

  // Calculate stats (amounts already in ALGO, not microALGO)
  const totalBets = Number(totalYesBets) + Number(totalNoBets);
  const totalPool = Number(totalYesAmount) + Number(totalNoAmount);

  return (
    <>
      <Card className={cn("w-full", className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Admin: Resolve Market
          </CardTitle>
          <CardDescription>{eventName}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Access Control Warning */}
          {!isAdmin && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                You are not authorized to resolve events. Only the admin wallet can perform this action.
              </AlertDescription>
            </Alert>
          )}

          {/* Already Resolved */}
          {isResolved && (
            <Alert className="border-blue-500 bg-blue-50 dark:bg-blue-950">
              <CheckCircle2 className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800 dark:text-blue-200">
                This event has already been resolved.
              </AlertDescription>
            </Alert>
          )}

          {/* Event Not Ended */}
          {!hasEnded && !isResolved && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                This event has not ended yet. Resolution will be available after the end time.
              </AlertDescription>
            </Alert>
          )}

          {/* Event Statistics */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
            <div className="space-y-3">
              <div>
                <p className="text-xs text-muted-foreground mb-1">YES Bets</p>
                <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                  {totalYesBets.toString()} bets
                </p>
                <p className="text-sm text-muted-foreground">
                  {Number(totalYesAmount).toFixed(2)} ALGO
                </p>
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-muted-foreground mb-1">NO Bets</p>
                <p className="text-lg font-semibold text-red-600 dark:text-red-400">
                  {totalNoBets.toString()} bets
                </p>
                <p className="text-sm text-muted-foreground">
                  {Number(totalNoAmount).toFixed(2)} ALGO
                </p>
              </div>
            </div>
          </div>

          <div className="p-4 bg-primary/5 rounded-lg">
            <p className="text-sm font-semibold">Total Pool</p>
            <p className="text-2xl font-bold">{totalPool.toFixed(2)} ALGO</p>
            <p className="text-xs text-muted-foreground mt-1">{totalBets} total bets</p>
          </div>

          {/* Resolution Buttons */}
          <div className="grid grid-cols-2 gap-4">
            <Button
              onClick={() => handleResolveClick(true)}
              disabled={!isAdmin || isResolved || !hasEnded || isPending}
              className="h-auto py-6 flex flex-col gap-2 bg-green-600 hover:bg-green-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPending ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                <TrendingUp className="h-6 w-6" />
              )}
              <span className="font-bold">YES</span>
              <span className="text-xs opacity-80">Event occurred</span>
            </Button>

            <Button
              onClick={() => handleResolveClick(false)}
              disabled={!isAdmin || isResolved || !hasEnded || isPending}
              className="h-auto py-6 flex flex-col gap-2 bg-red-600 hover:bg-red-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPending ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                <TrendingDown className="h-6 w-6" />
              )}
              <span className="font-bold">NO</span>
              <span className="text-xs opacity-80">Event did not occur</span>
            </Button>
          </div>

          {/* Status Messages */}
          {isPending && (
            <Alert>
              <Loader2 className="h-4 w-4 animate-spin" />
              <AlertDescription>
                Transaction processing... Please wait for blockchain confirmation.
              </AlertDescription>
            </Alert>
          )}

          {isSuccess && (
            <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800 dark:text-green-200">
                Event resolved successfully! Winners can now claim their rewards.
              </AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {error.message || 'Failed to resolve event. Please try again.'}
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

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Event Resolution</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>Are you sure you want to resolve this event as <strong className={selectedOutcome ? "text-green-600" : "text-red-600"}>{selectedOutcome ? 'YES' : 'NO'}</strong>?</p>
              <p className="text-sm">Event: <strong>{eventName}</strong></p>
              <p className="text-sm text-muted-foreground">This action cannot be undone. Winners will be able to claim their rewards after resolution.</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmResolve}
              className={cn(
                "text-white",
                selectedOutcome ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"
              )}
            >
              Confirm Resolution
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
