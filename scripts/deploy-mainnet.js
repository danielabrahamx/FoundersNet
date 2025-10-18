#!/usr/bin/env node
/**
 * Deploy PredictionMarket to Algorand MainNet
 * 
 * Usage: node scripts/deploy-mainnet.js [--verify] [--skip-confirmation]
 * 
 * WARNING: This deploys to MainNet and uses real ALGO tokens
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
const path = require('path');
const readline = require('readline');

/**
 * Prompt user for confirmation
 */
function promptConfirmation(question) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y');
    });
  });
}

async function main() {
  const args = process.argv.slice(2);
  const shouldVerify = args.includes('--verify');
  const skipConfirmation = args.includes('--skip-confirmation');
  
  console.log('═══════════════════════════════════════════════════');
  console.log('  Algorand PredictionMarket Deployment');
  console.log('  Network: MAINNET');
  console.log('═══════════════════════════════════════════════════\n');
  
  console.log('⚠️  ⚠️  ⚠️  WARNING ⚠️  ⚠️  ⚠️');
  console.log('You are deploying to MAINNET');
  console.log('This will use REAL ALGO tokens');
  console.log('Make sure you have tested on TestNet first!');
  console.log('⚠️  ⚠️  ⚠️  WARNING ⚠️  ⚠️  ⚠️\n');
  
  if (!skipConfirmation) {
    console.log('Waiting 10 seconds before continuing...');
    console.log('Press Ctrl+C to cancel\n');
    await new Promise(resolve => setTimeout(resolve, 10000));
  }
  
  try {
    // Get Algorand client
    const algodClient = getAlgodClient('mainnet');
    
    // Get deployer account
    const account = getAccount();
    console.log(`👤 Deployer: ${account.addr}`);
    
    // Check account balance
    const balance = await getAccountBalance(algodClient, account.addr);
    const balanceInAlgo = balance / 1_000_000;
    console.log(`💰 Balance: ${balanceInAlgo.toFixed(6)} ALGO`);
    
    // Load and estimate costs
    console.log('\n📋 Estimating deployment costs...');
    const { approvalProgram, clearProgram } = compileContract('prediction_market');
    
    const costs = estimateDeploymentCost(
      approvalProgram.length,
      clearProgram.length,
      100,
      100000
    );
    
    console.log(`   Transaction Fee: ${costs.transactionFee / 1_000_000} ALGO`);
    console.log(`   App Min Balance: ${costs.appMinBalance / 1_000_000} ALGO`);
    console.log(`   Program Storage: ${costs.programStorage / 1_000_000} ALGO`);
    console.log(`   Box Storage (est): ${costs.boxStorage / 1_000_000} ALGO`);
    console.log(`   Total Estimate: ${costs.total / 1_000_000} ALGO`);
    
    if (balance < costs.total) {
      throw new Error(
        `Insufficient balance for deployment.\n` +
        `   You have: ${balanceInAlgo.toFixed(6)} ALGO\n` +
        `   Need: ${(costs.total / 1_000_000).toFixed(6)} ALGO`
      );
    }
    
    // Final confirmation
    if (!skipConfirmation) {
      console.log('\n⚠️  FINAL CONFIRMATION REQUIRED ⚠️');
      const confirmed = await promptConfirmation(
        '\nType "yes" to deploy to MainNet (this will use real ALGO): '
      );
      
      if (!confirmed) {
        console.log('\n❌ Deployment cancelled by user');
        process.exit(0);
      }
    }
    
    // Deploy application
    console.log('\n🚀 Deploying PredictionMarket application to MAINNET...');
    
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
        algosdk.decodeAddress(account.addr).publicKey,
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
    
    const savedPath = saveDeployment('mainnet', deploymentInfo);
    console.log(`\n📄 Deployment info saved to: ${path.relative(process.cwd(), savedPath)}`);
    
    // Verify deployment if requested
    if (shouldVerify) {
      console.log('\n🔍 Verifying deployment...');
      const verification = await verifyDeployment(algodClient, appId, account.addr);
      
      if (verification.exists && verification.adminCorrect) {
        console.log('✅ Deployment verified successfully');
      } else {
        console.log('⚠️  Verification warnings detected');
        verification.errors.forEach(err => console.log(`   - ${err}`));
      }
    }
    
    // Print summary
    console.log('\n═══════════════════════════════════════════════════');
    console.log('  MainNet Deployment Complete!');
    console.log('═══════════════════════════════════════════════════');
    console.log(`📱 Application ID: ${appId}`);
    console.log(`📬 Application Address: ${appAddress}`);
    console.log(`👤 Admin Address: ${account.addr}`);
    console.log(`🌐 Network: MainNet`);
    
    console.log(`\n🔍 View on AlgoExplorer:`);
    console.log(`   https://algoexplorer.io/application/${appId}`);
    
    console.log('\n💡 Next Steps:');
    console.log(`   1. Update .env with VITE_APP_ID=${appId}`);
    console.log(`   2. Update .env with VITE_ADMIN_ADDRESS=${account.addr}`);
    console.log(`   3. Update .env with VITE_NETWORK=mainnet`);
    console.log('   4. Fund the app account for box storage');
    console.log('   5. Monitor the application carefully');
    console.log('');
    
    console.log('🎉 Your prediction market is now live on Algorand MainNet!');
    console.log('');
    
  } catch (error) {
    console.error('\n❌ Deployment failed:', error.message);
    console.error('\n💡 Troubleshooting:');
    console.error('   - Check ALGORAND_MNEMONIC in .env file');
    console.error('   - Ensure you have sufficient MainNet ALGO');
    console.error('   - Verify contract is compiled: npm run compile:algorand');
    console.error('   - Test on TestNet first before MainNet deployment');
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
