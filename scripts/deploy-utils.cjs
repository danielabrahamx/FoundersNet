/**
 * Algorand Deployment Utilities
 * 
 * Reusable functions for deploying and managing Algorand smart contracts
 */

const algosdk = require('algosdk');
const fs = require('fs');
const path = require('path');

/**
 * Network configurations
 */
const NETWORKS = {
  testnet: {
    algodUrl: process.env.ALGORAND_TESTNET_URL || 'https://testnet-api.algonode.cloud',
    indexerUrl: process.env.ALGORAND_TESTNET_INDEXER_URL || 'https://testnet-idx.algonode.cloud',
    port: '',
    token: '',
  },
  mainnet: {
    algodUrl: process.env.ALGORAND_MAINNET_URL || 'https://mainnet-api.algonode.cloud',
    indexerUrl: process.env.ALGORAND_MAINNET_INDEXER_URL || 'https://mainnet-idx.algonode.cloud',
    port: '',
    token: '',
  },
  localnet: {
    algodUrl: process.env.ALGORAND_LOCALNET_URL || 'http://localhost',
    indexerUrl: 'http://localhost:8980',
    port: '4001',
    token: 'a'.repeat(64),
  },
};

/**
 * Get Algorand client for specified network
 * @param {string} network - Network name (testnet, mainnet, localnet)
 * @returns {algosdk.Algodv2} Algod client
 */
function getAlgodClient(network = 'testnet') {
  const config = NETWORKS[network];
  if (!config) {
    throw new Error(`Unknown network: ${network}. Valid options: testnet, mainnet, localnet`);
  }
  
  return new algosdk.Algodv2(config.token, config.algodUrl, config.port);
}

/**
 * Get Indexer client for specified network
 * @param {string} network - Network name (testnet, mainnet, localnet)
 * @returns {algosdk.Indexer} Indexer client
 */
function getIndexerClient(network = 'testnet') {
  const config = NETWORKS[network];
  if (!config) {
    throw new Error(`Unknown network: ${network}. Valid options: testnet, mainnet, localnet`);
  }
  
  return new algosdk.Indexer(config.token, config.indexerUrl, config.port);
}

/**
 * Get account from mnemonic
 * @param {string} mnemonic - Optional mnemonic phrase (defaults to env variable)
 * @returns {Object} Account object with address and secret key
 */
function getAccount(mnemonic = null) {
  const mnemonicPhrase = mnemonic || process.env.ALGORAND_MNEMONIC;
  if (!mnemonicPhrase) {
    throw new Error('ALGORAND_MNEMONIC not set in .env file');
  }
  
  return algosdk.mnemonicToSecretKey(mnemonicPhrase);
}

/**
 * Wait for transaction confirmation
 * @param {algosdk.Algodv2} algodClient - Algod client
 * @param {string} txId - Transaction ID
 * @param {number} timeout - Maximum number of rounds to wait
 * @returns {Promise<Object>} Confirmed transaction info
 */
async function waitForConfirmation(algodClient, txId, timeout = 10) {
  let lastRound = (await algodClient.status().do())['last-round'];
  
  while (true) {
    const pendingInfo = await algodClient.pendingTransactionInformation(txId).do();
    
    if (pendingInfo['confirmed-round'] !== null && pendingInfo['confirmed-round'] > 0) {
      return pendingInfo;
    }
    
    if (pendingInfo['pool-error']) {
      throw new Error(`Transaction rejected: ${pendingInfo['pool-error']}`);
    }
    
    lastRound++;
    await algodClient.statusAfterBlock(lastRound).do();
    
    if (lastRound > (await algodClient.status().do())['last-round'] + timeout) {
      throw new Error('Transaction confirmation timeout');
    }
  }
}

/**
 * Compile contract from TEAL files
 * @param {string} contractName - Name of the contract (without extension)
 * @returns {Object} Approval and clear programs
 */
function compileContract(contractName = 'prediction_market') {
  // Files are compiled directly to smart_contracts folder, not artifacts
  const contractsDir = path.join(__dirname, '..', 'smart_contracts');
  
  // Convert prediction_market to PredictionMarket (capitalized)
  const capitalizedName = contractName.split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');
  
  const approvalPath = path.join(contractsDir, `${capitalizedName}.approval.teal`);
  const clearPath = path.join(contractsDir, `${capitalizedName}.clear.teal`);
  
  if (!fs.existsSync(approvalPath) || !fs.existsSync(clearPath)) {
    throw new Error(
      `Compiled TEAL files not found for contract: ${contractName}\n` +
      `Expected files:\n` +
      `  - ${approvalPath}\n` +
      `  - ${clearPath}\n` +
      `Please run: npm run compile:algorand`
    );
  }
  
  const approvalProgram = fs.readFileSync(approvalPath, 'utf8');
  const clearProgram = fs.readFileSync(clearPath, 'utf8');
  
  return { approvalProgram, clearProgram };
}

