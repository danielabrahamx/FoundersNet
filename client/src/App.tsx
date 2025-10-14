import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useState } from "react";
import Header from "@/components/Header";
import HomePage from "@/pages/HomePage";
import MyBetsPage from "@/pages/MyBetsPage";
import AdminPage from "@/pages/AdminPage";
import NotFound from "@/pages/not-found";
import { ADMIN_WALLET, VOTER_WALLETS } from "@/lib/wallets";

function Router({ walletAddress }: { walletAddress?: string }) {
  return (
    <Switch>
      <Route path="/">
        <HomePage walletAddress={walletAddress} />
      </Route>
      <Route path="/my-bets" component={MyBetsPage} />
      <Route path="/admin" component={AdminPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  const [walletAddress, setWalletAddress] = useState<string>();
  const isAdmin = walletAddress === ADMIN_WALLET;

  const handleConnectWallet = () => {
    // Start with first voter wallet by default
    setWalletAddress(VOTER_WALLETS[0]);
    console.log("Wallet connected");
  };

  const handleDisconnectWallet = () => {
    setWalletAddress(undefined);
    console.log("Wallet disconnected");
  };

  const handleSwitchWallet = (wallet: string) => {
    setWalletAddress(wallet);
    console.log("Switched to wallet:", wallet);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen bg-background">
          <Header
            walletAddress={walletAddress}
            isAdmin={isAdmin}
            onConnectWallet={handleConnectWallet}
            onDisconnectWallet={handleDisconnectWallet}
            onSwitchWallet={handleSwitchWallet}
          />
          <Router walletAddress={walletAddress} />
        </div>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}
