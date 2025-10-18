# Demo Video Script & Recording Guide

**Purpose:** Create professional demo video for hackathon submission (Required)

**Duration:** 5-7 minutes (screen recording)

**Tools:**
- **Screen Recording:** OBS Studio (free) or Loom
- **Video Editing:** DaVinci Resolve (free) or Camtasia
- **Audio:** Clear microphone or headset mic

---

## 🎬 Video Script

### Introduction (30 seconds)

**[Show title slide or GitHub repo]**

```
"Hi! I'm [Your Name], and I built Startup Prediction Markets - 
a decentralized betting platform on Algorand blockchain.

The problem: Traditional prediction markets are centralized, 
charge high fees, and lack transparency.

My solution: A smart contract-based platform where users bet 
ALGO on startup funding outcomes, with trustless resolution 
and instant payouts.

Let me show you how it works!"
```

---

### Demo Section 1: Starting LocalNet (45 seconds)

**[Terminal window]**

```
"First, I'll start the Algorand LocalNet - a local blockchain 
for development and testing."
```

**Commands to show:**
```powershell
# Show LocalNet status
algokit localnet status

# If not running:
algokit localnet start
```

**[Wait for LocalNet to start]**

```
"LocalNet is running! It gives us a complete Algorand blockchain 
with funded test accounts, all running on my machine."
```

---

### Demo Section 2: Deploy Smart Contract (1 minute)

**[Terminal window]**

```
"Now I'll deploy our custom smart contract to LocalNet."
```

**Commands to show:**
```powershell
# Show environment config
Get-Content .env

# Deploy contract
npm run deploy:local
```

**[Wait for deployment]**

```
"The contract is deployed! App ID 1008. 
This smart contract handles:
- Creating prediction events
- Recording bets
- Calculating payouts
- Distributing winnings

All written in Python, compiled to TEAL bytecode."
```

**[Optional: Show deployment JSON]**
```powershell
Get-Content deployments/local.json
```

---

### Demo Section 3: Start the dApp (30 seconds)

**[Terminal window]**

```
"Let's start the web application."
```

**Commands:**
```powershell
npm run dev
```

**[Browser opens to localhost:5173]**

```
"And we're live! This is the user interface built with 
React, TypeScript, and Tailwind CSS."
```

---

### Demo Section 4: Admin Creates Event (1 minute)

**[Browser: Navigate to Admin Panel]**

```
"I'm logged in as the admin. Let me create a new prediction event."
```

**Steps to show:**
1. Click "Admin Panel" in navigation
2. Fill out event form:
   - **Event Name:** "Will Startup XYZ raise Series A by Dec 2025?"
   - **End Date:** [Select future date]
3. Click "Create Event"
4. **[Show transaction being signed/confirmed]**

```
"Event created! Notice the transaction was confirmed in about 
4.5 seconds - that's Algorand's instant finality.

The smart contract has now stored this event in Box Storage, 
which allows unlimited events without hitting state limits."
```

---

### Demo Section 5: Place Bets (1.5 minutes)

**[Browser: Navigate back to Events Dashboard]**

```
"Now let's act as regular users and place some bets."
```

**Bet #1 - YES:**
1. Find the event we just created
2. Click "Place Bet"
3. Select "YES" (outcome will happen)
4. Enter amount: **5 ALGO**
5. Click "Confirm Bet"
6. **[Show atomic transaction group being created]**

```
"This creates an atomic transaction group:
- One payment transaction sending 5 ALGO to the contract
- One app call transaction recording the bet

They either both succeed or both fail - no in-between. 
That's how we guarantee fairness."
```

