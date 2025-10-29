# FoundersNet Demo Setup Guide

## 🎯 Quick Start

The FoundersNet platform is now fully configured as a **mock demo** for testing startup prediction markets on Solana. No localnet required!

### Running the Demo

```bash
cd c:\Users\danie\FoundersNet
npm run dev
```

Then open: **http://localhost:8000**

---

## 👥 Demo Accounts

Four test accounts are built into the system with 100 SOL each:

| Account | Address | Role | Purpose |
|---------|---------|------|---------|
| **Admin** | `3Nv4rUUkigbtqYJomNvRSKiBRLUMPaxdqWdvFU2777uT` | Admin | Create events, resolve outcomes |
| **Alice** | `HJo4gHiC3pMShSM5HYTwynb31FXMe2ocTVzUDX9kpHv7` | Bettor | Place bets on events |
| **Bob** | `DfzBqu6oYMng4qqR9CjJwQmMFXyTdhzVyFNsYrvLEr5b` | Bettor | Place bets on events |
| **Charlie** | `FBEqV7ytYEfrW8FQdpfNGLVD5DGEZVzm2maq1A5aDrdU` | Bettor | Place bets on events |

---

## 🎮 How to Use

### 1. **Select an Account**
   - Look at the header - find the **Account Selector dropdown**
   - Click it to switch between Admin, Alice, Bob, or Charlie
   - Your balance updates in real-time (100 SOL each)

### 2. **Create a Startup Event (Admin Only)**
   - Switch to **Admin** account
   - Click **Admin** tab in navigation
   - Fill in: Event name (e.g., "Will Startup X reach $1M ARR?")
   - Set betting end time
   - Click **Create Event**

### 3. **Place a Bet**
   - Switch to **Alice**, **Bob**, or **Charlie**
   - Go to **Home** tab
   - Find an event and click "Place Bet"
   - Enter amount and choose YES or NO
   - Click **Place Bet** - your SOL balance decreases

### 4. **Resolve an Event**
   - Switch back to **Admin**
   - Go to **Admin** tab
   - Find the event
   - Click **Resolve** and choose the outcome
   - Event is now locked for betting

### 5. **Claim Winnings**
   - Switch to a bettor account (**Alice**, **Bob**, or **Charlie**)
   - Go to **My Bets**
   - If you bet correctly, click **Claim Winnings**
   - Your balance increases with your payout

---

## 🔧 API Endpoints

### Demo Mode Endpoints
```
GET  /api/accounts                 → List all demo accounts
GET  /api/accounts/:address        → Get specific account balance
GET  /api/events                   → List all events
POST /api/events                   → Create new event (requires admin)
POST /api/events/:id/resolve       → Resolve event outcome
GET  /api/bets                     → Get all bets
POST /api/bets                     → Place a bet
POST /api/bets/claim              → Claim winnings
GET  /api/health                   → Health check (shows demo mode)
```

### Example cURL Commands

**Get all demo accounts:**
```bash
curl http://localhost:5000/api/accounts
```

**Check account balance:**
```bash
curl http://localhost:5000/api/accounts/HJo4gHiC3pMShSM5HYTwynb31FXMe2ocTVzUDX9kpHv7
```

**Get all events:**
```bash
curl http://localhost:5000/api/events
```

---

## 📊 Architecture

### Frontend
- **React 18** with TypeScript
- **Account Context** (`DemoAccountContext.tsx`) - manages current account & balances
- **Account Selector Component** - UI dropdown to switch accounts
- **Integrated into Header** - clean, non-blocking layout

### Backend
- **Express.js** server
- **Demo Mode** enabled by default (`DEMO_MODE=true` in .env)
- **In-memory storage** - events, bets, and account balances
- **Realistic Solana addresses** - tests look like real Solana interactions

### State Management
- React Context for account selection
- TanStack Query for API data fetching
- In-memory demo state server-side

---

## 🔄 Workflow Example

### Complete Demo Flow

1. **Start the app** → `npm run dev`
2. **Account is Admin by default** → See Admin tab in nav
3. **Create event**:
   - Name: "Will Figma reach $100M ARR by Q1 2026?"
   - End time: Tomorrow
   - Click Create
4. **Switch to Alice** → dropdown in header
5. **Go Home** → See the event
6. **Place bet**:
   - Bet 5 SOL on YES
   - Alice balance: 100 → 95 SOL
7. **Switch to Bob** → Place 3 SOL bet on NO
8. **Switch to Admin** → Resolve event
   - Choose YES outcome
9. **Switch to Alice** → Go to My Bets
10. **Claim winnings** → Alice wins! Balance increases

---

## 💡 Key Files Modified

| File | Change |
|------|--------|
| `client/src/contexts/DemoAccountContext.tsx` | NEW - Account management context |
| `client/src/components/AccountSelector.tsx` | NEW - Compact account switcher |
| `client/src/SolanaApp.tsx` | Added DemoAccountProvider wrapper |
| `client/src/components/SolanaHeader.tsx` | Integrated AccountSelector, cleaned layout |
| `server/routes-solana.ts` | Added `/api/accounts/*` endpoints |
| `.env` | Added `DEMO_MODE=true` and `VITE_DEMO_MODE=true` |

---

## 🚀 Next Steps (When Ready for Real Solana)

1. Set `DEMO_MODE=false` in `.env`
2. Start localnet: `npm run localnet:start`
3. Deploy smart contract: `anchor build && anchor deploy`
4. Update `VITE_SOLANA_PROGRAM_ID` in `.env`
5. Connect real Solana wallets (Phantom, Solflare)

---

## ✅ What Works Right Now

✓ Switch between 4 demo accounts  
✓ See real-time SOL balances  
✓ Create startup prediction events  
✓ Place bets on events  
✓ Resolve events  
✓ Claim winnings  
✓ Calculate payouts correctly  
✓ Track bet history  
✓ Admin access control  
✓ All Solana-like addresses and amounts in lamports  

---

## 🐛 Troubleshooting

**Q: Account selector not showing?**
- It's only visible on desktop (hidden on mobile)
- Try resizing browser or using dev tools

**Q: Balance not updating?**
- Refresh the page or switch accounts
- Check browser console for errors

**Q: Can't create event?**
- Must be Admin account
- Make sure event end time is in the future

**Q: Port 5000 or 8000 already in use?**
- Kill existing processes:
  ```powershell
  Stop-Process -Name "node" -Force
  ```

---

## 📝 Environment Variables

Located in `.env`:

```properties
# Enable demo mode
DEMO_MODE=true
VITE_DEMO_MODE=true

# Backend
PORT=5000

# Network (stay on localnet for demo)
VITE_SOLANA_NETWORK=solana-localnet
VITE_SOLANA_RPC_URL=http://localhost:8899

# When ready for real contract (optional for demo)
VITE_SOLANA_PROGRAM_ID=Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS
VITE_SOLANA_ADMIN_ADDRESS=87acAkPL2L84c1WUVYM7VwPRsjhpm7uXWhJwqjgEheA9
```

---

## 🎓 Learning Resources

- **Solana Docs**: https://docs.solana.com
- **Anchor Framework**: https://www.anchor-lang.com
- **TanStack Query**: https://tanstack.com/query
- **shadcn/ui**: https://ui.shadcn.com

---

**Enjoy testing FoundersNet! 🚀**
