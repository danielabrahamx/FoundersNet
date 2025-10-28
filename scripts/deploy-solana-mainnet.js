#!/usr/bin/env node

/**
 * Deploy Solana Prediction Market to MainNet-Beta
 * 
 * ⚠️  WARNING: PRODUCTION DEPLOYMENT WITH REAL SOL ⚠️
 * 
 * This script deploys the Anchor program to Solana MainNet-Beta
 * and saves deployment information for the frontend
 * 
 * Prerequisites:
 * 1. THOROUGH testing on devnet and testnet
 * 2. Security audit completed
 * 3. Build program: anchor build
 * 4. Sufficient SOL for deployment (~5-10 SOL)
 * 5. Deploy: node scripts/deploy-solana-mainnet.js
 */

import * as anchor from '@coral-xyz/anchor';
import { Program } from '@coral-xyz/anchor';
import { Keypair, LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ANSI colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  magenta: '\x1b[35m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function confirmDeployment() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    log('\n⚠️  ⚠️  ⚠️  MAINNET DEPLOYMENT WARNING ⚠️  ⚠️  ⚠️\n', 'red');
    log('This will deploy to MainNet-Beta with REAL SOL!', 'red');
    log('Ensure you have:', 'yellow');
    log('  ✓ Completed thorough testing on devnet and testnet', 'blue');
    log('  ✓ Performed security audit', 'blue');
    log('  ✓ Have sufficient SOL (5-10 SOL minimum)', 'blue');
    log('  ✓ Backed up your wallet private key', 'blue');
    log('  ✓ Understand the risks and costs involved\n', 'blue');

    rl.question('Type "I UNDERSTAND THE RISKS" to continue: ', (answer) => {
      rl.close();
      resolve(answer === 'I UNDERSTAND THE RISKS');
    });
  });
}

