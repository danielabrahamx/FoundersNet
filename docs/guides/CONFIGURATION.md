# Configuration Guide

## Overview

Configuration is centralized in the `config/` directory using a validated, type-safe approach.

---

## Environment Files

### File Structure

```
.env                      # Active configuration (gitignored)
.env.template             # Template with all options documented
.env.localnet             # Pre-configured for LocalNet
.env.testnet.template     # Template for TestNet
```

### Setup Process

#### For LocalNet Development

```bash
cp .env.localnet .env
# That's it! Pre-configured and ready to go
```

#### For TestNet

```bash
# 1. Copy template
cp .env.testnet.template .env

# 2. Fill in your values
# - VITE_ALGORAND_APP_ID (from deployment)
# - VITE_ALGORAND_ADMIN_ADDRESS (your wallet)
# - Optional: ALGORAND_MNEMONIC (for deployments)
```

---

## Environment Variables Reference

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_ALGORAND_NETWORK` | Network to connect to | `localnet`, `testnet`, `mainnet` |
| `VITE_ALGORAND_APP_ID` | Deployed smart contract ID | `1` (LocalNet), `123456789` (TestNet) |
| `VITE_ALGORAND_ADMIN_ADDRESS` | Admin wallet address | `IWEYBK...COWDSCY` (58 chars) |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Node environment | `development` |
| `VITE_API_URL` | Backend API URL | `http://localhost:5000` |
| `DATABASE_URL` | PostgreSQL connection | In-memory storage |
| `VITE_WALLETCONNECT_PROJECT_ID` | WalletConnect ID | Not used yet |

### Deployment Variables (Not Needed for Runtime)

| Variable | Description | Usage |
|----------|-------------|-------|
| `ALGORAND_MNEMONIC` | Deployer wallet mnemonic | Deploy scripts only |
| `ALGORAND_DEPLOYER_MNEMONIC` | Same as above | Legacy support |

---

## Configuration Access

### In Code

```typescript
// Get validated configuration
import { getConfig, getNetworkConfig } from '@/../../config';

// Access environment config
const config = getConfig();
console.log(config.network);      // 'localnet' | 'testnet' | 'mainnet'
console.log(config.appId);        // number
console.log(config.adminAddress); // string (58 chars)

// Access network config
const networkConfig = getNetworkConfig(config.network);
console.log(networkConfig.algod.url);   // Algod API URL
console.log(networkConfig.explorer.url); // Block explorer URL
```

### Validation

Configuration is validated once at startup:

```typescript
// This happens automatically when you import getConfig()
const config = getConfig();

// If validation fails, you get a clear error:
// ConfigValidationError: Missing required environment variable: VITE_ALGORAND_APP_ID
// Please check your .env file.
```

---

## Network Configurations

### LocalNet

```typescript
{
  name: 'LocalNet',
  algod: {
    url: 'http://localhost',
    port: 4001,
    token: 'aaaa...' // 64 a's
  },
  indexer: {
    url: 'http://localhost',
    port: 8980
  },
  explorer: {
    url: 'http://localhost:8980'
  },
  chainId: 1337
}
```

### TestNet

```typescript
{
  name: 'TestNet',
  algod: {
    url: 'https://testnet-api.algonode.cloud',
    port: 443,
    token: ''
  },
  indexer: {
    url: 'https://testnet-idx.algonode.cloud',
    port: 443
  },
  explorer: {
    url: 'https://testnet.algoexplorer.io'
  },
  chainId: 416002
}
```

### MainNet

```typescript
{
  name: 'MainNet',
  algod: {
    url: 'https://mainnet-api.algonode.cloud',
    port: 443,
    token: ''
  },
  indexer: {
    url: 'https://mainnet-idx.algonode.cloud',
    port: 443
  },
  explorer: {
    url: 'https://algoexplorer.io'
  },
  chainId: 416001
}
```

---

## Common Scenarios

### Switching Networks

```bash
# From LocalNet to TestNet
cp .env.testnet .env
# Update app ID if needed
npm run dev

# From TestNet to LocalNet
cp .env.localnet .env
npm run dev
```

### Deploying to New Network

```bash
# 1. Configure .env for target network
VITE_ALGORAND_NETWORK=testnet

# 2. Deploy
npm run deploy:testnet

# 3. Update .env with app ID from output
VITE_ALGORAND_APP_ID=123456789

# 4. Restart server
npm run dev
```

### Multiple Environments

```bash
# Keep separate env files
.env.localnet      # LocalNet config
.env.testnet       # TestNet config  
.env.production    # MainNet config

# Switch by copying
cp .env.testnet .env
```

---

## Security Best Practices

### ⚠️ Never Commit

- `.env` (active configuration)
- Any file with real mnemonics
- Production credentials

### ✅ Always

- Use `.env.template` for documentation
- Keep mnemonics in password manager
- Use TestNet for development
- Validate mainnet addresses before deployment

### 🔒 Mnemonics

```bash
# Wrong - Stored in .env
ALGORAND_MNEMONIC=word1 word2 ... word25

# Better - Use env var at deploy time
npm run deploy:testnet

# Best - Store in secure vault, pass via script
ALGORAND_MNEMONIC="$(cat ~/.secrets/testnet)" npm run deploy:testnet
```

---

## Troubleshooting

### Error: Missing required environment variable

**Problem:** `.env` file not found or incomplete

**Solution:**
```bash
# Copy appropriate template
cp .env.localnet .env

# Or for TestNet
cp .env.testnet.template .env
# Then fill in required values
```

### Error: Invalid VITE_ALGORAND_NETWORK

**Problem:** Network value is not valid

**Solution:**
```bash
# Must be one of: localnet, testnet, mainnet
VITE_ALGORAND_NETWORK=localnet  # ✅
VITE_ALGORAND_NETWORK=local     # ❌
```

### Error: Invalid app ID

**Problem:** App ID is not a positive integer

**Solution:**
```bash
# After deployment, update .env
VITE_ALGORAND_APP_ID=1          # ✅ LocalNet
VITE_ALGORAND_APP_ID=123456789  # ✅ TestNet/MainNet
VITE_ALGORAND_APP_ID=0          # ❌ Invalid
VITE_ALGORAND_APP_ID=abc        # ❌ Not a number
```

### Wrong network after switch

**Problem:** Still using old network config

**Solution:**
```bash
# 1. Update .env
cp .env.localnet .env

# 2. Restart dev server (Ctrl+C then)
npm run dev

# 3. Hard refresh browser (Ctrl+Shift+R)
```

---

## Advanced Usage

### Custom Network

```typescript
// config/networks.ts
export const NETWORK_CONFIGS = {
  // ... existing networks
  
  custom: {
    name: 'Custom Network',
    algod: {
      url: 'https://my-node.example.com',
      port: 443,
      token: 'my-token'
    },
    // ... rest of config
  }
} as const;
```

### Environment-Specific Features

```typescript
import { isDevelopment, isProduction } from '@/../../config';

if (isDevelopment()) {
  console.log('Debug info');
}

if (isProduction()) {
  // Enable analytics
}
```

---

## See Also

- [Architecture Overview](../architecture/OVERVIEW.md)
- [Local Development Guide](./LOCAL-DEVELOPMENT.md)
- [TestNet Deployment Guide](./TESTNET-DEPLOYMENT.md)
