# Migration to Clean Architecture

## Overview

This document explains the refactoring from messy scattered configuration to professional clean architecture.

---

## What Changed?

### Before (Messy) ❌

```
Multiple .env files everywhere
.env
.env.backup
.env.example
.env.algorand.example
.env.localnet.example
.env.testnet
.env.testnet (duplicate!)

Hardcoded config in code
client/src/lib/algorand.ts:
  - Magic strings
  - No validation
  - Global mutable state
  
Documentation scattered
PHASE1A-COMPLETE.md
PHASE1B-COMPLETE.md
PHASE2-COMPLETE.md
... 20+ markdown files in root
LOCALNET-SETUP.md
LOCALNET-VS-TESTNET.md
ALGORAND-QUICKSTART.md
... duplicated guides
```

### After (Clean) ✅

```
Clear environment templates
.env                     # Active (gitignored)
.env.template            # Documented template
.env.localnet            # LocalNet quick start
.env.testnet.template    # TestNet template

Centralized configuration
config/
├── networks.ts          # Network definitions only
├── environment.ts       # Validation only
└── index.ts             # Single export

Service layer
client/src/services/
└── algorand.service.ts  # Clean interface, DI pattern

Organized documentation
docs/
├── architecture/
│   └── OVERVIEW.md
├── guides/
│   ├── CONFIGURATION.md
│   ├── LOCAL-DEVELOPMENT.md
│   └── TESTNET-DEPLOYMENT.md
└── API.md

Clear entry point
README.md               # Professional, comprehensive
```

---

## Migration Steps

### Phase 1: Configuration ✅ DONE

**Created:**
- `config/networks.ts` - Network configurations
- `config/environment.ts` - Type-safe environment validation
- `config/index.ts` - Single export point

**Benefits:**
- ✅ Single source of truth
- ✅ Validated at startup
- ✅ Type-safe access
- ✅ Clear error messages

### Phase 2: Services ✅ DONE

**Created:**
- `client/src/services/algorand.service.ts`
- Clean `IAlgorandService` interface
- Dependency injection pattern

**Benefits:**
- ✅ Testable (mockable interface)
- ✅ No global state
- ✅ Clear responsibilities

### Phase 3: Documentation ✅ DONE

**Created:**
- `README.md` - Professional entry point
- `docs/architecture/OVERVIEW.md` - System design
- `docs/guides/CONFIGURATION.md` - Setup guide

**To Do:**
- Move PHASE*.md files to `docs/archive/`
- Create focused user guides
- Add API documentation

### Phase 4: Cleanup 🔄 IN PROGRESS

**To Do:**
- Remove duplicate .env files
- Refactor existing code to use new config
- Update imports throughout codebase
- Add deprecation warnings

---

## How to Use New Architecture

### 1. Configuration Access

**Old Way:**
```typescript
// Scattered throughout code
const network = import.meta.env.VITE_ALGORAND_NETWORK || 'testnet';
const appId = parseInt(import.meta.env.VITE_ALGORAND_APP_ID);
```

**New Way:**
```typescript
import { getConfig } from '@/../../config';

const config = getConfig(); // Validated, type-safe
console.log(config.network);  // NetworkType
console.log(config.appId);    // number
```

### 2. Network Configuration

**Old Way:**
```typescript
const NETWORKS = {
  testnet: { url: 'https://...', port: 443 },
  // Duplicated in multiple files
};
```

**New Way:**
```typescript
import { getNetworkConfig } from '@/../../config';

const network = getNetworkConfig('testnet');
console.log(network.algod.url);   // string
console.log(network.algod.port);  // number
```

### 3. Algorand Service

**Old Way:**
```typescript
// Direct algosdk usage everywhere
import algosdk from 'algosdk';
const client = new algosdk.Algodv2(...);
```

**New Way:**
```typescript
import { getAlgorandService } from '@/services/algorand.service';

const service = getAlgorandService();
const client = service.getAlgodClient();
await service.connectWallet();
```

---

## Backward Compatibility

During migration, both old and new patterns work:

```typescript
// Old imports still work
import { createAlgodClient } from '@/lib/algorand';

// But new way is preferred
import { getAlgorandService } from '@/services/algorand.service';
const service = getAlgorandService();
```

**Deprecation Timeline:**
1. Phase 4a: Add new architecture ✅ DONE
2. Phase 4b: Update documentation ✅ DONE
3. Phase 4c: Add deprecation warnings 🔄 NEXT
4. Phase 4d: Refactor existing code
5. Phase 5: Remove old patterns

---

## Benefits of New Architecture

### 1. **Single Source of Truth**

**Before:**
- Network config in 3+ places
- Environment vars accessed 10+ ways
- Duplicated validation logic

**After:**
- One `config/` directory
- One validation function
- Clear ownership

### 2. **Type Safety**

**Before:**
```typescript
const appId = import.meta.env.VITE_ALGORAND_APP_ID; // string | undefined
const num = parseInt(appId || '0'); // error-prone
```

**After:**
```typescript
const config = getConfig(); // validated once
const appId = config.appId;  // number (guaranteed)
```

### 3. **Testability**

**Before:**
```typescript
// Can't test - direct algosdk usage
function myFunction() {
  const client = new algosdk.Algodv2(...);
  return client.status();
}
```

**After:**
```typescript
// Easy to test - inject mock service
function myFunction(service: IAlgorandService) {
  const client = service.getAlgodClient();
  return client.status();
}
```

### 4. **Clear Errors**

**Before:**
```
TypeError: Cannot read property 'env' of undefined
// Where? Why? What do I do?
```

**After:**
```
ConfigValidationError: Missing required environment variable: VITE_ALGORAND_APP_ID
Please check your .env file.
// Clear problem, clear solution
```

---

## What to Update in Your Code

### If you're working on frontend:

```typescript
// Update imports
- import { createAlgodClient } from '@/lib/algorand';
+ import { getAlgorandService } from '@/services/algorand.service';

// Update usage
- const client = createAlgodClient();
+ const service = getAlgorandService();
+ const client = service.getAlgodClient();
```

### If you're adding features:

1. **Read the new docs:**
   - `README.md` - Start here
   - `docs/architecture/OVERVIEW.md` - Understand design
   - `docs/guides/CONFIGURATION.md` - Setup guide

2. **Use the new patterns:**
   - Import from `config/`
   - Use `AlgorandService`
   - Follow service layer pattern

3. **Add tests:**
   - Mock the service interface
   - Test business logic separately
   - Integration tests for full flow

---

## Need Help?

**Old pattern unclear?** Check existing code comments (marked deprecated)

**New pattern confusing?** See examples in:
- `client/src/services/algorand.service.ts`
- `docs/architecture/OVERVIEW.md`

**Migration questions?** Ask in GitHub Discussions

---

## Progress Tracker

- [x] Create config/ directory structure
- [x] Add network configurations
- [x] Add environment validation
- [x] Create service interface
- [x] Implement AlgorandService
- [x] Write architecture docs
- [x] Create migration guide
- [ ] Add deprecation warnings
- [ ] Refactor existing code
- [ ] Update all imports
- [ ] Remove old patterns
- [ ] Archive old documentation
- [ ] Update tests

**Target:** Complete by end of Phase 6
