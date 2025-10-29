/**
 * Account Selector Component
 * 
 * Allows switching between demo accounts (Admin, Alice, Bob, Charlie).
 * Compact, integrated into header.
 */

import { useDemoAccount, DEMO_ACCOUNTS } from '@/contexts/DemoAccountContext';
import { useEffect } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Coins, Shield } from 'lucide-react';

export default function AccountSelector() {
  const { currentAccount, switchAccount, accountBalance, refreshBalance } = useDemoAccount();

  // Refresh balance on mount and when account changes
  useEffect(() => {
    refreshBalance();
  }, [currentAccount.id]);

  return (
    <div className="hidden sm:flex items-center gap-2">
      {/* Account Dropdown */}
      <Select value={currentAccount.id} onValueChange={switchAccount}>
        <SelectTrigger className="w-[120px] h-9">
          <SelectValue placeholder="Account" />
        </SelectTrigger>
        <SelectContent>
          {DEMO_ACCOUNTS.map(account => (
            <SelectItem key={account.id} value={account.id}>
              <div className="flex items-center gap-2">
                {account.role === 'admin' && <Shield className="w-3 h-3" />}
                {account.name}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Admin Badge */}
      {currentAccount.role === 'admin' && (
        <Badge variant="default" className="bg-primary h-fit text-xs">
          <Shield className="w-2.5 h-2.5 mr-1" />
          Admin
        </Badge>
      )}

      {/* Balance Display */}
      <div className="flex items-center gap-1 text-xs font-mono text-muted-foreground">
        <Coins className="w-3 h-3" />
        <span>{accountBalance.toFixed(2)} SOL</span>
      </div>
    </div>
  );
}
