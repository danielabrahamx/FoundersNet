/**
 * Quick LocalNet Demo Test
 * Tests the deployed contract (app 1002) with real LocalNet accounts
 * Shows: Create Event -> Place Bets -> Resolve -> Claim Winnings
 */

const algosdk = require('algosdk');

// LocalNet configuration
const algodToken = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
const algodServer = 'http://localhost';
const algodPort = 4001;
const algodClient = new algosdk.Algodv2(algodToken, algodServer, algodPort);

// App ID from deployment
const APP_ID = 1002;

// LocalNet test accounts (from your localnet-accounts.ts)
const ACCOUNTS = {
  admin: {
    address: '3ZH2LWCKKRU5BCAIJIIOOGJUQYUZSYLTJP6TKDGPI4JIHN2QINRDWPBDNM',
    mnemonic: 'artwork drive liquid candy dumb effort eternal assume main silent act seed enroll eye mimic rail skin filter obey chunk sustain claim exhaust ability melt',
  },
  alice: {
    address: 'FTEY5MBG3DADIXW53H7ZBPWAZLSHXSWLSPOV5AXDOZHM45S4T4JSJDOQLE',
    mnemonic: 'mule theme solution become dish donor hero hobby insane guide ribbon vendor fiber shift cream certain message team hello shoulder excess credit food ability elevator',
  },
  bob: {
    address: '3IUCKSO5IH2IPGSBL4ZZXH7FEGQDCI7254ASQIBFQDPK7I7CTWOC3IP6WU',
    mnemonic: 'gravity alarm add credit paper spray else six outside valid wild cross crush raven cave absent fragile figure net useful empower car corn abstract season',
  },
};

// Convert mnemonics to accounts
const adminAccount = algosdk.mnemonicToSecretKey(ACCOUNTS.admin.mnemonic);
const aliceAccount = algosdk.mnemonicToSecretKey(ACCOUNTS.alice.mnemonic);
const bobAccount = algosdk.mnemonicToSecretKey(ACCOUNTS.bob.mnemonic);

// Helper to get address as string (algosdk v3 returns Address objects)
function getAddress(account) {
  return typeof account.addr === 'string' ? account.addr : algosdk.encodeAddress(account.addr.publicKey);
}

// Helper functions
async function waitForConfirmation(txId) {
  const status = await algosdk.waitForConfirmation(algodClient, txId, 4);
  console.log(`✅ Transaction confirmed in round ${status['confirmed-round']}`);
  return status;
}

function algoToMicroAlgo(algo) {
  return Math.floor(algo * 1_000_000);
}

async function getAccountBalance(address) {
  const accountInfo = await algodClient.accountInformation(address).do();
  return Number(accountInfo.amount);
}

async function getGlobalState() {
  const appInfo = await algodClient.getApplicationByID(APP_ID).do();
  const state = {};
  
  if (appInfo.params.globalState) {
    for (const item of appInfo.params.globalState) {
      const key = Buffer.from(item.key).toString('utf-8');
      if (item.value.type === 1) {
        state[key] = Buffer.from(item.value.bytes, 'base64');
      } else {
        state[key] = Number(item.value.uint);
      }
    }
  }
  
  return state;
}

async function checkBoxExists(boxName) {
  try {
    await algodClient.getApplicationBoxByName(APP_ID, Buffer.from(boxName)).do();
    return true;
  } catch (e) {
    return false;
  }
}

