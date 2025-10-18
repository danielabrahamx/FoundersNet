#!/usr/bin/env node
/**
 * LocalNet Account Manager
 * 
 * Creates and funds test accounts on LocalNet for development
 * 
 * Usage: node scripts/localnet-accounts.js [--count 5]
 */

require('dotenv').config();
const algosdk = require('algosdk');
const fs = require('fs');
const path = require('path');

const DEFAULT_ACCOUNT_COUNT = 5;
const FUNDING_AMOUNT = 100_000_000; // 100 ALGO per account

/**
 * Get LocalNet algod client
 */
function getLocalNetClient() {
  return new algosdk.Algodv2(
    'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    'http://localhost',
    '4001'
  );
}

/**
 * Get dispenser account (pre-funded LocalNet account)
 */
function getDispenserAccount() {
  const mnemonic = 'auction inquiry lava second expand liberty glass involve ginger illness length room item discover ahead table doctor term tackle cement bonus profit right above catch';
  return algosdk.mnemonicToSecretKey(mnemonic);
}

/**
 * Create and fund a new account
 */
async function createAndFundAccount(algodClient, dispenser, accountName) {
  // Generate new account
  const account = algosdk.generateAccount();
  const mnemonic = algosdk.secretKeyToMnemonic(account.sk);
  
  // Fund account from dispenser
  const params = await algodClient.getTransactionParams().do();
  const fundingTxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
    from: dispenser.addr,
    to: account.addr,
    amount: FUNDING_AMOUNT,
    note: new Uint8Array(Buffer.from(`Funding ${accountName}`)),
    suggestedParams: params,
  });
  
  const signedTxn = fundingTxn.signTxn(dispenser.sk);
  const { txId } = await algodClient.sendRawTransaction(signedTxn).do();
  
  // Wait for confirmation
  await algosdk.waitForConfirmation(algodClient, txId, 4);
  
  return {
    name: accountName,
    address: account.addr,
    mnemonic: mnemonic,
    privateKey: Buffer.from(account.sk).toString('hex'),
    balance: FUNDING_AMOUNT / 1_000_000,
  };
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2);
  const countArg = args.find(arg => arg.startsWith('--count'));
  const accountCount = countArg 
    ? parseInt(countArg.split('=')[1]) 
    : DEFAULT_ACCOUNT_COUNT;
  
  console.log('═══════════════════════════════════════════════════');
  console.log('  LocalNet Account Manager');
  console.log('═══════════════════════════════════════════════════\n');
  
  try {
    // Connect to LocalNet
    console.log('🔌 Connecting to LocalNet...');
    const algodClient = getLocalNetClient();
    
    // Test connection
    try {
      await algodClient.status().do();
      console.log('✅ Connected to LocalNet\n');
    } catch (error) {
      throw new Error(
        'Failed to connect to LocalNet.\n' +
        '   Make sure LocalNet is running: algokit localnet start'
      );
    }
    
    // Get dispenser account
    const dispenser = getDispenserAccount();
    console.log(`💰 Dispenser Account: ${dispenser.addr}`);
    
    const dispenserInfo = await algodClient.accountInformation(dispenser.addr).do();
    console.log(`   Balance: ${dispenserInfo.amount / 1_000_000} ALGO\n`);
    
    // Create accounts
    console.log(`👥 Creating ${accountCount} test accounts...\n`);
    
    const accounts = [];
    for (let i = 1; i <= accountCount; i++) {
      process.stdout.write(`   Creating Account ${i}/${accountCount}... `);
      
      const account = await createAndFundAccount(
        algodClient,
        dispenser,
        `Test Account ${i}`
      );
      
      accounts.push(account);
      console.log('✅');
    }
    
    // Save to file
    const outputPath = path.join(__dirname, '..', 'localnet-accounts.json');
    fs.writeFileSync(
      outputPath,
      JSON.stringify({ accounts, createdAt: new Date().toISOString() }, null, 2)
    );
    
    console.log(`\n💾 Accounts saved to: ${outputPath}\n`);
    
    // Display accounts
    console.log('═══════════════════════════════════════════════════');
    console.log('  Test Accounts Created');
    console.log('═══════════════════════════════════════════════════\n');
    
    accounts.forEach((account, index) => {
      console.log(`Account ${index + 1}:`);
      console.log(`  Address:  ${account.address}`);
      console.log(`  Balance:  ${account.balance} ALGO`);
      console.log(`  Mnemonic: ${account.mnemonic}`);
      console.log('');
    });
    
    console.log('═══════════════════════════════════════════════════');
    console.log('  Usage Instructions');
    console.log('═══════════════════════════════════════════════════\n');
    console.log('1. In your frontend, import these accounts:');
    console.log('   const accounts = require("./localnet-accounts.json");');
    console.log('');
    console.log('2. Let users select an account from a dropdown');
    console.log('');
    console.log('3. Sign transactions with the account private key:');
    console.log('   const account = algosdk.mnemonicToSecretKey(mnemonic);');
    console.log('   const signedTxn = txn.signTxn(account.sk);');
    console.log('');
    console.log('⚠️  THESE ACCOUNTS ARE FOR LOCALNET ONLY');
    console.log('   Never use these mnemonics on TestNet or MainNet!');
    console.log('');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.response) {
      console.error('   Response:', error.response.text);
    }
    process.exit(1);
  }
}

main();
