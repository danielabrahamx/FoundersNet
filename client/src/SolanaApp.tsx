import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SolanaWalletProvider } from "@/contexts/SolanaWalletContext";
import { DemoAccountProvider } from "@/contexts/DemoAccountContext";
import SolanaHeader from "@/components/SolanaHeader";
import HomePage from "@/pages/HomePage";
import MyBetsPage from "@/pages/MyBetsPage";
import AdminPage from "@/pages/AdminPage";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/">
        <HomePage />
      </Route>
      <Route path="/my-bets" component={MyBetsPage} />
      <Route path="/admin" component={AdminPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

export default function SolanaApp() {
  return (
    <QueryClientProvider client={queryClient}>
      <SolanaWalletProvider>
        <DemoAccountProvider>
          <TooltipProvider>
            <div className="min-h-screen bg-background">
              <SolanaHeader />
              <Router />
            </div>
            <Toaster />
          </TooltipProvider>
        </DemoAccountProvider>
      </SolanaWalletProvider>
    </QueryClientProvider>
  );
}
