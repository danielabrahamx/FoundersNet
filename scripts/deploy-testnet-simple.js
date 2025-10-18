#!/usr/bin/env node
/**
 * Simple TestNet Deployment Script
 * Deploys the compiled PredictionMarket contract to Algorand TestNet
 */

import dotenv from 'dotenv';
import algosdk from 'algosdk';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

async function main() {
  console.log('═══════════════════════════════════════════════════');
  console.log('  Algorand PredictionMarket Deployment');
  console.log('  Network: TESTNET');
  console.log('═══════════════════════════════════════════════════\n');

  try {
    // Setup Algod client for TestNet
    const algodToken = '';
    const algodServer = 'https://testnet-api.algonode.cloud';
    const algodPort = 443;
    const algodClient = new algosdk.Algodv2(algodToken, algodServer, algodPort);

    // Get deployer account from mnemonic
    const mnemonic = process.env.ALGORAND_DEPLOYER_MNEMONIC;
    if (!mnemonic) {
      throw new Error('ALGORAND_DEPLOYER_MNEMONIC not found in .env file');
    }

    const account = algosdk.mnemonicToSecretKey(mnemonic);
    console.log(`👤 Deployer: ${account.addr}`);

    // Check account balance
    const accountInfo = await algodClient.accountInformation(account.addr).do();
    const balance = accountInfo.amount;
    const balanceInAlgo = balance / 1_000_000;
    console.log(`💰 Balance: ${balanceInAlgo.toFixed(6)} ALGO`);

    if (balance < 1_000_000) {
      console.log('\n⚠️  Low balance detected!');
      console.log('💡 Get TestNet ALGO from: https://bank.testnet.algorand.network/');
      console.log(`   Your address: ${account.addr}`);
      throw new Error('Insufficient balance. Need at least 1 ALGO for deployment.');
    }

    // Read compiled TEAL programs
    const projectRoot = path.resolve(__dirname, '..');
    const approvalPath = path.join(projectRoot, 'smart_contracts', 'PredictionMarket.approval.teal');
    const clearPath = path.join(projectRoot, 'smart_contracts', 'PredictionMarket.clear.teal');
    const arc56Path = path.join(projectRoot, 'smart_contracts', 'PredictionMarket.arc56.json');

    console.log('\n📋 Loading compiled TEAL programs...');
    const approvalProgram = fs.readFileSync(approvalPath, 'utf8');
    const clearProgram = fs.readFileSync(clearPath, 'utf8');
    const arc56Contract = JSON.parse(fs.readFileSync(arc56Path, 'utf8'));

    // Compile the programs
    console.log('🔨 Compiling programs...');
    const approvalCompileResp = await algodClient.compile(approvalProgram).do();
    const clearCompileResp = await algodClient.compile(clearProgram).do();

    const approvalBytes = new Uint8Array(Buffer.from(approvalCompileResp.result, 'base64'));
    const clearBytes = new Uint8Array(Buffer.from(clearCompileResp.result, 'base64'));

    console.log(`   Approval Program: ${approvalBytes.length} bytes`);
    console.log(`   Clear Program: ${clearBytes.length} bytes`);

    // Get suggested params
    const params = await algodClient.getTransactionParams().do();

    // Define app state schema
    const numGlobalByteSlices = 1;
    const numGlobalInts = 2;
    const numLocalByteSlices = 0;
    const numLocalInts = 0;

    // Create application
    console.log('\n🚀 Creating application...');
    
    // Use ABI encoding for the create_application method
    const abiContract = new algosdk.ABIContract(arc56Contract);
    const method = abiContract.getMethodByName('create_application');
    
    // Encode method arguments properly
    const appArgs = [
      method.getSelector(),
      algosdk.decodeAddress(account.addr).publicKey // Already a Uint8Array
    ];

    const txn = algosdk.makeApplicationCreateTxnFromObject({
      from: account.addr,
      suggestedParams: params,
      onComplete: algosdk.OnApplicationComplete.NoOpOC,
      approvalProgram: approvalBytes,
      clearProgram: clearBytes,
      numLocalInts,
      numLocalByteSlices,
      numGlobalInts,
      numGlobalByteSlices,
      appArgs,
      extraPages: 3, // Extra pages for box storage
    });

    // Sign and send transaction
    const signedTxn = txn.signTxn(account.sk);
    const { txId } = await algodClient.sendRawTransaction(signedTxn).do();
    console.log(`   Transaction ID: ${txId}`);

    // Wait for confirmation
    console.log('⏳ Waiting for confirmation...');
    const confirmedTxn = await algosdk.waitForConfirmation(algodClient, txId, 4);
    console.log(`   Confirmed in round: ${confirmedTxn['confirmed-round']}`);

    // Get app ID
    const appId = confirmedTxn['application-index'];
    const appAddress = algosdk.getApplicationAddress(appId);

    console.log('\n✅ Application deployed successfully!');
    console.log(`   App ID: ${appId}`);
    console.log(`   App Address: ${appAddress}`);
    console.log(`   Explorer: https://testnet.algoexplorer.io/application/${appId}`);

    // Fund the application account
    console.log('\n💸 Funding application account with 5 ALGO...');
    const fundingAmount = 5_000_000; // 5 ALGO
    const fundTxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
      from: account.addr,
      to: appAddress,
      amount: fundingAmount,
      suggestedParams: params,
    });

    const signedFundTxn = fundTxn.signTxn(account.sk);
    const { txId: fundTxId } = await algodClient.sendRawTransaction(signedFundTxn).do();
    await algosdk.waitForConfirmation(algodClient, fundTxId, 4);
    console.log(`   ✅ Application funded with ${fundingAmount / 1_000_000} ALGO`);

    // Save deployment info
    const deploymentInfo = {
      network: 'testnet',
      appId,
      appAddress,
      adminAddress: account.addr,
      deployedAt: new Date().toISOString(),
      txId,
      explorerUrl: `https://testnet.algoexplorer.io/application/${appId}`,
    };

    const deploymentPath = path.join(projectRoot, 'deployments', 'testnet.json');
    fs.mkdirSync(path.dirname(deploymentPath), { recursive: true });
    fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
    console.log(`\n💾 Deployment info saved to: deployments/testnet.json`);

    // Update .env file
    console.log('\n📝 Update your .env file with:');
    console.log(`   VITE_ALGORAND_APP_ID=${appId}`);
    console.log(`   VITE_ALGORAND_ADMIN_ADDRESS=${account.addr}`);

    console.log('\n═══════════════════════════════════════════════════');
    console.log('  DEPLOYMENT COMPLETE! 🎉');
    console.log('═══════════════════════════════════════════════════');

  } catch (error) {
    console.error('\n❌ Deployment failed:', error.message);
    if (error.response) {
      console.error('   Response:', error.response.body);
    }
    process.exit(1);
  }
}

main();
