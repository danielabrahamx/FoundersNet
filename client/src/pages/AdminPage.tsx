import AdminEventForm from "@/components/AdminEventForm";
import AdminEventsTable from "@/components/AdminEventsTable";
import AdminWalletTracker from "@/components/AdminWalletTracker";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useWalletAddress, useProgramInitialized, useInitializeProgram } from "@/hooks/useSolanaPredictionMarket";
import { useResolveEvent } from "@/hooks/useSolanaPredictionMarket";
import { useAllEvents } from "@/hooks/useEvents";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Loader2, CheckCircle2 } from "lucide-react";
import { useMemo } from "react";

// Helper to format lamports to SOL
const formatSol = (lamports: bigint): string => {
  return (Number(lamports) / 1_000_000_000).toFixed(4);
};

// Get admin address from environment or config
const ADMIN_ADDRESS = import.meta.env.VITE_SOLANA_ADMIN_ADDRESS || '';

type EventStatus = "OPEN" | "CLOSED" | "RESOLVED";

interface AdminEvent {
  id: number;
  name: string;
  emoji: string;
  status: EventStatus;
  yesBets: number;
  noBets: number;
  endTime: number; // Unix timestamp in seconds
  outcome?: "YES" | "NO";
  totalYesAmount: bigint;
  totalNoAmount: bigint;
}

