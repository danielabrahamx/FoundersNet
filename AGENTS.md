# AGENTS.md - Coding Guidelines for FoundersNet

> **Last Updated:** October 29, 2025  
> **Project:** FoundersNet - Decentralized Prediction Markets on Solana  
> **For:** AI Coding Agents and Contributors

---

## 📋 Table of Contents
1. [Do](#do)
2. [Don't](#don't)
3. [Commands](#commands)
4. [Safety and Permissions](#safety-and-permissions)
5. [Project Structure](#project-structure)
6. [Code Style & Patterns](#code-style--patterns)
7. [Testing Guidelines](#testing-guidelines)
8. [API Documentation](#api-documentation)
9. [PR Checklist](#pr-checklist)
10. [When Stuck](#when-stuck)

---

## ✅ Do

### Framework & Libraries
- **Use React 18+** with functional components and hooks
- **Use TypeScript** with strict mode - no `any` types without justification
- **Use Tailwind CSS** utility classes for styling
- **Use shadcn/ui components** from `@/components/ui/` - don't reinvent the wheel
- **Use TanStack Query** (React Query) for server state management
- **Use Solana Wallet Adapter** for wallet connections
- **Use Anchor Framework** patterns for smart contract interactions
- **Use Wouter** for routing (lightweight alternative to React Router)

### Design Tokens & Styling
- **Use Tailwind CSS classes** - all design tokens are in `tailwind.config.ts`
- **Use CSS variables** from `client/src/index.css` for theme colors
- **Use shadcn/ui components** - consistent, accessible UI components
- **Support dark mode** - use `hsl(var(--color-name))` pattern
- **Use `cn()` utility** from `@/lib/utils` for conditional classes
- **Format with Prettier** - maintain consistent code style

### Component Design
- **Default to small components** - single responsibility principle
- **Keep components under 200 lines** - extract logic to hooks/services
- **Use custom hooks** for complex logic (see `client/src/hooks/`)
- **Separate business logic** into services (see `client/src/services/`)
- **Co-locate tests** with components when practical
- **Use TypeScript interfaces** for all props and data structures

### Solana Best Practices
- **Use PDAs (Program Derived Addresses)** for deterministic account addresses
- **Handle wallet connection states** - connecting, disconnected, error
- **Convert BN (Big Number)** types properly between Anchor and UI
- **Check transaction confirmation** before showing success
- **Handle Solana errors** gracefully with user-friendly messages
- **Use lamports** for all amounts (1 SOL = 1,000,000,000 lamports)

### State Management
- **Use TanStack Query** for server/blockchain state
- **Use React Context** only for truly global state (wallet, theme)
- **Use local state** (useState) for UI-only state
- **Invalidate queries** after mutations for fresh data

### Error Handling
- **Show toast notifications** for user actions (success/error)
- **Log errors to console** with context for debugging
- **Display user-friendly messages** - no raw error codes in UI
- **Handle wallet errors** - user rejection, insufficient funds, etc.
- **Validate inputs** on both client and smart contract

### File Organization
- **Use path aliases** - `@/` for client, `@shared/` for shared code
- **Keep imports organized** - external, internal, relative
- **Export from index files** where appropriate
- **Name files clearly** - PascalCase for components, camelCase for utils

---

## ❌ Don't

### Anti-Patterns
- **Don't hard-code colors** - use Tailwind classes or CSS variables
- **Don't use inline styles** unless absolutely necessary
- **Don't bypass TypeScript** - no `@ts-ignore` without explanation
- **Don't use class components** - use functional components only
- **Don't fetch in components** - use TanStack Query hooks
- **Don't mutate state directly** - immutable updates only
- **Don't mix concerns** - separate UI, logic, and data layers

### Component Mistakes
- **Don't create div soup** - use semantic HTML and shadcn/ui components
- **Don't skip accessibility** - use ARIA labels, keyboard navigation
- **Don't ignore loading states** - show skeletons/spinners
- **Don't forget error boundaries** - handle component errors
- **Don't over-abstract** - avoid premature optimization

### Solana Mistakes
- **Don't forget to check wallet connection** before transactions
- **Don't hardcode program IDs** - use environment variables
- **Don't ignore transaction fees** - show estimated costs
- **Don't skip confirmation** - wait for transaction finality
- **Don't mutate Anchor objects** - they're often frozen

### Dependencies
- **Don't add heavy dependencies** without approval (bundle size matters)
- **Don't install duplicate packages** - check existing dependencies
- **Don't use deprecated packages** - keep dependencies up to date
- **Don't commit node_modules** or build artifacts

### Security
- **Don't expose private keys** - use wallet adapters
- **Don't trust client-side validation** - validate in smart contract
- **Don't log sensitive data** - wallet addresses in production are OK
- **Don't commit .env files** - use .env.example as template

---

## 🔧 Commands

### Type Checking
```bash
# Full project type check
npm run check

# File-specific type check (faster for development)
npx tsc --noEmit client/src/path/to/file.tsx
```

### Linting & Formatting
```bash
# Lint specific file
npx eslint client/src/path/to/file.tsx

# Lint with auto-fix
npm run lint:fix
npx eslint --fix client/src/path/to/file.tsx

# Format with Prettier
npm run format
npx prettier --write client/src/path/to/file.tsx
```

### Testing
```bash
# Run all unit tests
npm run test:unit

# Watch mode
npm run test:unit:watch

# Run specific test file
npx vitest run test/path/to/file.test.tsx

# Test smart contract
npm run test:solana
# or
anchor test
```

### Development
```bash
# Start dev servers (frontend + backend)
npm run dev

# Frontend only (port 8000)
npm run dev:frontend

# Backend only (port 5000)
npm run dev:backend
```

### Building
```bash
# Build frontend only
npm run build:frontend

# Build backend only
npm run build:backend

# Build everything
npm run build

# Build is required before full deployment
```

### Solana
```bash
# Compile smart contract
npm run compile:solana
# or
anchor build

# Deploy to networks
npm run deploy:solana:localnet
npm run deploy:solana:devnet
npm run deploy:solana:testnet

# Verify deployment
npm run deploy:verify:devnet

# Local validator management
npm run localnet:start
npm run localnet:stop
npm run localnet:setup  # Start + compile + deploy
```

---

## 🔒 Safety and Permissions

### Allowed Without Prompt
✅ **Safe operations** - proceed without asking:
- Read files (`read_file`, `list_dir`, `grep_search`)
- Type check single file (`tsc --noEmit file.tsx`)
- Format single file (`prettier --write file.tsx`)
- Lint single file (`eslint --fix file.tsx`)
- Run single test file (`vitest run file.test.tsx`)
- View errors (`get_errors`)
- Search codebase (`semantic_search`, `file_search`)

### Ask First
⚠️ **Potentially risky** - get user approval:
- Installing packages (`npm install`)
- Git operations (`git push`, `git merge`, `git rebase`)
- Deleting files or directories (`rm`, `rmdir`)
- Changing file permissions (`chmod`)
- Running full build (`npm run build`)
- Running all tests (`npm test`, `npm run test:unit`)
- Running E2E tests (`npm run test:solana`)
- Deploying to networks (`npm run deploy:solana:*`)
- Modifying configuration files (`package.json`, `tsconfig.json`, etc.)
- Modifying smart contract code (`lib.rs`)
- Creating new npm scripts
- Stopping background processes

### Never Do Without Explicit Request
🚫 **Dangerous operations**:
- Deploy to mainnet (`npm run deploy:solana:mainnet`)
- Delete production data
- Modify .git directory directly
- Run commands with `sudo`
- Modify environment variables in production
- Transfer real funds
- Expose private keys

---

## 📁 Project Structure

### Key Entry Points
```
client/src/SolanaApp.tsx          → Main app component with routing
client/src/main.tsx               → React entry point
server/index.ts                   → Backend server entry
smart_contracts/solana/programs/prediction_market/src/lib.rs → Smart contract
```

### Important Directories
```
client/src/
  ├── components/        → React components
  │   ├── ui/           → shadcn/ui components (47 total)
  │   └── *.tsx         → Custom components
  ├── contexts/         → React contexts (Wallet)
  ├── hooks/            → Custom hooks (blockchain, events, toast)
  ├── lib/              → Utilities and helpers
  ├── pages/            → Route pages (Home, MyBets, Admin)
  ├── services/         → Business logic layer
  └── test/             → Component tests

server/
  ├── index.ts          → Express server
  └── routes-solana.ts  → API endpoints

smart_contracts/solana/
  └── programs/prediction_market/src/
      └── lib.rs        → Solana program (Rust)

config/
  ├── environment.ts    → Env validation
  ├── networks.ts       → Network configs
  └── index.ts          → Exports

shared/
  ├── contracts.ts      → Contract addresses
  └── schema.ts         → Shared types

test/
  ├── phase6-*.test.ts  → Infrastructure tests
  └── phase7-*.test.ts  → Integration tests
```

### Routing Structure (Wouter)
```typescript
/           → HomePage (event listings with bet modal)
/my-bets    → MyBetsPage (user bets + claim winnings)
/admin      → AdminPage (create events, resolve outcomes)
```

### Component Hierarchy
```
SolanaApp
├── SolanaWalletProvider (context)
│   └── QueryClientProvider
│       ├── SolanaHeader (navigation + wallet button)
│       └── Router (wouter)
│           ├── HomePage
│           │   ├── EventCard (multiple)
│           │   └── BetModal
│           ├── MyBetsPage
│           │   └── MyBetsTable
│           └── AdminPage
│               ├── AdminEventForm
│               ├── AdminEventsTable
│               └── AdminResolve
```

---

## 🎨 Code Style & Patterns

### Good Examples

#### Functional Component with Hooks
```typescript
// ✅ GOOD - Small, focused, functional component
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { usePlaceBet } from "@/hooks/useSolanaPredictionMarket";

interface BetButtonProps {
  eventId: number;
  outcome: boolean;
  amount: number;
}

export function BetButton({ eventId, outcome, amount }: BetButtonProps) {
  const { toast } = useToast();
  const placeBet = usePlaceBet();

  const handleBet = async () => {
    try {
      await placeBet.mutateAsync({ eventId, outcome, amount });
      toast({ title: "Bet placed successfully!" });
    } catch (error) {
      toast({ 
        title: "Failed to place bet", 
        description: error.message,
        variant: "destructive" 
      });
    }
  };

  return (
    <Button 
      onClick={handleBet} 
      disabled={placeBet.isPending}
      className="w-full"
    >
      {placeBet.isPending ? "Placing bet..." : "Place Bet"}
    </Button>
  );
}
```

#### Custom Hook Pattern
```typescript
// ✅ GOOD - Encapsulates blockchain logic
export function usePlaceBet() {
  const { connection } = useConnection();
  const wallet = useWallet();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ eventId, outcome, amount }) => {
      if (!wallet.publicKey) throw new Error("Wallet not connected");
      
      const service = getSolanaService(connection, wallet);
      const tx = await service.placeBet(eventId, outcome, amount);
      return tx;
    },
    onSuccess: () => {
      // Invalidate queries to refetch fresh data
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['userBets'] });
    }
  });
}
```

#### Service Layer Pattern
```typescript
// ✅ GOOD - Business logic separated from UI
export class SolanaService {
  constructor(
    private connection: Connection,
    private wallet: WalletContextState
  ) {}

  async placeBet(eventId: number, outcome: boolean, amount: number) {
    const program = this.getProgram();
    const eventPda = this.deriveEventPda(eventId);
    const betPda = this.deriveBetPda(betId);

    const tx = await program.methods
      .placeBet(new BN(eventId), outcome, new BN(amount))
      .accounts({
        event: eventPda,
        bet: betPda,
        bettor: this.wallet.publicKey!,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    return tx;
  }
}
```

### Bad Examples

#### Avoid Class Components
```typescript
// ❌ BAD - Don't use class components
class EventCard extends React.Component {
  render() {
    return <div>{this.props.event.name}</div>;
  }
}

// ✅ GOOD - Use functional components
function EventCard({ event }) {
  return <div>{event.name}</div>;
}
```

#### Avoid Fetching in Components
```typescript
// ❌ BAD - Don't fetch directly in components
function EventList() {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    fetch('/api/events')
      .then(res => res.json())
      .then(setEvents);
  }, []);

  return <div>{events.map(e => <EventCard event={e} />)}</div>;
}

// ✅ GOOD - Use TanStack Query hooks
function EventList() {
  const { data: events } = useAllEvents();
  return <div>{events?.map(e => <EventCard event={e} />)}</div>;
}
```

#### Avoid Hard-coded Colors
```typescript
// ❌ BAD - Hard-coded colors
<div style={{ backgroundColor: '#1a1a1a', color: '#ffffff' }}>

// ✅ GOOD - Tailwind classes
<div className="bg-card text-card-foreground">

// ✅ GOOD - CSS variables for custom needs
<div style={{ backgroundColor: 'hsl(var(--card))' }}>
```

---

## 🧪 Testing Guidelines

### Test Structure
```typescript
// File: MyComponent.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MyComponent } from './MyComponent';

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent name="Test" />);
    expect(screen.getByText('Test')).toBeInTheDocument();
  });

  it('handles click events', async () => {
    const onClick = vi.fn();
    render(<MyComponent onClick={onClick} />);
    
    await userEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledOnce();
  });
});
```

### What to Test
✅ **Test:**
- Component rendering
- User interactions
- Hook logic
- Service methods
- PDA derivation
- Data transformations
- Error handling

❌ **Don't test:**
- Third-party libraries
- Implementation details
- Styles (unless critical)

### Test Coverage Goals
- **Components:** Focus on user-facing behavior
- **Hooks:** Test all paths and edge cases
- **Services:** Test all public methods
- **Utils:** Test pure functions thoroughly

### Running Tests
```bash
# Quick feedback loop
npm run test:unit:watch

# Before committing
npm run test:unit

# Smart contract tests (takes longer)
npm run test:solana
```

---

## 📡 API Documentation

### REST API Endpoints (`server/routes-solana.ts`)

```
GET  /api/events          → List all prediction events
GET  /api/events/:id      → Get single event by ID
POST /api/events          → Create new event (admin only)
PUT  /api/events/:id      → Update event (admin only)
POST /api/events/:id/resolve → Resolve event outcome (admin)
GET  /api/bets/user/:wallet  → Get user's bets
POST /api/bets            → Place bet on event
GET  /api/health          → Health check
```

### Using the API Client

```typescript
// Don't fetch directly - use hooks
import { useAllEvents } from '@/hooks/useEvents';
import { usePlaceBet } from '@/hooks/useSolanaPredictionMarket';

// In component:
const { data: events, isLoading } = useAllEvents();
const placeBet = usePlaceBet();

// Place bet
await placeBet.mutateAsync({ 
  eventId: 1, 
  outcome: true, 
  amount: 1000000000 // 1 SOL in lamports
});
```

### Smart Contract Methods (`lib.rs`)

```rust
// Admin only
initialize(admin: Pubkey)
create_event(name: String, end_time: i64)
resolve_event(event_id: u64, outcome: bool)

// Public
place_bet(event_id: u64, outcome: bool, amount: u64)
claim_winnings(event_id: u64)
```

---

## ✅ PR Checklist

Before submitting a pull request:

### Code Quality
- [ ] TypeScript compiles without errors (`npm run check`)
- [ ] No ESLint warnings (`npm run lint`)
- [ ] Code is formatted with Prettier (`npm run format`)
- [ ] No console.log statements (unless intentional)
- [ ] No commented-out code
- [ ] All imports are used

### Testing
- [ ] Unit tests pass (`npm run test:unit`)
- [ ] New tests added for new features/bug fixes
- [ ] Test coverage maintained or improved
- [ ] Edge cases covered

### Functionality
- [ ] Changes work in dev environment
- [ ] Wallet connection tested
- [ ] Loading states implemented
- [ ] Error states handled
- [ ] Toast notifications added for user actions

### Documentation
- [ ] README updated if needed
- [ ] Code comments added for complex logic
- [ ] TypeScript interfaces documented
- [ ] New environment variables documented

### Git
- [ ] Commit messages are clear and descriptive
- [ ] Branch is up to date with main
- [ ] No merge conflicts
- [ ] Changes are focused (not too many unrelated changes)

### PR Description
- [ ] Title clearly describes change
- [ ] Description explains what and why
- [ ] Screenshots for UI changes
- [ ] Breaking changes called out

### Code Review
- [ ] Diff is small and reviewable (< 500 lines ideal)
- [ ] Changes are well-organized
- [ ] No unnecessary file changes

---

## 🆘 When Stuck

### Debugging Steps
1. **Check browser console** for errors
2. **Check terminal** for server/build errors
3. **Check wallet connection** - common source of issues
4. **Check network** - LocalNet vs DevNet vs TestNet
5. **Check Solana Explorer** for transaction details
6. **Check deployment status** - is program deployed?

### Ask for Help
When you're stuck, provide:
- **What you're trying to do** (goal)
- **What you tried** (attempted solutions)
- **Error messages** (full stack trace)
- **Environment** (LocalNet/DevNet, wallet, etc.)

Example:
```
I'm trying to place a bet on event #1, but getting:
"Error: Account not found"

Tried:
- Checked wallet connection (connected ✓)
- Verified event exists (event #1 exists ✓)
- Checked program deployment (deployed ✓)

Environment:
- Network: DevNet
- Wallet: Phantom (9AbC...xYz)
- Program: Fg6P...FsLnS

Full error: [paste error]
```

### Propose a Plan
When approaching complex changes:
1. **Ask clarifying questions**
2. **Propose a short plan** with steps
3. **Get feedback** before implementing
4. **Implement in small chunks**
5. **Test incrementally**

Example:
```
To add this feature, I plan to:
1. Create new hook useEventFilters()
2. Add filter UI to HomePage
3. Update useAllEvents to accept filters
4. Add tests for filtering logic

Does this approach make sense?
```

### Open Draft PR
For significant changes:
- Open a **draft PR** early
- Add **notes** on approach
- Ask for **early feedback**
- Iterate based on review

---

## 🎯 Test-First Development

When adding new features:

1. **Write test first** (TDD)
   ```typescript
   // Write failing test
   it('should filter events by status', () => {
     const filtered = filterEvents(events, 'active');
     expect(filtered).toHaveLength(2);
   });
   ```

2. **Implement feature** to make test pass
   ```typescript
   function filterEvents(events, status) {
     return events.filter(e => e.status === status);
   }
   ```

3. **Refactor** while keeping tests green

4. **Add edge cases**
   ```typescript
   it('handles empty array', () => {
     expect(filterEvents([], 'active')).toEqual([]);
   });
   ```

---

## 🌟 Best Practices Summary

### Component Design
- Small, focused, single responsibility
- TypeScript interfaces for all props
- Loading and error states
- Accessibility (ARIA, keyboard)

### State Management
- TanStack Query for server state
- React Context for global state
- Local state for UI-only state
- Immutable updates

### Styling
- Tailwind utility classes
- shadcn/ui components
- CSS variables for theme
- Dark mode support

### Solana Integration
- Wallet adapter for connections
- PDAs for deterministic addresses
- Proper BN conversion
- Transaction confirmation
- Error handling

### Code Quality
- TypeScript strict mode
- ESLint + Prettier
- Comprehensive tests
- Clear naming
- Small diffs

---

## 📚 Additional Resources

- **Codebase Index:** `CODEBASE_COMPREHENSIVE_INDEX.md`
- **Setup Guide:** `START-HERE.md`
- **Deployment:** `DEVNET_DEPLOYMENT_GUIDE.md`
- **Testing:** `TEST_DOCUMENTATION.md`
- **Solana Docs:** https://docs.solana.com
- **Anchor Docs:** https://www.anchor-lang.com
- **shadcn/ui:** https://ui.shadcn.com
- **TanStack Query:** https://tanstack.com/query

---

**Remember:** Write code that your future self (and others) will thank you for! 🚀
