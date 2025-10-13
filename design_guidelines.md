# Design Guidelines: Startup Prediction Markets

## Design Approach

**Selected Approach:** Design System - Web3 Utility Focus

This prediction markets platform requires clarity, trust, and efficiency over visual flair. Drawing inspiration from leading Web3 applications (Uniswap, Polymarket, OpenSea) with emphasis on data-driven interfaces that prioritize transaction confidence and real-time information display.

**Core Principles:**
- Trust through transparency: Every bet, stat, and transaction state is clearly visible
- Immediate comprehension: Users understand betting mechanics within seconds
- Data-first hierarchy: Statistics and countdowns take visual priority
- Web3 familiarity: Follow established crypto UX patterns for wallet states and transactions

## Color Palette

### Dark Mode (Primary)
- **Background:** 222 15% 8% (near-black with slight warmth)
- **Surface:** 222 13% 12% (elevated cards/panels)
- **Surface Hover:** 222 12% 15%
- **Border:** 222 10% 20% (subtle separation)

### Brand Colors
- **Primary (Accent):** 160 84% 39% (teal/emerald - trustworthy, financial)
- **Primary Hover:** 160 84% 45%
- **Success (YES):** 142 76% 45% (vibrant green)
- **Danger (NO):** 0 84% 60% (clear red)
- **Warning:** 38 92% 50% (amber for time-sensitive actions)

### Text Colors
- **Primary Text:** 0 0% 98%
- **Secondary Text:** 0 0% 71%
- **Muted Text:** 0 0% 55%

### Status Badges
- **Open:** 142 76% 45% (green)
- **Closed:** 38 92% 50% (amber)
- **Resolved:** 217 91% 60% (blue)

## Typography

**Font Stack:** 
- Primary: 'Inter' (Google Fonts) - exceptional readability for data
- Mono: 'JetBrains Mono' (Google Fonts) - wallet addresses, amounts

**Hierarchy:**
- **H1 (Page Titles):** text-4xl font-bold tracking-tight
- **H2 (Section Headers):** text-2xl font-semibold
- **H3 (Card Titles):** text-xl font-semibold
- **Body:** text-base font-normal leading-relaxed
- **Stats/Numbers:** text-2xl font-bold tabular-nums (fixed-width numbers)
- **Wallet Addresses:** font-mono text-sm
- **Small/Meta:** text-sm text-secondary

## Layout System

**Spacing Primitives:** Use Tailwind units of **2, 4, 6, 8, 12, 16, 20** for consistent rhythm

**Container Strategy:**
- **Max Width:** max-w-7xl mx-auto (wide for data tables)
- **Section Padding:** px-4 py-8 (mobile), px-6 py-12 (desktop)
- **Card Padding:** p-6
- **Component Spacing:** space-y-6 (vertical), gap-4 (grid)

**Grid Patterns:**
- Event Cards: grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6
- Admin Table: Full-width responsive table
- Stats Grid: grid-cols-2 md:grid-cols-4 gap-4

## Component Library

### Navigation Header
- Fixed top bar: bg-surface with border-b
- Logo left, Wallet connection right
- Tabs: Home | My Bets | Admin (if authorized)
- Wallet button shows truncated address when connected (0x1234...5678)
- Network indicator badge (Polygon Testnet)

### Event Cards
**Structure:**
- Surface background with hover elevation effect
- Startup emoji/icon + name (text-xl font-semibold)
- Description (text-sm text-secondary, 2-line clamp)
- **Countdown Timer:** Large, prominent display with time units (2d 14h 32m) in teal color
- **Bet Statistics Bar:** Horizontal split showing YES (green) / NO (red) with percentages and counts
- Pool amounts in MATIC with mono font
- Status badge (top-right corner, absolute positioned)
- Primary action button at bottom

### Bet Modal
- Centered overlay with backdrop blur
- Clear question header
- Large YES/NO toggle buttons (pill-shaped, active state fills with color)
- Fixed amount display: "10 MATIC (non-negotiable)" in prominent box
- Potential return calculation with arrow indicator
- Dual action buttons: Cancel (outline) + Confirm (filled primary)

### Stats Display Components
- Number + Label pattern
- Large tabular-nums for amounts
- Icon + metric pairs
- Micro-animations on value updates (count-up effect)

### Admin Panel
- Form inputs with clear labels above fields
- Date/time picker with calendar icon
- Table with alternating row backgrounds
- Action buttons (icon + text) in last column
- Resolve button only enabled when conditions met

### Status Indicators
- Badge component with dot indicator
- Color-coded by state (Open/Closed/Resolved)
- Pulsing animation for "Open" status only

### Transaction States
- Pending: Loading spinner with "Confirming transaction..."
- Success: Check icon with confetti animation (brief)
- Error: X icon with retry button

## Animations

**Use Sparingly:**
- Countdown tick: Subtle opacity pulse every second
- Card hover: translate-y-[-2px] with shadow increase (150ms ease)
- Button states: Built-in default behavior
- Loading states: Subtle spinner, no complex animations
- Success confetti: 2-second celebration on bet confirmation

## Images

**No Hero Image Required** - This is a utility dashboard, not a marketing site.

**Icon Strategy:**
- Use Heroicons (outline variant) via CDN
- Wallet icon, clock icon, trophy icon, checkmark, X mark
- Startup emojis as visual identifiers (🚀, 💡, 🏢) directly in card headers

## Accessibility & Polish

- All interactive elements have clear focus states (ring-2 ring-primary)
- Color contrast meets WCAG AA standards
- Wallet addresses always with copy button
- Tooltips on hover for complex mechanics
- Loading skeletons while data fetches
- Empty states with clear CTAs ("No bets yet - explore events")
- Error boundaries with friendly messages

## Responsive Behavior

- **Mobile:** Single column, stacked navigation, collapsible filters
- **Tablet:** 2-column event grid, condensed stats
- **Desktop:** 3-column grid, expanded tables, persistent filters sidebar

This design creates a professional, trustworthy Web3 betting platform that prioritizes clarity and user confidence in every transaction.