export default function AdminPage() {
  const address = useWalletAddress();
  const { execute: resolveEvent, isLoading: isResolvePending } = useResolveEvent();
  const { execute: initializeProgram, isLoading: isInitializePending } = useInitializeProgram();
  const { isInitialized, isLoading: isCheckingInit, refetch: recheckInit } = useProgramInitialized();
  const { toast } = useToast();
  const { data: contractEvents, isLoading, error } = useAllEvents();

  // Check if connected wallet is admin
  const isAdmin = address?.toLowerCase() === ADMIN_ADDRESS.toLowerCase();

  // Transform contract events to admin events format
  const adminEvents = useMemo(() => {
    if (!contractEvents) return [];
    
    return (contractEvents as any[]).map((event: any) => {
      const endTime = Number(event.endTime); // Unix timestamp in seconds
      const now = Math.floor(Date.now() / 1000); // Current time in seconds
      let status: EventStatus = "OPEN";
      
      if (event.resolved) {
        status = "RESOLVED";
      } else if (now >= endTime) {
        status = "CLOSED";
      }
      
      // API returns 'eventId' not 'id'
      const eventId = event.eventId || event.id;
      console.log('📊 Transforming event:', { eventId, rawEvent: event });
      
      return {
        id: Number(eventId),
        name: event.name,
        emoji: "🚀", // Default emoji, could be enhanced to extract from name
        status,
        yesBets: Number(event.totalYesBets),
        noBets: Number(event.totalNoBets),
        endTime,
        outcome: event.resolved ? (event.outcome ? "YES" : "NO") as "YES" | "NO" : undefined,
        totalYesAmount: event.totalYesAmount,
        totalNoAmount: event.totalNoAmount,
      };
    });
  }, [contractEvents]);

  const stats = useMemo(() => {
    const totalEvents = adminEvents.length;
    const totalBets = adminEvents.reduce((acc, e) => acc + e.yesBets + e.noBets, 0);
    const totalPool = adminEvents.reduce((acc, e) => {
      const yes = Number(formatSol(e.totalYesAmount));
      const no = Number(formatSol(e.totalNoAmount));
      return acc + yes + no;
    }, 0);
    const activeEvents = adminEvents.filter(e => e.status === "OPEN").length;
    
    return { totalEvents, totalBets, totalPool: Math.round(totalPool), activeEvents };
  }, [adminEvents]);

  const handleResolve = async (eventId: number, outcome: "YES" | "NO") => {
    console.log('🎯 AdminPage.handleResolve called:', {
      eventId,
      outcome,
      isAdmin,
      address,
      adminAddress: ADMIN_ADDRESS
    });
    
    if (!isAdmin) {
      console.log('❌ Not admin!');
      toast({
        title: "Access Denied",
        description: "Only the admin can resolve events.",
        variant: "destructive",
      });
      return;
    }

    try {
      if (!address) {
        console.log('❌ No address!');
        toast({
          title: "Wallet Not Connected",
          description: "Please connect your wallet to resolve events.",
          variant: "destructive",
        });
        return;
      }

      console.log('📞 Calling resolveEvent hook...');
      await resolveEvent(eventId, outcome === "YES", address);
      console.log('✅ resolveEvent completed!');
      
      toast({
        title: "Event Resolved!",
        description: `Event ${eventId} has been resolved as ${outcome}.`,
      });
      
      // Reload page after short delay to refresh data
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      console.error('❌ Error resolving event:', error);
      toast({
        title: "Resolution Failed",
        description: error instanceof Error ? error.message : "Failed to resolve event. Please try again.",
        variant: "destructive",
      });
      throw error; // Re-throw so AdminEventsTable knows it failed
    }
  };

  const handleInitializeProgram = async () => {
    if (!address) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet first.",
        variant: "destructive",
      });
      return;
    }

    try {
      await initializeProgram(ADMIN_ADDRESS);
      // Recheck initialization status after a short delay
      setTimeout(() => recheckInit(), 1000);
    } catch (error) {
      console.error('Error initializing program:', error);
    }
  };

  // Show loading state while checking initialization
  if (isCheckingInit) {
    return (
      <div className="container mx-auto py-8 space-y-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-lg">Checking program status...</span>
        </div>
      </div>
    );
  }

  // Show initialization prompt if program not initialized
  if (isInitialized === false) {
    return (
      <div className="container mx-auto py-8 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        </div>

        <Alert variant="default" className="border-yellow-500 bg-yellow-500/10">
          <AlertCircle className="h-4 w-4 text-yellow-500" />
          <AlertDescription className="text-yellow-500">
            <div className="space-y-4">
              <div>
                <strong>Program Not Initialized</strong>
                <p className="mt-1">
                  The prediction market smart contract has not been initialized yet. 
                  This is a one-time setup that must be completed before creating events or placing bets.
                </p>
              </div>
              
              {!address && (
                <p className="text-sm">
                  Please connect your wallet to initialize the program.
                </p>
              )}
              
              {address && !isAdmin && (
                <p className="text-sm">
                  Only the admin wallet can initialize the program.
                  <br />
                  Expected: {ADMIN_ADDRESS}
                  <br />
                  Connected: {address}
                </p>
              )}
              
              {address && isAdmin && (
                <div>
                  <p className="text-sm mb-3">
                    Click the button below to initialize the program with your wallet as admin.
                  </p>
                  <Button 
                    onClick={handleInitializeProgram}
                    disabled={isInitializePending}
                    className="bg-yellow-600 hover:bg-yellow-700"
                  >
                    {isInitializePending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Initializing...
                      </>
                    ) : (
                      'Initialize Program'
                    )}
                  </Button>
                </div>
              )}
            </div>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Show warning if not admin
  if (!address) {
    return (
      <div className="container max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Please connect your wallet to access the admin dashboard.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="container max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Access denied. Only the admin wallet ({ADMIN_ADDRESS.slice(0, 6)}...{ADMIN_ADDRESS.slice(-4)}) can access this page.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="container max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <span className="ml-3 text-muted-foreground">Loading events from blockchain...</span>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="container max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load events from contract. Please check your connection.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Manage events and monitor betting activity
          </p>
        </div>
        {isInitialized && (
          <div className="flex items-center text-green-500">
            <CheckCircle2 className="h-5 w-5 mr-2" />
            <span className="text-sm font-medium">Program Active</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card className="p-4">
          <div className="text-2xl font-bold tabular-nums" data-testid="text-total-events">{stats.totalEvents}</div>
          <div className="text-sm text-muted-foreground">Total Events</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold tabular-nums" data-testid="text-active-events">{stats.activeEvents}</div>
          <div className="text-sm text-muted-foreground">Active Events</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold tabular-nums" data-testid="text-total-bets">{stats.totalBets}</div>
          <div className="text-sm text-muted-foreground">Total Bets</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold tabular-nums font-mono" data-testid="text-total-pool">{stats.totalPool}</div>
          <div className="text-sm text-muted-foreground">ALGO Pooled</div>
        </Card>
      </div>

      <Tabs defaultValue="events" className="space-y-6">
        <TabsList>
          <TabsTrigger value="events" data-testid="tab-manage-events">Manage Events</TabsTrigger>
          <TabsTrigger value="wallets" data-testid="tab-wallet-tracker">Wallet Tracker</TabsTrigger>
          <TabsTrigger value="create" data-testid="tab-create-event">Create Event</TabsTrigger>
        </TabsList>

        <TabsContent value="events" className="space-y-4">
          <AdminEventsTable
            events={adminEvents}
            onResolve={handleResolve}
          />
        </TabsContent>

        <TabsContent value="wallets">
          <AdminWalletTracker events={adminEvents} />
        </TabsContent>

        <TabsContent value="create">
          <AdminEventForm />
        </TabsContent>
      </Tabs>
    </div>
  );
}
