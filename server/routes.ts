import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";

export async function registerRoutes(app: Express): Promise<Server> {
  // Solana endpoints - now blockchain interactions happen via frontend
  // Backend serves as a middleware/API aggregator for Solana data
  
  // Health check endpoint
  app.get("/api/health", (req, res) => {
    console.log('🔵 GET /api/health');
    res.json({ 
      status: 'ok',
      network: process.env.VITE_SOLANA_NETWORK || 'devnet',
      timestamp: new Date().toISOString()
    });
  });

  // Events endpoint - returns mock data or integrates with Solana RPC
  app.get("/api/events", (req, res) => {
    console.log('🔵 GET /api/events - Solana blockchain integration via frontend');
    res.json({
      message: 'Use frontend Solana hooks for event data',
      note: 'Events are read from Solana smart contract via @solana/web3.js'
    });
  });

  // User bets endpoint
  app.get("/api/users/:address/bets", (req, res) => {
    const userAddress = req.params.address;
    console.log(`🔵 GET /api/users/${userAddress}/bets`);
    res.json({
      message: 'Use frontend Solana hooks for user bet data',
      note: 'Bets are queried from Solana smart contract'
    });
  });

  const httpServer = createServer(app);

  return httpServer;
}

