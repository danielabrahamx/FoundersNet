import { Link, useLocation } from "wouter";
import { useState, useEffect } from "react";
import ThemeToggle from "./ThemeToggle";
import LocalNetAccountSwitcher from "./LocalNetAccountSwitcher";
import { TrendingUp, Wallet, LogOut, Coins } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  connectWallet,
  disconnectWallet,
  getConnectedAccounts,
  formatAddress,
  getPeraWallet,
  resetPeraWallet,
} from "@/lib/algorand";
import { useToast } from "@/hooks/use-toast";
import { useAccountBalance } from "@/hooks/useAlgorandPredictionMarket";

// Admin address should be loaded from environment
const ADMIN_ADDRESS = import.meta.env.VITE_ALGORAND_ADMIN_ADDRESS || "";
const NETWORK = import.meta.env.VITE_ALGORAND_NETWORK || "localnet";
const IS_LOCALNET = NETWORK.toLowerCase() === "localnet";

// Wallet info component with balance
function WalletInfo({ address, isAdmin }: { address: string; isAdmin: boolean }) {
  const { balance } = useAccountBalance(address);
  
  return (
    <div className="hidden sm:flex items-center gap-3 px-3 py-2 rounded-md bg-accent">
      <div className="flex items-center gap-2">
        <Wallet className="w-4 h-4" />
        <span className="text-sm font-medium">{formatAddress(address)}</span>
        {isAdmin && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-primary text-primary-foreground">
            Admin
          </span>
        )}
      </div>
      {balance !== null && (
        <div className="flex items-center gap-1 text-xs font-mono text-muted-foreground border-l pl-3">
          <Coins className="w-3 h-3" />
          <span>{balance.toFixed(2)} ALGO</span>
        </div>
      )}
    </div>
  );
}

export default function Header() {
  const [location] = useLocation();
  const [address, setAddress] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const { toast } = useToast();

  // Check if connected wallet is admin
  const isAdmin = address?.toLowerCase() === ADMIN_ADDRESS.toLowerCase();

  useEffect(() => {
    // LocalNet auto-connect: Use the active LocalNet account from localStorage
    if (IS_LOCALNET) {
      import('@/lib/localnet-accounts').then(({ getActiveLocalNetAccount, getAccountByAddress }) => {
        const activeAddress = getActiveLocalNetAccount();
        const activeAccount = getAccountByAddress(activeAddress);
        setAddress(activeAddress);
        
        // Show toast with active account name
        toast({
          title: "LocalNet Mode",
          description: `Connected as ${activeAccount?.name || 'LocalNet account'}`,
        });
      });

      // Listen for LocalNet account switches
      const handleAccountSwitch = ((e: CustomEvent) => {
        setAddress(e.detail.address);
      }) as EventListener;
      
      window.addEventListener('localnet_account_switched', handleAccountSwitch);
      
      return () => {
        window.removeEventListener('localnet_account_switched', handleAccountSwitch);
      };
    }

    // Check if wallet is already connected (TestNet/MainNet)
    const accounts = getConnectedAccounts();
    if (accounts.length > 0) {
      setAddress(accounts[0]);
    } else {
      // If no accounts but there's stale session data, clear it
      const peraWalletKeys = Object.keys(localStorage).filter(key => 
        key.includes('pera') || key.includes('walletconnect')
      );
      if (peraWalletKeys.length > 0) {
        console.log('Clearing stale wallet session data...');
        peraWalletKeys.forEach(key => localStorage.removeItem(key));
      }
    }

    // Listen for wallet connection changes
    const wallet = getPeraWallet();
    
    const handleConnect = (accounts: string[]) => {
      if (accounts.length > 0) {
        setAddress(accounts[0]);
        toast({
          title: "Wallet Connected",
          description: `Connected to ${formatAddress(accounts[0])}`,
        });
      }
    };

    const handleDisconnect = () => {
      setAddress(null);
      toast({
        title: "Wallet Disconnected",
        description: "Your wallet has been disconnected",
      });
    };

    wallet.connector?.on('connect', handleConnect);
    wallet.connector?.on('disconnect', handleDisconnect);

    return () => {
      wallet.connector?.off('connect', handleConnect);
      wallet.connector?.off('disconnect', handleDisconnect);
    };
  }, [toast]);

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      const accounts = await connectWallet();
      if (accounts.length > 0) {
        setAddress(accounts[0]);
        toast({
          title: "Wallet Connected",
          description: `Connected to ${accounts[0].slice(0, 8)}...${accounts[0].slice(-6)}`,
        });
      }
    } catch (error: any) {
      console.error('Failed to connect wallet:', error);
      
      // Handle specific error messages
      let errorMessage = "Failed to connect to Pera Wallet. Please try again.";
      if (error?.message?.includes('Session currently connected')) {
        errorMessage = "Wallet session error. Refreshing the page should fix this.";
      }
      
      toast({
        title: "Connection Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnectWallet();
      setAddress(null);
    } catch (error) {
      console.error('Failed to disconnect wallet:', error);
    }
  };

  const navItems = [
    { path: "/", label: "Home" },
    { path: "/my-bets", label: "My Bets" },
    ...(isAdmin ? [{ path: "/admin", label: "Admin" }] : []),
  ];

  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex h-16 items-center justify-between gap-4">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2 hover-elevate px-2 py-1 rounded-md" data-testid="link-home">
              <TrendingUp className="w-6 h-6 text-primary" />
              <span className="font-bold text-lg hidden sm:inline">FoundersNet</span>
            </Link>

            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => (
                <Link key={item.path} href={item.path}>
                  <span
                    className={cn(
                      "px-3 py-2 rounded-md text-sm font-medium transition-colors hover-elevate cursor-pointer",
                      location === item.path
                        ? "bg-accent text-accent-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                    data-testid={`link-nav-${item.label.toLowerCase().replace(' ', '-')}`}
                  >
                    {item.label}
                  </span>
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            
            {/* LocalNet Mode Indicator and Account Switcher */}
            {IS_LOCALNET && (
              <>
                <div className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-md bg-yellow-500/20 border border-yellow-500/30">
                  <span className="text-xs font-medium text-yellow-600 dark:text-yellow-400">
                    LocalNet
                  </span>
                </div>
                <LocalNetAccountSwitcher />
              </>
            )}
            
            {/* Algorand Wallet Connection */}
            {address ? (
              <div className="flex items-center gap-2">
                <WalletInfo address={address} isAdmin={isAdmin} />
                
                {!IS_LOCALNET && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDisconnect}
                    className="gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="hidden sm:inline">Disconnect</span>
                  </Button>
                )}
              </div>
            ) : (
              !IS_LOCALNET && (
                <Button
                  onClick={handleConnect}
                  disabled={isConnecting}
                  className="gap-2"
                  size="sm"
                >
                  <Wallet className="w-4 h-4" />
                  <span>{isConnecting ? "Connecting..." : "Connect Wallet"}</span>
                </Button>
              )
            )}
          </div>
        </div>

        <nav className="md:hidden flex items-center gap-1 pb-3 overflow-x-auto">
          {navItems.map((item) => (
            <Link key={item.path} href={item.path}>
              <span
                className={cn(
                  "px-3 py-1.5 rounded-md text-sm font-medium transition-colors hover-elevate whitespace-nowrap cursor-pointer",
                  location === item.path
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {item.label}
              </span>
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
