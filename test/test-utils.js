/**
 * Algorand Testing Utilities
 * Helper functions for testing PredictionMarket smart contract
 */

import algosdk from 'algosdk';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { APP_SPEC, PredictionMarketFactory } from './PredictionMarketClient.ts';
import { AlgorandClient } from '@algorandfoundation/algokit-utils/types/algorand-client';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Convert ARC-56 spec to ARC-4 ABI format that algosdk understands
function getABIContract() {
  const methods = APP_SPEC.methods.map(m => ({
    name: m.name,
    desc: m.desc || '',
    args: m.args.map(a => ({
      type: a.type,
      name: a.name,
      desc: a.desc || ''
    })),
    returns: { type: m.returns.type, desc: m.returns.desc || '' }
  }));
  
  return new algosdk.ABIContract({
    name: APP_SPEC.name,
    desc: APP_SPEC.desc || '',
    networks: {},
    methods
  });
}

const abiContract = getABIContract();

/**
 * Algorand network configurations
 */
const NETWORKS = {
  testnet: {
    algodUrl: process.env.ALGORAND_TESTNET_URL || 'https://testnet-api.algonode.cloud',
    indexerUrl: process.env.ALGORAND_TESTNET_INDEXER_URL || 'https://testnet-idx.algonode.cloud',
    port: '',
    token: '',
  },
  localnet: {
    algodUrl: 'http://localhost',
    indexerUrl: 'http://localhost',
    port: '4001',
    token: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  },
};

/**
 * Create an Algod client for the specified network
 * @param {string} network - 'testnet' or 'localnet'
 * @returns {algosdk.Algodv2}
 */
function createAlgodClient(network = 'localnet') {
  const config = NETWORKS[network];
  return new algosdk.Algodv2(config.token, config.algodUrl, config.port);
}

/**
 * Create an Indexer client for the specified network
 * @param {string} network - 'testnet' or 'localnet'
 * @returns {algosdk.Indexer}
 */
function createIndexerClient(network = 'localnet') {
  const config = NETWORKS[network];
  return new algosdk.Indexer(config.token, config.indexerUrl, config.port);
}

/**
 * Generate a new test account with funding
 * @param {algosdk.Algodv2} algodClient
 * @param {number} fundingAmount - Amount in microAlgos (default 100 ALGO)
 * @returns {Promise<algosdk.Account>}
 */
async function generateFundedAccount(algodClient, fundingAmount = 100_000_000) {
  const account = algosdk.generateAccount();
  
  // For LocalNet, fund from KMD wallet (AlgoKit standard)
  if (process.env.NETWORK === 'localnet' || !process.env.NETWORK) {
    try {
      // Use KMD to get a funded account
      const kmdToken = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
      const kmdServer = 'http://localhost';
      const kmdPort = '4002';
      const kmdClient = new algosdk.Kmd(kmdToken, kmdServer, kmdPort);
      
      // List wallets
      const wallets = await kmdClient.listWallets();
      const defaultWallet = wallets.wallets.find(w => w.name === 'unencrypted-default-wallet');
      
      if (!defaultWallet) {
        throw new Error('Default wallet not found in LocalNet KMD');
      }
      
      // Get wallet handle
      const walletHandle = await kmdClient.initWalletHandle(defaultWallet.id, '');
      
      // Get first account from wallet (this is the genesis account with funds)
      const addresses = await kmdClient.listKeys(walletHandle.wallet_handle_token);
      const dispenserAddr = addresses.addresses[0];
      
      // Export private key
      const accountKey = await kmdClient.exportKey(
        walletHandle.wallet_handle_token,
        '',
        dispenserAddr
      );
      
      const dispenser = {
        addr: dispenserAddr,
        sk: accountKey.private_key,
      };
      
      // Create and send funding transaction
      const params = await algodClient.getTransactionParams().do();
      const paymentTxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
        sender: dispenser.addr,
        receiver: algosdk.encodeAddress(account.addr.publicKey),
        amount: fundingAmount,
        suggestedParams: params,
      });
      
      const signedTxn = paymentTxn.signTxn(dispenser.sk);
      await algodClient.sendRawTransaction(signedTxn).do();
      await waitForConfirmation(algodClient, paymentTxn.txID().toString());
      
      // Release wallet handle
      await kmdClient.releaseWalletHandle(walletHandle.wallet_handle_token);
      
    } catch (error) {
      console.error('Error funding account from KMD:', error.message);
      throw error;
    }
  }
  
  return account;
}

