#!/usr/bin/env node
/**
 * Deploy PredictionMarket to Algorand LocalNet
 * 
 * Usage: node scripts/deploy-local.js [--verify]
 * 
 * Prerequisites: 
 * - Run: algokit localnet start
 */

require('dotenv').config();
const {
  getAlgodClient,
  compileContract,
  deployApp,
  fundAppAccount,
  saveDeployment,
  verifyDeployment,
  getAccountBalance,
} = require('./deploy-utils.cjs');

const algosdk = require('algosdk');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

/**
 * Get predefined admin account for LocalNet
 */
function getAdminAccount() {
  // Use the same admin account as defined in client/src/lib/localnet-accounts.ts
  const adminMnemonic = 'artwork drive liquid candy dumb effort eternal assume main silent act seed enroll eye mimic rail skin filter obey chunk sustain claim exhaust ability melt';
  return algosdk.mnemonicToSecretKey(adminMnemonic);
}

/**
 * Create and fund a test account on LocalNet
 */
async function createLocalAccount(algodClient) {
  // Generate new account
  const account = algosdk.generateAccount();
  
  // Fund from LocalNet dispenser (default account from algokit localnet)
  const dispenserMnemonic = 'concert prison siege distance host lend orbit soccer sock pride ancient around mixed feature turtle pupil current brush explain call coil pizza surge abandon crisp';
  const dispenser = algosdk.mnemonicToSecretKey(dispenserMnemonic);
  
  const params = await algodClient.getTransactionParams().do();
  const fundingAmount = 100_000_000; // 100 ALGO
  
  const txn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
    from: dispenser.addr,
    to: account.addr,
    amount: fundingAmount,
    suggestedParams: params,
  });
  
  const signedTxn = txn.signTxn(dispenser.sk);
  const { txId } = await algodClient.sendRawTransaction(signedTxn).do();
  
  // Wait for confirmation
  await algosdk.waitForConfirmation(algodClient, txId, 4);
  
  return account;
}

