import { Link, useLocation } from "wouter";
import { useEffect } from "react";
import { useWallet } from "@txnlab/use-wallet-react";
import ThemeToggle from "./ThemeToggle";
import LocalNetAccountSwitcher from "./LocalNetAccountSwitcher";
import { WalletConnectButton } from "./WalletConnectButton";
import { TrendingUp, Coins } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useAccountBalance, useWalletAddress } from "@/hooks/useAlgorandPredictionMarket";

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
        <span className="text-sm font-medium">{address.slice(0, 6)}...{address.slice(-4)}</span>
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
  const { activeAddress: walletAddress } = useWallet(); // Pera Wallet address (TestNet/MainNet)
  const localNetAddress = useWalletAddress(); // LocalNet address or Pera address
  const { toast } = useToast();

  // Use LocalNet address if on LocalNet, otherwise use Pera Wallet address
  const activeAddress = IS_LOCALNET ? localNetAddress : walletAddress;

  // Check if connected wallet is admin
  const isAdmin = activeAddress?.toLowerCase() === ADMIN_ADDRESS.toLowerCase();

  useEffect(() => {
    // Show connection status
    if (activeAddress) {
      toast({
        title: IS_LOCALNET ? "LocalNet Mode" : "Wallet Connected",
        description: `Connected: ${activeAddress.slice(0, 6)}...${activeAddress.slice(-4)}`,
      });
    }
  }, [activeAddress, toast]);

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
            
            {/* Multi-Wallet Connection */}
            {activeAddress ? (
              <div className="flex items-center gap-2">
                <WalletInfo address={activeAddress} isAdmin={isAdmin} />
                <WalletConnectButton />
              </div>
            ) : (
              <WalletConnectButton />
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
