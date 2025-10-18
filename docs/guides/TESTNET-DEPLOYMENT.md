# TestNet Deployment - Quick Guide

## Prerequisites ✅

Before deploying, make sure you have:

1. **Pera Wallet on mobile** with TestNet enabled
2. **At least 5 ALGO** in your TestNet account
3. **Your wallet address** (58 characters)
4. **Your wallet mnemonic** (24 words - TestNet only!)

---

## Get Test ALGO

Visit: **https://bank.testnet.algorand.network/**

1. Paste your wallet address
2. Complete captcha
3. Click "Dispense"
4. Wait ~10 seconds
5. Check Pera Wallet for funds

**Note:** Faucet limit is 10 ALGO per 24 hours.

---

## Option 1: Interactive Setup (Recommended)

Run the setup script that will guide you through:

```powershell
.\scripts\setup-testnet.ps1
```

This will:
- ✅ Validate your wallet address
- ✅ Validate your mnemonic
- ✅ Save configuration
- ✅ Deploy to TestNet
- ✅ Show next steps

---

## Option 2: Manual Setup

### Step 1: Configure .env.testnet

Edit `.env.testnet`:

```bash
VITE_ALGORAND_NETWORK=testnet

# Your wallet address (58 characters)
VITE_ALGORAND_ADMIN_ADDRESS=IWEYBK...COWDSCY

# Your mnemonic (24 words)
ALGORAND_MNEMONIC=word1 word2 word3 ... word24
ALGORAND_DEPLOYER_MNEMONIC=word1 word2 word3 ... word24

NODE_ENV=development
VITE_API_URL=http://localhost:5000
```

### Step 2: Activate TestNet Config

```powershell
Copy-Item .env.testnet .env
```

### Step 3: Deploy

```powershell
npm run deploy:testnet
```

### Step 4: Update App ID

Copy the App ID from the deployment output, then edit `.env`:

```bash
VITE_ALGORAND_APP_ID=123456789
```

### Step 5: Start Dev Server

```powershell
npm run dev
```

### Step 6: Connect Pera Wallet

1. Open http://localhost:5173
2. Click "Connect Wallet"
3. Scan QR code with Pera Wallet
4. Approve connection

---

## Deployment Costs

Typical TestNet deployment costs:

| Item | Cost |
|------|------|
| Transaction Fee | 0.001 ALGO |
| App Min Balance | 0.1 ALGO |
| Program Storage | ~0.5 ALGO |
| Initial Box Storage | ~1-2 ALGO |
| **Total** | **~2-3 ALGO** |

**You'll need ~5 ALGO total** to deploy and test comfortably.

---

## Troubleshooting

### "Insufficient Balance"

**Problem:** Not enough ALGO for deployment

**Solution:**
```powershell
# Get more test ALGO
# Visit: https://bank.testnet.algorand.network/
```

### "Invalid Mnemonic"

**Problem:** Mnemonic format incorrect

**Solutions:**
- Must be exactly 24 words
- Separated by spaces
- No extra punctuation
- Check for typos

### "Account Not Found"

**Problem:** Account hasn't received funds yet

**Solution:**
```powershell
# Wait 10-30 seconds after faucet dispense
# Check balance in Pera Wallet
```

### "Deployment Failed - Connection Error"

**Problem:** Network connectivity issue

**Solution:**
```powershell
# Check internet connection
# Try again - TestNet can be slow
npm run deploy:testnet
```

---

## After Deployment

### Verify Deployment

```powershell
npm run deploy:verify testnet
```

### View on Explorer

Your app will be visible at:
```
https://testnet.algoexplorer.io/application/YOUR_APP_ID
```

### Start Testing

```powershell
# Make sure .env has correct APP_ID
npm run dev

# Open browser
# http://localhost:5173

# Connect Pera Wallet
# Create events (admin only)
# Place bets
# Test all features
```

---

## Security Reminders

⚠️ **NEVER share your MainNet mnemonic!**

✅ **Safe to share:**
- TestNet wallet address
- TestNet App ID

❌ **NEVER share:**
- MainNet mnemonic
- Private keys
- Mnemonics for accounts with real funds

---

## Need Help?

**Check these first:**
1. Pera Wallet is on TestNet (not MainNet)
2. You have at least 5 ALGO
3. Mnemonic is exactly 24 words
4. Address is 58 characters

**Still stuck?**
- Read full error message
- Check `docs/TROUBLESHOOTING.md`
- Ask in GitHub Discussions

---

## Quick Commands Reference

```powershell
# Interactive setup
.\scripts\setup-testnet.ps1

# Manual deploy
npm run deploy:testnet

# Verify deployment
npm run deploy:verify testnet

# Start dev server
npm run dev

# Switch back to LocalNet
Copy-Item .env.localnet .env
npm run dev
```

---

**Ready? Run: `.\scripts\setup-testnet.ps1`** 🚀