/**
 * Compile TEAL program to bytecode
 * @param {algosdk.Algodv2} algodClient - Algod client
 * @param {string} programSource - TEAL source code
 * @returns {Promise<Uint8Array>} Compiled bytecode
 */
async function compileTealProgram(algodClient, programSource) {
  const encoder = new TextEncoder();
  const programBytes = encoder.encode(programSource);
  const compileResponse = await algodClient.compile(programBytes).do();
  
  return new Uint8Array(Buffer.from(compileResponse.result, 'base64'));
}

/**
 * Deploy an Algorand application
 * @param {algosdk.Algodv2} algodClient - Algod client
 * @param {Object} account - Deployer account
 * @param {string} approvalProgram - TEAL approval program
 * @param {string} clearProgram - TEAL clear program
 * @param {Object} schema - Application state schema
 * @param {Array} appArgs - Optional application arguments
 * @returns {Promise<Object>} Deployment result with appId and appAddress
 */
async function deployApp(
  algodClient,
  account,
  approvalProgram,
  clearProgram,
  schema = {},
  appArgs = []
) {
  // Compile TEAL to bytecode
  const approvalProgramCompiled = await compileTealProgram(algodClient, approvalProgram);
  const clearProgramCompiled = await compileTealProgram(algodClient, clearProgram);
  
  // Default schema for PredictionMarket
  const {
    numGlobalByteSlices = 1,  // admin address
    numGlobalInts = 2,         // event_counter, bet_counter
    numLocalByteSlices = 0,    // No local state
    numLocalInts = 0,          // No local state
  } = schema;
  
  // Get transaction parameters
  const params = await algodClient.getTransactionParams().do();
  
  // Create application transaction
  const txn = algosdk.makeApplicationCreateTxnFromObject({
    from: account.addr,
    suggestedParams: params,
    approvalProgram: approvalProgramCompiled,
    clearProgram: clearProgramCompiled,
    numGlobalByteSlices,
    numGlobalInts,
    numLocalByteSlices,
    numLocalInts,
    appArgs,
    onComplete: algosdk.OnApplicationComplete.NoOpOC,
  });
  
  // Sign transaction
  const signedTxn = txn.signTxn(account.sk);
  
  // Send transaction
  const { txId } = await algodClient.sendRawTransaction(signedTxn).do();
  
  // Wait for confirmation
  const confirmedTxn = await waitForConfirmation(algodClient, txId);
  
  // Get application ID
  const appId = confirmedTxn['application-index'];
  const appAddress = algosdk.getApplicationAddress(appId);
  
  return { appId, appAddress, txId };
}

/**
 * Initialize application with setup call
 * @param {algosdk.Algodv2} algodClient - Algod client
 * @param {Object} account - Admin account
 * @param {number} appId - Application ID
 * @param {Array} initArgs - Initialization arguments
 * @returns {Promise<Object>} Transaction confirmation
 */
async function initializeApp(algodClient, account, appId, initArgs = []) {
  const params = await algodClient.getTransactionParams().do();
  
  const txn = algosdk.makeApplicationNoOpTxnFromObject({
    from: account.addr,
    suggestedParams: params,
    appIndex: appId,
    appArgs: initArgs,
  });
  
  const signedTxn = txn.signTxn(account.sk);
  const { txId } = await algodClient.sendRawTransaction(signedTxn).do();
  
  return await waitForConfirmation(algodClient, txId);
}

/**
 * Fund an application account
 * @param {algosdk.Algodv2} algodClient - Algod client
 * @param {Object} account - Sender account
 * @param {string} appAddress - Application address to fund
 * @param {number} amount - Amount in microAlgos
 * @returns {Promise<Object>} Transaction confirmation
 */
async function fundAppAccount(algodClient, account, appAddress, amount) {
  const params = await algodClient.getTransactionParams().do();
  
  const txn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
    from: account.addr,
    to: appAddress,
    amount,
    suggestedParams: params,
  });
  
  const signedTxn = txn.signTxn(account.sk);
  const { txId } = await algodClient.sendRawTransaction(signedTxn).do();
  
  return await waitForConfirmation(algodClient, txId);
}

/**
 * Save deployment information to file
 * @param {string} network - Network name
 * @param {Object} deploymentInfo - Deployment information
 */
function saveDeployment(network, deploymentInfo) {
  const deploymentsDir = path.join(__dirname, '..', 'deployments');
  
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }
  
  const filePath = path.join(deploymentsDir, `${network}.json`);
  
  const data = {
    ...deploymentInfo,
    timestamp: new Date().toISOString(),
    network,
  };
  
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  
  return filePath;
}

/**
 * Load deployment information from file
 * @param {string} network - Network name
 * @returns {Object|null} Deployment information or null if not found
 */
function loadDeployment(network) {
  const deploymentsDir = path.join(__dirname, '..', 'deployments');
  const filePath = path.join(deploymentsDir, `${network}.json`);
  
  if (!fs.existsSync(filePath)) {
    return null;
  }
  
  const data = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(data);
}

