#!/usr/bin/env node
/**
 * Deploy PredictionMarket to Algorand TestNet
 * 
 * Usage: node scripts/deploy-testnet.js [--verify]
 */

require('dotenv').config();
const {
  getAlgodClient,
  getAccount,
  compileContract,
  deployApp,
  fundAppAccount,
  saveDeployment,
  verifyDeployment,
  getAccountBalance,
  estimateDeploymentCost,
} = require('./deploy-utils');

const algosdk = require('algosdk');
const fs = require('fs');
const path = require('path');

async function main() {
  const args = process.argv.slice(2);
  const shouldVerify = args.includes('--verify');
  
  console.log('═══════════════════════════════════════════════════');
  console.log('  Algorand PredictionMarket Deployment');
  console.log('  Network: TESTNET');
  console.log('═══════════════════════════════════════════════════\n');
  
  try {
    // Get Algorand client
    const algodClient = getAlgodClient('testnet');
    
    // Get deployer account
    const account = getAccount();
    console.log(`👤 Deployer: ${account.addr}`);
    
    // Check account balance
    const balance = await getAccountBalance(algodClient, account.addr);
    const balanceInAlgo = balance / 1_000_000;
    console.log(`💰 Balance: ${balanceInAlgo.toFixed(6)} ALGO`);
    
    if (balance < 1_000_000) {
      console.log('\n⚠️  Low balance detected!');
      console.log('💡 Get TestNet ALGO from: https://bank.testnet.algorand.network/');
      throw new Error('Insufficient balance. Need at least 1 ALGO for deployment.');
    }
    
    // Load and estimate costs
    console.log('\n📋 Estimating deployment costs...');
    const { approvalProgram, clearProgram } = compileContract('prediction_market');
    
    const costs = estimateDeploymentCost(
      approvalProgram.length,
      clearProgram.length,
      100,  // Estimated 100 boxes (events + bets)
      100000  // Estimated 100KB total box storage
    );
    
    console.log(`   Transaction Fee: ${costs.transactionFee / 1_000_000} ALGO`);
    console.log(`   App Min Balance: ${costs.appMinBalance / 1_000_000} ALGO`);
    console.log(`   Program Storage: ${costs.programStorage / 1_000_000} ALGO`);
    console.log(`   Box Storage (est): ${costs.boxStorage / 1_000_000} ALGO`);
    console.log(`   Total Estimate: ${costs.total / 1_000_000} ALGO`);
    
    if (balance < costs.total) {
      console.log(`\n⚠️  Warning: Balance may be insufficient for full deployment`);
      console.log(`   You have: ${balanceInAlgo.toFixed(6)} ALGO`);
      console.log(`   Estimated need: ${(costs.total / 1_000_000).toFixed(6)} ALGO`);
      console.log('\n   Continuing with deployment...\n');
    }
    
    // Deploy application
    console.log('\n🚀 Deploying PredictionMarket application...');
    
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
        algosdk.decodeAddress(account.addr).publicKey,  // Admin address
      ]
    );
    
    console.log(`✅ Application deployed successfully!`);
    console.log(`   App ID: ${appId}`);
    console.log(`   App Address: ${appAddress}`);
    console.log(`   Transaction ID: ${txId}`);
    
    // Fund application account
    console.log('\n💰 Funding application account...');
    const fundingAmount = 1_000_000; // 1 ALGO for initial operations
    await fundAppAccount(algodClient, account, appAddress, fundingAmount);
    console.log(`✅ Application funded with ${fundingAmount / 1_000_000} ALGO`);
    
    // Save deployment info
    const deploymentInfo = {
      appId,
      appAddress,
      adminAddress: account.addr,
      contractName: 'PredictionMarket',
      deploymentTxId: txId,
      fundingTxId: txId,
    };
    
    const savedPath = saveDeployment('testnet', deploymentInfo);
    console.log(`\n📄 Deployment info saved to: ${path.relative(process.cwd(), savedPath)}`);
    
    // Verify deployment if requested
    if (shouldVerify) {
      console.log('\n🔍 Verifying deployment...');
      const verification = await verifyDeployment(algodClient, appId, account.addr);
      
      if (verification.exists) {
        console.log('✅ Application exists on-chain');
      } else {
        console.log('❌ Application not found on-chain');
      }
      
      if (verification.adminCorrect) {
        console.log('✅ Admin address verified');
      } else {
        console.log('❌ Admin address mismatch');
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
    console.log('  Deployment Complete!');
    console.log('═══════════════════════════════════════════════════');
    console.log(`📱 Application ID: ${appId}`);
    console.log(`📬 Application Address: ${appAddress}`);
    console.log(`👤 Admin Address: ${account.addr}`);
    console.log(`🌐 Network: TestNet`);
    
    console.log(`\n🔍 View on AlgoExplorer:`);
    console.log(`   https://testnet.algoexplorer.io/application/${appId}`);
    
    console.log('\n💡 Next Steps:');
    console.log(`   1. Update .env with VITE_APP_ID=${appId}`);
    console.log(`   2. Update .env with VITE_ADMIN_ADDRESS=${account.addr}`);
    console.log('   3. Fund the app account for box storage:');
    console.log(`      node scripts/fund-app.js testnet ${appAddress} 10`);
    console.log('   4. Test the application with the frontend');
    console.log('');
    
  } catch (error) {
    console.error('\n❌ Deployment failed:', error.message);
    console.error('\n💡 Troubleshooting:');
    console.error('   - Check ALGORAND_MNEMONIC in .env file');
    console.error('   - Ensure you have sufficient TestNet ALGO');
    console.error('   - Get TestNet ALGO: https://bank.testnet.algorand.network/');
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
