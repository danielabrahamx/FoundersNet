import { Button } from "@/components/ui/button";
import { Wallet } from "lucide-react";

interface WalletButtonProps {
  address?: string;
  onConnect: () => void;
  onDisconnect: () => void;
}

export default function WalletButton({ address, onConnect, onDisconnect }: WalletButtonProps) {
  if (address) {
    return (
      <div className="flex items-center gap-2">
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-md bg-card border border-card-border">
          <div className="w-2 h-2 rounded-full bg-status-open" data-testid="indicator-connected" />
          <span className="font-mono text-sm" data-testid="text-wallet-address">
            {address.slice(0, 6)}...{address.slice(-4)}
          </span>
        </div>
        <Button 
          variant="outline" 
          size="sm"
          onClick={onDisconnect}
          data-testid="button-disconnect"
        >
          Disconnect
        </Button>
      </div>
    );
  }

  return (
    <Button onClick={onConnect} data-testid="button-connect-wallet">
      <Wallet className="w-4 h-4 mr-2" />
      Connect Wallet
    </Button>
  );
}
