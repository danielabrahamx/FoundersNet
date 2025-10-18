/**
 * Algorand Prediction Market Hooks
 * 
 * React hooks for interacting with the Algorand PredictionMarket smart contract.
 * Replaces wagmi hooks with algosdk-based implementations.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  algosdk,
  createAlgodClient,
  PREDICTION_MARKET_APP_ID,
  getSuggestedParams,
  signAndSendTransaction,
  signAndSendTransactionGroup,
  waitForConfirmation,
  readGlobalState,
  readBox,
  algoToMicroAlgo,
  getPeraWallet,
} from '@/lib/algorand';

// ABI for the PredictionMarket contract
// This should match the ARC4 ABI from the compiled smart contract
const PREDICTION_MARKET_ABI = {
  name: "PredictionMarket",
  methods: [
    {
      name: "create_event",
      args: [
        { type: "string", name: "name" },
        { type: "uint64", name: "end_time" }
      ],
      returns: { type: "uint64" }
    },
    {
      name: "place_bet",
      args: [
        { type: "uint64", name: "event_id" },
        { type: "bool", name: "outcome" },
        { type: "pay", name: "payment" }
      ],
      returns: { type: "void" }
    },
    {
      name: "resolve_event",
      args: [
        { type: "uint64", name: "event_id" },
        { type: "bool", name: "outcome" }
      ],
      returns: { type: "void" }
    },
    {
      name: "claim_winnings",
      args: [
        { type: "uint64", name: "bet_id" }
      ],
      returns: { type: "void" }
    },
    {
      name: "get_user_bets",
      args: [
        { type: "address", name: "user" }
      ],
      returns: { type: "(uint64,uint64,address,bool,uint64,bool)[]" },
      readonly: true
    }
  ]
};

// Event structure matching the smart contract
export interface Event {
  id: bigint;
  name: string;
  endTime: bigint;
  resolved: boolean;
  outcome: boolean;
  totalYesBets: bigint;
  totalNoBets: bigint;
  totalYesAmount: bigint;
  totalNoAmount: bigint;
}

// Bet structure matching the smart contract
export interface Bet {
  betId: bigint;
  eventId: bigint;
  bettor: string;
  outcome: boolean;
  amount: bigint;
  claimed: boolean;
}

/**
 * Hook to get current connected wallet address
 * Supports both Pera Wallet (TestNet/MainNet) and LocalNet mode
 */
export function useWalletAddress() {
  const [address, setAddress] = useState<string | null>(null);

  useEffect(() => {
    const network = import.meta.env.VITE_ALGORAND_NETWORK || 'localnet';
    const isLocalNet = network.toLowerCase() === 'localnet';

    // LocalNet mode: Use localStorage to track current account
    if (isLocalNet) {
      // Import the helper to get the active account
      import('@/lib/localnet-accounts').then(({ getActiveLocalNetAccount }) => {
        const localNetAddress = getActiveLocalNetAccount();
        setAddress(localNetAddress);
      });

      // Listen for account switching on LocalNet
      const handleStorageChange = (e: StorageEvent) => {
        if (e.key === 'localnet_active_account' && e.newValue) {
          setAddress(e.newValue);
        }
      };

      window.addEventListener('storage', handleStorageChange);
      
      // Also listen for custom event for same-tab updates
      const handleAccountSwitch = ((e: CustomEvent) => {
        setAddress(e.detail.address);
      }) as EventListener;
      
      window.addEventListener('localnet_account_switched', handleAccountSwitch);

      return () => {
        window.removeEventListener('storage', handleStorageChange);
        window.removeEventListener('localnet_account_switched', handleAccountSwitch);
      };
    }

    // Pera Wallet mode (TestNet/MainNet)
    const wallet = getPeraWallet();
    
    // Check if already connected
    const accounts = wallet.connector?.accounts || [];
    if (accounts.length > 0) {
      setAddress(accounts[0]);
    }

    // Listen for connection changes
    wallet.connector?.on('connect', (accounts: string[]) => {
      if (accounts.length > 0) {
        setAddress(accounts[0]);
      }
    });

    wallet.connector?.on('disconnect', () => {
      setAddress(null);
    });

    return () => {
      wallet.connector?.off('connect');
      wallet.connector?.off('disconnect');
    };
  }, []);

  return address;
}

