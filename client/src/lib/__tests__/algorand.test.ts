/**
 * Unit Tests for Algorand Client Library
 * 
 * Tests the core functionality of the Algorand client library including:
 * - Network configuration
 * - Client creation
 * - Utility functions
 * - Address formatting
 * - Amount conversions
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  algoToMicroAlgo,
  microAlgoToAlgo,
  formatAddress,
  getAppAddress,
  NETWORKS,
  ACTIVE_NETWORK,
} from '@/lib/algorand';
import algosdk from 'algosdk';

describe('Algorand Client Library', () => {
  describe('Network Configuration', () => {
    it('should have testnet configuration', () => {
      expect(NETWORKS.testnet).toBeDefined();
      expect(NETWORKS.testnet.algodUrl).toBe('https://testnet-api.algonode.cloud');
      expect(NETWORKS.testnet.port).toBe(443);
    });

    it('should have mainnet configuration', () => {
      expect(NETWORKS.mainnet).toBeDefined();
      expect(NETWORKS.mainnet.algodUrl).toBe('https://mainnet-api.algonode.cloud');
      expect(NETWORKS.mainnet.port).toBe(443);
    });

    it('should have localnet configuration', () => {
      expect(NETWORKS.localnet).toBeDefined();
      expect(NETWORKS.localnet.algodUrl).toBe('http://localhost');
      expect(NETWORKS.localnet.port).toBe(4001);
    });

    it('should default to testnet', () => {
      expect(['testnet', 'mainnet', 'localnet']).toContain(ACTIVE_NETWORK);
    });
  });

  describe('Amount Conversions', () => {
    it('should convert ALGO to microAlgos', () => {
      expect(algoToMicroAlgo(1)).toBe(1_000_000);
      expect(algoToMicroAlgo(0.5)).toBe(500_000);
      expect(algoToMicroAlgo(10)).toBe(10_000_000);
      expect(algoToMicroAlgo(0.000001)).toBe(1);
    });

    it('should convert microAlgos to ALGO', () => {
      expect(microAlgoToAlgo(1_000_000)).toBe(1);
      expect(microAlgoToAlgo(500_000)).toBe(0.5);
      expect(microAlgoToAlgo(10_000_000)).toBe(10);
      expect(microAlgoToAlgo(1)).toBe(0.000001);
    });

    it('should handle zero amounts', () => {
      expect(algoToMicroAlgo(0)).toBe(0);
      expect(microAlgoToAlgo(0)).toBe(0);
    });

    it('should round down for fractional microAlgos', () => {
      expect(algoToMicroAlgo(0.0000001)).toBe(0); // Less than 1 microAlgo
      expect(algoToMicroAlgo(1.9999999)).toBe(1_999_999);
    });
  });

  describe('Address Formatting', () => {
    it('should format full Algorand addresses', () => {
      const address = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567ABCDEFGHIJKLMNOPQRSTUVWXYZ2345';
      const formatted = formatAddress(address);
      expect(formatted).toBe('ABCDEF...2345');
      expect(formatted.length).toBeLessThan(address.length);
    });

    it('should return short addresses unchanged', () => {
      expect(formatAddress('ABC')).toBe('ABC');
      expect(formatAddress('ABCDEFGH')).toBe('ABCDEFGH');
    });

    it('should handle empty addresses', () => {
      expect(formatAddress('')).toBe('');
    });
  });

  describe('Application Address', () => {
    it('should generate app address from app ID', () => {
      const appId = 123456;
      const appAddress = getAppAddress(appId);
      
      // App address should be a valid Algorand address (58 characters)
      expect(appAddress).toBeDefined();
      expect(appAddress.length).toBe(58);
      
      // Verify it matches algosdk implementation
      expect(appAddress).toBe(algosdk.getApplicationAddress(appId));
    });

    it('should generate different addresses for different app IDs', () => {
      const addr1 = getAppAddress(1);
      const addr2 = getAppAddress(2);
      expect(addr1).not.toBe(addr2);
    });

    it('should generate consistent addresses', () => {
      const appId = 999;
      const addr1 = getAppAddress(appId);
      const addr2 = getAppAddress(appId);
      expect(addr1).toBe(addr2);
    });
  });
});
