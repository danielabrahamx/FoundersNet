# FoundersNet - Quick Demo Script

**Duration:** 5-7 minutes  
**Files to Show:** 5 core files only

---

## 📋 File Navigation Order

### 1️⃣ **`smart_contracts/prediction_market.py`** (2 min)
**What to show:**
- Lines 20-50: `EventStruct` and `BetStruct` (ARC-4 data structures)
- Lines 60-80: Box storage setup (`self.events`, `self.bets`)
- Lines 259-315: `claim_winnings` method (proportional payout + inner transaction)

**What to say:**
> "Smart contract in Python using ARC-4 encoding. Box storage for unlimited events. Claim winnings calculates proportional payout and uses inner transactions for automatic payment."

---

### 2️⃣ **`client/src/hooks/useAlgorandPredictionMarket.ts`** (2 min)
**What to show:**
- Lines 365-450: `usePlaceBet` - ARC-4 ABI method calling + box references
- Lines 773-810: `useClaimWinnings` - bet pre-fetch + dynamic box references + fee=2000

**What to say:**
> "Frontend uses algosdk 3.0. Key challenge: 8-box reference limit. We pre-fetch bet data to find the right event box. Fee is 2000 microAlgos to cover inner transaction (fee pooling)."

---

### 3️⃣ **`client/src/pages/HomePage.tsx`** (1 min)
**What to show:**
- Lines 20-60: Fetching events from API
- Lines 80-120: Event cards with bet modal

**What to say:**
> "Main UI - displays prediction events, users click to bet YES/NO. Clean React components with TailwindCSS."

---

### 4️⃣ **`client/src/pages/MyBetsPage.tsx`** (1 min)
**What to show:**
- Lines 40-80: Claim winnings button logic

**What to say:**
> "My Bets page shows user's bets. Claim button appears only for winning bets on resolved events. One-click payout."

---

### 5️⃣ **`server/routes.ts`** (1 min)
**What to show:**
- Lines 60-120: GET `/api/events` - reading boxes from blockchain

**What to say:**
> "Backend queries Algorand directly, decodes ARC-4 box data, serves as REST API. Using algosdk v3 with camelCase properties."

---

## 🔗 Part 2: Smart Contract (2.5 minutes)

**[Open `smart_contracts/prediction_market.py`]**

### Lines 1-50: Data Structures

> "This is the core smart contract written in Algorand Python. Let's start with our data structures."

**Scroll to `EventStruct` and `BetStruct`:**

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

> "We're using ARC-4 encoding for all data structures. Events store the prediction details, and bets track individual wagers."

### Lines 50-100: Box Storage

**Scroll to class variables:**

```python
def __init__(self) -> None:
    self.events = BoxMap(arc4.UInt64, EventStruct)
    self.bets = BoxMap(arc4.UInt64, BetStruct)
```

> "We're using Algorand's box storage for scalability. This allows us to store unlimited events and bets on-chain without bloating global state. Each event and bet gets its own box."

### Lines 150-200: Create Event Method

**[Scroll to `create_event`]**

> "Here's how we create prediction events. Notice we're incrementing a counter, creating the event struct, and storing it in a box. Only the contract creator can call this - there's admin control built-in."

### Lines 259-315: Claim Winnings Method

**[Scroll to `claim_winnings`]**

```python
def claim_winnings(self, bet_id: arc4.UInt64) -> None:
```

> "This is the most complex function. It validates the bet exists, checks ownership, verifies the event is resolved, calculates proportional payout, and sends winnings via an inner transaction. The payout formula is: your bet amount times total pool, divided by winning pool."

**Point to the inner transaction:**

```python
itxn.Payment(
    receiver=bet.bettor.native,
    amount=payout,
    fee=0,  # Use fee pooling from group
).submit()
```

> "Notice the inner transaction with fee=0. That's fee pooling - the outer transaction pays for both. This is why we set fee=2000 on the client side."

---

## ⚛️ Part 3: Frontend Architecture (2.5 minutes)

**[Open `client/src/hooks/useAlgorandPredictionMarket.ts`]**

> "The frontend is built with custom React hooks for clean separation of concerns. This file is the heart of our blockchain integration."

### Lines 1-50: Setup & Configuration

> "At the top, we're importing algosdk 3.0.0 and configuring our connection to LocalNet. The APP_ID comes from our deployment."

### Lines 365-500: Place Bet Function

**[Scroll to `usePlaceBet` hook]**

```typescript
const placeBet = useCallback(async (
  eventId: number,
  outcome: boolean,
  amount: number,
  senderAddress: string
) => {
```

> "Here's how we place bets. Key points:"

**Highlight these sections:**

