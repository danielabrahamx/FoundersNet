#!/usr/bin/env node
/**
 * Verify TestNet Deployment
 * Confirms the deployed contract is operational
 */

import algosdk from 'algosdk';
import dotenv from 'dotenv';

dotenv.config();

async function main() {
  console.log('═══════════════════════════════════════════════════');
  console.log('  Verifying TestNet Deployment');
  console.log('═══════════════════════════════════════════════════\n');

  try {
    // Setup client
    const algodClient = new algosdk.Algodv2('', 'https://testnet-api.algonode.cloud', 443);
    
    const appId = parseInt(process.env.VITE_ALGORAND_APP_ID);
    const adminAddress = process.env.VITE_ALGORAND_ADMIN_ADDRESS;

    console.log('📋 Deployment Info:');
    console.log(`   App ID: ${appId}`);
    console.log(`   Admin: ${adminAddress}`);
    console.log();

    // Get application info
    console.log('🔍 Fetching application details...');
    const appInfo = await algodClient.getApplicationByID(appId).do();
    
    console.log('✅ Application found!');
    console.log(`   Created: Round ${appInfo.params['created-at-round']}`);
    console.log(`   Creator: ${appInfo.params.creator}`);
    console.log();

    // Get global state
    const globalState = appInfo.params['global-state'] || [];
    console.log('📊 Global State:');
    globalState.forEach(item => {
      const key = Buffer.from(item.key, 'base64').toString();
      let value;
      if (item.value.type === 1) {
        value = item.value.bytes;
      } else {
        value = item.value.uint;
      }
      console.log(`   ${key}: ${value}`);
    });
    console.log();

    // Get app account info
    const appAddress = algosdk.getApplicationAddress(appId);
    console.log(`📱 Application Account: ${appAddress}`);
    
    const appAccount = await algodClient.accountInformation(appAddress).do();
    const balance = appAccount.amount / 1_000_000;
    console.log(`💰 Balance: ${balance.toFixed(6)} ALGO`);
    console.log();

    // Verification summary
    console.log('═══════════════════════════════════════════════════');
    console.log('  ✅ VERIFICATION COMPLETE');
    console.log('═══════════════════════════════════════════════════');
    console.log();
    console.log('🎯 Contract Status: OPERATIONAL');
    console.log('🔗 Explorer: https://testnet.algoexplorer.io/application/' + appId);
    console.log();
    console.log('📱 Next Steps:');
    console.log('   1. Run: npm run dev');
    console.log('   2. Open browser to localhost');
    console.log('   3. Connect Pera Wallet');
    console.log('   4. Start creating events and placing bets!');
    console.log();

  } catch (error) {
    console.error('❌ Verification failed:', error.message);
    process.exit(1);
  }
}

main();
