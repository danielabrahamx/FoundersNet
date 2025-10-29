# FoundersNet Demo - Quick Reference

## 🚀 Start the App
```bash
npm run dev
# Opens at http://localhost:8000
```

## 👥 4 Built-in Demo Accounts
- **Admin** - Create & resolve events
- **Alice** - Bettor (100 SOL)
- **Bob** - Bettor (100 SOL)  
- **Charlie** - Bettor (100 SOL)

## 🎮 Switch Accounts
Header dropdown → Select account → Balance updates

## 📋 Workflow
1. **Admin** → Create event (name + end time)
2. **Alice/Bob/Charlie** → Place bets on event
3. **Admin** → Resolve event (choose YES/NO)
4. **Bettors** → Claim winnings if correct

## 💰 Account Selector Location
**Top right of header** - Shows current account & SOL balance

## 📱 Admin Only
- Creating events
- Resolving events
- Admin tab in navigation

## ✅ What's Working
- Account switching with real balance tracking
- Event creation, betting, and resolution
- Payout calculations
- Bet history
- Responsive UI

## 🔑 Key Files
- `DemoAccountContext.tsx` - Account state management
- `AccountSelector.tsx` - Account switcher UI
- `routes-solana.ts` - Backend demo API
- `.env` - `DEMO_MODE=true`

---
**No blockchain setup needed - everything is in-memory!**
