# FoundersNet 

> **Decentralized prediction markets on Solana - bet on startup success with blockchain transparency**

[![Solana](https://img.shields.io/badge/Solana-Smart%20Contract-brightgreen)](https://solana.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

**🎥 DEMO VIDEO:** https://youtu.be/1JXoABdrP04
**💻 CODE OVERVIEW VIDEO:** https://youtu.be/SGxryo_z_sw

---

## 🎯 What It Does

A trustless prediction market where users bet SOL on startup funding outcomes:

- 🔐 **Trustless:** Smart contracts enforce fair outcomes
- 🔍 **Transparent:** All bets visible on-chain
- ⚡ **Instant Payouts:** Automated winnings distribution
- 💰 **Low Fees:** Solana's low transaction fees

---


## 🚀 Quick Start (3 Steps)

### 1️⃣ Install Dependencies
```bash
npm install
```

### 2️⃣ Run Tests (Verify Everything Works)
```bash
npm run test:unit
# Expected: 272 tests passing | 21 skipped | 0 failures
```

### 3️⃣ Start Development Server
```bash
npm run dev
# Frontend: http://localhost:8000
# Backend: http://localhost:5000
```

---

## 🌐 Deployment Instructions

### Prerequisites
- Node.js 18+
- Solana CLI 1.18.18+
- Anchor Framework 0.30.1+
- A Solana wallet (Phantom recommended)

### Deploy to Solana Devnet

**Step 1: Configure Environment**
```bash
# Create .env file
cp .env.example .env

# Set your RPC URL (or use default Devnet)
VITE_SOLANA_NETWORK=devnet
VITE_SOLANA_RPC_URL=https://api.devnet.solana.com
```

**Step 2: Build Smart Contract**
```bash
cd smart_contracts/solana
anchor build
```

**Step 3: Deploy Contract**
```bash
anchor deploy --provider.cluster devnet
```

**Step 4: Update Program ID**
```bash
# Copy the deployed program ID and update:
# - Anchor.toml: [programs.devnet]
# - shared/contracts.ts: SOLANA_PROGRAM_ID
```

**Step 5: Initialize Program**
```bash
# Run initialization script with your admin wallet
node scripts/deploy-solana-devnet.js
```

**Step 6: Build & Deploy Frontend**
```bash
npm run build:frontend
# Deploy dist/ folder to your hosting provider (Vercel, Netlify, etc.)
```

### Deploy to Solana Localnet (Testing)

```bash
# Start local validator
solana-test-validator

# In another terminal:
cd smart_contracts/solana
anchor build
anchor deploy --provider.cluster localnet

# Initialize and test
npm run dev
```

---

## 🏗️ Architecture

```
┌─────────────────┐
│   React App     │  User Interface (TypeScript + Vite)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Solana Wallet   │  (Sign Transactions)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Express Backend │  (Port 5000 - API Layer)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Solana Program  │  Smart Contract (Anchor/Rust)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Solana Network  │  Devnet/Mainnet
└─────────────────┘
```

---

## 🛠️ Tech Stack

**Frontend:**
- React 18 + TypeScript
- Vite build tool
- TailwindCSS + shadcn/ui
- @solana/wallet-adapter-react
- @solana/web3.js

**Backend:**
- Express.js REST API
- @solana/web3.js

**Smart Contract:**
- Rust
- Anchor Framework (v0.30.1)
- Solana Program (9 instructions)

---

## 📁 Project Structure

```
FoundersNet/
├── client/src/              # React frontend
│   ├── components/          # UI components
│   ├── hooks/               # Custom hooks (blockchain interactions)
│   ├── services/            # Solana service layer
│   ├── pages/               # App pages (Home, Admin, MyBets)
│   └── contexts/            # React contexts (Wallet)
├── server/                  # Express.js backend
│   ├── index.ts            # Server entry point
│   └── routes-solana.ts    # API endpoints
├── smart_contracts/solana/  # Solana program
│   └── programs/prediction_market/
│       └── src/lib.rs      # Smart contract (508 lines)
├── scripts/                 # Deployment scripts
├── test/                    # Test suites (272 tests)
└── docs/                    # Documentation
```

---

## 🧪 Testing

```bash
# Run all tests
npm run test:unit

# Type checking
npm run check

# Lint code
npm run lint

# Build production
npm run build:frontend
```

**Test Coverage:**
- ✅ 272 unit tests passing
- ✅ E2E workflow validation
- ✅ Smart contract instructions tested
- ✅ Frontend component tests

---

## 🎮 How to Use

### As a User:
1. Connect your Solana wallet (Phantom, Solflare, etc.)
2. Browse active prediction events
3. Place YES/NO bets with SOL
4. Wait for admin to resolve event
5. Claim proportional winnings if you won!

### As an Admin:
1. Connect with the admin wallet
2. Create new prediction events (name, emoji, end time)
3. Resolve events when outcome is known
4. Platform automatically distributes winnings

---

## 🔧 Development Commands

```bash
# Development
npm run dev                    # Start dev servers
npm run dev:frontend          # Frontend only (port 8000)
npm run dev:backend           # Backend only (port 5000)

# Building
npm run build                 # Build everything
npm run build:frontend        # Build frontend only

# Testing
npm run test:unit             # Run all tests
npm run test:unit:watch       # Watch mode
npm run check                 # Type checking

# Solana
npm run compile:solana        # Build smart contract
anchor test                   # Test smart contract
```

---

## 📚 Technical Deep Dive

### Solana Integration Highlights

**1. Program Derived Addresses (PDAs)**
- Deterministic account addresses for events and bets
- Scalable to unlimited prediction markets
- No state size constraints

**2. Atomic Transactions**
- SOL transfers and bet recording in single transaction
- Guaranteed consistency
- No partial execution failures

**3. High-Speed Finality**
- Sub-second confirmation times
- Real-time betting experience
- No waiting for multiple blocks

**4. Low Transaction Costs**
- ~$0.00025 per transaction
- Makes micro-betting economically viable
- Superior to high-fee chains

---

## 📖 Documentation

- **[AGENTS.md](./AGENTS.md)** - Coding guidelines for contributors
- **[START-HERE.md](./START-HERE.md)** - Complete setup guide
- **[DEVNET_DEPLOYMENT_GUIDE.md](./DEVNET_DEPLOYMENT_GUIDE.md)** - Detailed deployment steps
- **[TEST_DOCUMENTATION.md](./TEST_DOCUMENTATION.md)** - Testing guide

---

## 🤝 Contributing

Contributions welcome! Please read [AGENTS.md](./AGENTS.md) for coding guidelines.

---

## 📄 License

MIT License - see [LICENSE](./LICENSE) for details

---

**Built with ❤️ on Solana** 🚀 