1. **Fetch bet counter** (lines 375-385):
   > "First, we read global state to predict the next bet ID. This is crucial for box references."

2. **ARC-4 ABI method** (lines 400-410):
   ```typescript
   const placeBetMethod = new algosdk.ABIMethod({
     name: 'place_bet',
     args: [
       { type: 'uint64', name: 'event_id' },
       { type: 'bool', name: 'outcome' },
       { type: 'pay', name: 'payment' }
     ],
     returns: { type: 'void' }
   });
   ```
   > "We're using proper ARC-4 ABI calling - not raw method selectors. This was critical for reliability."

3. **Box references** (lines 415-445):
   ```typescript
   boxes: [
     { appIndex: APP_ID, name: eventBoxName },
     { appIndex: APP_ID, name: betsBoxName },
     { appIndex: APP_ID, name: userBetsBoxName },
     { appIndex: APP_ID, name: eventBetsBoxName },
   ]
   ```
   > "We have to explicitly reference every box the smart contract will touch - Algorand enforces this for security. Maximum 8 boxes per transaction."

4. **LocalNet signing** (lines 460-475):
   > "For LocalNet, we sign with mnemonics directly. For production, this would use Pera Wallet."

### Lines 773-870: Claim Winnings - The Tricky Part

**[Scroll to `useClaimWinnings`]**

> "This was the most challenging function. Let me show you why."

**Highlight the bet pre-fetch:**

```typescript
// First, fetch the bet to determine which event it belongs to
const betBoxResponse = await algodClient.getApplicationBoxByName(APP_ID, betsBoxName).do();
const betData = betBoxResponse.value;

// Parse event_id from bet struct (bytes 8-15)
const eventIdBuffer = Buffer.from(betData.slice(8, 16));
const eventId = Number(eventIdBuffer.readBigUInt64BE(0));
```

> "We can't know which event box to reference without reading the bet first. So we fetch it, parse the event_id from bytes 8-15, then construct the correct box reference. This keeps us under the 8-box limit."

**Highlight the fee:**

```typescript
params.fee = 2000;  // 1000 for app call + 1000 for inner payment
params.flatFee = true;
```

> "The fee is doubled to cover the inner transaction that pays out winnings. This is fee pooling in action."

---

## 🎨 Part 4: UI Components (1.5 minutes)

**[Open `client/src/pages/HomePage.tsx`]**

> "Let's look at the main page. We're fetching events from our backend API, displaying them as cards, and letting users bet."

**[Scroll to the bet modal trigger]**

> "When you click 'Place Bet', we open a modal that uses our usePlaceBet hook. The UI is built with shadcn/ui components and TailwindCSS."

**[Open `client/src/components/AlgorandHeader.tsx`]**

> "The header detects if you're an admin and shows navigation accordingly. We're using a custom useWalletAddress hook that works with both LocalNet accounts and Pera Wallet."

**[Open `client/src/pages/MyBetsPage.tsx`]**

> "On the My Bets page, users can see their active bets and claim winnings when events resolve. The claim button appears only for winning bets on resolved events."

---

## 🔧 Part 5: Backend Integration (1 minute)

**[Open `server/routes.ts`]**

**[Scroll to GET /api/events]**

```typescript
router.get('/events', async (req, res) => {
```

> "The backend queries the Algorand blockchain directly using algosdk, reads box storage, decodes ARC-4 data, and serves it as clean JSON. This gives us a REST API layer for easier frontend consumption."

**[Highlight the decoding logic]**

```typescript
const globalState = appInfo.params.globalState;
const eventCounter = Number(item.value.uint);
```

> "Notice we're using the algosdk v3 camelCase property names - this was a breaking change we had to fix throughout the codebase."

---

## 🎯 Optional: Quick Wins to Mention

If you have extra time, mention these technical achievements:

✅ **algosdk v3.0.0 migration** - Fixed 20+ breaking changes  
✅ **8-box reference limit** - Solved with dynamic box fetching  
✅ **Fee pooling** - Doubled fee to cover inner transactions  
✅ **ARC-4 ABI calling** - Proper method calling vs raw selectors

---

## 📝 Quick Checklist

**Files in order:**
1. ✅ `smart_contracts/prediction_market.py`
2. ✅ `client/src/hooks/useAlgorandPredictionMarket.ts`
3. ✅ `client/src/pages/HomePage.tsx`
4. ✅ `client/src/pages/MyBetsPage.tsx`
5. ✅ `server/routes.ts`

**Prep:**
- Increase VS Code font size (Ctrl/Cmd + +)
- Close extra tabs
- Have each file open in separate VS Code tabs for quick switching

**Total Time:** 5-7 minutes

---

That's it! Just 5 files. Keep it simple and focused. 🚀
