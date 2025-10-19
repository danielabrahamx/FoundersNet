# FoundersNet 

> **Decentralized prediction markets on Algorand - bet on startup success with blockchain transparency**

[![Algorand](https://img.shields.io/badge/Algorand-Smart%20Contract-brightgreen)](https://algorand.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

** LocalNet App ID:** 1002  
** Status:** Production Ready  
** Smart Contract:** Algorand ARC-4 (Python  TEAL)

---
## DEMO VIDEO : [https://m.youtube.com/watch?v=kjgx7n%E2%80%94scq&feature=youtu.be](https://www.youtube.com/watch?v=KjGx7n--ScQ)
## CODE OVERVIEW VIDEO https://youtu.be/6d1tBbY2YwE
##  What It Does

A trustless prediction market where users bet ALGO on startup funding outcomes:

-  **Trustless:** Smart contracts enforce fair outcomes
-  **Transparent:** All bets visible on-chain
-  **Instant Payouts:** Automated winnings distribution
-  **Low Fees:** ~0.002 ALGO per transaction

---

## Technical Implementation & Algorand Integration

### SDKs and Tools Used
- **Algorand Python SDK**: Smart contract development and deployment
- **algosdk 3.0.0**: Frontend blockchain interactions and wallet integration
- **Pera Wallet Connect**: Secure transaction signing
- **AlgoKit**: Development and testing framework

### Key Algorand Features Leveraged

#### 1. Box Storage for Scalability
Traditional Algorand smart contracts are limited by global state storage. FoundersNet uses Box Storage to:
- Store unlimited betting events without state constraints
- Maintain detailed bet history for each user
- Scale to thousands of concurrent prediction markets

#### 2. ARC-4 ABI Encoding
- Type-safe smart contract method calls
- Standardized interface for frontend integration
- Robust error handling and validation

#### 3. Atomic Transactions
- Guaranteed consistency between ALGO transfers and bet recording
- Prevents partial execution failures
- Enables complex multi-step operations

#### 4. Instant Finality
- Bets are confirmed in ~4 seconds
- No waiting for multiple block confirmations
- Superior user experience compared to other blockchains

### What Makes This Uniquely Possible on Algorand

1. **Cost Efficiency**: Ethereum gas fees would make micro-betting economically unviable
2. **Scalability**: Box Storage allows unlimited events without performance degradation  
3. **Developer Experience**: Python SDK enables rapid smart contract development
4. **Network Performance**: 4-second finality enables real-time betting experiences


---

## 📸 Screenshots

### Events Dashboard
![Events Dashboard](docs/screenshots/Homedashboard.png)
*Browse active prediction markets and see real-time betting statistics*

### Admin Dashboard
![Admin Dashboard](docs/screenshots/AdminDashboard.png)
*Manage events, resolve outcomes, and monitor platform activity*

---

##  Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Start Algorand LocalNet
algokit localnet start

# 3. Deploy smart contract
npm run deploy:local

# 4. Start development server
npm run dev

# 5. Visit the app
# Frontend: http://localhost:5173
# Backend API: http://localhost:5000
```

---

##  Architecture

```

   React App       User Interface (TypeScript + Vite)

         
          Pera Wallet / LocalNet Accounts (Sign Transactions)
         
          Express.js Backend (Port 5000)
             PostgreSQL + Drizzle ORM
         
          Algorand LocalNet (Port 4001)
              Smart Contract (App ID 1002)
                  Box Storage (Events, Bets, User Data)
```

---

##  Tech Stack

**Frontend:**
- React 18 + TypeScript
- Vite build tool
- TailwindCSS + shadcn/ui components
- Pera Wallet integration
- algosdk 3.0.0 (latest)

**Backend:**
- Express.js REST API
- PostgreSQL database
- Drizzle ORM
- Algorand SDK for blockchain queries

**Smart Contract:**
- Python (Algorand Python SDK)
- Compiled to TEAL bytecode
- ARC-4 ABI encoding
- Box storage for scalability

---

##  How to Use

### **As a User:**
1. Connect your Pera Wallet or use LocalNet test accounts
2. Browse active prediction events
3. Place YES/NO bets with ALGO
4. Wait for admin to resolve event
5. Claim proportional winnings if you won!

### **As an Admin:**
1. Connect with the admin account
2. Create new prediction events
3. Resolve events when outcome is known
4. Platform automatically distributes winnings

---

##  Testing on LocalNet

We provide 4 pre-funded test accounts:

| Account | Role | Balance |
|---------|------|---------|
| Admin | Create & resolve events | 1000 ALGO |
| Alice | Place bets | 100 ALGO |
| Bob | Place bets | 100 ALGO |
| Charlie | Place bets | 100 ALGO |

---

##  Project Structure

```
StartupMarkets/
 client/src/              # React frontend
    components/          # UI components
    hooks/               # Custom React hooks
    lib/                 # Algorand utilities
    pages/               # App pages
 server/                  # Express.js backend
 smart_contracts/         # Algorand Python contracts
 scripts/                 # Deployment scripts
 docs/                    # Documentation
```

---

##  Deployment

### LocalNet (Development)
```bash
npm run deploy:local
```

### TestNet (Staging)
```bash
npm run deploy:testnet
```

### MainNet (Production)
```bash
npm run deploy:mainnet
```

---

##  Learn More

- **[START-HERE.md](./START-HERE.md)** - Complete setup guide
- **[ACTIVITY.md](./ACTIVITY.md)** - Development history & migration notes
- **[docs/architecture/](./docs/architecture/)** - System architecture details

---

##  Contributing

Contributions welcome! This project is built for the **Algorand Hackathon 2025**.

---

##  License

MIT License - see [LICENSE](./LICENSE) for details

---

**Built with  on Algorand** 
