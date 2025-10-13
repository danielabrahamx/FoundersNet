import { Link, useLocation } from "wouter";
import WalletButton from "./WalletButton";
import ThemeToggle from "./ThemeToggle";
import { TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface HeaderProps {
  walletAddress?: string;
  isAdmin?: boolean;
  onConnectWallet: () => void;
  onDisconnectWallet: () => void;
}

export default function Header({ walletAddress, isAdmin, onConnectWallet, onDisconnectWallet }: HeaderProps) {
  const [location] = useLocation();

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
              <span className="font-bold text-lg hidden sm:inline">Startup Markets</span>
            </Link>

            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => (
                <Link key={item.path} href={item.path}>
                  <a
                    className={cn(
                      "px-3 py-2 rounded-md text-sm font-medium transition-colors hover-elevate",
                      location === item.path
                        ? "bg-accent text-accent-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                    data-testid={`link-nav-${item.label.toLowerCase().replace(' ', '-')}`}
                  >
                    {item.label}
                  </a>
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <WalletButton
              address={walletAddress}
              onConnect={onConnectWallet}
              onDisconnect={onDisconnectWallet}
            />
          </div>
        </div>

        <nav className="md:hidden flex items-center gap-1 pb-3 overflow-x-auto">
          {navItems.map((item) => (
            <Link key={item.path} href={item.path}>
              <a
                className={cn(
                  "px-3 py-1.5 rounded-md text-sm font-medium transition-colors hover-elevate whitespace-nowrap",
                  location === item.path
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {item.label}
              </a>
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