/**
 * Verify deployment by checking application exists and state
 * @param {algosdk.Algodv2} algodClient - Algod client
 * @param {number} appId - Application ID
 * @param {string} expectedAdmin - Expected admin address
 * @returns {Promise<Object>} Verification result
 */
async function verifyDeployment(algodClient, appId, expectedAdmin) {
  const results = {
    exists: false,
    adminCorrect: false,
    globalState: null,
    errors: [],
  };
  
  try {
    // Get application info
    const appInfo = await algodClient.getApplicationByID(appId).do();
    results.exists = true;
    
    // Parse global state
    const globalState = {};
    if (appInfo.params && appInfo.params['global-state']) {
      for (const item of appInfo.params['global-state']) {
        const key = Buffer.from(item.key, 'base64').toString();
        
        if (item.value.type === 1) {
          // Bytes
          globalState[key] = Buffer.from(item.value.bytes, 'base64').toString('base64');
        } else if (item.value.type === 2) {
          // Uint
          globalState[key] = item.value.uint;
        }
      }
    }
    results.globalState = globalState;
    
    // Verify admin address
    if (globalState.admin) {
      const adminBytes = Buffer.from(globalState.admin, 'base64');
      const adminAddr = algosdk.encodeAddress(adminBytes);
      results.adminCorrect = (adminAddr === expectedAdmin);
      
      if (!results.adminCorrect) {
        results.errors.push(`Admin mismatch: expected ${expectedAdmin}, got ${adminAddr}`);
      }
    } else {
      results.errors.push('Admin address not found in global state');
    }
    
  } catch (error) {
    results.errors.push(`Failed to verify deployment: ${error.message}`);
  }
  
  return results;
}

/**
 * Read application global state
 * @param {algosdk.Algodv2} algodClient - Algod client
 * @param {number} appId - Application ID
 * @returns {Promise<Object>} Global state key-value pairs
 */
async function readGlobalState(algodClient, appId) {
  const appInfo = await algodClient.getApplicationByID(appId).do();
  const globalState = {};
  
  if (appInfo.params && appInfo.params['global-state']) {
    for (const item of appInfo.params['global-state']) {
      const key = Buffer.from(item.key, 'base64').toString();
      
      if (item.value.type === 1) {
        // Bytes
        globalState[key] = Buffer.from(item.value.bytes, 'base64');
      } else if (item.value.type === 2) {
        // Uint
        globalState[key] = item.value.uint;
      }
    }
  }
  
  return globalState;
}

/**
 * Get account balance
 * @param {algosdk.Algodv2} algodClient - Algod client
 * @param {string} address - Account address
 * @returns {Promise<number>} Balance in microAlgos
 */
async function getAccountBalance(algodClient, address) {
  const accountInfo = await algodClient.accountInformation(address).do();
  return accountInfo.amount;
}

/**
 * Calculate minimum balance requirement for box storage
 * @param {number} numBoxes - Number of boxes
 * @param {number} totalBoxBytes - Total bytes in all boxes
 * @returns {number} Minimum balance in microAlgos
 */
function calculateBoxMinBalance(numBoxes, totalBoxBytes) {
  // Algorand box storage formula:
  // 2500 microAlgos per box + 400 microAlgos per byte
  return (2500 * numBoxes) + (400 * totalBoxBytes);
}

/**
 * Estimate deployment costs
 * @param {number} approvalProgramSize - Size of approval program in bytes
 * @param {number} clearProgramSize - Size of clear program in bytes
 * @param {number} estimatedBoxes - Estimated number of boxes
 * @param {number} estimatedBoxBytes - Estimated total box bytes
 * @returns {Object} Cost breakdown in microAlgos
 */
function estimateDeploymentCost(
  approvalProgramSize,
  clearProgramSize,
  estimatedBoxes = 100,
  estimatedBoxBytes = 100000
) {
  const txnFee = 1000; // Base transaction fee
  const appMinBalance = 100000; // 0.1 ALGO minimum for app account
  const programStorage = (approvalProgramSize + clearProgramSize) * 50; // 50 microAlgos per byte
  const boxStorage = calculateBoxMinBalance(estimatedBoxes, estimatedBoxBytes);
  
  return {
    transactionFee: txnFee,
    appMinBalance,
    programStorage,
    boxStorage,
    total: txnFee + appMinBalance + programStorage + boxStorage,
  };
}

module.exports = {
  // Client setup
  getAlgodClient,
  getIndexerClient,
  getAccount,
  
  // Contract operations
  compileContract,
  compileTealProgram,
  deployApp,
  initializeApp,
  fundAppAccount,
  
  // Deployment management
  saveDeployment,
  loadDeployment,
  verifyDeployment,
  
  // State reading
  readGlobalState,
  getAccountBalance,
  
  // Transaction helpers
  waitForConfirmation,
  
  // Cost estimation
  calculateBoxMinBalance,
  estimateDeploymentCost,
  
  // Network configs
  NETWORKS,
};