/**
 * Wait for a transaction to be confirmed
 * @param {algosdk.Algodv2} algodClient
 * @param {string} txId
 * @param {number} timeout - Timeout in rounds (default 10)
 * @returns {Promise<object>}
 */
async function waitForConfirmation(algodClient, txId, timeout = 10) {
  const status = await algosdk.waitForConfirmation(algodClient, txId, timeout);
  return status;
}

/**
 * Compile TEAL program
 * @param {algosdk.Algodv2} algodClient
 * @param {string} tealSource - TEAL source code
 * @returns {Promise<Uint8Array>}
 */
async function compileTeal(algodClient, tealSource) {
  const encoder = new TextEncoder();
  const programBytes = encoder.encode(tealSource);
  const compileResponse = await algodClient.compile(programBytes).do();
  return new Uint8Array(Buffer.from(compileResponse.result, 'base64'));
}

/**
 * Load and compile TEAL files from artifacts directory
 * @param {algosdk.Algodv2} algodClient
 * @returns {Promise<{approval: Uint8Array, clear: Uint8Array}>}
 */
async function loadCompiledContract(algodClient) {
  const artifactsDir = path.join(__dirname, '..', 'smart_contracts', 'artifacts');
  const approvalPath = path.join(artifactsDir, 'prediction_market.approval.teal');
  const clearPath = path.join(artifactsDir, 'prediction_market.clear.teal');
  
  const approvalSource = fs.readFileSync(approvalPath, 'utf8');
  const clearSource = fs.readFileSync(clearPath, 'utf8');
  
  const approval = await compileTeal(algodClient, approvalSource);
  const clear = await compileTeal(algodClient, clearSource);
  
  return { approval, clear };
}

/**
 * Deploy the PredictionMarket application
 * @param {algosdk.Algodv2} algodClient
 * @param {algosdk.Account} deployer
 * @param {algosdk.Account} admin
 * @returns {Promise<{appId: number, appAddress: string}>}
 */
