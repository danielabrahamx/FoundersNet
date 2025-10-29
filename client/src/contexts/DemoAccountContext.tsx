/**
 * Demo Account Context
 * 
 * Manages demo account selection for the mock Solana prediction market.
 * Allows switching between Admin, Alice, Bob, and Charlie for testing.
 */

import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface DemoAccount {
  id: string;
  name: string;
  address: string;
  role: 'admin' | 'bettor';
  balanceSOL: number;
}

export const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    id: 'admin',
    name: 'Admin',
    address: '3Nv4rUUkigbtqYJomNvRSKiBRLUMPaxdqWdvFU2777uT',
    role: 'admin',
    balanceSOL: 100,
  },
  {
    id: 'alice',
    name: 'Alice',
    address: 'HJo4gHiC3pMShSM5HYTwynb31FXMe2ocTVzUDX9kpHv7',
    role: 'bettor',
    balanceSOL: 100,
  },
  {
    id: 'bob',
    name: 'Bob',
    address: 'DfzBqu6oYMng4qqR9CjJwQmMFXyTdhzVyFNsYrvLEr5b',
    role: 'bettor',
    balanceSOL: 100,
  },
  {
    id: 'charlie',
    name: 'Charlie',
    address: 'FBEqV7ytYEfrW8FQdpfNGLVD5DGEZVzm2maq1A5aDrdU',
    role: 'bettor',
    balanceSOL: 100,
  },
];

export interface DemoAccountContextValue {
  currentAccount: DemoAccount;
  accounts: DemoAccount[];
  switchAccount: (accountId: string) => void;
  isAdmin: boolean;
  accountBalance: number;
  updateBalance: (newBalance: number) => void;
  refreshBalance: () => Promise<void>;
}

const DemoAccountContext = createContext<DemoAccountContextValue | undefined>(undefined);

export function DemoAccountProvider({ children }: { children: ReactNode }) {
  // Initialize from localStorage so selection persists across reloads
  const initialAccountId = (() => {
    if (typeof window === 'undefined') return 'admin';
    try {
      return localStorage.getItem('foundersnet:demoAccount') || 'admin';
    } catch {
      return 'admin';
    }
  })();

  const [currentAccountId, setCurrentAccountId] = useState(initialAccountId);
  const [accountBalances, setAccountBalances] = useState<Record<string, number>>(
    DEMO_ACCOUNTS.reduce((acc, account) => ({
      ...acc,
      [account.id]: account.balanceSOL,
    }), {})
  );

  const currentAccount = DEMO_ACCOUNTS.find(a => a.id === currentAccountId) || DEMO_ACCOUNTS[0];
  const isAdmin = currentAccount.role === 'admin';
  const accountBalance = accountBalances[currentAccountId] || 100;

  const switchAccount = (accountId: string) => {
    const account = DEMO_ACCOUNTS.find(a => a.id === accountId);
    if (account) {
      setCurrentAccountId(accountId);
      try {
        if (typeof window !== 'undefined') {
          localStorage.setItem('foundersnet:demoAccount', accountId);
        }
      } catch {}
      // Fetch balance for newly selected account
      refreshBalance(accountId);
    }
  };

  const updateBalance = (newBalance: number) => {
    setAccountBalances(prev => ({
      ...prev,
      [currentAccountId]: Math.max(0, newBalance),
    }));
  };

  const refreshBalance = async (accountId?: string) => {
    const targetId = accountId || currentAccountId;
    const account = DEMO_ACCOUNTS.find(a => a.id === targetId);
    if (!account) return;

    try {
      const resp = await fetch(`/api/accounts/${account.address}`);
      if (resp.ok) {
        const data = await resp.json();
        setAccountBalances(prev => ({
          ...prev,
          [targetId]: data.balanceSOL || account.balanceSOL,
        }));
      }
    } catch (err) {
      console.error('Failed to refresh balance:', err);
    }
  };

  const value: DemoAccountContextValue = {
    currentAccount,
    accounts: DEMO_ACCOUNTS,
    switchAccount,
    isAdmin,
    accountBalance,
    updateBalance,
    refreshBalance,
  };

  return (
    <DemoAccountContext.Provider value={value}>
      {children}
    </DemoAccountContext.Provider>
  );
}

export function useDemoAccount() {
  const context = useContext(DemoAccountContext);
  if (!context) {
    throw new Error('useDemoAccount must be used within DemoAccountProvider');
  }
  return context;
}
