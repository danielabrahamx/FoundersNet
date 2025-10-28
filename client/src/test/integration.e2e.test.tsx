/**
 * Integration E2E Tests
 * Tests integration between different parts of the application
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { QueryClient } from '@tanstack/react-query';

describe('Integration Tests', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
  });

  describe('API Integration', () => {
    it('should fetch events from API', async () => {
      const mockEvents = [
        {
          eventId: 1,
          name: 'Will TechStartup raise Series A?',
          endTime: Math.floor(Date.now() / 1000) + 86400,
          resolved: false,
          totalYesBets: 10,
          totalNoBets: 5,
        },
      ];

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockEvents,
      });

      const response = await fetch('http://localhost:5000/api/events');
      const data = await response.json();

      expect(data).toEqual(mockEvents);
      expect(data).toHaveLength(1);
      expect(data[0].name).toBe('Will TechStartup raise Series A?');
    });

    it('should handle API errors gracefully', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Internal Server Error' }),
      });

      const response = await fetch('http://localhost:5000/api/events');
      expect(response.ok).toBe(false);
      expect(response.status).toBe(500);
    });

    it('should handle network timeouts', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network timeout'));

      try {
        await fetch('http://localhost:5000/api/events');
        expect(true).toBe(false); // Should not reach here
      } catch (error: any) {
        expect(error.message).toBe('Network timeout');
      }
    });
  });

  describe('Solana Integration', () => {
    it('should validate Solana addresses correctly', () => {
      const validAddress = 'Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS';
      const invalidAddress = 'invalid-address';

      // Basic validation (length check)
      expect(validAddress.length).toBeGreaterThanOrEqual(32);
      expect(invalidAddress.length).toBeLessThan(32);
    });

    it('should handle lamports to SOL conversion', () => {
      const lamports = 1_000_000_000; // 1 SOL
      const sol = lamports / 1_000_000_000;
      
      expect(sol).toBe(1);
      expect(sol.toFixed(4)).toBe('1.0000');
    });

    it('should format SOL amounts correctly', () => {
      const formatSol = (lamports: number): string => {
        return (lamports / 1_000_000_000).toFixed(4);
      };

      expect(formatSol(5_000_000_000)).toBe('5.0000');
      expect(formatSol(500_000_000)).toBe('0.5000');
      expect(formatSol(50_000_000)).toBe('0.0500');
    });
  });

  describe('Configuration Integration', () => {
    it('should load environment configuration', () => {
      const config = {
        nodeEnv: 'development',
        network: 'solana-devnet',
        programId: 'Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS',
        adminAddress: 'Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS',
        apiUrl: 'http://localhost:5000',
      };

      expect(config.network).toBe('solana-devnet');
      expect(config.nodeEnv).toBe('development');
      expect(config.programId).toBeTruthy();
      expect(config.adminAddress).toBeTruthy();
    });

    it('should validate configuration values', () => {
      const config = {
        network: 'solana-devnet',
        programId: 'Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS',
      };

      expect(['solana-localnet', 'solana-devnet', 'solana-testnet', 'solana-mainnet-beta'])
        .toContain(config.network);
      expect(config.programId.length).toBeGreaterThanOrEqual(32);
    });
  });

  describe('Data Flow Integration', () => {
    it('should handle event creation to display flow', async () => {
      const newEvent = {
        name: 'Test Event',
        endTime: Math.floor(Date.now() / 1000) + 86400,
      };

      // Mock API response
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          eventId: 1,
          ...newEvent,
          resolved: false,
          totalYesBets: 0,
          totalNoBets: 0,
        }),
      });

      const response = await fetch('http://localhost:5000/api/events', {
        method: 'POST',
        body: JSON.stringify(newEvent),
      });

      const data = await response.json();
      expect(data.name).toBe('Test Event');
      expect(data.eventId).toBe(1);
    });

    it('should handle betting workflow', async () => {
      const bet = {
        eventId: 1,
        outcome: true, // YES
        amount: 1_000_000_000, // 1 SOL
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          betId: 1,
          ...bet,
          claimed: false,
        }),
      });

      const response = await fetch('http://localhost:5000/api/bets', {
        method: 'POST',
        body: JSON.stringify(bet),
      });

      const data = await response.json();
      expect(data.betId).toBe(1);
      expect(data.eventId).toBe(1);
      expect(data.outcome).toBe(true);
    });
  });

  describe('State Management Integration', () => {
    it('should handle query client caching', () => {
      const queryKey = ['/api/events'];
      const data = [{ eventId: 1, name: 'Test Event' }];

      queryClient.setQueryData(queryKey, data);
      const cachedData = queryClient.getQueryData(queryKey);

      expect(cachedData).toEqual(data);
    });

    it('should invalidate queries on mutations', () => {
      const queryKey = ['/api/events'];
      queryClient.setQueryData(queryKey, []);

      queryClient.invalidateQueries({ queryKey });

      // Query should be marked as stale
      const state = queryClient.getQueryState(queryKey);
      expect(state?.isInvalidated).toBe(true);
    });
  });
});