async function deployPredictionMarket(algodClient, deployer, admin) {
  const { approval, clear } = await loadCompiledContract(algodClient);
  
  const params = await algodClient.getTransactionParams().do();
  
  // Define schema - CRITICAL: Use the exact values from ARC-56 spec
  const localInts = 0;
  const localBytes = 0;
  const globalInts = 2; // admin (stored as bytes), event_counter, bet_counter
  const globalBytes = 1; // admin address
  
  // Create application using Atomic Transaction Composer for ARC-4 compatibility
  const atc = new algosdk.AtomicTransactionComposer();
  
  // Get admin address as string
  const adminAddr = typeof admin.addr === 'string' ? admin.addr : algosdk.encodeAddress(admin.addr.publicKey);
  const deployerAddr = typeof deployer.addr === 'string' ? deployer.addr : algosdk.encodeAddress(deployer.addr.publicKey);
  
  console.log('📝 Deploying with admin:', adminAddr);
  console.log('📝 Deployer:', deployerAddr);
  
  // Get the create_application method from the ABI contract
  const createMethod = abiContract.methods.find(m => m.name === 'create_application');
  
  //Add method call to ATC with proper box references
  atc.addMethodCall({
    appID: 0, // 0 means this is an app creation call
    method: createMethod,
    methodArgs: [adminAddr],
    sender: deployerAddr,
    signer: algosdk.makeBasicAccountTransactionSigner(deployer),
    suggestedParams: params,
    onComplete: algosdk.OnApplicationComplete.NoOpOC,
    approvalProgram: approval,
    clearProgram: clear,
    numGlobalInts: globalInts,
    numGlobalByteSlices: globalBytes,
    numLocalInts: localInts,
    numLocalByteSlices: localBytes,
    extraPages: 3, // Additional pages for box storage
  });
  
  // Execute the transaction
  const result = await atc.execute(algodClient, 4);
  
  console.log('✅ ATC execution result txIDs:', result.txIDs);
  console.log('✅ Method results count:', result.methodResults?.length);
  console.log('✅ Application Index:', result.methodResults[0]?.txInfo?.applicationIndex);
  console.log('✅ TxInfo keys:', Object.keys(result.methodResults[0]?.txInfo || {}));
  
  // Get the app ID from the method result
  const txInfo = result.methodResults[0]?.txInfo;
  console.log('🔍 Global State Delta:', txInfo?.globalStateDelta);
  console.log('🔍 Logs:', txInfo?.logs);
  let appId = txInfo?.applicationIndex;
  
  // Convert BigInt to Number if needed
  if (typeof appId === 'bigint') {
    appId = Number(appId);
  }
  
  if (!appId || typeof appId !== 'number') {
    throw new Error(`Failed to get application ID from transaction result`);
  }
  
  console.log(`✅ Smart contract deployed! App ID: ${appId}`);
  const appAddress = algosdk.getApplicationAddress(appId);
  
  // Fund the application account with minimum balance
  await fundAccount(algodClient, deployer, appAddress, 1_000_000); // 1 ALGO for MBR
  
  // Wait for confirmation and verify global state was set
  await waitForConfirmation(algodClient, result.txIDs[0]);
  const verifyState = await algodClient.getApplicationByID(appId).do();
  console.log('📊 Global state after deployment:');
  console.log('   params keys:', Object.keys(verifyState.params));
  console.log('   global-state:', verifyState.params['global-state']);
  console.log('   globalState:', verifyState.params.globalState);
  
  return { appId, appAddress };
}

/**
 * Fund an account
 * @param {algosdk.Algodv2} algodClient
 * @param {algosdk.Account} sender
 * @param {string} recipient
 * @param {number} amount - Amount in microAlgos
 * @returns {Promise<string>} Transaction ID
 */
async function fundAccount(algodClient, sender, recipient, amount) {
  const params = await algodClient.getTransactionParams().do();
  
  // Handle Address object from algosdk v3
  const senderAddr = typeof sender.addr === 'string' ? sender.addr : algosdk.encodeAddress(sender.addr.publicKey);
  
  const paymentTxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
    sender: senderAddr,
    receiver: recipient,
    amount: amount,
    suggestedParams: params,
  });
  
  const signedTxn = paymentTxn.signTxn(sender.sk);
  await algodClient.sendRawTransaction(signedTxn).do();
  
  // Use the transaction's ID directly (algosdk v3)
  const txId = paymentTxn.txID().toString();
  await waitForConfirmation(algodClient, txId);
  
  return txId;
}

/**
 * Call an application method using ABI and AtomicTransactionComposer
 * @param {algosdk.Algodv2} algodClient
 * @param {algosdk.Account} sender
 * @param {number} appId
 * @param {string} methodName
 * @param {Array} methodArgs
 * @param {Array<algosdk.Transaction>} additionalTxns - For atomic groups (e.g., payment transactions)
 * @returns {Promise<object>}
 */
