/**
 * Algorand PredictionMarket Deployment Script
 * 
 * Deploys the prediction_market.py contract to Algorand network
 * Supports TestNet, MainNet, and LocalNet
 */

const algosdk = require('algosdk');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Network configuration
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
 */
function getAlgodClient(network = 'testnet') {
  const config = NETWORKS[network];
  if (!config) {
    throw new Error(`Unknown network: ${network}`);
  }
  
  return new algosdk.Algodv2(config.token, config.algodUrl, config.port);
}

/**
 * Get account from mnemonic
 */
function getAccount() {
  const mnemonic = process.env.ALGORAND_MNEMONIC;
  if (!mnemonic) {
    throw new Error('ALGORAND_MNEMONIC not set in .env file');
  }
  
  return algosdk.mnemonicToSecretKey(mnemonic);
}

/**
 * Wait for transaction confirmation
 */
async function waitForConfirmation(algodClient, txId, timeout = 10) {
  let lastRound = (await algodClient.status().do())['last-round'];
  
  while (true) {
    const pendingInfo = await algodClient.pendingTransactionInformation(txId).do();
    
    if (pendingInfo['confirmed-round'] !== null && pendingInfo['confirmed-round'] > 0) {
      console.log(`✅ Transaction confirmed in round ${pendingInfo['confirmed-round']}`);
      return pendingInfo;
    }
    
    if (pendingInfo['pool-error']) {
      throw new Error(`Transaction rejected: ${pendingInfo['pool-error']}`);
    }
    
    lastRound++;
    await algodClient.statusAfterBlock(lastRound).do();
  }
}

/**
 * Compile Algorand Python contract to TEAL
 * 
 * NOTE: This requires the Algorand Python compiler (puya) to be installed
 * Install with: pip install algorand-python
 * 
 * This is a placeholder - actual compilation should be done via:
 * algokit compile py smart_contracts/prediction_market.py
 */
async function compileContract(contractPath) {
  console.log('📝 Compiling Algorand Python contract...');
  console.log('⚠️  Run: algokit compile py smart_contracts/prediction_market.py');
  console.log('');
  
  // For this deployment script, we assume the contract is already compiled
  // and the TEAL files are in smart_contracts/artifacts/
  
  const artifactsDir = path.join(__dirname, '..', 'smart_contracts', 'artifacts');
  const approvalPath = path.join(artifactsDir, 'prediction_market.approval.teal');
  const clearPath = path.join(artifactsDir, 'prediction_market.clear.teal');
  
  if (!fs.existsSync(approvalPath) || !fs.existsSync(clearPath)) {
    throw new Error(
      'Compiled TEAL files not found. Please run:\n' +
      'algokit compile py smart_contracts/prediction_market.py'
    );
  }
  
  const approvalProgram = fs.readFileSync(approvalPath, 'utf8');
  const clearProgram = fs.readFileSync(clearPath, 'utf8');
  
  console.log('✅ TEAL programs loaded');
  
  return { approvalProgram, clearProgram };
}

/**
 * Compile TEAL program with algod
 */
async function compileTealProgram(algodClient, programSource) {
  const encoder = new TextEncoder();
  const programBytes = encoder.encode(programSource);
  const compileResponse = await algodClient.compile(programBytes).do();
  
  return new Uint8Array(Buffer.from(compileResponse.result, 'base64'));
}

/**
 * Deploy the Algorand application
 */
async function deployApplication(algodClient, account, approvalProgram, clearProgram) {
  console.log('\n🚀 Deploying PredictionMarket application...');
  
  // Compile TEAL to bytecode
  const approvalProgramCompiled = await compileTealProgram(algodClient, approvalProgram);
  const clearProgramCompiled = await compileTealProgram(algodClient, clearProgram);
  
  // Define application state schema
  const numGlobalByteSlices = 1;  // admin address
  const numGlobalInts = 2;         // event_counter, bet_counter
  const numLocalByteSlices = 0;    // No local state
  const numLocalInts = 0;          // No local state
  
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
    appArgs: [
      // Pass admin address as argument
      algosdk.decodeAddress(account.addr).publicKey,
    ],
    onComplete: algosdk.OnApplicationComplete.NoOpOC,
  });
  
  // Sign transaction
  const signedTxn = txn.signTxn(account.sk);
  
  // Send transaction
  console.log('📤 Sending deployment transaction...');
  const { txId } = await algodClient.sendRawTransaction(signedTxn).do();
  console.log(`Transaction ID: ${txId}`);
  
  // Wait for confirmation
  const confirmedTxn = await waitForConfirmation(algodClient, txId);
  
  // Get application ID
  const appId = confirmedTxn['application-index'];
  console.log(`\n✨ Application deployed successfully!`);
  console.log(`📱 Application ID: ${appId}`);
  
  // Get application address
  const appAddress = algosdk.getApplicationAddress(appId);
  console.log(`📬 Application Address: ${appAddress}`);
  
  return { appId, appAddress };
}

