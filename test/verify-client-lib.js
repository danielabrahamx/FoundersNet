/**
 * Verification Script for Algorand Client Library
 * Tests the core client library functions without requiring blockchain connection
 */

import {
  NETWORKS,
  ACTIVE_NETWORK,
  algoToMicroAlgo,
  microAlgoToAlgo,
  formatAddress,
  getAppAddress,
} from '../client/src/lib/algorand.ts';

console.log('🧪 Running Algorand Client Library Verification Tests...\n');

let passedTests = 0;
let totalTests = 0;

function test(description, fn) {
  totalTests++;
  try {
    fn();
    console.log(`✅ PASS: ${description}`);
    passedTests++;
  } catch (error) {
    console.log(`❌ FAIL: ${description}`);
    console.log(`   Error: ${error.message}`);
  }
}

function assertEquals(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(`Expected ${expected}, got ${actual}. ${message || ''}`);
  }
}

function assertDefined(value, message) {
  if (value === undefined || value === null) {
    throw new Error(`Value should be defined. ${message || ''}`);
  }
}

function assertType(value, type, message) {
  if (typeof value !== type) {
    throw new Error(`Expected type ${type}, got ${typeof value}. ${message || ''}`);
  }
}

// Test Suite: Network Configuration
console.log('📦 Testing Network Configuration\n');

test('TestNet configuration exists', () => {
  assertDefined(NETWORKS.testnet);
  assertEquals(NETWORKS.testnet.algodUrl, 'https://testnet-api.algonode.cloud');
  assertEquals(NETWORKS.testnet.port, 443);
});

test('MainNet configuration exists', () => {
  assertDefined(NETWORKS.mainnet);
  assertEquals(NETWORKS.mainnet.algodUrl, 'https://mainnet-api.algonode.cloud');
  assertEquals(NETWORKS.mainnet.port, 443);
});

test('LocalNet configuration exists', () => {
  assertDefined(NETWORKS.localnet);
  assertEquals(NETWORKS.localnet.algodUrl, 'http://localhost');
  assertEquals(NETWORKS.localnet.port, 4001);
});

test('Active network is valid', () => {
  assertDefined(ACTIVE_NETWORK);
  const validNetworks = ['testnet', 'mainnet', 'localnet'];
  if (!validNetworks.includes(ACTIVE_NETWORK)) {
    throw new Error(`Active network ${ACTIVE_NETWORK} not in valid networks`);
  }
});

// Test Suite: Amount Conversions
console.log('\n📦 Testing Amount Conversions\n');

test('Convert 1 ALGO to microAlgos', () => {
  assertEquals(algoToMicroAlgo(1), 1_000_000);
});

test('Convert 0.5 ALGO to microAlgos', () => {
  assertEquals(algoToMicroAlgo(0.5), 500_000);
});

test('Convert 10 ALGO to microAlgos', () => {
  assertEquals(algoToMicroAlgo(10), 10_000_000);
});

test('Convert microAlgos to ALGO', () => {
  assertEquals(microAlgoToAlgo(1_000_000), 1);
  assertEquals(microAlgoToAlgo(500_000), 0.5);
});

test('Handle zero amounts', () => {
  assertEquals(algoToMicroAlgo(0), 0);
  assertEquals(microAlgoToAlgo(0), 0);
});

// Test Suite: Address Formatting
console.log('\n📦 Testing Address Formatting\n');

test('Format full Algorand address', () => {
  const fullAddress = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567ABCDEFGHIJKLMNOPQRSTUVWXYZ2345';
  const formatted = formatAddress(fullAddress);
  assertEquals(formatted, 'ABCDEF...2345');
});

test('Handle short addresses', () => {
  assertEquals(formatAddress('ABC'), 'ABC');
  assertEquals(formatAddress('ABCDEFGH'), 'ABCDEFGH');
});

test('Handle empty address', () => {
  assertEquals(formatAddress(''), '');
});

// Test Suite: Application Address
console.log('\n📦 Testing Application Address Generation\n');

test('Generate app address from app ID', () => {
  const appId = 123456;
  const appAddress = getAppAddress(appId);
  
  assertDefined(appAddress);
  assertEquals(appAddress.length, 58, 'App address should be 58 characters');
  assertType(appAddress, 'string');
});

test('Different app IDs generate different addresses', () => {
  const addr1 = getAppAddress(1);
  const addr2 = getAppAddress(2);
  
  if (addr1 === addr2) {
    throw new Error('Different app IDs should generate different addresses');
  }
});

test('Same app ID generates consistent address', () => {
  const appId = 999;
  const addr1 = getAppAddress(appId);
  const addr2 = getAppAddress(appId);
  
  assertEquals(addr1, addr2);
});

// Summary
console.log(`\n${'='.repeat(50)}`);
console.log(`📊 Test Results: ${passedTests}/${totalTests} tests passed`);
console.log(`${'='.repeat(50)}\n`);

if (passedTests === totalTests) {
  console.log('✅ All Algorand client library functions are working correctly!\n');
  process.exit(0);
} else {
  console.log(`❌ ${totalTests - passedTests} test(s) failed\n`);
  process.exit(1);
}