async function callAppMethod(algodClient, sender, appId, methodName, methodArgs = [], additionalTxns = []) {
  const params = await algodClient.getTransactionParams().do();
  
  // Get the ABI method from the contract
  const method = abiContract.getMethodByName(methodName);
  
  // Create AtomicTransactionComposer
  const atc = new algosdk.AtomicTransactionComposer();
  
  // Determine which boxes this method will access
  // Box storage prefixes from the contract:
  // - "events" (0x6576656e7473) + uint64
  // - "bets" (0x62657473) + uint64  
  // - "user_bets" (0x757365725f62657473) + address
  // - "event_bets" (0x6576656e745f62657473) + uint64
  
  const boxReferences = [];
  
  const makeBoxRef = (appIndex, name) => ({ appIndex, name });
  
  // For methods that access boxes, we need to specify which ones
  // The box name is: prefix + key
  if (methodName === 'create_event') {
    // Accesses: events box for the new event ID (current counter + 1)
    // Also accesses event_bets box for initialization
    // We need to get the current event counter to know the next event ID
    const eventCounterKey = new TextEncoder().encode('event_counter');
    const eventCounterValue = await algodClient.getApplicationByID(appId).do();
    const eventCounter = eventCounterValue.params['global-state']?.find(
      gs => Buffer.from(gs.key, 'base64').toString() === 'event_counter'
    )?.value?.uint || 0;
    
    const nextEventId = eventCounter + 1;
    const eventsPrefix = Buffer.from('events');
    const eventBetsPrefix = Buffer.from('event_bets');
    const eventIdBytes = algosdk.encodeUint64(nextEventId);
    
    boxReferences.push(
      makeBoxRef(appId, Buffer.concat([eventsPrefix, eventIdBytes])),
      makeBoxRef(appId, Buffer.concat([eventBetsPrefix, eventIdBytes]))
    );
  } else if (methodName === 'place_bet') {
    // Accesses: events box, bets box, user_bets box, event_bets box
    const eventId = typeof methodArgs[0] === 'bigint' ? Number(methodArgs[0]) : methodArgs[0];
    const eventsPrefix = Buffer.from('events');
    const betsPrefix = Buffer.from('bets');
    const userBetsPrefix = Buffer.from('user_bets');
    const eventBetsPrefix = Buffer.from('event_bets');
    const eventIdBytes = algosdk.encodeUint64(eventId);
    
    // Get current bet counter to know the next bet ID
    const betCounterValue = await algodClient.getApplicationByID(appId).do();
    const betCounter = betCounterValue.params['global-state']?.find(
      gs => Buffer.from(gs.key, 'base64').toString() === 'bet_counter'
    )?.value?.uint || 0;
    const nextBetId = betCounter + 1;
    const betIdBytes = algosdk.encodeUint64(nextBetId);
    
    // Handle Address object from algosdk v3
    const senderAddrString = typeof sender.addr === 'string' ? sender.addr : algosdk.encodeAddress(sender.addr.publicKey);
    const userAddress = algosdk.decodeAddress(senderAddrString).publicKey;
    
    boxReferences.push(
      makeBoxRef(appId, Buffer.concat([eventsPrefix, eventIdBytes])),
      makeBoxRef(appId, Buffer.concat([betsPrefix, betIdBytes])),
      makeBoxRef(appId, Buffer.concat([userBetsPrefix, userAddress])),
      makeBoxRef(appId, Buffer.concat([eventBetsPrefix, eventIdBytes]))
    );
  } else if (methodName === 'resolve_event') {
    const eventId = typeof methodArgs[0] === 'bigint' ? Number(methodArgs[0]) : methodArgs[0];
    const eventsPrefix = Buffer.from('events');
    const eventIdBytes = algosdk.encodeUint64(eventId);
    
    boxReferences.push(
      makeBoxRef(appId, Buffer.concat([eventsPrefix, eventIdBytes]))
    );
  } else if (methodName === 'claim_winnings') {
    const betId = typeof methodArgs[0] === 'bigint' ? Number(methodArgs[0]) : methodArgs[0];
    const betsPrefix = Buffer.from('bets');
    const betIdBytes = algosdk.encodeUint64(betId);
    
    // Also need the event box for the bet
    boxReferences.push(
      makeBoxRef(appId, Buffer.concat([betsPrefix, betIdBytes]))
    );
    
    // We'd need to know the event ID from the bet to add the events box ref
    // For now, we'll let the contract error guide us if needed
  } else if (methodName === 'get_event') {
    const eventId = typeof methodArgs[0] === 'bigint' ? Number(methodArgs[0]) : methodArgs[0];
    const eventsPrefix = Buffer.from('events');
    const eventIdBytes = algosdk.encodeUint64(eventId);
    
    boxReferences.push(
      makeBoxRef(appId, Buffer.concat([eventsPrefix, eventIdBytes]))
    );
  } else if (methodName === 'get_user_bets') {
    const userAddress = algosdk.decodeAddress(methodArgs[0]).publicKey;
    const userBetsPrefix = Buffer.from('user_bets');
    
    boxReferences.push(
      makeBoxRef(appId, Buffer.concat([userBetsPrefix, userAddress]))
    );
    
    // Also need bets boxes for all the user's bets - but we don't know which ones yet
    // The contract will access them, so we need to be more clever here
  }
  
  // Add payment transactions first if they exist
  for (const txn of additionalTxns) {
    atc.addTransaction({
      txn: txn,
      signer: algosdk.makeBasicAccountTransactionSigner(sender),
    });
  }
  
  // Add the method call with box references
  const senderAddr = typeof sender.addr === 'string' ? sender.addr : algosdk.encodeAddress(sender.addr.publicKey);
  
  atc.addMethodCall({
    appID: appId,
    method: method,
    methodArgs: methodArgs,
    sender: senderAddr,
    suggestedParams: params,
    signer: algosdk.makeBasicAccountTransactionSigner(sender),
    boxes: boxReferences.length > 0 ? boxReferences : undefined
  });
  
  // Execute the transaction group
  const result = await atc.execute(algodClient, 4);
  
  // Wait for confirmation
  const txId = result.txIDs[result.txIDs.length - 1]; // Last transaction is the method call
  const confirmedTxn = await waitForConfirmation(algodClient, txId);
  
  return {
    ...confirmedTxn,
    returnValue: result.methodResults[result.methodResults.length - 1].returnValue,
  };
}

