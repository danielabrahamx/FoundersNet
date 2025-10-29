# 🚀 FoundersNet - Demo Mode Setup Guide

## Overview

FoundersNet is now configured to run in **Demo Mode** - a fully functional mock Solana prediction market that doesn't require:
- Running a Solana validator
- Deploying smart contracts
- Real wallet connections

You can immediately test the entire platform with 4 simulated accounts!

---

## 🎮 Demo Accounts

The system comes with **4 pre-configured accounts**:

| Account | Role | Address | Balance | Purpose |
|---------|------|---------|---------|---------|
| **Admin** | Admin | `3Nv4rUUkigbtqYJomNvRSKiBRLUMPaxdqWdvFU2777uT` | 100 SOL | Create and manage events |
| **Alice** | Bettor | `HJo4gHiC3pMShSM5HYTwynb31FXMe2ocTVzUDX9kpHv7` | 100 SOL | Place bets on events |
| **Bob** | Bettor | `DfzBqu6oYMng4qqR9CjJwQmMFXyTdhzVyFNsYrvLEr5b` | 100 SOL | Place bets on events |
| **Charlie** | Bettor | `FBEqV7ytYEfrW8FQdpfNGLVD5DGEZVzm2maq1A5aDrdU` | 100 SOL | Place bets on events |

---

## 🚀 Getting Started

### 1. Start the Development Servers

```bash
npm run dev
```

This starts:
- **Backend API** on `http://localhost:5000`
- **Frontend** on `http://localhost:8000`

### 2. Open the App

Visit: **http://localhost:8000**

You should see:
- The FoundersNet header with the **Account Selector dropdown**
- The account selector showing "Admin" by default
- Admin balance showing "100.00 SOL"
- Admin address displayed

---

## 🎯 Workflow: Create & Bet

### Step 1: Create a Startup Event (Admin)

1. The account selector should show **"Admin"**
2. Click the **"Admin"** tab in the navigation
3. Fill in:
   - **Event Name**: e.g., "Will TechCorp reach $1M ARR?"
   - **Betting End Time**: Pick a time in the future
4. Click **"Create Event"**
5. Event appears immediately in the market

### Step 2: Switch to Alice & Place a Bet

1. Click the **account selector dropdown** in the header
2. Select **"Alice"**
3. Balance updates to show **"100.00 SOL"** for Alice
4. Go to **"Home"** tab
5. Find the event you created
6. Click **"Place Bet (10 SOL)"**
7. Choose **"YES"** or **"NO"**
8. Bet is placed instantly, Alice's balance decreases by 10 SOL

### Step 3: Bob & Charlie Place Bets

1. Switch to **"Bob"** using the account selector
2. Find the same event
3. Place a bet (Alice bet YES, Bob bets NO)
4. Switch to **"Charlie"** and place another bet

### Step 4: Check My Bets

1. Click **"My Bets"** tab
2. See all bets placed by the current account
3. Switch accounts to see different bet histories

### Step 5: Resolve Event (Admin)

1. Switch back to **"Admin"** account
2. Go to **"Admin"** tab
3. Find the event in the events table
4. Click **"Resolve"**
5. Select outcome (YES or NO)
6. Event is resolved

### Step 6: Claim Winnings

1. Switch to **"Alice"** account
2. Go to **"My Bets"**
3. If Alice's bet matches the outcome, she can **"Claim Winnings"**
4. Her balance increases with winnings

---

## 📊 API Endpoints

All endpoints are available at `http://localhost:5000/api`:

### Events Management

```bash
# Get all events
GET /api/events

# Get specific event
GET /api/events/:id

# Create event (demo mode)
POST /api/events
{
  "name": "Startup prediction",
  "endTime": 1729000000,
  "adminAddress": "3Nv4rUUkigbtqYJomNvRSKiBRLUMPaxdqWdvFU2777uT"
}

# Resolve event (demo mode)
POST /api/events/:id/resolve
{
  "outcome": true,
  "adminAddress": "3Nv4rUUkigbtqYJomNvRSKiBRLUMPaxdqWdvFU2777uT"
}
```

### Betting