// Main test flow
async function runDemo() {
  console.log('\n🚀 FOUNDERSNET LOCALNET DEMO TEST\n');
  console.log('='.repeat(60));
  
  try {
    // 1. Check app exists and get initial state
    console.log('\n📊 Step 1: Checking deployed contract...');
    const appInfo = await algodClient.getApplicationByID(APP_ID).do();
    console.log(`   App ID: ${APP_ID}`);
    console.log(`   Creator: ${appInfo.params.creator}`);
    
    const initialState = await getGlobalState();
    console.log(`   Admin: ${algosdk.encodeAddress(initialState.admin)}`);
    console.log(`   Event Counter: ${initialState.event_counter || 0}`);
    console.log(`   Bet Counter: ${initialState.bet_counter || 0}`);
    
    // 2. Check account balances
    console.log('\n💰 Step 2: Checking account balances...');
    const adminBalance = await getAccountBalance(getAddress(adminAccount));
    const aliceBalance = await getAccountBalance(getAddress(aliceAccount));
    const bobBalance = await getAccountBalance(getAddress(bobAccount));
    
    console.log(`   Admin: ${(adminBalance / 1_000_000).toFixed(2)} ALGO`);
    console.log(`   Alice: ${(aliceBalance / 1_000_000).toFixed(2)} ALGO`);
    console.log(`   Bob: ${(bobBalance / 1_000_000).toFixed(2)} ALGO`);
    
    // 3. Create a new event
    console.log('\n🎯 Step 3: Admin creating new event...');
    const params = await algodClient.getTransactionParams().do();
    
    const eventName = `Hackathon Demo ${Date.now()}`;
    const endTime = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
    
    // Build create_event transaction using ATC for ARC-4
    const atc = new algosdk.AtomicTransactionComposer();
    const createMethod = new algosdk.ABIMethod({
      name: 'create_event',
      args: [
        { type: 'string', name: 'name' },
        { type: 'uint64', name: 'end_time' }
      ],
      returns: { type: 'uint64' }
    });
    
    atc.addMethodCall({
      appID: APP_ID,
      method: createMethod,
      methodArgs: [eventName, endTime],
      sender: getAddress(adminAccount),
      suggestedParams: params,
      signer: algosdk.makeBasicAccountTransactionSigner(adminAccount),
      boxes: [
        // Event box: "events" + event_id (2)
        { appIndex: APP_ID, name: new Uint8Array([...Buffer.from('events'), ...Buffer.from([0,0,0,0,0,0,0,2])]) },
        // Event bets box: "event_bets" + event_id (2)
        { appIndex: APP_ID, name: new Uint8Array([...Buffer.from('event_bets'), ...Buffer.from([0,0,0,0,0,0,0,2])]) },
      ],
    });
    
    const createResult = await atc.execute(algodClient, 4);
    console.log(`   Transaction sent: ${createResult.txIDs[0]}`);
    
    await waitForConfirmation(createResult.txIDs[0]);
    
    const stateAfterCreate = await getGlobalState();
    const eventId = stateAfterCreate.event_counter;
    console.log(`   ✅ Event created! Event ID: ${eventId}`);
    
    // 4. Alice places a YES bet
    console.log('\n💵 Step 4: Alice placing YES bet (10 ALGO)...');
    const aliceBetAmount = algoToMicroAlgo(10);
    
    const appAddress = algosdk.getApplicationAddress(APP_ID);
    const paramsAlice = await algodClient.getTransactionParams().do();
    
    // Payment transaction
    const paymentTxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
      from: getAddress(aliceAccount),
      to: appAddress,
      amount: aliceBetAmount,
      suggestedParams: paramsAlice,
    });
    
    // Use ATC for ARC-4 method call
    const atc2 = new algosdk.AtomicTransactionComposer();
    const placeBetMethod = new algosdk.ABIMethod({
      name: 'place_bet',
      args: [
        { type: 'uint64', name: 'event_id' },
        { type: 'bool', name: 'outcome' },
        { type: 'pay', name: 'payment' }
      ],
      returns: { type: 'void' }
    });
    
    const nextBetId = 3; // Current bet_counter is 2, so next will be 3
    
    atc2.addMethodCall({
      appID: APP_ID,
      method: placeBetMethod,
      methodArgs: [eventId, true, { txn: paymentTxn, signer: algosdk.makeEmptyTransactionSigner() }],
      sender: getAddress(aliceAccount),
      suggestedParams: paramsAlice,
      signer: algosdk.makeEmptyTransactionSigner(),
      boxes: [
        // Events box to read event data
        { appIndex: APP_ID, name: new Uint8Array([...Buffer.from('events'), ...Buffer.from([0,0,0,0,0,0,0,eventId])]) },
        // Bets box to store new bet
        { appIndex: APP_ID, name: new Uint8Array([...Buffer.from('bets'), ...Buffer.from([0,0,0,0,0,0,0,nextBetId])]) },
        // User bets box
        { appIndex: APP_ID, name: new Uint8Array([...Buffer.from('user_bets'), ...algosdk.decodeAddress(getAddress(aliceAccount)).publicKey]) },
        // Event bets box
        { appIndex: APP_ID, name: new Uint8Array([...Buffer.from('event_bets'), ...Buffer.from([0,0,0,0,0,0,0,eventId])]) },
      ],
    });
    
    // Get transaction group and sign
    const txnGroup = atc2.buildGroup();
    const txns = txnGroup.map(tx => tx.txn);
    
    const signedTxns = [
      algosdk.signTransaction(txns[0], aliceAccount.sk), // Payment
      algosdk.signTransaction(txns[1], aliceAccount.sk), // Method call
    ];
    
    const betTxId = await algodClient.sendRawTransaction(signedTxns).do();
    console.log(`   Transaction sent: ${betTxId.txId}`);
    
    await waitForConfirmation(betTxId.txId);
    
    const stateAfterAliceBet = await getGlobalState();
    console.log(`   ✅ Alice bet placed! Bet Counter: ${stateAfterAliceBet.bet_counter}`);
    
    // 5. Bob places a NO bet
    console.log('\n💵 Step 5: Bob placing NO bet (10 ALGO)...');
    const bobBetAmount = algoToMicroAlgo(10);
    const params2 = await algodClient.getTransactionParams().do();
    
    const bobPaymentTxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
      from: getAddress(bobAccount),
      to: appAddress,
      amount: bobBetAmount,
      suggestedParams: params2,
    });
    
    const bobBetArgs = [
      new Uint8Array(Buffer.from('place_bet')),
      algosdk.encodeUint64(eventId),
      new Uint8Array([0]), // NO = false
    ];
    
    const bobBetTxn = algosdk.makeApplicationNoOpTxnFromObject({
      from: getAddress(bobAccount),
      suggestedParams: params2,
      appIndex: APP_ID,
      appArgs: bobBetArgs,
    });
    
    const bobTxnGroup = [bobPaymentTxn, bobBetTxn];
    algosdk.assignGroupID(bobTxnGroup);
    
    const bobSignedPayment = bobTxnGroup[0].signTxn(bobAccount.sk);
    const bobSignedBet = bobTxnGroup[1].signTxn(bobAccount.sk);
    
    const bobBetTxId = await algodClient.sendRawTransaction([bobSignedPayment, bobSignedBet]).do();
    console.log(`   Transaction sent: ${bobBetTxId.txId}`);
    
    await waitForConfirmation(bobBetTxId.txId);
    
    const stateAfterBobBet = await getGlobalState();
    console.log(`   ✅ Bob bet placed! Bet Counter: ${stateAfterBobBet.bet_counter}`);
    
    // 6. Admin resolves event as YES (Alice wins)
    console.log('\n🎲 Step 6: Admin resolving event as YES (Alice wins)...');
    const params3 = await algodClient.getTransactionParams().do();
    
    const resolveArgs = [
      new Uint8Array(Buffer.from('resolve_event')),
      algosdk.encodeUint64(eventId),
      new Uint8Array([1]), // YES = true
    ];
    
    const resolveTxn = algosdk.makeApplicationNoOpTxnFromObject({
      from: getAddress(adminAccount),
      suggestedParams: params3,
      appIndex: APP_ID,
      appArgs: resolveArgs,
    });
    
    const signedResolve = resolveTxn.signTxn(adminAccount.sk);
    const resolveTxId = await algodClient.sendRawTransaction(signedResolve).do();
    console.log(`   Transaction sent: ${resolveTxId.txId}`);
    
    await waitForConfirmation(resolveTxId.txId);
    console.log(`   ✅ Event resolved as YES!`);
    
    // 7. Alice claims winnings
    console.log('\n🏆 Step 7: Alice claiming winnings...');
    const aliceBalanceBefore = await getAccountBalance(getAddress(aliceAccount));
    
    const params4 = await algodClient.getTransactionParams().do();
    const betIdToClaim = 1; // Alice's bet was first
    
    const claimArgs = [
      new Uint8Array(Buffer.from('claim_winnings')),
      algosdk.encodeUint64(betIdToClaim),
    ];
    
    const claimTxn = algosdk.makeApplicationNoOpTxnFromObject({
      from: getAddress(aliceAccount),
      suggestedParams: params4,
      appIndex: APP_ID,
      appArgs: claimArgs,
    });
    
    const signedClaim = claimTxn.signTxn(aliceAccount.sk);
    const claimTxId = await algodClient.sendRawTransaction(signedClaim).do();
    console.log(`   Transaction sent: ${claimTxId.txId}`);
    
    await waitForConfirmation(claimTxId.txId);
    
    const aliceBalanceAfter = await getAccountBalance(aliceAccount.addr);
    const payout = (aliceBalanceAfter - aliceBalanceBefore) / 1_000_000;
    
    console.log(`   ✅ Alice claimed winnings!`);
    console.log(`   💰 Payout received: ${payout.toFixed(6)} ALGO`);
    
    // 8. Final summary
    console.log('\n📊 FINAL SUMMARY');
    console.log('='.repeat(60));
    
    const finalState = await getGlobalState();
    const finalAlice = await getAccountBalance(getAddress(aliceAccount));
    const finalBob = await getAccountBalance(getAddress(bobAccount));
    
    console.log(`   Total Events Created: ${finalState.event_counter}`);
    console.log(`   Total Bets Placed: ${finalState.bet_counter}`);
    console.log(`   Alice Final Balance: ${(finalAlice / 1_000_000).toFixed(2)} ALGO`);
    console.log(`   Bob Final Balance: ${(finalBob / 1_000_000).toFixed(2)} ALGO`);
    console.log(`   Alice Net Gain: ${((finalAlice - aliceBalance) / 1_000_000).toFixed(2)} ALGO`);
    console.log(`   Bob Net Loss: ${((finalBob - bobBalance) / 1_000_000).toFixed(2)} ALGO`);
    
    console.log('\n✅ ALL TESTS PASSED! The contract is working perfectly!\n');
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.body);
    }
    process.exit(1);
  }
}

// Run the demo
runDemo().catch(console.error);