/**
 * Create a payment transaction for atomic groups
 * @param {algosdk.Algodv2} algodClient
 * @param {algosdk.Account} sender
 * @param {string} receiver
 * @param {number} amount - Amount in microAlgos
 * @returns {Promise<algosdk.Transaction>}
 */
async function createPaymentTxn(algodClient, sender, receiver, amount) {
  const params = await algodClient.getTransactionParams().do();
  
  // Handle Address object from algosdk v3
  const senderAddr = typeof sender.addr === 'string' ? sender.addr : algosdk.encodeAddress(sender.addr.publicKey);
  
  return algosdk.makePaymentTxnWithSuggestedParamsFromObject({
    sender: senderAddr,
    receiver: receiver,
    amount: amount,
    suggestedParams: params,
  });
}

/**
 * Encode method argument based on type
 * @param {*} arg
 * @returns {Uint8Array}
 */
function encodeMethodArg(arg) {
  if (typeof arg === 'string') {
    return new Uint8Array(Buffer.from(arg));
  } else if (typeof arg === 'number' || typeof arg === 'bigint') {
    return algosdk.encodeUint64(arg);
  } else if (typeof arg === 'boolean') {
    return new Uint8Array([arg ? 1 : 0]);
  } else if (arg instanceof Uint8Array) {
    return arg;
  }
  throw new Error(`Unsupported argument type: ${typeof arg}`);
}

/**
 * Read global state of an application
 * @param {algosdk.Algodv2} algodClient
 * @param {number} appId
 * @returns {Promise<object>}
 */
