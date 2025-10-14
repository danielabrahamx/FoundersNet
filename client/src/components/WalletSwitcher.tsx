import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, Wallet, Shield } from "lucide-react";
import { ADMIN_WALLET, VOTER_WALLETS } from "@/lib/wallets";

interface WalletSwitcherProps {
  currentWallet?: string;
  onSelectWallet: (wallet: string) => void;
}

export default function WalletSwitcher({ currentWallet, onSelectWallet }: WalletSwitcherProps) {
  if (!currentWallet) return null;

  const isAdmin = currentWallet === ADMIN_WALLET;
  const displayAddress = currentWallet.slice(0, 10) + "..." + currentWallet.slice(-4);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2" data-testid="button-wallet-switcher">
          {isAdmin ? (
            <Shield className="w-4 h-4" />
          ) : (
            <Wallet className="w-4 h-4" />
          )}
          <span className="font-mono text-xs">{displayAddress}</span>
          <ChevronDown className="w-3 h-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64 max-h-96 overflow-y-auto">
        <DropdownMenuLabel>Switch Wallet</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={() => onSelectWallet(ADMIN_WALLET)} data-testid="wallet-option-admin">
          <Shield className="w-4 h-4 mr-2" />
          <div className="flex-1">
            <div className="font-medium">Admin Wallet</div>
            <div className="font-mono text-xs text-muted-foreground">
              {ADMIN_WALLET.slice(0, 12)}...
            </div>
          </div>
        </DropdownMenuItem>

        <DropdownMenuSeparator />
        <DropdownMenuLabel>Voter Wallets (40)</DropdownMenuLabel>
        
        {VOTER_WALLETS.map((wallet, index) => (
          <DropdownMenuItem 
            key={wallet} 
            onClick={() => onSelectWallet(wallet)}
            data-testid={`wallet-option-${index + 1}`}
          >
            <Wallet className="w-4 h-4 mr-2" />
            <div className="flex-1">
              <div className="font-medium">Voter #{index + 1}</div>
              <div className="font-mono text-xs text-muted-foreground">
                {wallet.slice(0, 12)}...
              </div>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
