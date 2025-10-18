import { useState, useEffect } from 'react';
import algosdk from 'algosdk';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Copy, RefreshCw, Wallet } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface LocalNetAccount {
  name: string;
  address: string;
  mnemonic: string;
  balance: number;
}

interface LocalNetAccountSelectorProps {
  onAccountSelect: (account: algosdk.Account) => void;
  selectedAddress?: string;
}

export default function LocalNetAccountSelector({
  onAccountSelect,
  selectedAddress,
}: LocalNetAccountSelectorProps) {
  const [accounts, setAccounts] = useState<LocalNetAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAccount, setSelectedAccount] = useState<LocalNetAccount | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    try {
      // Try to load pre-created accounts
      const response = await fetch('/localnet-accounts.json');
      if (response.ok) {
        const data = await response.json();
        setAccounts(data.accounts || []);
      } else {
        // Generate accounts on the fly
        generateAccounts();
      }
    } catch (error) {
      console.error('Failed to load accounts:', error);
      generateAccounts();
    } finally {
      setLoading(false);
    }
  };

  const generateAccounts = () => {
    // Generate 5 random accounts for LocalNet testing
    const generatedAccounts: LocalNetAccount[] = [];
    
    for (let i = 1; i <= 5; i++) {
      const account = algosdk.generateAccount();
      const mnemonic = algosdk.secretKeyToMnemonic(account.sk);
      
      generatedAccounts.push({
        name: `Test Account ${i}`,
        address: account.addr,
        mnemonic: mnemonic,
        balance: 0, // Not funded yet
      });
    }
    
    setAccounts(generatedAccounts);
  };

  const handleSelectAccount = (address: string) => {
    const account = accounts.find(acc => acc.address === address);
    if (account) {
      setSelectedAccount(account);
      
      // Convert mnemonic to account object
      const algoAccount = algosdk.mnemonicToSecretKey(account.mnemonic);
      onAccountSelect(algoAccount);
      
      toast({
        title: 'Account Selected',
        description: `Using ${account.name}`,
      });
    }
  };

  const copyAddress = () => {
    if (selectedAccount) {
      navigator.clipboard.writeText(selectedAccount.address);
      toast({
        title: 'Copied!',
        description: 'Address copied to clipboard',
      });
    }
  };

  const copyMnemonic = () => {
    if (selectedAccount) {
      navigator.clipboard.writeText(selectedAccount.mnemonic);
      toast({
        title: 'Copied!',
        description: 'Mnemonic copied to clipboard',
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center gap-2">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span>Loading accounts...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Alert>
        <Wallet className="h-4 w-4" />
        <AlertDescription>
          <strong>LocalNet Mode:</strong> Select a test account below. These accounts are for
          local development only and have no value outside LocalNet.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Select Test Account</CardTitle>
          <CardDescription>
            Choose an account to interact with the LocalNet blockchain
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Select
            value={selectedAccount?.address || selectedAddress}
            onValueChange={handleSelectAccount}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select an account..." />
            </SelectTrigger>
            <SelectContent>
              {accounts.map((account) => (
                <SelectItem key={account.address} value={account.address}>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{account.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {account.address.slice(0, 8)}...{account.address.slice(-8)}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {selectedAccount && (
            <div className="space-y-3 rounded-lg border p-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-sm font-medium">Address</label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={copyAddress}
                    className="h-6 px-2"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
                <code className="text-xs bg-muted p-2 rounded block break-all">
                  {selectedAccount.address}
                </code>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-sm font-medium">Mnemonic (Secret)</label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={copyMnemonic}
                    className="h-6 px-2"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
                <code className="text-xs bg-muted p-2 rounded block break-all">
                  {selectedAccount.mnemonic}
                </code>
              </div>

              <div className="text-sm text-muted-foreground">
                Balance: {selectedAccount.balance > 0 
                  ? `${selectedAccount.balance} ALGO` 
                  : 'Not funded (run: node scripts/localnet-accounts.js)'}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Alert variant="destructive">
        <AlertDescription className="text-xs">
          ⚠️ <strong>Security Warning:</strong> These mnemonics are displayed in plain text
          for LocalNet development convenience. Never use this approach on TestNet or MainNet!
        </AlertDescription>
      </Alert>
    </div>
  );
}