async function readGlobalState(algodClient, appId) {
  const appInfo = await algodClient.getApplicationByID(appId).do();
  const globalState = {};
  
  console.log('DEBUG appInfo keys:', Object.keys(appInfo));
  console.log('DEBUG appInfo.params keys:', appInfo.params ? Object.keys(appInfo.params) : 'no params');
  
  // algosdk v3 uses camelCase: globalState, NOT hyphenated global-state
  const stateArray = appInfo.params?.globalState || appInfo.globalState || [];
  
  console.log('DEBUG stateArray length:', stateArray.length);
  
  for (const item of stateArray) {
    const key = Buffer.from(item.key, 'base64').toString();
    let value;
    
    if (item.value.type === 1) {
      // Bytes - could be address or string
      const bytes = Buffer.from(item.value.bytes, 'base64');
      // Check if it's an address (32 bytes)
      if (bytes.length === 32) {
        value = bytes; // Keep as buffer for address decoding
      } else {
        value = bytes.toString();
      }
    } else {
      // Uint - algosdk v3 may return BigInt
      value = typeof item.value.uint === 'bigint' ? Number(item.value.uint) : item.value.uint;
    }
    
    console.log('DEBUG global state key:', key, 'value type:', typeof value);
    globalState[key] = value;
  }
  
  return globalState;
}

/**
 * Read box value from an application
 * @param {algosdk.Algodv2} algodClient
 * @param {number} appId
 * @param {string} boxName
 * @returns {Promise<Uint8Array>}
 */
async function readBox(algodClient, appId, boxName) {
  const boxNameEncoded = new Uint8Array(Buffer.from(boxName));
  const boxValue = await algodClient.getApplicationBoxByName(appId, boxNameEncoded).do();
  return boxValue.value;
}

/**
 * Parse event data from box storage
 * @param {Uint8Array} boxData
 * @returns {object}
 */
function parseEventStruct(boxData) {
  // EventStruct layout (ARC4):
  // - id: uint64 (8 bytes)
  // - name: string (dynamic)
  // - end_time: uint64 (8 bytes)
  // - resolved: bool (1 byte)
  // - outcome: bool (1 byte)
  // - total_yes_bets: uint64 (8 bytes)
  // - total_no_bets: uint64 (8 bytes)
  // - total_yes_amount: uint64 (8 bytes)
  // - total_no_amount: uint64 (8 bytes)
  
  // This is a simplified parser - actual ARC4 encoding is more complex
  const buffer = Buffer.from(boxData);
  
  return {
    id: buffer.readBigUInt64BE(0),
    // name: decode string at offset...
    // Additional parsing would be needed for complete struct
  };
}

/**
 * Get account balance
 * @param {algosdk.Algodv2} algodClient
 * @param {string} address
 * @returns {Promise<number>}
 */
async function getAccountBalance(algodClient, address) {
  const accountInfo = await algodClient.accountInformation(address).do();
  return accountInfo.amount;
}

/**
 * Get current timestamp for Algorand (Unix timestamp)
 * @returns {number}
 */
function getCurrentTimestamp() {
  return Math.floor(Date.now() / 1000);
}

/**
 * Convert ALGO to microAlgos
 * @param {number} algo
 * @returns {number}
 */
function algoToMicroAlgo(algo) {
  return algo * 1_000_000;
}

/**
 * Convert microAlgos to ALGO
 * @param {number} microAlgo
 * @returns {number}
 */
function microAlgoToAlgo(microAlgo) {
  return microAlgo / 1_000_000;
}

export {
  createAlgodClient,
  createIndexerClient,
  generateFundedAccount,
  waitForConfirmation,
  compileTeal,
  loadCompiledContract,
  deployPredictionMarket,
  fundAccount,
  callAppMethod,
  createPaymentTxn,
  encodeMethodArg,
  readGlobalState,
  readBox,
  parseEventStruct,
  getAccountBalance,
  getCurrentTimestamp,
  algoToMicroAlgo,
  microAlgoToAlgo,
};