async function main() {
  const args = process.argv.slice(2);
  const shouldVerify = args.includes('--verify');
  
  console.log('═══════════════════════════════════════════════════');
  console.log('  Algorand PredictionMarket Deployment');
  console.log('  Network: LOCALNET');
  console.log('═══════════════════════════════════════════════════\n');
  
  try {
    // Get Algorand client
    console.log('🔌 Connecting to LocalNet...');
    const algodClient = getAlgodClient('localnet');
    
    // Test connection
    try {
      await algodClient.status().do();
      console.log('✅ Connected to LocalNet');
    } catch (error) {
      throw new Error(
        'Failed to connect to LocalNet.\n' +
        '   Make sure LocalNet is running: algokit localnet start'
      );
    }
    
    // Use predefined admin account
    console.log('\n👤 Using predefined admin account...');
    const account = getAdminAccount();
    console.log(`   Address: ${account.addr}`);
    
    // Fund admin account if needed
    const currentBalance = await getAccountBalance(algodClient, account.addr);
    if (currentBalance < 10_000_000) { // If less than 10 ALGO
      console.log('   Funding admin account from dispenser...');
      const dispenserMnemonic = 'concert prison siege distance host lend orbit soccer sock pride ancient around mixed feature turtle pupil current brush explain call coil pizza surge abandon crisp';
      const dispenser = algosdk.mnemonicToSecretKey(dispenserMnemonic);
      
      const params = await algodClient.getTransactionParams().do();
      const fundingAmount = 100_000_000; // 100 ALGO
      
      const txn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
        from: dispenser.addr,
        to: account.addr,
        amount: fundingAmount,
        suggestedParams: params,
      });
      
      const signedTxn = txn.signTxn(dispenser.sk);
      const { txId } = await algodClient.sendRawTransaction(signedTxn).do();
      await algosdk.waitForConfirmation(algodClient, txId, 4);
    }
    
    const balance = await getAccountBalance(algodClient, account.addr);
    console.log(`   Balance: ${balance / 1_000_000} ALGO`);
    
    // Load contract
    console.log('\n📝 Loading compiled contract...');
    const { approvalProgram, clearProgram } = compileContract('prediction_market');
    console.log('✅ Contract loaded');
    
    // Deploy application
    console.log('\n🚀 Deploying PredictionMarket application...');
    
    // For ABI methods, the first 4 bytes are the method selector (hash of method signature)
    // Method signature for create_application: "create_application(address)void"
    const methodSignature = 'create_application(address)void';
    const hash = crypto.createHash('sha512-256').update(methodSignature).digest();
    const methodSelector = new Uint8Array(hash.slice(0, 4));
    
    // Encode admin address parameter (account type is encoded as 32-byte address)
    const adminAddress = new Uint8Array(algosdk.decodeAddress(account.addr).publicKey);
    
    const { appId, appAddress, txId } = await deployApp(
      algodClient,
      account,
      approvalProgram,
      clearProgram,
      {
        numGlobalByteSlices: 1,
        numGlobalInts: 2,
        numLocalByteSlices: 0,
        numLocalInts: 0,
      },
      [
        methodSelector,
        adminAddress,
      ]
    );
    
    console.log(`✅ Application deployed successfully!`);
    console.log(`   App ID: ${appId}`);
    console.log(`   App Address: ${appAddress}`);
    console.log(`   Transaction ID: ${txId}`);
    
    // Fund application account
    console.log('\n💰 Funding application account...');
    const fundingAmount = 10_000_000; // 10 ALGO for LocalNet testing
    await fundAppAccount(algodClient, account, appAddress, fundingAmount);
    console.log(`✅ Application funded with ${fundingAmount / 1_000_000} ALGO`);
    
    // Save deployment info
    const deploymentInfo = {
      appId,
      appAddress,
      adminAddress: account.addr,
      adminMnemonic: algosdk.secretKeyToMnemonic(account.sk), // Include mnemonic for LocalNet
      contractName: 'PredictionMarket',
      deploymentTxId: txId,
      fundingTxId: txId,
    };
    
    const savedPath = saveDeployment('local', deploymentInfo);
    console.log(`\n📄 Deployment info saved to: ${path.relative(process.cwd(), savedPath)}`);
    
    // Verify deployment if requested
    if (shouldVerify) {
      console.log('\n🔍 Verifying deployment...');
      const verification = await verifyDeployment(algodClient, appId, account.addr);
      
      if (verification.exists) {
        console.log('✅ Application exists on-chain');
      }
      
      if (verification.adminCorrect) {
        console.log('✅ Admin address verified');
      }
      
      if (verification.globalState) {
        console.log('\n📊 Global State:');
        console.log(JSON.stringify(verification.globalState, null, 2));
      }
      
      if (verification.errors.length > 0) {
        console.log('\n⚠️  Verification warnings:');
        verification.errors.forEach(err => console.log(`   - ${err}`));
      }
    }
    
    // Print summary
    console.log('\n═══════════════════════════════════════════════════');
    console.log('  LocalNet Deployment Complete!');
    console.log('═══════════════════════════════════════════════════');
    console.log(`📱 Application ID: ${appId}`);
    console.log(`📬 Application Address: ${appAddress}`);
    console.log(`👤 Admin Address: ${account.addr}`);
    console.log(`🔑 Admin Mnemonic: ${algosdk.secretKeyToMnemonic(account.sk)}`);
    console.log(`🌐 Network: LocalNet`);
    
    console.log('\n💡 Usage:');
    console.log(`   1. Use App ID ${appId} in your tests`);
    console.log(`   2. Use admin address ${account.addr}`);
    console.log('   3. Run tests: npm test');
    console.log('   4. Interact via frontend (update .env with above values)');
    console.log('');
    
    console.log('🔧 LocalNet Commands:');
    console.log('   Status:  algokit localnet status');
    console.log('   Reset:   algokit localnet reset');
    console.log('   Stop:    algokit localnet stop');
    console.log('');
    
  } catch (error) {
    console.error('\n❌ Deployment failed:', error.message);
    console.error('\n💡 Troubleshooting:');
    console.error('   - Start LocalNet: algokit localnet start');
    console.error('   - Check LocalNet status: algokit localnet status');
    console.error('   - Reset LocalNet: algokit localnet reset');
    console.error('   - Verify contract is compiled: npm run compile:algorand');
    console.error('');
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

module.exports = { main };
