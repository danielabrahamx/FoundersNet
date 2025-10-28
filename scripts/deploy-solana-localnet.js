#!/usr/bin/env node

/**
 * Deploy Solana Prediction Market to LocalNet
 * 
 * This script deploys the Anchor program to local solana-test-validator
 * and saves deployment information for the frontend
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

async function deployToLocalnet() {
  try {
    log('\n🚀 Starting Solana LocalNet Deployment', 'bright');
    log('=====================================\n', 'bright');

    // Configure Anchor for localnet
    const provider = anchor.AnchorProvider.env();
    anchor.setProvider(provider);

    log(`📡 Connected to: ${provider.connection.rpcEndpoint}`, 'blue');
    log(`💼 Deployer: ${provider.wallet.publicKey.toString()}\n`, 'blue');

    // Check deployer balance
    const balance = await provider.connection.getBalance(provider.wallet.publicKey);
    log(`💰 Balance: ${balance / LAMPORTS_PER_SOL} SOL`, 'yellow');

    if (balance < 0.1 * LAMPORTS_PER_SOL) {
      log('\n⚠️  Warning: Low balance. Requesting airdrop...', 'yellow');
      const signature = await provider.connection.requestAirdrop(
        provider.wallet.publicKey,
        2 * LAMPORTS_PER_SOL
      );
      await provider.connection.confirmTransaction(signature);
      log('✅ Airdrop successful!\n', 'green');
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
      log(`   Transaction: ${tx}\n`, 'blue');

      // Fetch the initialized state
      programState = await program.account.programState.fetch(programStatePDA);
      log(`   Admin: ${programState.admin.toString()}`, 'blue');
      log(`   Event Counter: ${programState.eventCounter}`, 'blue');
      log(`   Bet Counter: ${programState.betCounter}\n`, 'blue');
    }

    // Save deployment info
    const deploymentInfo = {
      network: 'localnet',
      programId: programId.toString(),
      programStatePDA: programStatePDA.toString(),
      admin: provider.wallet.publicKey.toString(),
      rpcUrl: provider.connection.rpcEndpoint,
      deployedAt: new Date().toISOString(),
      eventCounter: programState.eventCounter.toString(),
      betCounter: programState.betCounter.toString(),
    };

    const deploymentsDir = path.join(__dirname, '../deployments');
    if (!fs.existsSync(deploymentsDir)) {
      fs.mkdirSync(deploymentsDir, { recursive: true });
    }

    const deploymentPath = path.join(deploymentsDir, 'solana-localnet.json');
    fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));

    log('💾 Deployment info saved to:', 'green');
    log(`   ${deploymentPath}\n`, 'blue');

    // Update .env.solana.localnet
    const envPath = path.join(__dirname, '../.env.solana.localnet');
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
      log('✅ Updated .env.solana.localnet', 'green');
    }

    log('\n🎉 Deployment Complete!', 'bright');
    log('=====================================\n', 'bright');

    log('📋 Next Steps:', 'yellow');
    log('   1. Start your dev server: npm run dev', 'blue');
    log('   2. Connect your wallet to LocalNet', 'blue');
    log('   3. Create test events and place bets\n', 'blue');

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
deployToLocalnet()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
