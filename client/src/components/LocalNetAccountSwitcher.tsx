/**
 * LocalNetAccountSwitcher Component
 * Allows switching between test accounts on LocalNet for testing betting scenarios
 */

import { useState } from 'react';
import { Check, Users, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  LOCALNET_ACCOUNTS,
  getActiveLocalNetAccount,
  switchLocalNetAccount,
  getAccountByAddress,
} from '@/lib/localnet-accounts';
import { formatAddress } from '@/lib/algorand';
import { cn } from '@/lib/utils';
import { useAccountBalance } from '@/hooks/useAlgorandPredictionMarket';

function AccountBalance({ address }: { address: string }) {
  const { balance, isLoading } = useAccountBalance(address);
  
  if (isLoading) return <span className="text-xs text-muted-foreground">Loading...</span>;
  if (balance === null) return null;
  
  return (
    <div className="flex items-center gap-1 text-xs font-mono text-muted-foreground">
      <Wallet className="w-3 h-3" />
      <span>{balance.toFixed(2)} ALGO</span>
    </div>
  );
}

export default function LocalNetAccountSwitcher() {
  const [activeAddress, setActiveAddress] = useState(() => getActiveLocalNetAccount());
  const activeAccount = getAccountByAddress(activeAddress);

  const handleSwitch = (address: string) => {
    console.log('🔄 Switching LocalNet account from', activeAddress, 'to', address);
    switchLocalNetAccount(address);
    setActiveAddress(address);
    
    // Reload the page to update all components with new account
    window.location.reload();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="gap-2 border-yellow-500/30 bg-yellow-500/10 hover:bg-yellow-500/20"
        >
          <Users className="w-4 h-4" />
          <span className="hidden sm:inline">
            {activeAccount?.name || 'Switch Account'}
          </span>
          <span className="sm:hidden">{formatAddress(activeAddress)}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuLabel>LocalNet Test Accounts</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {LOCALNET_ACCOUNTS.map((account) => (
          <DropdownMenuItem
            key={account.address}
            onClick={() => handleSwitch(account.address)}
            className="flex items-start gap-3 cursor-pointer"
          >
            <div className="flex h-full items-center pt-1">
              {activeAddress === account.address ? (
                <Check className="w-4 h-4 text-primary" />
              ) : (
                <div className="w-4" />
              )}
            </div>
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-medium">{account.name}</span>
                {account.role === 'admin' && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-primary text-primary-foreground">
                    Admin
                  </span>
                )}
              </div>
              <div className="text-xs text-muted-foreground font-mono">
                {formatAddress(account.address)}
              </div>
              <AccountBalance address={account.address} />
              {activeAddress === account.address && (
                <div className="text-xs text-primary">
                  ✓ Currently active
                </div>
              )}
            </div>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <div className="px-2 py-1.5 text-xs text-muted-foreground">
          Switch accounts to simulate different users placing bets
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
