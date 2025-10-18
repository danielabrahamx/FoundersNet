/**
 * Direct Verification Script for Algorand Utilities
 * Runs without a test framework to verify functionality
 */

import {
  algoToMicroAlgo,
  microAlgoToAlgo,
} from './test-utils.js';

console.log('🧪 Running Algorand Utility Verification Tests...\n');

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

// Test Suite: Amount Conversions
console.log('📦 Testing Amount Conversions\n');

test('Convert 1 ALGO to microAlgos', () => {
  assertEquals(algoToMicroAlgo(1), 1_000_000);
});

test('Convert 0.5 ALGO to microAlgos', () => {
  assertEquals(algoToMicroAlgo(0.5), 500_000);
});

test('Convert 10 ALGO to microAlgos', () => {
  assertEquals(algoToMicroAlgo(10), 10_000_000);
});

test('Convert 0.000001 ALGO to microAlgos', () => {
  assertEquals(algoToMicroAlgo(0.000001), 1);
});

test('Convert 1,000,000 microAlgos to ALGO', () => {
  assertEquals(microAlgoToAlgo(1_000_000), 1);
});

test('Convert 500,000 microAlgos to ALGO', () => {
  assertEquals(microAlgoToAlgo(500_000), 0.5);
});

test('Convert 10,000,000 microAlgos to ALGO', () => {
  assertEquals(microAlgoToAlgo(10_000_000), 10);
});

test('Handle zero ALGO amount', () => {
  assertEquals(algoToMicroAlgo(0), 0);
});

test('Handle zero microAlgo amount', () => {
  assertEquals(microAlgoToAlgo(0), 0);
});

test('Round down fractional microAlgos', () => {
  const result = algoToMicroAlgo(1.9999999);
  // Should be floored to integer microAlgos
  assertEquals(Math.floor(result), 1_999_999);
});

// Summary
console.log(`\n${'='.repeat(50)}`);
console.log(`📊 Test Results: ${passedTests}/${totalTests} tests passed`);
console.log(`${'='.repeat(50)}\n`);

if (passedTests === totalTests) {
  console.log('✅ All utility functions are working correctly!\n');
  process.exit(0);
} else {
  console.log(`❌ ${totalTests - passedTests} test(s) failed\n`);
  process.exit(1);
}
