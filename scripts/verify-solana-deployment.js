#!/usr/bin/env node

/**
 * Verify Solana Prediction Market Deployment
 * 
 * This script verifies that the Solana program is correctly deployed
 * and initialized across different networks
 */

import * as anchor from '@coral-xyz/anchor';
import { Program } from '@coral-xyz/anchor';
import { PublicKey } from '@solana/web3.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ANSI colors
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

async function verifyDeployment(network) {
  try {
    log(`\n📋 Verifying ${network.toUpperCase()} Deployment`, 'bright');
    log('=====================================\n', 'bright');

    // Load deployment info
    const deploymentPath = path.join(__dirname, `../deployments/solana-${network}.json`);
    if (!fs.existsSync(deploymentPath)) {
      log(`❌ Deployment file not found: ${deploymentPath}`, 'red');
      return false;
    }

    const deploymentInfo = JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));
    log(`✅ Deployment file found`, 'green');
    log(`   Deployed: ${new Date(deploymentInfo.deployedAt).toLocaleString()}`, 'blue');

    // Configure connection
    let rpcUrl;
    switch (network) {
      case 'localnet':
        rpcUrl = 'http://localhost:8899';
        break;
      case 'devnet':
        rpcUrl = 'https://api.devnet.solana.com';
        break;
      case 'testnet':
        rpcUrl = 'https://api.testnet.solana.com';
        break;
      case 'mainnet':
        rpcUrl = 'https://api.mainnet-beta.solana.com';
        break;
      default:
        throw new Error(`Unknown network: ${network}`);
    }

    const connection = new anchor.web3.Connection(rpcUrl, 'confirmed');
    log(`✅ Connected to ${network}`, 'green');

    // Verify program exists
    const programId = new PublicKey(deploymentInfo.programId);
    const programInfo = await connection.getAccountInfo(programId);
    
    if (!programInfo) {
      log(`❌ Program not found on ${network}`, 'red');
      return false;
    }

    log(`✅ Program found`, 'green');
    log(`   Program ID: ${programId.toString()}`, 'blue');
    log(`   Owner: ${programInfo.owner.toString()}`, 'blue');
    log(`   Executable: ${programInfo.executable}`, 'blue');

    // Load IDL
    const idlPath = path.join(__dirname, '../target/idl/prediction_market.json');
    if (!fs.existsSync(idlPath)) {
      log(`⚠️  IDL not found, skipping detailed verification`, 'yellow');
      return true;
    }

    const idl = JSON.parse(fs.readFileSync(idlPath, 'utf8'));
    const program = new Program(idl, programId, { connection });

    // Verify program state
    const programStatePDA = new PublicKey(deploymentInfo.programStatePDA);
    try {
      const programState = await program.account.programState.fetch(programStatePDA);
      
      log(`✅ Program state found`, 'green');
      log(`   Admin: ${programState.admin.toString()}`, 'blue');
      log(`   Event Counter: ${programState.eventCounter}`, 'blue');
      log(`   Bet Counter: ${programState.betCounter}`, 'blue');

      // Verify admin matches
      if (programState.admin.toString() === deploymentInfo.admin) {
        log(`✅ Admin address matches deployment info`, 'green');
      } else {
        log(`⚠️  Admin address mismatch!`, 'yellow');
        log(`   Expected: ${deploymentInfo.admin}`, 'yellow');
        log(`   Actual: ${programState.admin.toString()}`, 'yellow');
      }

    } catch (error) {
      log(`❌ Failed to fetch program state`, 'red');
      log(`   ${error.message}`, 'red');
      return false;
    }

    // Verify environment file
    const envPath = path.join(__dirname, `../.env.solana.${network}`);
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      const programIdMatch = envContent.match(/VITE_SOLANA_PROGRAM_ID=(.*)/);
      
      if (programIdMatch && programIdMatch[1] === deploymentInfo.programId) {
        log(`✅ Environment file matches deployment`, 'green');
      } else {
        log(`⚠️  Environment file may be outdated`, 'yellow');
        log(`   Update .env.solana.${network} with:`, 'yellow');
        log(`   VITE_SOLANA_PROGRAM_ID=${deploymentInfo.programId}`, 'yellow');
      }
    } else {
      log(`⚠️  Environment file not found: ${envPath}`, 'yellow');
    }

    log(`\n✅ ${network.toUpperCase()} deployment verified successfully!\n`, 'green');
    return true;

  } catch (error) {
    log(`\n❌ Verification failed for ${network}:`, 'red');
    log(`   ${error.message}\n`, 'red');
    return false;
  }
}

async function verifyAll() {
  const networks = ['localnet', 'devnet', 'testnet', 'mainnet'];
  const results = {};

  log('\n🔍 Solana Deployment Verification', 'bright');
  log('===================================\n', 'bright');

  for (const network of networks) {
    results[network] = await verifyDeployment(network);
  }

  log('\n📊 Verification Summary', 'bright');
  log('=====================\n', 'bright');

  for (const [network, success] of Object.entries(results)) {
    const status = success ? '✅ PASS' : '❌ FAIL';
    const color = success ? 'green' : 'red';
    log(`${status} - ${network}`, color);
  }

  console.log('');

  const allPassed = Object.values(results).every(r => r);
  return allPassed;
}

// Get network from command line args or verify all
const network = process.argv[2];

if (network) {
  verifyDeployment(network)
    .then((success) => {
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
} else {
  verifyAll()
    .then((success) => {
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
