# Screenshot Capture Guide

**Purpose:** Capture UI screenshots for README.md hackathon submission

**Location:** Save all screenshots to `docs/screenshots/`

---

## 📸 Required Screenshots

### 1. Dashboard - Events List
**File:** `dashboard.png`

**What to capture:**
- Full browser window showing events dashboard
- At least 2-3 active prediction events visible
- Show betting pools (YES/NO amounts)
- Show end dates and status
- Highlight clean UI design

**Steps:**
1. Navigate to http://localhost:5173
2. Ensure LocalNet is connected (green indicator in header)
3. Make sure you have events created (or create 2-3 test events)
4. Zoom browser to 100% (Ctrl+0)
5. Take full-window screenshot (Win+Shift+S or Snipping Tool)
6. Save as `docs/screenshots/dashboard.png`

**Annotations to add (optional):**
- Arrow pointing to "Total Pool" amounts
- Highlight "Place Bet" button
- Circle the Algorand connection status

---

### 2. Betting Interface
**File:** `place-bet.png`

**What to capture:**
- Modal or page showing bet placement UI
- YES/NO selection options
- Amount input field
- Current pool sizes
- "Confirm Bet" button

**Steps:**
1. Click "Place Bet" on any event
2. Fill in a sample amount (e.g., 5 ALGO)
3. Select YES or NO
4. Capture the modal/page BEFORE clicking confirm
5. Save as `docs/screenshots/place-bet.png`

**Annotations:**
- Highlight the atomic transaction explanation (if shown)
- Show Pera Wallet integration (if visible)

---

### 3. Admin Panel
**File:** `admin-panel.png`

**What to capture:**
- Admin panel with event creation form
- Fields: Event Name, End Date
- "Create Event" button
- (Optional) List of pending resolutions

**Steps:**
1. Navigate to Admin Panel (http://localhost:5173/admin)
2. Show the create event form
3. Optionally fill in sample data:
   - Name: "Will Startup ABC raise Series A by Dec 2025?"
   - End Date: Future date
4. Capture full panel
5. Save as `docs/screenshots/admin-panel.png`

**Annotations:**
- Show admin-only access indicator
- Highlight event creation workflow

---

### 4. Claim Winnings
**File:** `claim-winnings.png`

**What to capture:**
- User's winning bets (after event resolved)
- Payout calculation display
- "Claim Payout" button
- Success message (if shown after claim)

**Steps:**
1. Resolve an event (as admin)
2. Navigate to "My Bets" or winning bets section
3. Show a winning bet with calculated payout
4. Capture before or after claiming
5. Save as `docs/screenshots/claim-winnings.png`

**Annotations:**
- Highlight payout calculation formula
- Show transaction confirmation (if visible)

---

### 5. BONUS: Event Details
**File:** `event-details.png` (optional but recommended)

**What to capture:**
- Detailed view of a single event
- All bets placed on that event
- Betting history/timeline
- Pool distribution chart (if available)

---

### 6. BONUS: Wallet Connection
**File:** `wallet-connection.png` (optional)

**What to capture:**
- Pera Wallet connection modal
- QR code or account selection
- "Connect Wallet" button

**For LocalNet:**
- Show the simplified connection (no real wallet needed)

**For TestNet:**
- Show Pera Wallet integration

---

## 🛠️ Screenshot Tools

### Windows Snipping Tool (Recommended)
```powershell
# Press Win+Shift+S to open snipping tool
# Select area to capture
# Opens in clipboard - paste into Paint or image editor
# Save as PNG
```

### Windows Game Bar
```powershell
# Press Win+G to open Game Bar
# Click camera icon to screenshot
# Saves to C:\Users\[YourName]\Videos\Captures
```

### Browser DevTools
```javascript
// For full-page screenshots:
// 1. Press F12 to open DevTools
// 2. Press Ctrl+Shift+P
// 3. Type "screenshot"
// 4. Select "Capture full size screenshot"
```

### Third-Party (Professional)
- **ShareX** (free, powerful) - https://getsharex.com/
- **Greenshot** (free, lightweight) - https://getgreenshot.org/
- **Lightshot** (simple, fast) - https://app.prntscr.com/

---

## ✨ Screenshot Best Practices

**Resolution:**
- Minimum: 1920x1080 (Full HD)
- Recommended: 2560x1440 (2K) for sharpness
- Format: PNG (lossless, better than JPG for UI)

**Composition:**
- Remove browser bookmarks bar (Ctrl+Shift+B)
- Hide unnecessary browser extensions
- Use Incognito/Private mode for clean UI
- Full browser window (not just content area)
- Ensure good contrast (dark mode or light mode, be consistent)

**Annotations:**
- Use red arrows/circles to highlight key features
- Add short text labels (12-16pt font)
- Keep annotations minimal (don't clutter)
- Use consistent annotation style across all screenshots

**Editing Tools:**
- **Paint.NET** (Windows, free)
- **GIMP** (cross-platform, free)
- **Photoshop** (professional, paid)
- **Figma** (web-based, free for basic use)

---

## 📐 Image Sizes for README

**For GitHub README:**
- Width: 800-1200px (scales well on different screens)
- Height: Auto (maintain aspect ratio)
- File size: <500KB per image (compress if needed)

**Compression:**
```powershell
# Use TinyPNG or ImageOptim to compress PNGs without quality loss
# Online: https://tinypng.com/
```

---

## 📂 File Organization

```
docs/screenshots/
├── dashboard.png              # Main events list
├── place-bet.png              # Betting interface
├── admin-panel.png            # Admin event creation
├── claim-winnings.png         # Payout claiming
├── event-details.png          # (Optional) Single event view
├── wallet-connection.png      # (Optional) Pera Wallet
└── README.md                  # This file
```

---

## ✅ Screenshot Checklist

Before finalizing screenshots for README:

- [ ] All 4 required screenshots captured
- [ ] Images are clear and high resolution
- [ ] UI is clean (no debug consoles, errors, etc.)
- [ ] Consistent browser/UI theme across all shots
- [ ] File names match README references
- [ ] Images compressed to reasonable file sizes
- [ ] (Optional) Annotations added to highlight key features
- [ ] All images saved to `docs/screenshots/`
- [ ] README.md updated with correct image paths

---

## 🎨 Making Screenshots Look Professional

**Before Capturing:**
1. ✅ Create test data (2-3 events with varied names)
2. ✅ Place some test bets (show non-zero pools)
3. ✅ Resolve at least one event (to show claiming)
4. ✅ Clean browser UI (hide bookmarks, extensions)
5. ✅ Zoom to 100% or 110% for clarity

**After Capturing:**
1. ✅ Crop unnecessary whitespace
2. ✅ Add subtle drop shadow (optional, for depth)
3. ✅ Compress file size without quality loss
4. ✅ Add to README with descriptive alt text

---

## 🔗 Adding to README

**Markdown Syntax:**
```markdown
### 1. Events Dashboard
![Events Dashboard](docs/screenshots/dashboard.png)
*Browse all active prediction events with real-time betting stats*
```

**With Links:**
```markdown
### 1. Events Dashboard
[![Events Dashboard](docs/screenshots/dashboard.png)](#)
*Click to view full size*
```

**With Captions:**
```markdown
<figure>
  <img src="docs/screenshots/dashboard.png" alt="Events Dashboard">
  <figcaption>Browse all active prediction events with real-time betting stats</figcaption>
</figure>
```

---

**Remember:** Good screenshots make your README professional and help judges quickly understand your project!
