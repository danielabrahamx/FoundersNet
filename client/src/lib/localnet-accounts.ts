/**
 * LocalNet Test Accounts
 * Pre-funded accounts from Algorand LocalNet for testing
 */

export interface LocalNetAccount {
  name: string;
  address: string;
  mnemonic: string;
  role: 'admin' | 'user';
}

// These are the standard LocalNet dispensers and test accounts
// They're pre-funded with ALGO automatically when LocalNet starts
export const LOCALNET_ACCOUNTS: LocalNetAccount[] = [
  {
    name: 'Admin Account',
    address: '3ZH2LWCKKRU5BCAIJIIOOGJUQYUZSYLTJP6TKDGPI4JIHN2QINRDWPBDNM',
    mnemonic: 'artwork drive liquid candy dumb effort eternal assume main silent act seed enroll eye mimic rail skin filter obey chunk sustain claim exhaust ability melt',
    role: 'admin',
  },
  {
    name: 'Alice (User 1)',
    address: 'FTEY5MBG3DADIXW53H7ZBPWAZLSHXSWLSPOV5AXDOZHM45S4T4JSJDOQLE',
    mnemonic: 'mule theme solution become dish donor hero hobby insane guide ribbon vendor fiber shift cream certain message team hello shoulder excess credit food ability elevator',
    role: 'user',
  },
  {
    name: 'Bob (User 2)',
    address: '3IUCKSO5IH2IPGSBL4ZZXH7FEGQDCI7254ASQIBFQDPK7I7CTWOC3IP6WU',
    mnemonic: 'gravity alarm add credit paper spray else six outside valid wild cross crush raven cave absent fragile figure net useful empower car corn abstract season',
    role: 'user',
  },
  {
    name: 'Charlie (User 3)',
    address: 'YF4DZ24IGBWZT6NXVKWAAESG25UZFMYCTFF5EZHHLVRYA2ADBD2MSJVESY',
    mnemonic: 'scrub scheme silk scan ahead divide grief surprise enhance claim naive first dish gown method wolf token shaft eager rabbit cute paddle jealous absorb cash',
    role: 'user',
  },
];

/**
 * Get currently active LocalNet account from localStorage
 * If not set, initializes to the first user account (Alice), NOT admin
 */
export function getActiveLocalNetAccount(): string {
  if (typeof window === 'undefined') return LOCALNET_ACCOUNTS[1].address; // Default to Alice (User 1)
  
  const stored = localStorage.getItem('localnet_active_account');
  
  // If nothing stored, initialize to first user account (Alice, not Admin)
  if (!stored) {
    const defaultAccount = LOCALNET_ACCOUNTS[1].address; // Alice (User 1)
    localStorage.setItem('localnet_active_account', defaultAccount);
    return defaultAccount;
  }
  
  return stored;
}

/**
 * Switch to a different LocalNet account
 */
export function switchLocalNetAccount(address: string): void {
  if (typeof window === 'undefined') return;
  
  localStorage.setItem('localnet_active_account', address);
  
  // Dispatch custom event so other components can react
  window.dispatchEvent(new CustomEvent('localnet_account_switched', {
    detail: { address }
  }));
}

/**
 * Get account info by address
 */
export function getAccountByAddress(address: string): LocalNetAccount | undefined {
  return LOCALNET_ACCOUNTS.find(acc => acc.address === address);
}