async function deployToMainnet() {
  try {
    log('\n🚀 Starting Solana MainNet-Beta Deployment', 'bright');
    log('===========================================\n', 'bright');

    const confirmed = await confirmDeployment();
    if (!confirmed) {
      log('\n❌ Deployment cancelled\n', 'red');
      log('This is the correct choice if you have any doubts.', 'yellow');
      log('Always test thoroughly on devnet and testnet first!\n', 'yellow');
      process.exit(0);
    }

    // Configure Anchor for mainnet-beta
    const connection = new anchor.web3.Connection(
      process.env.MAINNET_RPC_URL || 'https://api.mainnet-beta.solana.com',
      'confirmed'
    );

    // Load wallet from default location
    const walletPath = process.env.ANCHOR_WALLET || 
      path.join(process.env.HOME || process.env.USERPROFILE, '.config', 'solana', 'id.json');
    
    if (!fs.existsSync(walletPath)) {
      throw new Error(
        `Wallet not found at ${walletPath}. Create one with: solana-keygen new`
      );
    }

    const walletKeypair = Keypair.fromSecretKey(
      Uint8Array.from(JSON.parse(fs.readFileSync(walletPath, 'utf8')))
    );

    const wallet = new anchor.Wallet(walletKeypair);
    const provider = new anchor.AnchorProvider(connection, wallet, {
      commitment: 'confirmed',
    });

    anchor.setProvider(provider);

    log(`📡 Connected to: ${provider.connection.rpcEndpoint}`, 'blue');
    log(`💼 Deployer: ${provider.wallet.publicKey.toString()}\n`, 'blue');

    // Check deployer balance
    const balance = await provider.connection.getBalance(provider.wallet.publicKey);
    log(`💰 Balance: ${balance / LAMPORTS_PER_SOL} SOL`, 'yellow');

    if (balance < 5 * LAMPORTS_PER_SOL) {
      log('\n❌ Insufficient balance!', 'red');
      log('   Minimum required: 5 SOL', 'yellow');
      log('   Recommended: 10 SOL for safe deployment\n', 'yellow');
      throw new Error('Insufficient balance for mainnet deployment');
    }

    // Estimate deployment cost
    const estimatedCost = 2.5; // SOL
    log(`📊 Estimated deployment cost: ~${estimatedCost} SOL`, 'yellow');
    log(`   Remaining after deployment: ~${(balance / LAMPORTS_PER_SOL - estimatedCost).toFixed(2)} SOL\n`, 'yellow');

    // Load the program
    const programPath = path.join(__dirname, '../target/idl/prediction_market.json');
    if (!fs.existsSync(programPath)) {
      throw new Error(
        'Program IDL not found. Run "anchor build" first.'
      );
    }

    const idl = JSON.parse(fs.readFileSync(programPath, 'utf8'));
    const programId = new PublicKey(idl.metadata.address);

    log(`📄 Program ID: ${programId.toString()}`, 'blue');

    // Check if program is deployed
    const programInfo = await provider.connection.getAccountInfo(programId);
    if (!programInfo) {
      log('\n❌ Program not deployed!', 'red');
      log('   Run: anchor deploy --provider.cluster mainnet-beta\n', 'yellow');
      log('   ⚠️  This will cost ~2-3 SOL in deployment fees\n', 'yellow');
      throw new Error('Program must be deployed before initialization');
    }

    log('✅ Program is deployed\n', 'green');

    const program = new Program(idl, programId, provider);

    // Derive program state PDA
    const [programStatePDA] = PublicKey.findProgramAddressSync(
      [Buffer.from('program_state')],
      programId
    );

    log(`🔑 Program State PDA: ${programStatePDA.toString()}`, 'blue');

    // Check if program is already initialized
    let programState;
    try {
      programState = await program.account.programState.fetch(programStatePDA);
      log('\n✅ Program already initialized', 'green');
      log(`   Admin: ${programState.admin.toString()}`, 'blue');
      log(`   Event Counter: ${programState.eventCounter}`, 'blue');
      log(`   Bet Counter: ${programState.betCounter}\n`, 'blue');
    } catch (error) {
      // Program not initialized, initialize it
      log('\n📝 Initializing program...', 'yellow');
      log('   This will cost ~0.001-0.01 SOL\n', 'yellow');

      const tx = await program.methods
        .initialize(provider.wallet.publicKey)
        .accounts({
          programState: programStatePDA,
          admin: provider.wallet.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();

      log(`✅ Initialization successful!`, 'green');
      log(`   Transaction: https://explorer.solana.com/tx/${tx}\n`, 'blue');

      // Wait for confirmation with higher commitment
      await provider.connection.confirmTransaction(tx, 'finalized');
      log('✅ Transaction finalized on-chain\n', 'green');

      // Fetch the initialized state
      programState = await program.account.programState.fetch(programStatePDA);
      log(`   Admin: ${programState.admin.toString()}`, 'blue');
      log(`   Event Counter: ${programState.eventCounter}`, 'blue');
      log(`   Bet Counter: ${programState.betCounter}\n`, 'blue');
    }

    // Save deployment info
    const deploymentInfo = {
      network: 'mainnet-beta',
      programId: programId.toString(),
      programStatePDA: programStatePDA.toString(),
      admin: provider.wallet.publicKey.toString(),
      rpcUrl: provider.connection.rpcEndpoint,
      explorerUrl: `https://explorer.solana.com/address/${programId.toString()}`,
      deployedAt: new Date().toISOString(),
      eventCounter: programState.eventCounter.toString(),
      betCounter: programState.betCounter.toString(),
      initialBalance: balance.toString(),
    };

    const deploymentsDir = path.join(__dirname, '../deployments');
    if (!fs.existsSync(deploymentsDir)) {
      fs.mkdirSync(deploymentsDir, { recursive: true });
    }

    const deploymentPath = path.join(deploymentsDir, 'solana-mainnet.json');
    fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));

    log('💾 Deployment info saved to:', 'green');
    log(`   ${deploymentPath}\n`, 'blue');

    // Update .env.solana.mainnet
    const envPath = path.join(__dirname, '../.env.solana.mainnet');
    if (fs.existsSync(envPath)) {
      let envContent = fs.readFileSync(envPath, 'utf8');
      envContent = envContent.replace(
        /VITE_SOLANA_PROGRAM_ID=.*/,
        `VITE_SOLANA_PROGRAM_ID=${programId.toString()}`
      );
      envContent = envContent.replace(
        /VITE_SOLANA_ADMIN_ADDRESS=.*/,
        `VITE_SOLANA_ADMIN_ADDRESS=${provider.wallet.publicKey.toString()}`
      );
      fs.writeFileSync(envPath, envContent);
      log('✅ Updated .env.solana.mainnet', 'green');
    }

    log('\n🎉 MainNet Deployment Complete!', 'bright');
    log('===========================================\n', 'bright');

    log('⚠️  CRITICAL POST-DEPLOYMENT STEPS:', 'red');
    log('   1. IMMEDIATELY backup your wallet private key', 'yellow');
    log('   2. Set up monitoring and alerting', 'yellow');
    log('   3. Monitor initial transactions closely', 'yellow');
    log('   4. Have emergency procedures ready', 'yellow');
    log('   5. Set up analytics and error tracking\n', 'yellow');

    log('📋 Recommended Actions:', 'blue');
    log('   • Start with small test transactions', 'blue');
    log('   • Monitor gas/fee costs', 'blue');
    log('   • Watch for unusual activity', 'blue');
    log('   • Keep testnet deployment for testing\n', 'blue');

    log('🔗 Important Links:', 'magenta');
    log(`   Program: https://explorer.solana.com/address/${programId.toString()}`, 'blue');
    log(`   Admin: https://explorer.solana.com/address/${provider.wallet.publicKey.toString()}`, 'blue');
    log(`   Program State: https://explorer.solana.com/address/${programStatePDA.toString()}\n`, 'blue');

    log('💰 Final Balance:', 'yellow');
    const finalBalance = await provider.connection.getBalance(provider.wallet.publicKey);
    log(`   ${finalBalance / LAMPORTS_PER_SOL} SOL\n`, 'yellow');

    return deploymentInfo;
  } catch (error) {
    log('\n❌ Deployment Failed:', 'red');
    log(`   ${error.message}\n`, 'red');
    if (error.logs) {
      log('Transaction Logs:', 'yellow');
      error.logs.forEach((log) => console.log(`   ${log}`));
    }
    throw error;
  }
}

// Run deployment
deployToMainnet()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
