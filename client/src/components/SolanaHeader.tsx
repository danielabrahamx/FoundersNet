/**
 * Solana Header Component
 * 
 * Replaces AlgorandHeader with Solana wallet integration.
 * Features:
 * - Solana wallet connection (Phantom, Solflare)
 * - SOL balance display
 * - Network indicator (devnet/testnet/mainnet-beta/localnet)
 * - Admin detection
 * - Responsive navigation
 */

import { Link, useLocation } from "wouter";
import { useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import ThemeToggle from "./ThemeToggle";
import AccountSelector from "./AccountSelector";
import { TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useDemoAccount } from "@/contexts/DemoAccountContext";

// Admin address from environment
const ADMIN_ADDRESS = import.meta.env.VITE_SOLANA_ADMIN_ADDRESS || "";
const NETWORK = import.meta.env.VITE_SOLANA_NETWORK || "devnet";
const DEMO_MODE = (import.meta as any).env?.VITE_DEMO_MODE === 'true';

// Network indicator component
function NetworkIndicator({ network }: { network: string }) {
  const getNetworkColor = () => {
    switch (network.toLowerCase()) {
      case 'mainnet-beta':
        return 'bg-green-500/20 border-green-500/30 text-green-600 dark:text-green-400';
      case 'testnet':
        return 'bg-blue-500/20 border-blue-500/30 text-blue-600 dark:text-blue-400';
      case 'devnet':
        return 'bg-purple-500/20 border-purple-500/30 text-purple-600 dark:text-purple-400';
      case 'localnet':
        return 'bg-yellow-500/20 border-yellow-500/30 text-yellow-600 dark:text-yellow-400';
      default:
        return 'bg-gray-500/20 border-gray-500/30 text-gray-600 dark:text-gray-400';
    }
  };

  const displayName = network === 'mainnet-beta' ? 'Mainnet' : network.charAt(0).toUpperCase() + network.slice(1);

  return (
    <div data-testid="network-indicator" className={cn(
      "hidden sm:flex items-center gap-2 px-3 py-2 rounded-md border",
      getNetworkColor()
    )}>
      <span className="text-xs font-medium">
        {displayName}
      </span>
    </div>
  );
}

export default function SolanaHeader() {
  const [location] = useLocation();
  const { publicKey, connected } = useWallet();
  const { currentAccount, isAdmin } = useDemoAccount();
  const { toast } = useToast();

  const activeAddress = publicKey?.toBase58() || null;
  const isDemoAdmin = currentAccount.role === 'admin';

  useEffect(() => {
    if (DEMO_MODE) return; // In demo mode, wallet is optional; skip toast
    // Show connection status
    if (connected && activeAddress) {
      toast({
        title: "Wallet Connected",
        description: `Connected: ${activeAddress.slice(0, 6)}...${activeAddress.slice(-4)}`,
      });
    }
  }, [connected, activeAddress, toast]);

  const navItems = [
    { path: "/", label: "Home" },
    { path: "/my-bets", label: "My Bets" },
    ...(isDemoAdmin ? [{ path: "/admin", label: "Admin" }] : []),
  ];

  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container max-w-7xl mx-auto px-4 sm:px-6">
        {/* Top Row: Logo, Nav, and Controls */}
        <div className="flex h-16 items-center justify-between gap-4">
          <div className="flex items-center gap-8 flex-1">
            <Link href="/" className="flex items-center gap-2 hover-elevate px-2 py-1 rounded-md" data-testid="link-home">
              <TrendingUp className="w-6 h-6 text-primary" />
              <span className="font-bold text-lg hidden sm:inline">FoundersNet</span>
            </Link>

            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => (
                <Link key={item.path} href={item.path} data-testid={`link-nav-${item.label.toLowerCase().replace(' ', '-')}`}>
                  <span
                    className={cn(
                      "px-3 py-2 rounded-md text-sm font-medium transition-colors hover-elevate cursor-pointer",
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

          {/* Right Controls: Theme, Network, Account, Wallet */}
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <NetworkIndicator network={NETWORK} />
            <AccountSelector />
            
            {!DEMO_MODE && <WalletMultiButton />}
          </div>
        </div>

        {/* Mobile Navigation */}
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
