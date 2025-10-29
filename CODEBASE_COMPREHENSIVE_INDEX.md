# FoundersNet - Comprehensive Codebase Index

> **Last Updated:** October 29, 2025  
> **Project:** Decentralized Prediction Markets on Solana  
> **Tech Stack:** React + TypeScript + Solana (Rust/Anchor) + Express

---

## 📋 Table of Contents
1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Directory Structure](#directory-structure)
4. [Frontend (Client)](#frontend-client)
5. [Backend (Server)](#backend-server)
6. [Smart Contracts (Solana)](#smart-contracts-solana)
7. [Configuration](#configuration)
8. [Testing](#testing)
9. [Scripts & Deployment](#scripts--deployment)
10. [Key Dependencies](#key-dependencies)
11. [Development Workflow](#development-workflow)

---

## 📖 Project Overview

**FoundersNet** is a decentralized prediction market platform built on Solana where users can:
- Bet SOL on startup funding outcomes
- Create and manage prediction events (admin only)
- Claim winnings automatically through smart contracts
- View real-time market statistics and betting history

### Key Features
- **Trustless:** Smart contracts enforce fair outcomes
- **Transparent:** All bets visible on-chain
- **Instant Payouts:** Automated winnings distribution
- **Low Fees:** Leverages Solana's low transaction costs
- **High Speed:** Sub-second transaction finality

---

## 🏗 Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     FoundersNet Platform                     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Frontend (React)          Backend (Express)                │
│  ├─ Vite Dev Server        ├─ REST API                      │
│  ├─ React Router           └─ Proxy to Solana RPC           │
│  ├─ TanStack Query                                           │
│  ├─ Wallet Adapter                                           │
│  └─ Tailwind + shadcn/ui                                     │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Smart Contracts (Solana/Rust)                              │
│  ├─ Anchor Framework                                         │
│  ├─ Program ID: Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS│
│  ├─ PDAs for Events & Bets                                   │
│  └─ Admin-controlled operations                              │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Tech Stack
- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui
- **Backend:** Express, TypeScript
- **Blockchain:** Solana (Rust), Anchor Framework 0.32
- **State Management:** TanStack Query (React Query)
- **Wallet:** Solana Wallet Adapter (Phantom, Solflare)
- **Testing:** Vitest, Testing Library
- **Build Tools:** esbuild, Vite

---

## 📁 Directory Structure

```
/workspaces/FoundersNet/
├── client/                      # Frontend application
│   ├── index.html               # HTML entry point
│   └── src/
│       ├── main.tsx             # React entry point
│       ├── SolanaApp.tsx        # Main app component with routing
│       ├── index.css            # Global styles (Tailwind)
│       ├── components/          # React components
│       ├── contexts/            # React contexts (Wallet, etc.)
│       ├── hooks/               # Custom React hooks
│       ├── lib/                 # Utilities and helpers
│       ├── pages/               # Page components
│       ├── services/            # Business logic & API clients
│       └── test/                # Component tests
│
├── server/                      # Backend Express server
│   ├── index.ts                 # Server entry point
│   ├── routes-solana.ts         # API routes
│   └── vite.ts                  # Vite middleware config
│
├── smart_contracts/             # Blockchain smart contracts
│   └── solana/
│       ├── Anchor.toml          # Anchor configuration
│       ├── Cargo.toml           # Rust dependencies
│       └── programs/
│           └── prediction_market/
│               └── src/
│                   └── lib.rs   # Main Solana program
│
├── config/                      # Configuration modules
│   ├── environment.ts           # Env validation
│   ├── networks.ts              # Network configs
│   └── index.ts                 # Config exports
│
├── shared/                      # Shared code (client/server)
│   ├── contracts.ts             # Contract addresses & ABIs
│   └── schema.ts                # Data schemas
│
├── test/                        # Integration & E2E tests
│   ├── phase6-*.test.ts         # Infrastructure tests
│   ├── phase7-*.test.ts         # Integration tests
│   └── *.test.tsx               # Component tests
│
├── scripts/                     # Deployment & utility scripts
│   ├── deploy-solana-*.js       # Deployment scripts
│   └── verify-solana-deployment.js
│
├── docs/                        # Documentation
│   ├── architecture/            # Architecture docs
│   ├── guides/                  # How-to guides
│   └── screenshots/             # UI screenshots
│
├── target/                      # Anchor build output
│   ├── idl/                     # Interface Definition Language
│   └── types/                   # Generated TypeScript types
│
├── deployments/                 # Deployment configurations
│   └── testnet.json             # Network deployment info
│
├── package.json                 # Node.js dependencies & scripts
├── tsconfig.json                # TypeScript configuration
├── vite.config.ts               # Vite configuration
├── vitest.config.ts             # Vitest test configuration
├── tailwind.config.ts           # Tailwind CSS configuration
├── postcss.config.js            # PostCSS configuration
├── components.json              # shadcn/ui configuration
└── README.md                    # Main documentation
```

---

## 🎨 Frontend (Client)

### Entry Points
- **HTML:** `client/index.html` - Root HTML file
- **React:** `client/src/main.tsx` - React app initialization
- **App:** `client/src/SolanaApp.tsx` - Main component with routing

### Core Components (`client/src/components/`)

#### Main Components
- **`SolanaHeader.tsx`** - Top navigation with wallet connection
- **`EventCard.tsx`** - Display individual prediction event
- **`BetModal.tsx`** - Modal for placing bets
- **`MyBetsTable.tsx`** - User's betting history table
- **`AdminEventForm.tsx`** - Form to create new events (admin)
- **`AdminEventsTable.tsx`** - Manage all events (admin)
- **`AdminResolve.tsx`** - Resolve event outcomes (admin)
- **`WalletConnectButton.tsx`** - Solana wallet connection
- **`CountdownTimer.tsx`** - Event end time countdown
- **`EventStatusBadge.tsx`** - Event status indicator
- **`ThemeToggle.tsx`** - Dark/light mode toggle

#### UI Components (`client/src/components/ui/`)
shadcn/ui components (47 components total):
- **Forms:** `button`, `input`, `textarea`, `select`, `checkbox`, `radio-group`, `switch`, `slider`, `form`, `label`
- **Layout:** `card`, `separator`, `tabs`, `accordion`, `collapsible`, `sheet`, `dialog`, `drawer`, `sidebar`
- **Feedback:** `toast`, `alert`, `badge`, `progress`, `skeleton`, `hover-card`, `tooltip`
- **Navigation:** `navigation-menu`, `menubar`, `dropdown-menu`, `context-menu`, `breadcrumb`, `pagination`
- **Data Display:** `table`, `calendar`, `carousel`, `chart`, `avatar`, `aspect-ratio`
- **Overlays:** `popover`, `alert-dialog`, `command`
- **Misc:** `scroll-area`, `resizable`, `toggle`, `toggle-group`, `input-otp`

### Pages (`client/src/pages/`)
- **`HomePage.tsx`** - Landing page with event cards and betting
- **`MyBetsPage.tsx`** - User's bet history and claim winnings
- **`AdminPage.tsx`** - Admin dashboard for event management
- **`EventDetailPage.tsx`** - Detailed view of single event (if exists)
- **`not-found.tsx`** - 404 error page

### Custom Hooks (`client/src/hooks/`)
- **`useSolanaPredictionMarket.ts`** - Main hook for blockchain interactions
  - `useWalletAddress()` - Get connected wallet address
  - `useGetUserBets()` - Fetch user's bets
  - `usePlaceBet()` - Place a new bet
  - `useClaimWinnings()` - Claim winnings from resolved events
  - `useCreateEvent()` - Create new event (admin)
  - `useResolveEvent()` - Resolve event outcome (admin)
- **`useEvents.ts`** - Event data fetching hooks
  - `useAllEvents()` - Fetch all events
  - `useEvent(id)` - Fetch single event by ID
- **`use-toast.ts`** - Toast notification hook
- **`use-mobile.tsx`** - Mobile viewport detection hook

### Contexts (`client/src/contexts/`)
- **`SolanaWalletContext.tsx`** - Solana wallet provider
  - Wraps `@solana/wallet-adapter-react`
  - Provides wallet connection state
  - Integrates Phantom, Solflare adapters
  - Handles network switching

### Services (`client/src/services/`)
- **`solana.service.ts`** - Solana blockchain interaction layer
  - PDA (Program Derived Address) derivation
  - Transaction building and signing
  - Account data fetching
  - Error handling

### Utilities (`client/src/lib/`)
- **`utils.ts`** - General utility functions
- **`queryClient.ts`** - TanStack Query client configuration
- **`solana-wallet.ts`** - Wallet adapter utilities

### Routing
Uses **wouter** for lightweight routing:
```typescript
/ -> HomePage (event listings)
/my-bets -> MyBetsPage (user bets)
/admin -> AdminPage (admin dashboard)
```

### Styling
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - Pre-built accessible components
- **CSS Variables** - Theme tokens defined in `index.css`
- **Dark Mode** - Theme toggle with `next-themes`

---

## 🔧 Backend (Server)

### Structure (`server/`)
- **`index.ts`** - Express server initialization
  - Middleware setup (JSON, URL encoding)
  - Request logging
  - Error handling
  - Vite integration for dev mode
- **`routes-solana.ts`** - API route definitions
  - Event CRUD operations
  - Bet management endpoints
  - Admin operations
- **`vite.ts`** - Vite dev server integration
  - HMR (Hot Module Replacement) setup
  - Static file serving in production

### API Endpoints
```
GET  /api/events          - List all events
GET  /api/events/:id      - Get single event
POST /api/events          - Create event (admin)
PUT  /api/events/:id      - Update event (admin)
POST /api/bets            - Place bet
GET  /api/bets/:wallet    - Get user bets
POST /api/resolve/:id     - Resolve event (admin)
```

### Configuration
- **Port:** 5000 (backend), 8000 (Vite dev server)
- **Proxy:** `/api` requests proxied from frontend to backend
- **CORS:** Configured for local development

---

## ⛓ Smart Contracts (Solana)

### Location
`smart_contracts/solana/programs/prediction_market/src/lib.rs`

### Program Details
- **Program ID:** `Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS`
- **Framework:** Anchor 0.32.1
- **Language:** Rust

### Key Instructions
```rust
initialize(admin: Pubkey)              // Initialize program state
create_event(name, end_time)           // Create prediction event
place_bet(event_id, outcome, amount)   // Place bet on event
resolve_event(event_id, outcome)       // Resolve event (admin)
claim_winnings(event_id)               // Claim winnings from resolved bet
```

### Account Structures

#### ProgramState (PDA)
- `admin: Pubkey` - Admin wallet address
- `event_counter: u64` - Total events created
- `bet_counter: u64` - Total bets placed
- `bump: u8` - PDA bump seed

#### Event (PDA per event)
- `event_id: u64` - Unique event identifier
- `name: String` - Event name/description
- `end_time: i64` - Unix timestamp when betting closes
- `resolved: bool` - Whether event is resolved
- `outcome: bool` - True if "Yes" wins, false if "No" wins
- `total_yes_bets: u64` - Number of Yes bets
- `total_no_bets: u64` - Number of No bets
- `total_yes_amount: u64` - Total lamports bet on Yes
- `total_no_amount: u64` - Total lamports bet on No
- `creator: Pubkey` - Event creator address
- `bump: u8` - PDA bump seed

#### Bet (PDA per bet)
- `bet_id: u64` - Unique bet identifier
- `event_id: u64` - Associated event ID
- `bettor: Pubkey` - Wallet that placed bet
- `outcome: bool` - Bet prediction (true = Yes, false = No)
- `amount: u64` - Bet amount in lamports
- `claimed: bool` - Whether winnings claimed
- `bump: u8` - PDA bump seed

### PDA Seeds
```rust
// Program State PDA
["program_state"]

// Event PDA
["event", event_id.to_le_bytes()]

// Bet PDA
["bet", bet_id.to_le_bytes()]
```

### Error Codes
- `Unauthorized` - Only admin can perform action
- `EventDoesNotExist` - Invalid event ID
- `EventAlreadyResolved` - Cannot bet on resolved event
- `BettingPeriodEnded` - Betting closed
- `EventNotResolved` - Cannot claim before resolution
- `NoWinningsAvailable` - Bet did not win
- `WinningsAlreadyClaimed` - Cannot claim twice
- `BetAmountMustBeGreaterThanZero` - Invalid bet amount
- `EndTimeMustBeInFuture` - Invalid event end time

### Build & Deploy
```bash
# Compile smart contract
npm run compile:solana
# or
anchor build

# Deploy to networks
npm run deploy:solana:localnet
npm run deploy:solana:devnet
npm run deploy:solana:testnet
npm run deploy:solana:mainnet

# Verify deployment
npm run deploy:verify:devnet
```

---

## ⚙️ Configuration

### Environment Variables (`.env`)
```bash
# Network
VITE_SOLANA_NETWORK=solana-devnet
VITE_SOLANA_RPC_URL=https://api.devnet.solana.com
VITE_SOLANA_PROGRAM_ID=Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS

# Admin
VITE_ADMIN_ADDRESS=<admin_wallet_pubkey>

# Optional
DATABASE_URL=<database_connection_string>
WALLET_CONNECT_PROJECT_ID=<project_id>
```

### Config Modules (`config/`)

#### `networks.ts`
Defines network configurations:
```typescript
type NetworkType = 'solana-localnet' | 'solana-devnet' | 
                   'solana-testnet' | 'solana-mainnet-beta'

interface NetworkConfig {
  name: string
  rpcUrl: string
  wsUrl?: string
  explorerUrl: string
  cluster: string
  commitment: 'processed' | 'confirmed' | 'finalized'
}
```

Networks:
- **LocalNet:** `http://localhost:8899` - Local validator
- **DevNet:** `https://api.devnet.solana.com` - Test network
- **TestNet:** `https://api.testnet.solana.com` - Staging network
- **MainNet:** `https://api.mainnet-beta.solana.com` - Production

#### `environment.ts`
Type-safe environment variable validation:
- Validates required variables at startup
- Provides typed access to config
- Follows fail-fast principle

#### `index.ts`
Exports unified config interface:
```typescript
getConfig() -> EnvironmentConfig
getNetworkConfig(network) -> NetworkConfig
```

### Anchor Config (`Anchor.toml`)
```toml
[programs.localnet]
prediction_market = "Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS"

[programs.devnet]
prediction_market = "Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS"

[provider]
cluster = "Localnet"
wallet = "~/.config/solana/id.json"
```

### TypeScript Config (`tsconfig.json`)
```json
{
  "compilerOptions": {
    "module": "ESNext",
    "jsx": "preserve",
    "paths": {
      "@/*": ["client/src/*"],
      "@shared/*": ["shared/*"]
    }
  }
}
```

### Vite Config (`vite.config.ts`)
- **Aliases:** `@` -> `client/src`, `@shared` -> `shared`
- **Server Port:** 8000
- **Proxy:** `/api` -> `http://localhost:5000`
- **Plugins:** React, Node polyfills (Buffer)

---

## 🧪 Testing

### Test Structure (`test/`)

#### Unit Tests
- **`phase7-unit.test.ts`** - Service layer unit tests
  - PDA derivation
  - Transaction building
  - Data transformations
- **`useSolanaPredictionMarket.test.ts`** - Hook tests
- **`SolanaHeader.test.tsx`** - Component tests
- **`utility.test.js`** - Utility function tests

#### Integration Tests
- **`phase6-integration.test.ts`** - Infrastructure tests (272 tests)
  - Network connectivity
  - Program deployment
  - Environment variables
  - API endpoints
  - Deployment scripts
- **`phase7-integration.test.ts`** - Smart contract integration
  - Event creation
  - Bet placement
  - Event resolution
  - Winnings claims

#### E2E Tests
- **`phase7-e2e.test.ts`** - End-to-end workflows
  - Full betting lifecycle
  - Multi-user scenarios
  - Error handling

### Test Commands
```bash
# Run all unit tests
npm run test:unit           # 272 tests passing

# Watch mode
npm run test:unit:watch

# Solana on-chain tests
npm run test:solana
# or
anchor test

# Full test suite
npm test
```

### Test Configuration
- **Framework:** Vitest
- **DOM:** happy-dom / jsdom
- **React Testing:** @testing-library/react
- **Coverage:** Built into Vitest

---

## 🚀 Scripts & Deployment

### NPM Scripts (`package.json`)

#### Development
```bash
npm run dev              # Start both frontend & backend
npm run dev:frontend     # Vite dev server (port 8000)
npm run dev:backend      # Express server (port 5000)
```

#### Build
```bash
npm run build            # Build both frontend & backend
npm run build:frontend   # Vite production build
npm run build:backend    # esbuild bundle
npm start                # Start production server
```

#### Code Quality
```bash
npm run check            # TypeScript type check
npm run lint             # ESLint
npm run lint:fix         # ESLint with auto-fix
npm run format           # Prettier format
```

#### Solana
```bash
# Smart Contracts
npm run compile:solana   # Compile Rust -> WASM

# Deployment
npm run deploy:solana:localnet
npm run deploy:solana:devnet
npm run deploy:solana:testnet
npm run deploy:solana:mainnet

# Verification
npm run deploy:verify:localnet
npm run deploy:verify:devnet
npm run deploy:verify:testnet
npm run deploy:verify:mainnet

# LocalNet Management
npm run localnet:start   # Start local validator
npm run localnet:stop    # Stop local validator
npm run localnet:setup   # Start + compile + deploy
```

### Deployment Scripts (`scripts/`)
- **`deploy-solana-localnet.js`** - Deploy to local validator
- **`deploy-solana-devnet.js`** - Deploy to Solana DevNet
- **`deploy-solana-testnet.js`** - Deploy to Solana TestNet
- **`deploy-solana-mainnet.js`** - Deploy to Solana MainNet
- **`verify-solana-deployment.js`** - Verify deployment success
- **`deploy-utils.cjs`** - Shared deployment utilities

### Deployment Process
1. Set up wallet with SOL for deployment
2. Update environment variables
3. Compile smart contract: `npm run compile:solana`
4. Deploy to network: `npm run deploy:solana:devnet`
5. Verify deployment: `npm run deploy:verify:devnet`
6. Update deployment info in `deployments/` folder
7. Build and deploy frontend

---

## 📦 Key Dependencies

### Frontend Dependencies
```json
{
  "@solana/web3.js": "^1.95.3",              // Solana blockchain SDK
  "@solana/wallet-adapter-react": "^0.15.35", // Wallet integration
  "@coral-xyz/anchor": "^0.32.1",             // Anchor client
  "react": "^18.3.1",                         // UI framework
  "wouter": "^3.3.5",                         // Lightweight routing
  "@tanstack/react-query": "^5.90.3",         // Data fetching
  "@radix-ui/react-*": "^1.x.x",             // UI primitives
  "lucide-react": "^0.453.0",                // Icons
  "tailwindcss": "^3.4.17",                  // CSS framework
  "recharts": "^2.15.2",                      // Charts
  "zod": "^3.24.2",                           // Schema validation
  "react-hook-form": "^7.55.0",              // Form handling
  "framer-motion": "^11.13.1"                // Animations
}
```

### Backend Dependencies
```json
{
  "express": "^4.21.2",                      // Web server
  "tsx": "^4.20.5",                          // TypeScript execution
  "ws": "^8.18.0"                            // WebSocket support
}
```

### Development Dependencies
```json
{
  "@vitejs/plugin-react": "^4.7.0",         // Vite React plugin
  "typescript": "5.6.3",                     // Type checking
  "vitest": "^3.2.4",                        // Testing framework
  "@testing-library/react": "^16.3.0",       // React testing
  "eslint": "^8.56.0",                       // Linting
  "prettier": "^3.2.5",                      // Code formatting
  "concurrently": "^8.2.2",                  // Run parallel commands
  "esbuild": "^0.25.0"                       // Fast bundler
}
```

### Solana Dependencies (Rust)
```toml
[dependencies]
anchor-lang = "0.32.1"
anchor-spl = "0.32.1"
solana-program = "1.18"
```

---

## 🔄 Development Workflow

### Getting Started
```bash
# 1. Clone repository
git clone <repo-url>
cd FoundersNet

# 2. Install dependencies
npm install

# 3. Set up environment
cp .env.example .env
# Edit .env with your configuration

# 4. Start local Solana validator (optional)
npm run localnet:start

# 5. Deploy smart contract
npm run compile:solana
npm run deploy:solana:localnet

# 6. Start development servers
npm run dev
# Frontend: http://localhost:8000
# Backend: http://localhost:5000
```

### Development Guidelines

#### File Organization
- Keep components small and focused
- Use custom hooks for complex logic
- Separate business logic into services
- Place shared types in `shared/`
- Co-locate tests with source files

#### Naming Conventions
- **Components:** PascalCase (e.g., `EventCard.tsx`)
- **Hooks:** camelCase with `use` prefix (e.g., `useEvents.ts`)
- **Utils:** camelCase (e.g., `formatDate.ts`)
- **Constants:** UPPER_SNAKE_CASE (e.g., `MAX_BET_AMOUNT`)

#### Import Aliases
```typescript
import Component from '@/components/Component'  // Client src
import { schema } from '@shared/schema'         // Shared code
```

#### State Management
- **Server State:** TanStack Query (React Query)
- **Local State:** React useState/useReducer
- **Global State:** React Context (Wallet)

#### Error Handling
- Use Solana error codes in smart contract
- Display user-friendly messages in UI
- Log detailed errors for debugging
- Show toast notifications for user actions

### Code Style
- **TypeScript:** Strict mode enabled
- **Formatting:** Prettier with 2-space indents
- **Linting:** ESLint with React rules
- **Max Line Length:** 80-100 characters

### Git Workflow
```bash
# Feature development
git checkout -b feature/new-feature
# Make changes
git add .
git commit -m "feat: add new feature"
git push origin feature/new-feature

# Create pull request for review
```

### Testing Workflow
```bash
# Before committing
npm run check           # Type check
npm run lint            # Lint check
npm run test:unit       # Run tests

# Fix issues
npm run lint:fix        # Auto-fix lint issues
npm run format          # Format code
```

---

## 📚 Additional Resources

### Documentation Files
- **`README.md`** - Main project documentation
- **`DEVNET_DEPLOYMENT_GUIDE.md`** - Deployment instructions
- **`START-HERE.md`** - Quick start guide
- **`HACKATHON.md`** - Hackathon submission info
- **`TEST_DOCUMENTATION.md`** - Testing guide
- **`PHASE_*.md`** - Phase completion reports

### Architecture Docs (`docs/architecture/`)
- System design documents
- Data flow diagrams
- Security considerations

### Guide Docs (`docs/guides/`)
- Setup instructions
- Deployment guides
- Troubleshooting

---

## 🔍 Quick Reference

### Important Program IDs
```
Prediction Market: Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS
```

### Network RPCs
```
LocalNet:  http://localhost:8899
DevNet:    https://api.devnet.solana.com
TestNet:   https://api.testnet.solana.com
MainNet:   https://api.mainnet-beta.solana.com
```

### Ports
```
Frontend Dev:  8000
Backend API:   5000
LocalNet RPC:  8899
LocalNet WS:   8900
```

### Key Files to Know
1. **`client/src/SolanaApp.tsx`** - App entry & routing
2. **`client/src/hooks/useSolanaPredictionMarket.ts`** - Blockchain hooks
3. **`smart_contracts/solana/programs/prediction_market/src/lib.rs`** - Smart contract
4. **`config/environment.ts`** - Environment config
5. **`server/routes-solana.ts`** - API routes
6. **`package.json`** - All available scripts

---

## 📊 Project Statistics

- **Total Lines of Code:** ~15,000+ (estimated)
- **Components:** 60+ React components
- **Tests:** 272 passing tests
- **Dependencies:** 50+ packages
- **Supported Wallets:** Phantom, Solflare, and more
- **Networks:** LocalNet, DevNet, TestNet, MainNet

---

## 🎯 Next Steps for New Developers

1. Read `README.md` for project overview
2. Review this index to understand structure
3. Read `START-HERE.md` for setup instructions
4. Explore `client/src/SolanaApp.tsx` to see routing
5. Check `client/src/hooks/useSolanaPredictionMarket.ts` for blockchain interactions
6. Review smart contract at `smart_contracts/solana/programs/prediction_market/src/lib.rs`
7. Run tests: `npm run test:unit`
8. Start dev server: `npm run dev`
9. Read component code to understand patterns

---

**End of Codebase Index**
