/**
 * Algorand Testing Utilities
 * Helper functions for testing PredictionMarket smart contract
 */

import algosdk from 'algosdk';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
  
  // For LocalNet, fund from the default dispenser account
  if (process.env.NETWORK === 'localnet') {
    const dispenserMnemonic = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon';
    const dispenser = algosdk.mnemonicToSecretKey(dispenserMnemonic);
    
    const params = await algodClient.getTransactionParams().do();
    const paymentTxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
      from: dispenser.addr,
      to: account.addr,
      amount: fundingAmount,
      suggestedParams: params,
    });
    
    const signedTxn = paymentTxn.signTxn(dispenser.sk);
    await algodClient.sendRawTransaction(signedTxn).do();
    await waitForConfirmation(algodClient, paymentTxn.txID().toString());
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
  
  // Define schema
  const localInts = 0;
  const localBytes = 0;
  const globalInts = 16;
  const globalBytes = 8;
  
  // Create application
  const createTxn = algosdk.makeApplicationCreateTxnFromObject({
    from: deployer.addr,
    suggestedParams: params,
    approvalProgram: approval,
    clearProgram: clear,
    numLocalInts: localInts,
    numLocalByteSlices: localBytes,
    numGlobalInts: globalInts,
    numGlobalByteSlices: globalBytes,
    onComplete: algosdk.OnApplicationComplete.NoOpOC,
    appArgs: [
      new Uint8Array(Buffer.from('create_application')),
      algosdk.decodeAddress(admin.addr).publicKey,
    ],
    extraPages: 3, // Additional pages for box storage
  });
  
  const signedTxn = createTxn.signTxn(deployer.sk);
  const txId = await algodClient.sendRawTransaction(signedTxn).do();
  const confirmedTxn = await waitForConfirmation(algodClient, txId.txId);
  
  const appId = confirmedTxn['application-index'];
  const appAddress = algosdk.getApplicationAddress(appId);
  
  // Fund the application account with minimum balance
  await fundAccount(algodClient, deployer, appAddress, 1_000_000); // 1 ALGO for MBR
  
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
  const paymentTxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
    from: sender.addr,
    to: recipient,
    amount: amount,
    suggestedParams: params,
  });
  
  const signedTxn = paymentTxn.signTxn(sender.sk);
  const txId = await algodClient.sendRawTransaction(signedTxn).do();
  await waitForConfirmation(algodClient, txId.txId);
  
  return txId.txId;
}

/**
 * Call an application method
 * @param {algosdk.Algodv2} algodClient
 * @param {algosdk.Account} sender
 * @param {number} appId
 * @param {string} methodName
 * @param {Array} methodArgs
 * @param {Array<algosdk.Transaction>} additionalTxns - For atomic groups
 * @returns {Promise<object>}
 */
async function callAppMethod(algodClient, sender, appId, methodName, methodArgs = [], additionalTxns = []) {
  const params = await algodClient.getTransactionParams().do();
  
  // Encode method name and arguments
  const appArgs = [
    new Uint8Array(Buffer.from(methodName)),
    ...methodArgs.map(arg => encodeMethodArg(arg)),
  ];
  
  const appCallTxn = algosdk.makeApplicationNoOpTxnFromObject({
    from: sender.addr,
    suggestedParams: params,
    appIndex: appId,
    appArgs: appArgs,
  });
  
  let txns = [];
  let signedTxns = [];
  
  if (additionalTxns.length > 0) {
    // Atomic group with additional transactions
    txns = [...additionalTxns, appCallTxn];
    algosdk.assignGroupID(txns);
    
    // Sign all transactions
    signedTxns = txns.map(txn => txn.signTxn(sender.sk));
  } else {
    // Single transaction
    signedTxns = [appCallTxn.signTxn(sender.sk)];
  }
  
  const txId = await algodClient.sendRawTransaction(signedTxns).do();
  const confirmedTxn = await waitForConfirmation(algodClient, txId.txId);
  
  return confirmedTxn;
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
  return algosdk.makePaymentTxnWithSuggestedParamsFromObject({
    from: sender.addr,
    to: receiver,
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
  
  if (appInfo.params['global-state']) {
    for (const item of appInfo.params['global-state']) {
      const key = Buffer.from(item.key, 'base64').toString();
      let value;
      
      if (item.value.type === 1) {
        // Bytes
        value = Buffer.from(item.value.bytes, 'base64').toString();
      } else {
        // Uint
        value = item.value.uint;
      }
      
      globalState[key] = value;
    }
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
