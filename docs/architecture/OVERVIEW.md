# Project Architecture

## Design Principles

This project follows professional software engineering best practices:

### 1. **Separation of Concerns**
- **Presentation Layer** (`client/src/components`, `client/src/pages`)
- **Business Logic** (`client/src/services`, `client/src/hooks`)
- **Data Layer** (`server/routes.ts`, `smart_contracts/`)
- **Configuration** (`config/`)

### 2. **Dependency Injection**
- Services are injected, not globally accessed
- Makes code testable and maintainable
- Example: `AlgorandService` can be mocked for testing

### 3. **Single Responsibility Principle**
- Each module has one reason to change
- `networks.ts` - Only network configurations
- `environment.ts` - Only environment validation
- `algorand.service.ts` - Only Algorand operations

### 4. **Type Safety**
- Strict TypeScript throughout
- Interface-based design
- Validated environment variables

### 5. **Fail-Fast**
- Configuration errors caught at startup
- Clear error messages with solutions
- No silent failures

---

## Layer Architecture

```
┌─────────────────────────────────────────────┐
│          Presentation Layer                 │
│  (React Components, Pages, UI)              │
│  - AlgorandHeader.tsx                       │
│  - HomePage.tsx                             │
│  - EventCard.tsx                            │
└─────────────┬───────────────────────────────┘
              │
              ↓
┌─────────────────────────────────────────────┐
│          Application Layer                  │
│  (React Hooks, State Management)            │
│  - useAlgorandPredictionMarket.ts           │
│  - React Query for async state              │
└─────────────┬───────────────────────────────┘
              │
              ↓
┌─────────────────────────────────────────────┐
│          Service Layer                      │
│  (Business Logic, Clean Interfaces)         │
│  - AlgorandService                          │
│  - IAlgorandService interface               │
└─────────────┬───────────────────────────────┘
              │
              ↓
┌─────────────────────────────────────────────┐
│          Infrastructure Layer               │
│  (External Dependencies)                    │
│  - algosdk (Algorand SDK)                   │
│  - PeraWalletConnect                        │
│  - Express Server                           │
└─────────────┬───────────────────────────────┘
              │
              ↓
┌─────────────────────────────────────────────┐
│          Blockchain Layer                   │
│  (Algorand Network)                         │
│  - Smart Contract (prediction_market.py)    │
│  - LocalNet / TestNet / MainNet             │
└─────────────────────────────────────────────┘
```

---

## Configuration Management

### Old Approach (Messy) ❌
```typescript
// Scattered throughout codebase
const network = import.meta.env.VITE_NETWORK || 'testnet';
const appId = parseInt(import.meta.env.VITE_APP_ID || '0');
// No validation, duplicated everywhere
```

### New Approach (Clean) ✅
```typescript
// Single source of truth
import { getConfig, getNetworkConfig } from '@/../../config';

const config = getConfig(); // Validated once at startup
const network = getNetworkConfig(config.network);
```

**Benefits:**
- ✅ Validated once at startup
- ✅ Type-safe access
- ✅ Clear error messages
- ✅ Easy to test
- ✅ No magic strings

---

## Service Pattern

### IAlgorandService Interface

```typescript
interface IAlgorandService {
  // Client access
  getAlgodClient(): algosdk.Algodv2;
  getIndexerClient(): algosdk.Indexer;
  
  // Wallet operations
  connectWallet(): Promise<string[]>;
  disconnectWallet(): Promise<void>;
  
  // Utilities
  formatAddress(address: string): string;
  getExplorerUrl(type, id): string;
}
```

**Why?**
- ✅ Testable - Mock the interface for tests
- ✅ Swappable - Switch implementations easily
- ✅ Clear contract - Consumers know what's available
- ✅ Documentation - Interface is self-documenting

---

## File Organization

```
config/                    # Configuration (NEW)
├── networks.ts           # Network definitions
├── environment.ts        # Environment validation
└── index.ts              # Single export point

client/src/
├── services/             # Business logic (NEW)
│   └── algorand.service.ts
├── hooks/                # React hooks
│   └── useAlgorandPredictionMarket.ts
├── components/           # Presentational components
│   ├── ui/              # Reusable UI primitives
│   └── ...              # Feature-specific components
├── pages/                # Route pages
├── lib/                  # Utilities and helpers
└── AlgorandApp.tsx       # Application root

docs/                     # Documentation (NEW)
├── architecture/         # System design docs
├── guides/              # How-to guides
└── API.md               # API reference

server/
├── index.ts             # Server entry point
├── routes.ts            # API routes
└── storage.ts           # Data layer

smart_contracts/
└── prediction_market.py  # Smart contract source

scripts/                  # Operational scripts
├── deploy-local.cjs
├── deploy-testnet.js
└── verify-deployment.js
```

---

## Data Flow

### Reading Data (Query)

```
Component
  ↓ (useQuery hook)
React Query
  ↓ (fetch)
Server API (/api/events)
  ↓ (algodClient)
Algorand Network
```

### Writing Data (Mutation)

```
Component
  ↓ (useMutation hook)
React Hook (usePlaceBet)
  ↓ (service call)
AlgorandService
  ↓ (algosdk + wallet)
Pera Wallet (signs)
  ↓ (transaction)
Algorand Network
```

---

## Testing Strategy

### Unit Tests
- Service methods (mocked dependencies)
- Utility functions
- Configuration validation

### Integration Tests
- Smart contract operations
- API endpoints
- Wallet integration

### E2E Tests (Future)
- Full user flows
- LocalNet environment

---

## Error Handling

### Configuration Errors
```typescript
throw new ConfigValidationError(
  `Missing required environment variable: ${key}\n` +
  `Please check your .env file.`
);
```

### Service Errors
```typescript
try {
  await service.connectWallet();
} catch (error) {
  // Specific error handling
  if (error.message.includes('Session')) {
    // Reset and retry
  }
}
```

**Principles:**
- ✅ Fail fast with clear messages
- ✅ Provide solutions, not just problems
- ✅ Log errors for debugging
- ✅ Never expose internal details to users

---

## Next Steps

1. **Complete Migration** - Refactor existing code to use new architecture
2. **Add Tests** - Unit tests for services and config
3. **Improve Docs** - Add inline documentation
4. **Performance** - Add caching layer
5. **Monitoring** - Add error tracking and analytics

---

## References

- [Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [SOLID Principles](https://en.wikipedia.org/wiki/SOLID)
- [TypeScript Best Practices](https://www.typescriptlang.org/docs/handbook/declaration-files/do-s-and-don-ts.html)
- [React Best Practices](https://react.dev/learn/thinking-in-react)