/**
 * Hook to get total bets for a specific event
 */
export function useTotalBets(eventId: number) {
  const [data, setData] = useState<{ yesBets: bigint; noBets: bigint } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const refetch = useCallback(async () => {
    if (!PREDICTION_MARKET_APP_ID || eventId === 0) return;
    
    setIsLoading(true);
    setError(null);

    try {
      const algodClient = createAlgodClient();
      
      // Read event from box storage
      // Box key: "events" + uint64(event_id)
      const encoder = new TextEncoder();
      const eventsPrefix = encoder.encode('events');
      const eventIdBytes = algosdk.encodeUint64(eventId);
      const boxName = new Uint8Array(eventsPrefix.length + eventIdBytes.length);
      boxName.set(eventsPrefix, 0);
      boxName.set(eventIdBytes, eventsPrefix.length);
      
      const boxValue = await readBox(PREDICTION_MARKET_APP_ID, boxName);
      
      if (boxValue) {
        // Parse event struct from box value
        // This is a simplified parsing - adjust based on actual ARC4 encoding
        const totalYesBets = BigInt(new DataView(boxValue.buffer).getBigUint64(32, false));
        const totalNoBets = BigInt(new DataView(boxValue.buffer).getBigUint64(40, false));
        
        setData({ yesBets: totalYesBets, noBets: totalNoBets });
      }
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { data, isLoading, error, refetch };
}

/**
 * Hook to get user's bets
 */
export function useGetUserBets(userAddress: string | null) {
  const [data, setData] = useState<Bet[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const refetch = useCallback(async () => {
    if (!userAddress) {
      console.log('⚠️ useGetUserBets: No user address');
      setData([]);
      return;
    }
    
    setIsLoading(true);
    setError(null);

    try {
      console.log('📊 Fetching bets for user:', userAddress);
      
      // Fetch from API endpoint
      const response = await fetch(`/api/users/${userAddress}/bets`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const bets = await response.json();
      console.log(`✅ Fetched ${bets.length} bets from API`);
      
      // Convert API format to Bet type
      const parsedBets: Bet[] = bets.map((bet: any) => ({
        betId: BigInt(bet.betId),
        eventId: BigInt(bet.eventId),
        bettor: bet.bettor,
        outcome: bet.outcome,
        amount: BigInt(bet.amount),
        claimed: bet.claimed,
      }));
      
      setData(parsedBets);
    } catch (err) {
      console.error('❌ Error in useGetUserBets:', err);
      setError(err as Error);
      // Set empty array so UI doesn't break
      setData([]);
    } finally {
      setIsLoading(false);
    }
  }, [userAddress]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { data, isLoading, error, refetch };
}

/**
 * Hook to get event details
 */
export function useGetEvent(eventId: number) {
  const [data, setData] = useState<Event | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const refetch = useCallback(async () => {
    if (!PREDICTION_MARKET_APP_ID || eventId === 0) return;
    
    setIsLoading(true);
    setError(null);

    try {
      // Read event from box storage
      // Box key: "events" + uint64(event_id)
      const encoder = new TextEncoder();
      const eventsPrefix = encoder.encode('events');
      const eventIdBytes = algosdk.encodeUint64(eventId);
      const boxName = new Uint8Array(eventsPrefix.length + eventIdBytes.length);
      boxName.set(eventsPrefix, 0);
      boxName.set(eventIdBytes, eventsPrefix.length);
      
      const boxValue = await readBox(PREDICTION_MARKET_APP_ID, boxName);
      
      if (boxValue) {
        // Parse event struct from box value
        // This is a simplified parsing - adjust based on actual ARC4 encoding
        setData({
          id: BigInt(eventId),
          name: "Event Name", // Parse from box
          endTime: BigInt(0),
          resolved: false,
          outcome: false,
          totalYesBets: BigInt(0),
          totalNoBets: BigInt(0),
          totalYesAmount: BigInt(0),
          totalNoAmount: BigInt(0),
        });
      }
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { data, isLoading, error, refetch };
}

/**
 * Hook to place a bet
 */
export function usePlaceBet() {
  const [isPending, setIsPending] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [txId, setTxId] = useState<string | null>(null);

  const placeBet = useCallback(async (
    eventId: number,
    outcome: boolean,
    amount: number,
    senderAddress: string
  ) => {
    if (!PREDICTION_MARKET_APP_ID) {
      throw new Error('App ID not configured');
    }

    console.log('🎯 usePlaceBet - Starting bet placement:', {
      eventId,
      outcome,
      amount,
      senderAddress,
      senderAddressShort: `${senderAddress.slice(0, 6)}...${senderAddress.slice(-4)}`
    });

    setIsPending(true);
    setIsSuccess(false);
    setError(null);
    setTxId(null);

    try {
      const algodClient = createAlgodClient();
      const params = await getSuggestedParams();
      const appAddress = algosdk.getApplicationAddress(PREDICTION_MARKET_APP_ID);

      // Fetch current bet counter to know which bet box will be created
      const appInfo = await algodClient.getApplicationByID(PREDICTION_MARKET_APP_ID).do();
      const globalState = appInfo.params['global-state'] || [];
      let betCounter = 0;
      for (const item of globalState) {
        const key = Buffer.from(item.key, 'base64').toString();
        if (key === 'bet_counter') {
          betCounter = item.value.uint || 0;
          break;
        }
      }
      const nextBetId = betCounter + 1;

      // Create atomic transaction composer for ARC-4 method calls
      const atc = new algosdk.AtomicTransactionComposer();
      
      // Create payment transaction
      const paymentTxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
        from: senderAddress,
        to: appAddress,
        amount: algoToMicroAlgo(amount),
        suggestedParams: params,
      });

      // Define the place_bet method from ABI
      const placeBetMethod = new algosdk.ABIMethod({
        name: 'place_bet',
        args: [
          { type: 'uint64', name: 'event_id' },
          { type: 'bool', name: 'outcome' },
          { type: 'pay', name: 'payment' }
        ],
        returns: { type: 'void' }
      });

      // Calculate box references - contract needs to access multiple boxes:
      // 1. events box - to read event data
      const eventsPrefix = new Uint8Array(Buffer.from('events', 'utf-8'));
      const eventIdBytes = algosdk.encodeUint64(eventId);
      const eventBoxName = new Uint8Array(eventsPrefix.length + eventIdBytes.length);
      eventBoxName.set(eventsPrefix, 0);
      eventBoxName.set(eventIdBytes, eventsPrefix.length);
      
      // 2. bets box - to store the new bet with the next bet ID
      const betsPrefix = new Uint8Array([98, 101, 116, 115]); // 'bets' in bytes
      const nextBetIdBytes = algosdk.encodeUint64(nextBetId);
      const betsBoxName = new Uint8Array(betsPrefix.length + nextBetIdBytes.length);
      betsBoxName.set(betsPrefix, 0);
      betsBoxName.set(nextBetIdBytes, betsPrefix.length);
      
      // 3. user_bets box - to update the user's bet list
      const userBetsPrefix = new Uint8Array(Buffer.from('user_bets', 'utf-8'));
      const userAddressBytes = algosdk.decodeAddress(senderAddress).publicKey;
      const userBetsBoxName = new Uint8Array(userBetsPrefix.length + userAddressBytes.length);
      userBetsBoxName.set(userBetsPrefix, 0);
      userBetsBoxName.set(userAddressBytes, userBetsPrefix.length);
      
      // 4. event_bets box - to update the event's bet list
      const eventBetsPrefix = new Uint8Array(Buffer.from('event_bets', 'utf-8'));
      const eventBetsBoxName = new Uint8Array(eventBetsPrefix.length + eventIdBytes.length);
      eventBetsBoxName.set(eventBetsPrefix, 0);
      eventBetsBoxName.set(eventIdBytes, eventBetsPrefix.length);

      // Add method call to composer
      atc.addMethodCall({
        appID: PREDICTION_MARKET_APP_ID,
        method: placeBetMethod,
        methodArgs: [eventId, outcome, { txn: paymentTxn, signer: algosdk.makeEmptyTransactionSigner() }],
        sender: senderAddress,
        suggestedParams: params,
        signer: algosdk.makeEmptyTransactionSigner(),
        boxes: [
          { appIndex: PREDICTION_MARKET_APP_ID, name: eventBoxName },
          { appIndex: PREDICTION_MARKET_APP_ID, name: betsBoxName },
          { appIndex: PREDICTION_MARKET_APP_ID, name: userBetsBoxName },
          { appIndex: PREDICTION_MARKET_APP_ID, name: eventBetsBoxName },
        ],
      });

      // Get the transaction group (already has group IDs assigned)
      const txnGroup = atc.buildGroup();
      const txns = txnGroup.map(tx => tx.txn);
      
      // Sign transactions (don't reassign group IDs - they're already set!)
      let signedTxns: Uint8Array[];
      
      if (PREDICTION_MARKET_APP_ID) { // LocalNet check
        const network = import.meta.env.VITE_ALGORAND_NETWORK || 'localnet';
        
        if (network === 'localnet') {
          // LocalNet: Sign with mnemonic
          const { LOCALNET_ACCOUNTS } = await import('@/lib/localnet-accounts');
          const account = LOCALNET_ACCOUNTS.find(acc => acc.address === senderAddress);
          
          if (!account) {
            throw new Error(`LocalNet account not found for address: ${senderAddress}`);
          }
          
          const signerAccount = algosdk.mnemonicToSecretKey(account.mnemonic);
          console.log('🔑 Signing with account:', {
            name: account.name,
            address: account.address,
            signerAddress: signerAccount.addr,
            matches: signerAccount.addr === senderAddress
          });
          signedTxns = txns.map(txn => txn.signTxn(signerAccount.sk));
        } else {
          // TestNet/MainNet: Use Pera Wallet
          const wallet = getPeraWallet();
          const txnsToSign = txns.map(txn => ({ txn, signers: [senderAddress] }));
          signedTxns = await wallet.signTransaction([txnsToSign]);
        }
      } else {
        throw new Error('App ID not configured');
      }
      
      // Send to network
      const { txId: txnId } = await algodClient.sendRawTransaction(signedTxns).do();

      // Wait for confirmation
      await waitForConfirmation(txnId);

      setTxId(txnId);
      setIsSuccess(true);
      return txnId;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setIsPending(false);
    }
  }, []);

  return { placeBet, isPending, isSuccess, error, txId };
}

/**
 * Hook to create an event (admin only)
 */
export function useCreateEvent() {
  const [isPending, setIsPending] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [txId, setTxId] = useState<string | null>(null);

  const createEvent = useCallback(async (
    name: string,
    endTime: number,
    senderAddress: string
  ) => {
    if (!PREDICTION_MARKET_APP_ID) {
      throw new Error('App ID not configured');
    }

    setIsPending(true);
    setIsSuccess(false);
    setError(null);
    setTxId(null);

    try {
      const params = await getSuggestedParams();

      // Read current event_counter to predict next event_id
      const algodClient = createAlgodClient();
      const appInfo = await algodClient.getApplicationByID(PREDICTION_MARKET_APP_ID).do();
      const globalState = appInfo.params['global-state'] || [];
      
      // Find event_counter in global state
      let eventCounter = 0;
      for (const item of globalState) {
        const key = Buffer.from(item.key, 'base64').toString();
        if (key === 'event_counter') {
          eventCounter = item.value.uint || 0;
          break;
        }
      }
      
      const nextEventId = eventCounter + 1;

      // Use algosdk's ABIMethod to get proper method selector
      const abiMethod = new algosdk.ABIMethod({
        name: 'create_event',
        args: [
          { type: 'string', name: 'name' },
          { type: 'uint64', name: 'end_time' }
        ],
        returns: { type: 'uint64' }
      });

      // Get method selector (first 4 bytes of method signature hash)
      const methodSelector = abiMethod.getSelector();

      // Encode arguments using ABI encoding
      const encoder = new TextEncoder();
      
      // Encode string: 2-byte length prefix + UTF-8 bytes
      const nameBytes = encoder.encode(name);
      const encodedName = new Uint8Array(2 + nameBytes.length);
      encodedName[0] = (nameBytes.length >> 8) & 0xFF;
      encodedName[1] = nameBytes.length & 0xFF;
      encodedName.set(nameBytes, 2);

      // Encode uint64: 8 bytes, big-endian
      const encodedEndTime = new Uint8Array(8);
      const view = new DataView(encodedEndTime.buffer);
      view.setBigUint64(0, BigInt(endTime), false);

      // Create box references for the event storage
      // Box keys are simply: field_name + abi_encoded_key (no hashing!)
      const eventIdBytes = new Uint8Array(8);
      new DataView(eventIdBytes.buffer).setBigUint64(0, BigInt(nextEventId), false);
      
      const eventsFieldBytes = encoder.encode('events');
      const eventsBoxKey = new Uint8Array(eventsFieldBytes.length + eventIdBytes.length);
      eventsBoxKey.set(eventsFieldBytes, 0);
      eventsBoxKey.set(eventIdBytes, eventsFieldBytes.length);
      
      const eventBetsFieldBytes = encoder.encode('event_bets');
      const eventBetsBoxKey = new Uint8Array(eventBetsFieldBytes.length + eventIdBytes.length);
      eventBetsBoxKey.set(eventBetsFieldBytes, 0);
      eventBetsBoxKey.set(eventIdBytes, eventBetsFieldBytes.length);

      // Create application call transaction with box references
      const appCallTxn = algosdk.makeApplicationNoOpTxnFromObject({
        from: senderAddress,
        appIndex: PREDICTION_MARKET_APP_ID,
        appArgs: [
          methodSelector,
          encodedName,
          encodedEndTime,
        ],
        boxes: [
          { appIndex: PREDICTION_MARKET_APP_ID, name: eventsBoxKey },
          { appIndex: PREDICTION_MARKET_APP_ID, name: eventBetsBoxKey },
        ],
        suggestedParams: params,
      });

      // Send transaction
      const txnId = await signAndSendTransaction(appCallTxn, senderAddress);

      // Wait for confirmation
      await waitForConfirmation(txnId);

      setTxId(txnId);
      setIsSuccess(true);
      return txnId;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setIsPending(false);
    }
  }, []);

  return { createEvent, isPending, isSuccess, error, txId };
}

/**
 * Hook to resolve an event (admin only)
 */
export function useResolveEvent() {
  const [isPending, setIsPending] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [txId, setTxId] = useState<string | null>(null);

  const resolveEvent = useCallback(async (
    eventId: number,
    outcome: boolean,
    senderAddress: string
  ) => {
    if (!PREDICTION_MARKET_APP_ID) {
      throw new Error('App ID not configured');
    }

    console.log('🎯 useResolveEvent - Starting event resolution:', {
      eventId,
      outcome,
      senderAddress,
      senderAddressShort: `${senderAddress.slice(0, 6)}...${senderAddress.slice(-4)}`
    });

    setIsPending(true);
    setIsSuccess(false);
    setError(null);
    setTxId(null);

    try {
      const algodClient = createAlgodClient();
      const params = await getSuggestedParams();

      // Create atomic transaction composer for ARC-4 method calls
      const atc = new algosdk.AtomicTransactionComposer();
      
      // Define the resolve_event method from ABI
      const resolveEventMethod = new algosdk.ABIMethod({
        name: 'resolve_event',
        args: [
          { type: 'uint64', name: 'event_id' },
          { type: 'bool', name: 'outcome' }
        ],
        returns: { type: 'void' }
      });

      // Calculate box reference for the event
      const eventsPrefix = new Uint8Array(Buffer.from('events', 'utf-8'));
      const eventIdBytes = algosdk.encodeUint64(eventId);
      const eventBoxName = new Uint8Array(eventsPrefix.length + eventIdBytes.length);
      eventBoxName.set(eventsPrefix, 0);
      eventBoxName.set(eventIdBytes, eventsPrefix.length);

      // Add method call to composer
      atc.addMethodCall({
        appID: PREDICTION_MARKET_APP_ID,
        method: resolveEventMethod,
        methodArgs: [eventId, outcome],
        sender: senderAddress,
        suggestedParams: params,
        signer: algosdk.makeEmptyTransactionSigner(),
        boxes: [
          { appIndex: PREDICTION_MARKET_APP_ID, name: eventBoxName },
        ],
      });

      // Get the transaction group
      const txnGroup = atc.buildGroup();
      const txns = txnGroup.map(tx => tx.txn);
      
      // Sign transactions
      let signedTxns: Uint8Array[];
      
      const network = import.meta.env.VITE_ALGORAND_NETWORK || 'localnet';
      
      if (network === 'localnet') {
        // LocalNet: Sign with mnemonic
        const { LOCALNET_ACCOUNTS } = await import('@/lib/localnet-accounts');
        const account = LOCALNET_ACCOUNTS.find(acc => acc.address === senderAddress);
        
        if (!account) {
          throw new Error(`LocalNet account not found for address: ${senderAddress}`);
        }
        
        const signerAccount = algosdk.mnemonicToSecretKey(account.mnemonic);
        console.log('🔑 Signing with account:', {
          name: account.name,
          address: account.address,
          signerAddress: signerAccount.addr,
          matches: signerAccount.addr === senderAddress
        });
        signedTxns = txns.map(txn => txn.signTxn(signerAccount.sk));
      } else {
        // TestNet/MainNet: Use Pera Wallet
        const wallet = getPeraWallet();
        const txnsToSign = txns.map(txn => ({ txn, signers: [senderAddress] }));
        signedTxns = await wallet.signTransaction([txnsToSign]);
      }
      
      // Send to network
      const { txId: txnId } = await algodClient.sendRawTransaction(signedTxns).do();

      console.log('✅ Event resolution transaction sent:', txnId);

      // Wait for confirmation
      await waitForConfirmation(txnId);

      console.log('✅ Event resolution confirmed!');

      setTxId(txnId);
      setIsSuccess(true);
      return txnId;
    } catch (err) {
      console.error('❌ Error resolving event:', err);
      setError(err as Error);
      throw err;
    } finally {
      setIsPending(false);
    }
  }, []);

  return { resolveEvent, isPending, isSuccess, error, txId };
}

/**
 * Hook to claim winnings
 */
export function useClaimWinnings() {
  const [isPending, setIsPending] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [txId, setTxId] = useState<string | null>(null);

  const claimWinnings = useCallback(async (
    betId: number,
    senderAddress: string
  ) => {
    if (!PREDICTION_MARKET_APP_ID) {
      throw new Error('App ID not configured');
    }

    setIsPending(true);
    setIsSuccess(false);
    setError(null);
    setTxId(null);

    try {
      const params = await getSuggestedParams();

      // Create application call transaction
      const appCallTxn = algosdk.makeApplicationNoOpTxnFromObject({
        from: senderAddress,
        appIndex: PREDICTION_MARKET_APP_ID,
        appArgs: [
          new Uint8Array(Buffer.from('claim_winnings')),
          algosdk.encodeUint64(betId),
        ],
        suggestedParams: params,
      });

      // Send transaction
      const txnId = await signAndSendTransaction(appCallTxn, senderAddress);

      // Wait for confirmation
      await waitForConfirmation(txnId);

      setTxId(txnId);
      setIsSuccess(true);
      return txnId;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setIsPending(false);
    }
  }, []);

  return { claimWinnings, isPending, isSuccess, error, txId };
}

/**
 * Hook to get account balance in ALGO
 */
export function useAccountBalance(address: string | null) {
  const [balance, setBalance] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!address) {
      setBalance(null);
      return;
    }

    const fetchBalance = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const algodClient = createAlgodClient();
        const accountInfo = await algodClient.accountInformation(address).do();
        const balanceInAlgo = accountInfo.amount / 1_000_000;
        setBalance(balanceInAlgo);
      } catch (err) {
        setError(err as Error);
        setBalance(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBalance();
    
    // Refresh balance every 5 seconds
    const interval = setInterval(fetchBalance, 5000);
    return () => clearInterval(interval);
  }, [address]);

  return { balance, isLoading, error };
}