```bash
# Place a bet (demo mode)
POST /api/bets
{
  "eventId": 1,
  "bettor": "HJo4gHiC3pMShSM5HYTwynb31FXMe2ocTVzUDX9kpHv7",
  "outcome": true,
  "amount": 10000000000
}

# Get user's bets
GET /api/users/:address/bets

# Get event's bets
GET /api/events/:id/bets

# Claim winnings
POST /api/bets/claim
{
  "eventId": 1,
  "bettor": "HJo4gHiC3pMShSM5HYTwynb31FXMe2ocTVzUDX9kpHv7"
}
```

### Accounts

```bash
# List all demo accounts
GET /api/accounts

# Get specific account balance
GET /api/accounts/:address
```

### Health

```bash
# Health check
GET /api/health
```

---

## 🎨 UI Components

### Account Selector (Header)

The new **AccountSelector** component in the header allows:
- Dropdown to switch between accounts
- Displays current account balance in SOL
- Shows admin badge for admin account
- Displays wallet address

### Admin Panel Updates

- Automatically hides/shows based on selected account role
- Only Admin can see the "Admin" tab
- Form validation for event creation

---

## 🔧 Environment Configuration

Demo mode is enabled in `.env`:

```properties
DEMO_MODE=true
VITE_DEMO_MODE=true
```

To disable demo mode and use real Solana:
```properties
DEMO_MODE=false
VITE_DEMO_MODE=false
```

---

## 📝 How It Works Behind the Scenes

### Frontend
- **DemoAccountContext**: Manages selected account state
- **AccountSelector**: UI component for account switching
- Account balance updates automatically when switching

### Backend
- **DEMO_MODE flag**: Routes all requests to in-memory data structures
- **seedDemoState()**: Initializes accounts and demo data on startup
- All CRUD operations (create event, place bet, resolve, claim) work with mock data
- Balances updated in-memory and persist during the session

### Data Storage
- **Events**: `demoEvents` object indexed by event ID
- **Bets**: `demoBets` array with full bet records
- **Accounts**: `demoAccounts` object with balance tracking
- **Counters**: `demoCounters` for auto-incrementing IDs

---

## 🧪 Testing Scenarios

### Scenario 1: Simple Bet Flow
1. Admin creates event "Will Startup X reach $1M ARR?"
2. Alice bets $10 on YES
3. Bob bets $5 on NO
4. Charlie bets $8 on YES
5. Admin resolves to YES
6. Alice and Charlie claim winnings

### Scenario 2: Multiple Events
- Create 3 different events simultaneously
- Different users betting on different events
- Mix of resolved and open events

### Scenario 3: Balance Tracking
- Monitor account balances as bets are placed
- Verify correct deductions and payouts
- Test insufficient balance scenario

---

## 🐛 Troubleshooting

### Account Selector Not Showing
- Ensure `DemoAccountProvider` wraps your app in `SolanaApp.tsx`
- Check browser console for errors

### Balances Not Updating
- Refresh the page (demo data persists in backend)
- Check that `useDemoAccount` hook is called in components

### Events Not Appearing
- Make sure you're creating events as Admin
- Check `/api/events` endpoint to verify events exist

### Can't Place Bets
- Verify current account has sufficient balance (at least 10 SOL)
- Check that event hasn't been resolved yet
- Ensure event end time is in the future

---

## 🚀 Next Steps: Real Solana Integration

When ready to integrate with real Solana:

1. Deploy smart contract to localnet/devnet
2. Update `VITE_SOLANA_PROGRAM_ID` in `.env`
3. Set `DEMO_MODE=false` in `.env`
4. Start localnet validator: `npm run localnet:start`
5. Deploy contract: `npm run deploy:solana:localnet`
6. The API will automatically use smart contract instead of demo mode

---

## 📚 Additional Resources

- **API Documentation**: `/server/routes-solana.ts`
- **Frontend Components**: `/client/src/components/`
- **Context Hooks**: `/client/src/contexts/`
- **Pages**: `/client/src/pages/`

---

## ✅ Verification Checklist

- [x] Account selector shows in header
- [x] Can switch between 4 accounts
- [x] Balance updates when switching accounts
- [x] Admin can create events
- [x] Users can place bets
- [x] Users can claim winnings
- [x] API endpoints return correct data
- [x] No blockchain required
- [x] Everything is Solana-themed (addresses, SOL, lamports)

---

**Ready to test! 🎉**
