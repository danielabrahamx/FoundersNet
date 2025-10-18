/**
 * Example Event Detail Page
 * 
 * This page demonstrates how to integrate the PlaceBet and AdminResolve components
 * with Wagmi hooks for smart contract interaction on Polygon Amoy testnet.
 */

import { useParams } from 'wouter';
import { useAccount } from 'wagmi';
import { PlaceBet } from '@/components/PlaceBet';
import { AdminResolve } from '@/components/AdminResolve';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, AlertCircle } from 'lucide-react';
import { useEvent } from '@/hooks/useEvents';
import { Alert, AlertDescription } from '@/components/ui/alert';
import CountdownTimer from '@/components/CountdownTimer';
import EventStatusBadge from '@/components/EventStatusBadge';

// Get admin address from environment
const ADMIN_ADDRESS = import.meta.env.VITE_ALGORAND_ADMIN_ADDRESS || "";

export default function EventDetailPage() {
  const params = useParams();
  const eventId = params.id ? parseInt(params.id) : 0;
  const { address, isConnected } = useAccount();

  // Fetch event data from the smart contract
  const { data: event, isLoading, error } = useEvent(eventId);

  // Check if connected user is admin
  const isAdmin = address?.toLowerCase() === ADMIN_ADDRESS.toLowerCase();

  // Loading state
  if (isLoading) {
    return (
      <div className="container max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading event from blockchain...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !event) {
    return (
      <div className="container max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load event data. Please make sure you're connected to Algorand LocalNet with Pera Wallet.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Parse event data
  const eventData = event as any;
  const now = Math.floor(Date.now() / 1000);
  const endTime = Number(eventData.endTime);
  const hasEnded = now >= endTime;
  const isResolved = eventData.resolved;

  // Determine status
  let status: "OPEN" | "CLOSED" | "RESOLVED" = "OPEN";
  if (isResolved) status = "RESOLVED";
  else if (hasEnded) status = "CLOSED";

  return (
    <div className="container max-w-4xl mx-auto px-4 sm:px-6 py-8">
      {/* Event Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-4xl font-bold tracking-tight">{eventData.name}</h1>
          <EventStatusBadge status={status} />
        </div>
        
        <div className="flex items-center gap-4 text-muted-foreground">
          <div>
            <span className="text-sm">Event ID: </span>
            <span className="font-mono font-semibold">#{eventId}</span>
          </div>
          {!isResolved && (
            <div className="flex items-center gap-2">
              <span className="text-sm">Ends in:</span>
              <CountdownTimer endTime={endTime * 1000} />
            </div>
          )}
        </div>

        {isResolved && (
          <Alert className="mt-4 border-blue-500 bg-blue-50 dark:bg-blue-950">
            <AlertDescription className="text-blue-800 dark:text-blue-200">
              <strong>Outcome:</strong> {eventData.outcome ? 'YES' : 'NO'} - This event has been resolved.
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* Main Content */}
      <div className="grid gap-6">
        {/* Betting Pool Stats */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-3 gap-6 text-center">
              <div>
                <p className="text-sm text-muted-foreground mb-2">Total Pool</p>
                <p className="text-2xl font-bold">
                  {((parseFloat(eventData.totalYesAmount.toString()) + 
                     parseFloat(eventData.totalNoAmount.toString())) / 1e18).toFixed(4)} ALGO
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-2">YES Bets</p>
                <p className="text-2xl font-bold text-green-600">
                  {eventData.totalYesBets.toString()}
                </p>
                <p className="text-sm text-muted-foreground">
                  {(parseFloat(eventData.totalYesAmount.toString()) / 1e18).toFixed(4)} ALGO
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-2">NO Bets</p>
                <p className="text-2xl font-bold text-red-600">
                  {eventData.totalNoBets.toString()}
                </p>
                <p className="text-sm text-muted-foreground">
                  {(parseFloat(eventData.totalNoAmount.toString()) / 1e18).toFixed(4)} ALGO
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Connection Warning */}
        {!isConnected && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Please connect your wallet to place bets or resolve this event.
            </AlertDescription>
          </Alert>
        )}

        {/* Place Bet Component - Available to all connected users */}
        {isConnected && !isAdmin && (
          <PlaceBet
            eventId={eventId}
            eventName={eventData.name}
            eventEndTime={eventData.endTime}
            totalYesAmount={eventData.totalYesAmount}
            totalNoAmount={eventData.totalNoAmount}
            isResolved={isResolved}
          />
        )}

        {/* Admin Resolution Component - Only for admin */}
        {isConnected && isAdmin && (
          <div className="space-y-6">
            <Alert className="border-amber-500 bg-amber-50 dark:bg-amber-950">
              <AlertDescription className="text-amber-800 dark:text-amber-200">
                You are logged in as admin. You can resolve this event once it has ended.
              </AlertDescription>
            </Alert>
            
            <AdminResolve
              eventId={eventId}
              eventName={eventData.name}
              eventEndTime={eventData.endTime}
              isResolved={isResolved}
              totalYesBets={eventData.totalYesBets}
              totalNoBets={eventData.totalNoBets}
              totalYesAmount={eventData.totalYesAmount}
              totalNoAmount={eventData.totalNoAmount}
            />

            {/* Admin can also place bets if needed */}
            <PlaceBet
              eventId={eventId}
              eventName={eventData.name}
              eventEndTime={eventData.endTime}
              totalYesAmount={eventData.totalYesAmount}
              totalNoAmount={eventData.totalNoAmount}
              isResolved={isResolved}
            />
          </div>
        )}
      </div>
    </div>
  );
}
