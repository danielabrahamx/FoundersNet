import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { WalletProvider } from "@/contexts/WalletProvider";
import { useWallet } from "@txnlab/use-wallet-react";
import AlgorandHeader from "@/components/AlgorandHeader";
import HomePage from "@/pages/HomePage";
import MyBetsPage from "@/pages/MyBetsPage";
import AdminPage from "@/pages/AdminPage";
import NotFound from "@/pages/not-found";

function Router() {
  const { activeAddress } = useWallet();
  
  return (
    <Switch>
      <Route path="/">
        <HomePage walletAddress={activeAddress ?? undefined} />
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
      <WalletProvider>
        <TooltipProvider>
          <div className="min-h-screen bg-background">
            <AlgorandHeader />
            <Router />
          </div>
          <Toaster />
        </TooltipProvider>
      </WalletProvider>
    </QueryClientProvider>
  );
}