/**
 * Fund the application account
 */
async function fundApplicationAccount(algodClient, account, appAddress, amount) {
  console.log(`\n💰 Funding application account with ${amount / 1_000_000} ALGO...`);
  
  const params = await algodClient.getTransactionParams().do();
  
  const txn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
    from: account.addr,
    to: appAddress,
    amount,
    suggestedParams: params,
  });
  
  const signedTxn = txn.signTxn(account.sk);
  const { txId } = await algodClient.sendRawTransaction(signedTxn).do();
  
  await waitForConfirmation(algodClient, txId);
  console.log('✅ Application account funded');
}

/**
 * Save deployment information
 */
function saveDeploymentInfo(network, deploymentInfo) {
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
  console.log(`\n📄 Deployment info saved to: deployments/${network}.json`);
}

/**
 * Main deployment function
 */
async function main() {
  const network = process.argv[2] || 'testnet';
  
  console.log('═══════════════════════════════════════════════════');
  console.log('  Algorand PredictionMarket Deployment');
  console.log(`  Network: ${network.toUpperCase()}`);
  console.log('═══════════════════════════════════════════════════\n');
  
  // Validate network
  if (!NETWORKS[network]) {
    console.error(`❌ Invalid network: ${network}`);
    console.error('Valid options: testnet, mainnet, localnet');
    process.exit(1);
  }
  
  // Safety check for mainnet
  if (network === 'mainnet') {
    console.log('⚠️  WARNING: Deploying to MAINNET');
    console.log('⚠️  This will use real ALGO tokens');
    console.log('⚠️  Press Ctrl+C to cancel, or wait 5 seconds to continue...\n');
    await new Promise(resolve => setTimeout(resolve, 5000));
  }
  
  try {
    // Get Algorand client
    const algodClient = getAlgodClient(network);
    
    // Get deployer account
    const account = getAccount();
    console.log(`👤 Deployer: ${account.addr}\n`);
    
    // Check account balance
    const accountInfo = await algodClient.accountInformation(account.addr).do();
    const balance = accountInfo.amount / 1_000_000;
    console.log(`💰 Account Balance: ${balance} ALGO`);
    
    if (balance < 1) {
      throw new Error('Insufficient balance. Need at least 1 ALGO for deployment.');
    }
    
    // Compile contract
    const { approvalProgram, clearProgram } = await compileContract();
    
    // Deploy application
    const { appId, appAddress } = await deployApplication(
      algodClient,
      account,
      approvalProgram,
      clearProgram
    );
    
    // Fund application account (minimum balance + operational funds)
    // Box storage requires additional minimum balance
    const fundingAmount = 1_000_000; // 1 ALGO for initial operations
    await fundApplicationAccount(algodClient, account, appAddress, fundingAmount);
    
    // Save deployment info
    const deploymentInfo = {
      appId,
      appAddress,
      adminAddress: account.addr,
      contractName: 'PredictionMarket',
    };
    
    saveDeploymentInfo(network, deploymentInfo);
    
    // Print summary
    console.log('\n═══════════════════════════════════════════════════');
    console.log('  Deployment Complete!');
    console.log('═══════════════════════════════════════════════════');
    console.log(`📱 Application ID: ${appId}`);
    console.log(`📬 Application Address: ${appAddress}`);
    console.log(`👤 Admin Address: ${account.addr}`);
    console.log(`🌐 Network: ${network}`);
    
    if (network === 'testnet') {
      console.log(`\n🔍 View on AlgoExplorer:`);
      console.log(`   https://testnet.algoexplorer.io/application/${appId}`);
    } else if (network === 'mainnet') {
      console.log(`\n🔍 View on AlgoExplorer:`);
      console.log(`   https://algoexplorer.io/application/${appId}`);
    }
    
    console.log('\n💡 Next Steps:');
    console.log('   1. Update .env with VITE_APP_ID=' + appId);
    console.log('   2. Update .env with VITE_ADMIN_ADDRESS=' + account.addr);
    console.log('   3. Test the application with the frontend');
    console.log('');
    
  } catch (error) {
    console.error('\n❌ Deployment failed:', error.message);
    process.exit(1);
  }
}

// Run deployment
if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = {
  getAlgodClient,
  getAccount,
  deployApplication,
  saveDeploymentInfo,
};
