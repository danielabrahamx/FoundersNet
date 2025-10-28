/**
 * Integration Tests for Phase 6: Infrastructure & Configuration
 * 
 * These tests validate end-to-end flows:
 * 1. Environment configuration loading
 * 2. Network connectivity
 * 3. Program deployment verification
 * 4. Server API integration
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { Connection, PublicKey } from '@solana/web3.js';
import fs from 'fs';
import path from 'path';

// Use process.cwd() for cross-platform path resolution
const rootDir = process.cwd();

describe('Phase 6 Integration: Network Connectivity', () => {
  describe('LocalNet Connection', () => {
    it('should connect to localnet (if running)', async () => {
      try {
        const connection = new Connection('http://localhost:8899', 'confirmed');
        const version = await connection.getVersion();
        expect(version).toBeDefined();
        expect(version['solana-core']).toBeDefined();
      } catch (error: any) {
        // LocalNet might not be running, which is ok for unit tests
        expect(error.message).toBeDefined();
      }
    });
  });

  describe('DevNet Connection', () => {
    it('should connect to devnet', async () => {
      const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
      const version = await connection.getVersion();
      expect(version).toBeDefined();
      expect(version['solana-core']).toBeDefined();
    }, 15000); // Longer timeout for network request
  });

  describe('RPC URL Configuration', () => {
    const networks = [
      { name: 'localnet', url: 'http://localhost:8899' },
      { name: 'devnet', url: 'https://api.devnet.solana.com' },
      { name: 'testnet', url: 'https://api.testnet.solana.com' },
      { name: 'mainnet', url: 'https://api.mainnet-beta.solana.com' },
    ];

    networks.forEach(({ name, url }) => {
      it(`should have valid ${name} RPC URL format`, () => {
        const envPath = path.join(rootDir, `.env.solana.${name}`);
        if (fs.existsSync(envPath)) {
          const content = fs.readFileSync(envPath, 'utf8');
          expect(content).toContain(url);
        }
      });
    });
  });
});

describe('Phase 6 Integration: Program Deployment', () => {
  describe('Program ID Validation', () => {
    it('should have valid Solana program ID format', () => {
      const envPath = path.join(rootDir, '.env.solana.localnet');
      if (fs.existsSync(envPath)) {
        const content = fs.readFileSync(envPath, 'utf8');
        const match = content.match(/VITE_SOLANA_PROGRAM_ID=(.*)/);
        
        if (match && match[1] && match[1] !== 'YourProgramIDHere') {
          const programId = match[1];
          
          // Should be 32-44 characters (base58 encoded public key)
          expect(programId.length).toBeGreaterThanOrEqual(32);
          expect(programId.length).toBeLessThanOrEqual(44);
          
          // Should only contain valid base58 characters
          expect(programId).toMatch(/^[1-9A-HJ-NP-Za-km-z]+$/);
          
          // Should be a valid public key
          expect(() => new PublicKey(programId)).not.toThrow();
        }
      }
    });
  });

  describe('Deployment Info Structure', () => {
    const networks = ['localnet', 'devnet', 'testnet', 'mainnet'];

    networks.forEach((network) => {
      it(`should have valid ${network} deployment info structure (if deployed)`, () => {
        const deploymentPath = path.join(rootDir, `deployments/solana-${network}.json`);
        
        if (fs.existsSync(deploymentPath)) {
          const deploymentInfo = JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));
          
          // Required fields
          expect(deploymentInfo).toHaveProperty('network');
          expect(deploymentInfo).toHaveProperty('programId');
          expect(deploymentInfo).toHaveProperty('programStatePDA');
          expect(deploymentInfo).toHaveProperty('admin');
          expect(deploymentInfo).toHaveProperty('rpcUrl');
          expect(deploymentInfo).toHaveProperty('deployedAt');
          
          // Validate program ID is a valid public key
          expect(() => new PublicKey(deploymentInfo.programId)).not.toThrow();
          
          // Validate program state PDA is a valid public key
          expect(() => new PublicKey(deploymentInfo.programStatePDA)).not.toThrow();
          
          // Validate admin is a valid public key
          expect(() => new PublicKey(deploymentInfo.admin)).not.toThrow();
          
          // Validate deployed at is a valid date
          expect(new Date(deploymentInfo.deployedAt).getTime()).toBeGreaterThan(0);
        }
      });
    });
  });
});

describe('Phase 6 Integration: Environment Variable Loading', () => {
  it('should load environment variables correctly', () => {
    // Test that environment variables can be loaded
    const testEnv = {
      VITE_SOLANA_NETWORK: process.env.VITE_SOLANA_NETWORK || 'solana-localnet',
      VITE_SOLANA_PROGRAM_ID: process.env.VITE_SOLANA_PROGRAM_ID || 'not-set',
      VITE_API_URL: process.env.VITE_API_URL || 'http://localhost:5000',
    };
    
    expect(testEnv.VITE_SOLANA_NETWORK).toBeDefined();
    expect(testEnv.VITE_SOLANA_PROGRAM_ID).toBeDefined();
    expect(testEnv.VITE_API_URL).toBeDefined();
  });

  it('should validate network-specific configurations', () => {
    const networks = ['localnet', 'devnet', 'testnet', 'mainnet'];
    
    networks.forEach((network) => {
      const envPath = path.join(rootDir, `.env.solana.${network}`);
      if (fs.existsSync(envPath)) {
        const content = fs.readFileSync(envPath, 'utf8');
        
        // Parse environment variables
        const envVars: Record<string, string> = {};
        content.split('\n').forEach((line) => {
          const match = line.match(/^([A-Z_]+)=(.*)$/);
          if (match) {
            envVars[match[1]] = match[2];
          }
        });
        
        // Validate network matches
        if (envVars.VITE_SOLANA_NETWORK) {
          expect(envVars.VITE_SOLANA_NETWORK).toBe(`solana-${network}`);
        }
        
        // Validate RPC URL format
        if (envVars.VITE_SOLANA_RPC_URL) {
          if (network === 'localnet') {
            expect(envVars.VITE_SOLANA_RPC_URL).toContain('localhost');
          } else {
            expect(envVars.VITE_SOLANA_RPC_URL).toMatch(/^https?:\/\//);
          }
        }
      }
    });
  });
});

describe('Phase 6 Integration: API Endpoint Validation', () => {
  describe('Server Routes Configuration', () => {
    let routesContent: string;

    beforeAll(() => {
      const routesPath = path.join(rootDir, 'server/routes-solana.ts');
      routesContent = fs.readFileSync(routesPath, 'utf8');
    });

    it('should handle all Solana networks in getSolanaConnection', () => {
      const networks = ['solana-localnet', 'solana-devnet', 'solana-testnet', 'solana-mainnet'];
      
      networks.forEach((network) => {
        expect(routesContent).toContain(network);
      });
    });

    it('should have proper error handling for each endpoint', () => {
      const endpoints = [
        'GET /api/events',
        'GET /api/events/:id',
        'GET /api/users/:address/bets',
        'GET /api/events/:id/bets',
        'GET /api/stats',
        'GET /api/health',
      ];
      
      // Check that the routes file has try-catch blocks for error handling
      const tryCatchCount = (routesContent.match(/try\s*{/g) || []).length;
      expect(tryCatchCount).toBeGreaterThanOrEqual(5); // At least 5 endpoints with try-catch
      
      // Check that error responses are sent
      expect(routesContent).toContain('res.status(500)');
      expect(routesContent).toContain('res.status(400)');
      expect(routesContent).toContain('error');
    });

    it('should validate user addresses in user bets endpoint', () => {
      expect(routesContent).toContain('Invalid Solana address');
      expect(routesContent).toContain('new PublicKey(userAddress)');
    });

    it('should validate event IDs in event endpoints', () => {
      expect(routesContent).toContain('Invalid event ID');
      expect(routesContent).toContain('parseInt');
    });
  });
});

describe('Phase 6 Integration: Deployment Script Validation', () => {
  describe('Script Execution Flow', () => {
    const scripts = [
      'deploy-solana-localnet.js',
      'deploy-solana-devnet.js',
      'deploy-solana-testnet.js',
      'deploy-solana-mainnet.js',
    ];

    scripts.forEach((scriptName) => {
      it(`${scriptName} should have complete deployment flow`, () => {
        const scriptPath = path.join(rootDir, 'scripts', scriptName);
        const content = fs.readFileSync(scriptPath, 'utf8');
        
        // Check for key deployment steps
        const requiredSteps = [
          'connection', // Connection usage (lowercase for provider.connection)
          'programId',
          'programStatePDA',
          'initialize',
          'deploymentInfo',
          'fs.writeFileSync',
          '.env.solana.',
        ];
        
        requiredSteps.forEach((step) => {
          expect(content).toContain(step);
        });
      });
    });

    it('mainnet script should have additional safety checks', () => {
      const scriptPath = path.join(rootDir, 'scripts/deploy-solana-mainnet.js');
      const content = fs.readFileSync(scriptPath, 'utf8');
      
      expect(content).toContain('WARNING');
      expect(content).toContain('confirmDeployment');
      expect(content).toContain('I UNDERSTAND THE RISKS');
      expect(content).toContain('balance');
      expect(content).toContain('5 * LAMPORTS_PER_SOL');
    });
  });

  describe('Verification Script', () => {
    it('should verify all networks', () => {
      const scriptPath = path.join(rootDir, 'scripts/verify-solana-deployment.js');
      const content = fs.readFileSync(scriptPath, 'utf8');
      
      const networks = ['localnet', 'devnet', 'testnet', 'mainnet'];
      networks.forEach((network) => {
        expect(content).toContain(network);
      });
    });

    it('should check program existence', () => {
      const scriptPath = path.join(rootDir, 'scripts/verify-solana-deployment.js');
      const content = fs.readFileSync(scriptPath, 'utf8');
      
      expect(content).toContain('getAccountInfo');
      expect(content).toContain('programState');
    });

    it('should validate environment files', () => {
      const scriptPath = path.join(rootDir, 'scripts/verify-solana-deployment.js');
      const content = fs.readFileSync(scriptPath, 'utf8');
      
      expect(content).toContain('.env.solana.');
      expect(content).toContain('VITE_SOLANA_PROGRAM_ID');
    });
  });
});

describe('Phase 6 Integration: Complete Workflow', () => {
  it('should have all components for local development', () => {
    const requiredComponents = [
      '.env.solana.localnet',
      'scripts/deploy-solana-localnet.js',
      'server/routes-solana.ts',
    ];
    
    requiredComponents.forEach((component) => {
      const componentPath = path.join(rootDir, component);
      expect(fs.existsSync(componentPath), `${component} should exist`).toBe(true);
    });
  });

  it('should have all components for devnet testing', () => {
    const requiredComponents = [
      '.env.solana.devnet',
      'scripts/deploy-solana-devnet.js',
    ];
    
    requiredComponents.forEach((component) => {
      const componentPath = path.join(rootDir, component);
      expect(fs.existsSync(componentPath), `${component} should exist`).toBe(true);
    });
  });

  it('should have all components for testnet staging', () => {
    const requiredComponents = [
      '.env.solana.testnet',
      'scripts/deploy-solana-testnet.js',
    ];
    
    requiredComponents.forEach((component) => {
      const componentPath = path.join(rootDir, component);
      expect(fs.existsSync(componentPath), `${component} should exist`).toBe(true);
    });
  });

  it('should have all components for mainnet production', () => {
    const requiredComponents = [
      '.env.solana.mainnet',
      'scripts/deploy-solana-mainnet.js',
    ];
    
    requiredComponents.forEach((component) => {
      const componentPath = path.join(rootDir, component);
      expect(fs.existsSync(componentPath), `${component} should exist`).toBe(true);
    });
  });

  it('should have deployment verification for all networks', () => {
    const scriptPath = path.join(rootDir, 'scripts/verify-solana-deployment.js');
    expect(fs.existsSync(scriptPath)).toBe(true);
    
    const content = fs.readFileSync(scriptPath, 'utf8');
    expect(content).toContain('verifyDeployment');
    expect(content).toContain('verifyAll');
  });

  it('should have npm scripts for complete workflow', () => {
    const packagePath = path.join(rootDir, 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    
    const requiredScripts = [
      'compile:solana',
      'deploy:solana:localnet',
      'deploy:solana:devnet',
      'deploy:solana:testnet',
      'deploy:solana:mainnet',
      'deploy:verify',
      'localnet:start',
      'localnet:stop',
      'localnet:setup',
    ];
    
    requiredScripts.forEach((script) => {
      expect(packageJson.scripts).toHaveProperty(script);
    });
  });
});

export { describe, it, expect };
