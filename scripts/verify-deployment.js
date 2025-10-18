#!/usr/bin/env node
/**
 * Verify Algorand PredictionMarket Deployment
 * 
 * Usage: node scripts/verify-deployment.js <network> [app-id]
 * 
 * Examples:
 *   node scripts/verify-deployment.js testnet
 *   node scripts/verify-deployment.js testnet 12345678
 *   node scripts/verify-deployment.js local
 */

require('dotenv').config();
const {
  getAlgodClient,
  loadDeployment,
  verifyDeployment,
  readGlobalState,
  getAccountBalance,
} = require('./deploy-utils');

const algosdk = require('algosdk');

/**
 * Test creating an event
 */
async function testCreateEvent(algodClient, account, appId) {
  try {
    console.log('\n🧪 Testing event creation...');
    
    const params = await algodClient.getTransactionParams().do();
    const futureTime = Math.floor(Date.now() / 1000) + 86400; // 24 hours from now
    
    const txn = algosdk.makeApplicationNoOpTxnFromObject({
      from: account.addr,
      suggestedParams: params,
      appIndex: appId,
      appArgs: [
        new Uint8Array(Buffer.from('create_event')),
        new Uint8Array(Buffer.from('Test Event')),
        algosdk.encodeUint64(futureTime),
      ],
    });
    
    const signedTxn = txn.signTxn(account.sk);
    const { txId } = await algodClient.sendRawTransaction(signedTxn).do();
    
    // Wait for confirmation
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('✅ Event creation call succeeded');
    console.log(`   Transaction ID: ${txId}`);
    
    return true;
  } catch (error) {
    console.log('❌ Event creation failed:', error.message);
    return false;
  }
}

/**
 * Run comprehensive verification
 */
async function runVerification(network, appId = null) {
  console.log('═══════════════════════════════════════════════════');
  console.log('  Algorand Deployment Verification');
  console.log(`  Network: ${network.toUpperCase()}`);
  console.log('═══════════════════════════════════════════════════\n');
  
  try {
    // Get Algorand client
    const algodClient = getAlgodClient(network);
    
    // Load deployment info if app ID not provided
    let deploymentInfo;
    if (!appId) {
      console.log('📂 Loading deployment info...');
      deploymentInfo = loadDeployment(network);
      
      if (!deploymentInfo) {
        throw new Error(
          `No deployment found for ${network}.\n` +
          `   Please deploy first or provide an app ID.`
        );
      }
      
      appId = deploymentInfo.appId;
      console.log(`✅ Loaded deployment: App ID ${appId}`);
    } else {
      console.log(`📱 Verifying App ID: ${appId}`);
    }
    
    // Basic verification
    console.log('\n🔍 Running basic verification...');
    const verification = await verifyDeployment(
      algodClient,
      appId,
      deploymentInfo?.adminAddress || null
    );
    
    if (!verification.exists) {
      throw new Error(`Application ${appId} not found on ${network}`);
    }
    console.log('✅ Application exists on-chain');
    
    // Get application info
    const appInfo = await algodClient.getApplicationByID(appId).do();
    const appAddress = algosdk.getApplicationAddress(appId);
    
    console.log('\n📊 Application Details:');
    console.log(`   App ID: ${appId}`);
    console.log(`   App Address: ${appAddress}`);
    console.log(`   Creator: ${appInfo.params.creator}`);
    
    // Check balance
    const balance = await getAccountBalance(algodClient, appAddress);
    console.log(`   Balance: ${(balance / 1_000_000).toFixed(6)} ALGO`);
    
    if (balance < 100000) {
      console.log('   ⚠️  Warning: Low balance, may need funding for operations');
    }
    
    // Display global state
    console.log('\n📊 Global State:');
    const globalState = await readGlobalState(algodClient, appId);
    
    if (Object.keys(globalState).length === 0) {
      console.log('   (empty - may need initialization)');
    } else {
      for (const [key, value] of Object.entries(globalState)) {
        if (key === 'admin' && Buffer.isBuffer(value)) {
          const adminAddr = algosdk.encodeAddress(value);
          console.log(`   ${key}: ${adminAddr}`);
          
          if (deploymentInfo?.adminAddress && adminAddr !== deploymentInfo.adminAddress) {
            console.log('   ⚠️  Warning: Admin address mismatch!');
          } else if (deploymentInfo?.adminAddress) {
            console.log('   ✅ Admin address verified');
          }
        } else {
          console.log(`   ${key}: ${value}`);
        }
      }
    }
    
    // Program details
    if (appInfo.params['approval-program'] && appInfo.params['clear-state-program']) {
      const approvalSize = Buffer.from(appInfo.params['approval-program'], 'base64').length;
      const clearSize = Buffer.from(appInfo.params['clear-state-program'], 'base64').length;
      
      console.log('\n📝 Program Details:');
      console.log(`   Approval Program: ${approvalSize} bytes`);
      console.log(`   Clear Program: ${clearSize} bytes`);
    }
    
    // State schema
    const globalSchema = appInfo.params['global-state-schema'];
    const localSchema = appInfo.params['local-state-schema'];
    
    console.log('\n📐 State Schema:');
    console.log(`   Global: ${globalSchema['num-byte-slice']} byte slices, ${globalSchema['num-uint']} uints`);
    console.log(`   Local: ${localSchema['num-byte-slice']} byte slices, ${localSchema['num-uint']} uints`);
    
    // Verification summary
    console.log('\n═══════════════════════════════════════════════════');
    console.log('  Verification Summary');
    console.log('═══════════════════════════════════════════════════');
    
    const checks = [
      { name: 'Application exists', passed: verification.exists },
      { name: 'Admin address correct', passed: verification.adminCorrect },
      { name: 'Sufficient balance', passed: balance >= 100000 },
      { name: 'Global state initialized', passed: Object.keys(globalState).length > 0 },
    ];
    
    checks.forEach(check => {
      const icon = check.passed ? '✅' : '❌';
      console.log(`${icon} ${check.name}`);
    });
    
    const allPassed = checks.every(c => c.passed);
    
    if (allPassed) {
      console.log('\n🎉 All verification checks passed!');
    } else {
      console.log('\n⚠️  Some verification checks failed');
    }
    
    // Network-specific explorer links
    if (network === 'testnet') {
      console.log(`\n🔍 View on AlgoExplorer:`);
      console.log(`   https://testnet.algoexplorer.io/application/${appId}`);
    } else if (network === 'mainnet') {
      console.log(`\n🔍 View on AlgoExplorer:`);
      console.log(`   https://algoexplorer.io/application/${appId}`);
    }
    
    console.log('');
    
  } catch (error) {
    console.error('\n❌ Verification failed:', error.message);
    console.error('');
    process.exit(1);
  }
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('Usage: node scripts/verify-deployment.js <network> [app-id]');
    console.log('');
    console.log('Examples:');
    console.log('  node scripts/verify-deployment.js testnet');
    console.log('  node scripts/verify-deployment.js testnet 12345678');
    console.log('  node scripts/verify-deployment.js local');
    console.log('');
    process.exit(1);
  }
  
  const network = args[0];
  const appId = args[1] ? parseInt(args[1]) : null;
  
  await runVerification(network, appId);
}

// Run verification
if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { runVerification };
