#!/usr/bin/env node
/**
 * Fund LocalNet test accounts
 * 
 * Funds Alice, Bob, and Charlie accounts on LocalNet for testing
 */

const algosdk = require('algosdk');

async function fundAccounts() {
  console.log('💰 Funding LocalNet Test Accounts...\n');

  // Create algod client for LocalNet
  const algodClient = new algosdk.Algodv2(
    'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    'http://localhost',
    4001
  );

  // Dispenser account (pre-funded LocalNet account)
  const dispenserMnemonic = 'concert prison siege distance host lend orbit soccer sock pride ancient around mixed feature turtle pupil current brush explain call coil pizza surge abandon crisp';
  const dispenser = algosdk.mnemonicToSecretKey(dispenserMnemonic);

  // Test accounts to fund
  const accounts = [
    {
      address: '3ZH2LWCKKRU5BCAIJIIOOGJUQYUZSYLTJP6TKDGPI4JIHN2QINRDWPBDNM',
      name: 'Admin Account',
    },
    {
      address: 'FTEY5MBG3DADIXW53H7ZBPWAZLSHXSWLSPOV5AXDOZHM45S4T4JSJDOQLE',
      name: 'Alice (User 1)',
    },
    {
      address: '3IUCKSO5IH2IPGSBL4ZZXH7FEGQDCI7254ASQIBFQDPK7I7CTWOC3IP6WU',
      name: 'Bob (User 2)',
    },
    {
      address: 'YF4DZ24IGBWZT6NXVKWAAESG25UZFMYCTFF5EZHHLVRYA2ADBD2MSJVESY',
      name: 'Charlie (User 3)',
    },
  ];

  try {
    // Get transaction parameters
    const params = await algodClient.getTransactionParams().do();
    const fundingAmount = 100_000_000; // 100 ALGO

    // Fund each account
    for (const account of accounts) {
      console.log(`📤 Funding ${account.name}...`);
      
      const txn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
        from: dispenser.addr,
        to: account.address,
        amount: fundingAmount,
        suggestedParams: params,
      });

      const signedTxn = txn.signTxn(dispenser.sk);
      const { txId } = await algodClient.sendRawTransaction(signedTxn).do();
      
      // Wait for confirmation
      await algosdk.waitForConfirmation(algodClient, txId, 4);
      
      console.log(`✅ Funded ${account.name}: ${account.address}`);
      console.log(`   Amount: ${fundingAmount / 1_000_000} ALGO`);
      console.log(`   TxID: ${txId}\n`);
    }

    console.log('🎉 All accounts funded successfully!');
  } catch (error) {
    console.error('❌ Error funding accounts:', error.message);
    throw error;
  }
}

// Run the script
fundAccounts().catch((error) => {
  console.error('Failed to fund accounts:', error);
  process.exit(1);
});
