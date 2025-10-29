# 🚀 FoundersNet - Startup Prediction Markets (Demo Ready)

A **Solana-based prediction market** for betting on startup outcomes. Create events, place bets, and win SOL based on predictions.

## ⚡ Quick Start

```bash
# Install dependencies
npm install

# Start the app (frontend + backend)
npm run dev

# Open browser
http://localhost:8000
```

**That's it!** No blockchain setup needed for the demo.

---

## 🎮 Try the Demo Now

### Built-in Test Accounts
Select from the **Account Selector** in the header:

| Account | Role | Balance |
|---------|------|---------|
| 👑 Admin | Create & manage events | 100 SOL |
| 🎯 Alice | Bettor | 100 SOL |
| 🎯 Bob | Bettor | 100 SOL |
| 🎯 Charlie | Bettor | 100 SOL |

### Demo Workflow
1. **Switch to Admin** → Create a startup prediction event
2. **Switch to Alice** → Place a 5 SOL bet on YES
3. **Switch to Bob** → Place a 3 SOL bet on NO
4. **Back to Admin** → Resolve the event (pick YES winner)
5. **Switch to Alice** → Claim your winnings!

---

## 📋 Features

✅ **Account Switching** - Test with 4 different accounts  
✅ **Event Creation** - Create startup prediction events (admin)  
✅ **Betting** - Place SOL bets on outcomes  
✅ **Event Resolution** - Resolve with winning outcome (admin)  
✅ **Payout System** - Automatic winner calculations  
✅ **Real-time Balances** - See SOL updates instantly  
✅ **Bet History** - Track all your predictions  
✅ **Responsive UI** - Works on desktop and mobile  

---

## 🏗️ Architecture

### Frontend
- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **TanStack Query** for data fetching
- **Demo Account Context** for account management
- **shadcn/ui** components

### Backend
- **Express.js** server
- **In-memory demo state** (no database needed)
- **Solana-compatible API** (ready for real contracts)

---

## 📚 Documentation

- **[DEMO_SETUP.md](./DEMO_SETUP.md)** - Complete setup guide
- **[QUICK_REFERENCE.md](./QUICK_REFERENCE.md)** - Quick reference card
- **[DEMO_COMPLETE.md](./DEMO_COMPLETE.md)** - Detailed summary

---

## 🔧 Commands

```bash
# Development
npm run dev              # Start frontend + backend
npm run dev:frontend    # Frontend only (port 8000)
npm run dev:backend     # Backend only (port 5000)

# Code Quality
npm run check           # TypeScript check
npm run lint            # ESLint
npm run lint:fix        # ESLint auto-fix
npm run format          # Prettier format

# Testing
npm run test:unit       # Run unit tests
npm run test:unit:watch # Watch mode

# Building
npm run build           # Build for production
```

---

## 🎯 Next Steps (When Ready for Real Solana)

The demo is fully compatible with real Solana. To switch:

1. **Set up localnet**
   ```bash
   npm run localnet:start
   ```

2. **Deploy smart contract**
   ```bash
   cd smart_contracts/solana
   anchor build
   anchor deploy
   ```

3. **Update environment**
   - Edit `.env` and set `DEMO_MODE=false`
   - Add your deployed program ID
   - Use real Solana wallets

All API endpoints remain the same!

---

## 📊 Demo Accounts Details

```json
{
  "admin": {
    "address": "3Nv4rUUkigbtqYJomNvRSKiBRLUMPaxdqWdvFU2777uT",
    "balance": "100 SOL",
    "permissions": ["create_event", "resolve_event"]
  },
  "alice": {
    "address": "HJo4gHiC3pMShSM5HYTwynb31FXMe2ocTVzUDX9kpHv7",
    "balance": "100 SOL",
    "permissions": ["place_bet", "claim_winnings"]
  },
  "bob": {
    "address": "DfzBqu6oYMng4qqR9CjJwQmMFXyTdhzVyFNsYrvLEr5b",
    "balance": "100 SOL",
    "permissions": ["place_bet", "claim_winnings"]
  },
  "charlie": {
    "address": "FBEqV7ytYEfrW8FQdpfNGLVD5DGEZVzm2maq1A5aDrdU",
    "balance": "100 SOL",
    "permissions": ["place_bet", "claim_winnings"]
  }
}
```

---

## 🔌 API Endpoints

### Demo Mode Endpoints
```
GET  /api/accounts                    List demo accounts
GET  /api/accounts/:address           Get account balance
GET  /api/events                      List all events
POST /api/events                      Create event (admin)
GET  /api/events/:id                  Get event details
POST /api/events/:id/resolve          Resolve event (admin)
GET  /api/bets                        List all bets
POST /api/bets                        Place bet
POST /api/bets/claim                 Claim winnings
GET  /api/health                      Health check
```

### Example Requests
```bash
# Get all demo accounts
curl http://localhost:5000/api/accounts

# Get all events
curl http://localhost:5000/api/events

# Check health
curl http://localhost:5000/api/health
```

---

## 🛠️ Environment Setup

```properties
# In .env (already configured for demo)
PORT=5000
NODE_ENV=development

# Enable demo mode
DEMO_MODE=true
VITE_DEMO_MODE=true

# Solana network
VITE_SOLANA_NETWORK=solana-localnet
VITE_SOLANA_RPC_URL=http://localhost:8899

# Program (for real Solana)
VITE_SOLANA_PROGRAM_ID=Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS
```

---

## 🐛 Troubleshooting

**Q: Account selector not showing?**  
A: It's only visible on desktop. Check dev tools or resize browser.

**Q: Port already in use?**  
A: `Stop-Process -Name "node" -Force` then try again

**Q: Balance not updating?**  
A: Refresh page or switch accounts

**Q: Can't create events?**  
A: Make sure you're using Admin account

---

## 📦 Tech Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Express.js** - Backend
- **TanStack Query** - Data fetching
- **Solana Web3.js** - Blockchain integration
- **Vite** - Build tool
- **shadcn/ui** - Component library

---

## 🎓 Learn More

- [Solana Docs](https://docs.solana.com)
- [Anchor Framework](https://www.anchor-lang.com)
- [TanStack Query Docs](https://tanstack.com/query)
- [Tailwind CSS](https://tailwindcss.com)

---

## 📄 License

MIT - Feel free to use this for your hackathon project!

---

**Ready to predict? Start with `npm run dev` and enjoy! 🚀**
