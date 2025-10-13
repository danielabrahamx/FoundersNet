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

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/my-bets" component={MyBetsPage} />
      <Route path="/admin" component={AdminPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  //todo: remove mock functionality - replace with actual wallet connection
  const [walletAddress, setWalletAddress] = useState<string>();
  //todo: remove mock functionality - replace with actual admin check
  const isAdmin = walletAddress === "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb";

  const handleConnectWallet = () => {
    //todo: remove mock functionality - integrate MetaMask
    setWalletAddress("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb");
    console.log("Wallet connected (mock)");
  };

  const handleDisconnectWallet = () => {
    setWalletAddress(undefined);
    console.log("Wallet disconnected");
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
          />
          <Router />
        </div>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}
