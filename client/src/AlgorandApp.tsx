import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import AlgorandHeader from "@/components/AlgorandHeader";
import HomePage from "@/pages/HomePage";
import MyBetsPage from "@/pages/MyBetsPage";
import AdminPage from "@/pages/AdminPage";
import NotFound from "@/pages/not-found";
import { useWalletAddress } from "@/hooks/useAlgorandPredictionMarket";

function Router() {
  const address = useWalletAddress();
  
  return (
    <Switch>
      <Route path="/">
        <HomePage walletAddress={address || undefined} />
      </Route>
      <Route path="/my-bets" component={MyBetsPage} />
      <Route path="/admin" component={AdminPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen bg-background">
          <AlgorandHeader />
          <Router />
        </div>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}
