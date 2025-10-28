#!/usr/bin/env node

/**
 * Deploy Solana Prediction Market to DevNet
 * 
 * This script deploys the Anchor program to Solana DevNet
 * and saves deployment information for the frontend
 * 
 * Prerequisites:
 * 1. Build program: anchor build
 * 2. Get devnet SOL: solana airdrop 2 --url devnet
 * 3. Deploy: node scripts/deploy-solana-devnet.js
 */

import * as anchor from '@coral-xyz/anchor';
import { Program } from '@coral-xyz/anchor';
import { Keypair, LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

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
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function deployToDevnet() {
  try {
    log('\n🚀 Starting Solana DevNet Deployment', 'bright');
    log('=====================================\n', 'bright');

    // Configure Anchor for devnet
    const connection = new anchor.web3.Connection(
      'https://api.devnet.solana.com',
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

    if (balance < 0.5 * LAMPORTS_PER_SOL) {
      log('\n⚠️  Warning: Low balance!', 'yellow');
      log('   Get devnet SOL from: https://faucet.solana.com', 'yellow');
      log('   Or run: solana airdrop 2 --url devnet\n', 'yellow');
      throw new Error('Insufficient balance for deployment');
    }

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
      log('   Run: anchor deploy --provider.cluster devnet\n', 'yellow');
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

      const tx = await program.methods
        .initialize(provider.wallet.publicKey)
        .accounts({
          programState: programStatePDA,
          admin: provider.wallet.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();

      log(`✅ Initialization successful!`, 'green');
      log(`   Transaction: https://explorer.solana.com/tx/${tx}?cluster=devnet\n`, 'blue');

      // Fetch the initialized state
      programState = await program.account.programState.fetch(programStatePDA);
      log(`   Admin: ${programState.admin.toString()}`, 'blue');
      log(`   Event Counter: ${programState.eventCounter}`, 'blue');
      log(`   Bet Counter: ${programState.betCounter}\n`, 'blue');
    }

    // Save deployment info
    const deploymentInfo = {
      network: 'devnet',
      programId: programId.toString(),
      programStatePDA: programStatePDA.toString(),
      admin: provider.wallet.publicKey.toString(),
      rpcUrl: provider.connection.rpcEndpoint,
      explorerUrl: `https://explorer.solana.com/address/${programId.toString()}?cluster=devnet`,
      deployedAt: new Date().toISOString(),
      eventCounter: programState.eventCounter.toString(),
      betCounter: programState.betCounter.toString(),
    };

    const deploymentsDir = path.join(__dirname, '../deployments');
    if (!fs.existsSync(deploymentsDir)) {
      fs.mkdirSync(deploymentsDir, { recursive: true });
    }

    const deploymentPath = path.join(deploymentsDir, 'solana-devnet.json');
    fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));

    log('💾 Deployment info saved to:', 'green');
    log(`   ${deploymentPath}\n`, 'blue');

    // Update .env.solana.devnet
    const envPath = path.join(__dirname, '../.env.solana.devnet');
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
      log('✅ Updated .env.solana.devnet', 'green');
    }

    log('\n🎉 Deployment Complete!', 'bright');
    log('=====================================\n', 'bright');

    log('📋 Next Steps:', 'yellow');
    log('   1. Update your frontend .env to use devnet', 'blue');
    log('   2. Connect your wallet to DevNet', 'blue');
    log('   3. Get test SOL from faucet if needed', 'blue');
    log('   4. Test your application thoroughly\n', 'blue');

    log('🔗 Useful Links:', 'yellow');
    log(`   Program: https://explorer.solana.com/address/${programId.toString()}?cluster=devnet`, 'blue');
    log('   Faucet: https://faucet.solana.com\n', 'blue');

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
deployToDevnet()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
