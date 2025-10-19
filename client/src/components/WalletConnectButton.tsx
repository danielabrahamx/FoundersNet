import { useWallet } from '@txnlab/use-wallet-react';
import { Button } from '@/components/ui/button';
import { Wallet, Check, LogOut } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useState } from 'react';

export function WalletConnectButton() {
  const { wallets, activeWallet, activeAccount } = useWallet();
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnect = async (walletId: string) => {
    setIsConnecting(true);
    try {
      const wallet = wallets.find(w => w.id === walletId);
      if (wallet) {
        await wallet.connect();
        wallet.setActive();
      }
    } catch (error) {
      console.error('Failed to connect wallet:', error);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (activeWallet) {
      await activeWallet.disconnect();
    }
  };

  // If connected, show address and disconnect option
  if (activeAccount) {
    const shortAddress = `${activeAccount.address.slice(0, 6)}...${activeAccount.address.slice(-4)}`;
    
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="gap-2">
            <Wallet className="h-4 w-4" />
            {shortAddress}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Connected Wallet</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="font-mono text-xs">
            {activeAccount.address}
          </DropdownMenuItem>
          {activeWallet && (
            <DropdownMenuItem className="text-muted-foreground">
              via {activeWallet.metadata.name}
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleDisconnect} className="text-destructive">
            <LogOut className="mr-2 h-4 w-4" />
            Disconnect
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // If not connected, show connect options
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="default" className="gap-2" disabled={isConnecting}>
          <Wallet className="h-4 w-4" />
          {isConnecting ? 'Connecting...' : 'Connect Wallet'}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Choose Wallet</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {wallets.map((wallet) => (
          <DropdownMenuItem
            key={wallet.id}
            onClick={() => handleConnect(wallet.id)}
            className="cursor-pointer"
          >
            <div className="flex items-center gap-2">
              {wallet.metadata.icon && (
                <img 
                  src={wallet.metadata.icon} 
                  alt={wallet.metadata.name}
                  className="h-5 w-5"
                />
              )}
              <span>{wallet.metadata.name}</span>
              {wallet.isActive && <Check className="ml-auto h-4 w-4" />}
            </div>
          </DropdownMenuItem>
        ))}
        {wallets.length === 0 && (
          <DropdownMenuItem disabled>
            No wallets available
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
