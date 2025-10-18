/**
 * Simple Unit Tests for Algorand Utilities
 * These tests don't require blockchain connection
 */

import { describe, it } from 'mocha';
import { expect } from 'chai';
import {
  algoToMicroAlgo,
  microAlgoToAlgo,
} from '../test-utils.js';

describe("Algorand Utility Functions", function () {
  describe("Amount Conversions", function () {
    it("should convert ALGO to microAlgos", function () {
      expect(algoToMicroAlgo(1)).to.equal(1_000_000);
      expect(algoToMicroAlgo(0.5)).to.equal(500_000);
      expect(algoToMicroAlgo(10)).to.equal(10_000_000);
    });

    it("should convert microAlgos to ALGO", function () {
      expect(microAlgoToAlgo(1_000_000)).to.equal(1);
      expect(microAlgoToAlgo(500_000)).to.equal(0.5);
      expect(microAlgoToAlgo(10_000_000)).to.equal(10);
    });

    it("should handle zero amounts", function () {
      expect(algoToMicroAlgo(0)).to.equal(0);
      expect(microAlgoToAlgo(0)).to.equal(0);
    });
  });
});