**Bet #2 - NO:**
1. Click "Place Bet" again
2. Select "NO" (outcome won't happen)
3. Enter amount: **3 ALGO**
4. Click "Confirm Bet"

```
"Now we have:
- YES pool: 5 ALGO
- NO pool: 3 ALGO
- Total pool: 8 ALGO

The UI updates in real-time as bets are placed."
```

**[Show betting pools updating on Event Card]**

---

### Demo Section 6: Resolve Event (1 minute)

**[Browser: Navigate to Admin Panel → Resolve Events]**

```
"Time to resolve the event. In reality, we'd wait for the 
actual outcome (did they raise Series A?), but for the demo, 
I'll resolve it now."
```

**Steps:**
1. Find event in "Pending Resolution" section
2. Select outcome: **YES** (they raised funding)
3. Click "Resolve Event"
4. **[Show transaction confirmation]**

```
"Event resolved! The outcome is YES.

The smart contract has now:
- Marked the event as resolved
- Determined the winning pool (YES bettors)
- Calculated proportional payouts

Let's claim the winnings!"
```

---

### Demo Section 7: Claim Winnings (1 minute)

**[Browser: Navigate to My Bets or Event Details]**

```
"I bet 5 ALGO on YES, which won. Let's see my payout."
```

**Steps:**
1. Find the bet in "My Winning Bets"
2. **[Show payout calculation]**
   - My bet: 5 ALGO
   - Total YES pool: 5 ALGO
   - Total pool: 8 ALGO
   - My share: 100% of YES pool
   - Payout: ~8 ALGO (100% return!)
3. Click "Claim Payout"
4. **[Show inner transaction sending ALGO back to user]**

```
"Boom! Instant payout. The smart contract used an inner 
transaction to send my winnings directly to my wallet.

Notice the fee: 0.001 ALGO (~$0.0002 USD). On Ethereum, 
this would cost $5-50 in gas fees. That's why Algorand 
is perfect for micro-betting."
```

---

### Demo Section 8: Block Explorer (30 seconds)

**[Open block explorer]**

```
"Let's verify everything on-chain."
```

**Show:**
1. Navigate to AlgoExplorer (LocalNet or TestNet)
2. Search for App ID: 1008
3. **[Show contract state]**
   - Total events created
   - Total bets placed
   - Contract balance
4. **[Show recent transactions]**
   - Event creation txn
   - Bet placement txns
   - Resolution txn
   - Payout txn

```
"Complete transparency. Anyone can audit the contract, 
verify bet amounts, and see all payouts."
```

---

### Conclusion (30 seconds)

**[Show GitHub repo or closing slide]**

```
"To recap:
- Custom smart contract on Algorand (460 lines of Python)
- Cheap fees make micro-betting economically viable
- Atomic transactions ensure fairness
- Box Storage allows unlimited scaling
- Instant finality = real-time UX

This is fully open source on GitHub. 
Check out the README for setup instructions.

Thanks for watching!"
```

---

## 🎥 Loom Walkthrough Script (Code Explanation - 10-15 minutes)

**Separate video explaining code and repo structure**

### Section 1: Repository Structure (2 minutes)

**[Show file explorer]**

```
"Let me walk through how this project is organized.

At the root:
- smart_contracts/ - Algorand Python contracts
- client/ - React frontend
- server/ - Express backend
- config/ - Centralized configuration
- scripts/ - Deployment scripts
- docs/ - All documentation

This follows a clean architecture pattern with clear separation."
```

---

### Section 2: Smart Contract Deep Dive (5 minutes)

**[Open prediction_market.py]**

```
"The heart of the project is this smart contract. 
It's written in Python using AlgoPy framework.

Let me explain the key parts:"
```

**Show:**

1. **Data Structures (lines 1-40)**
```python
class EventStruct(arc4.Struct):
    event_id: arc4.UInt64
    name: arc4.String
    end_time: arc4.UInt64
    resolved: arc4.Bool
    outcome: arc4.Bool
    total_yes_bets: arc4.UInt64
    total_no_bets: arc4.UInt64
    total_yes_amount: arc4.UInt64
    total_no_amount: arc4.UInt64
```
```
"This defines how we store event data. ARC-4 structs provide 
type safety and efficient encoding."
```

2. **Box Storage (lines 60-65)**
```python
self.events = BoxMap(arc4.UInt64, EventStruct)
self.bets = BoxMap(arc4.UInt64, BetStruct)
self.user_bets = BoxMap(arc4.Address, arc4.DynamicArray[arc4.UInt64])
```
```
"Box Storage is key - it lets us store unlimited events and bets. 
Traditional global state is limited to 64 key-value pairs. 
With boxes, we only pay for what we use."
```

3. **Create Event Method (lines 75-100)**
```
"Only the admin can create events. We validate:
- Caller is admin
- End time is in the future
- Then increment counter and store event in box"
```

4. **Place Bet Method (lines 120-180)**
```
"This is complex because we use atomic transactions.

The bettor sends ALGO via payment transaction,
and we record the bet in the same atomic group.

Key validation:
- Event exists
- Event not resolved
- End time not passed
- Payment amount matches

Then we update both event totals AND user's bet list."
```

5. **Claim Payout Method (lines 250-300)**
```
"Payout calculation is proportional:

payout = (user_bet / winning_pool) * total_pool

We use an inner transaction to send ALGO back to the user.
This is unique to Algorand - the contract can directly 
send funds without the user having to withdraw."
```

---

### Section 3: Frontend Integration (3 minutes)

**[Open client/src/hooks/useAlgorand.ts or similar]**

```
"The frontend uses algosdk to interact with the contract."
```

**Show:**

1. **Connecting to Algorand**
```typescript
const algodClient = new algosdk.Algodv2(
  '',
  'http://localhost:4001',
  ''
);
```

2. **Creating Atomic Transaction Group**
```typescript
// Payment transaction
const paymentTxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
  from: userAddress,
  to: appAddress,
  amount: betAmount,
  suggestedParams
});

// App call transaction
const appCallTxn = algosdk.makeApplicationCallTxnFromObject({
  from: userAddress,
  appIndex: APP_ID,
  onComplete: algosdk.OnApplicationComplete.NoOpOC,
  appArgs: [encodedMethodCall],
  suggestedParams
});

// Group them atomically
algosdk.assignGroupID([paymentTxn, appCallTxn]);
```

3. **Wallet Integration**
```
"We use Pera Wallet Connect for signing.
Users never share private keys - the wallet app signs 
transactions securely."
```

---

### Section 4: Why Algorand? (2 minutes)

**[Show comparison chart or README section]**

```
"Why did I choose Algorand over Ethereum or other chains?

1. Fees: $0.001 vs $5-50 on Ethereum
   → Makes micro-betting viable

2. Speed: 4.5 seconds vs 15 minutes on Ethereum
   → Real-time user experience

3. Atomic Transactions: Built-in feature
   → Fairness guarantees (payment + bet recorded together)

4. Box Storage: Unlimited scalability
   → No hit to global state limits

5. Python Smart Contracts: More accessible than Solidity
   → Easier to audit and maintain

This project wouldn't be economically feasible on Ethereum."
```

---

### Conclusion (1 minute)

**[Show README or GitHub repo]**

```
"Everything is documented in the README:
- Setup instructions
- Architecture diagrams
- API documentation
- Deployment guides

The code is open source under MIT license.

If you have questions, feel free to reach out!

Thanks for watching this technical walkthrough."
```

---

## 📝 Recording Checklist

**Before Recording:**
- [ ] Clean browser (close unnecessary tabs)
- [ ] Clear terminal history
- [ ] Prepare test data (event names, bet amounts)
- [ ] Test full flow once (dry run)
- [ ] Close distracting applications
- [ ] Check microphone audio levels
- [ ] Prepare notes/script on second monitor

**During Recording:**
- [ ] Speak clearly and at moderate pace
- [ ] Pause between major sections (easier to edit)
- [ ] Point cursor to important UI elements
- [ ] Read transaction IDs slowly if showing them
- [ ] Zoom in on small text (terminal output)
- [ ] Show loading states (don't fast-forward)

**After Recording:**
- [ ] Watch full video for errors
- [ ] Edit out long pauses or mistakes
- [ ] Add captions/subtitles (accessibility)
- [ ] Export at 1080p minimum
- [ ] Upload to YouTube (unlisted or public)
- [ ] Add link to README

---

## 🎬 Recording Setup (OBS Studio)

**Scene 1: Full Screen Browser**
```
Source: Display Capture (your main monitor)
Resolution: 1920x1080
FPS: 30fps
Bitrate: 5000 kbps
```

**Scene 2: Terminal + Browser (Split)**
```
Source 1: Window Capture (Terminal)
Source 2: Window Capture (Browser)
Layout: Side-by-side or picture-in-picture
```

**Audio:**
```
Source: Microphone
Noise Suppression: Enable
Gain: Adjust to -6dB to -12dB
```

**Output Settings:**
```
Format: MP4
Video Encoder: H.264
Audio Encoder: AAC 192kbps
```

---

## 🎬 Alternative: Loom Recording

**Advantages:**
- Instant upload and sharing
- No video editing needed
- Automatic captions
- Easy trimming tool

**Steps:**
1. Install Loom Chrome extension
2. Click "Start Recording" → "Screen + Cam"
3. Select window or full screen
4. Click red button to start
5. Do your demo
6. Click "Finish" when done
7. Share link or download MP4

**Settings:**
- Resolution: 1080p
- Include webcam: Optional (adds personal touch)
- Include captions: Yes (automatically generated)

---

**Remember:** The demo video is REQUIRED for hackathon judging. Make it clear, engaging, and show your project actually working!
