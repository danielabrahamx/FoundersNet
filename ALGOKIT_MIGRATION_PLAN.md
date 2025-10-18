# FoundersNet - AlgoKit Fullstack Template Migration Plan

**Date:** October 18, 2025  
**Project:** FoundersNet - Algorand Prediction Markets  
**Current Structure:** Custom full-stack with Express.js backend  
**Target:** AlgoKit Fullstack Template Best Practices

---

## Executive Summary

This document outlines the refactoring strategy to align FoundersNet with AlgoKit fullstack template best practices while preserving all existing functionality, including the custom Express.js/PostgreSQL backend. The migration will modernize dependencies, improve project structure, and enhance maintainability.

---

## Current State Analysis

### Project Structure
```
StartupMarkets/
├── client/                    # Frontend (React + Vite)
│   └── src/
├── server/                    # Backend (Express.js + PostgreSQL)
├── smart_contracts/          # Algorand Python contracts
├── scripts/                  # Deployment scripts
├── config/                   # Network configurations
├── shared/                   # Shared types and contracts
└── test/                     # Test files
```

### Identified Issues

1. **Dependency Conflicts**
   - `@algorandfoundation/algokit-utils`: v6.0.0 (outdated, current is v9.0.0+)
   - `algosdk`: v2.7.0 (outdated, current is v3.0.0+)
   - `@perawallet/connect`: v1.3.1 (outdated, current is v1.4.1+)
   - `@txnlab/use-wallet`: Missing (should be v4.0.0+)
   - Replit-specific plugins that may cause conflicts in production

2. **Structural Issues**
   - Mixed frontend/backend/contracts in single package.json
   - No separation between frontend and backend dependencies
   - Custom server setup not aligned with typical AlgoKit patterns
   - `algokit.yaml` missing project structure definition

3. **Configuration Gaps**
   - No workspace configuration in `.algokit.toml`
   - Vite config missing `vite-plugin-node-polyfills`
   - Missing `.env.template` for frontend
   - No ESLint/Prettier configuration

---

## Target AlgoKit Structure

### Recommended Structure (Hybrid Approach)
```
FoundersNet/
├── .algokit.toml              # Workspace configuration
├── projects/
│   ├── foundersnet-frontend/  # AlgoKit React frontend
│   │   ├── src/
│   │   ├── package.json       # Frontend dependencies only
│   │   ├── vite.config.ts
│   │   ├── tailwind.config.ts
│   │   └── .env.template
│   ├── foundersnet-contracts/ # Algorand smart contracts
│   │   ├── smart_contracts/
│   │   ├── tests/
│   │   └── .algokit.toml
│   └── foundersnet-backend/   # Express.js API server
│       ├── server/
│       ├── package.json       # Backend dependencies only
│       └── drizzle.config.ts
├── shared/                    # Shared types/contracts
└── .github/                   # CI/CD workflows
```

---

## Migration Strategy

### Phase 1: Dependency Analysis & Updates ✅

**Current Status:** In Progress

#### Critical Updates Needed:
1. **Algorand Ecosystem**
   - `algosdk`: `^2.7.0` → `^3.0.0`
   - `@algorandfoundation/algokit-utils`: `^6.0.0` → `^9.0.0`
   - Add `@txnlab/use-wallet`: `^4.0.0`
   - Add `@txnlab/use-wallet-react`: `^4.0.0`
   - `@perawallet/connect`: `^1.3.1` → `^1.4.1`
   - `@blockshake/defly-connect`: `^1.1.6` → `^1.2.1`

2. **Build Tools**
   - Add `vite-plugin-node-polyfills`: `^0.22.0`
   - Add `@algorandfoundation/algokit-client-generator`: `^5.0.0`

3. **Wallet Integration**
   - Replace Pera Wallet direct integration with `@txnlab/use-wallet-react`
   - Supports multiple wallets: Pera, Defly, Exodus, WalletConnect

4. **Remove/Replace**
   - Remove Replit-specific plugins (or make optional):
     - `@replit/vite-plugin-cartographer`
     - `@replit/vite-plugin-dev-banner`
     - `@replit/vite-plugin-runtime-error-modal`

#### Compatibility Matrix:
```
algosdk v3.0.0 ← requires → @algorandfoundation/algokit-utils v9.0.0+
@txnlab/use-wallet v4.0.0 ← requires → @txnlab/use-wallet-react v4.0.0
React 18.3.1 ← compatible → all above packages ✓
```

---

### Phase 2: Project Structure Refactoring

#### Option A: Full Workspace (Recommended)
**Pros:** Best practices, clean separation, easier CI/CD
**Cons:** More initial work, requires moving files

**Implementation:**
1. Create `projects/` directory
2. Move frontend code to `projects/foundersnet-frontend/`
3. Move smart contracts to `projects/foundersnet-contracts/`
4. Move backend to `projects/foundersnet-backend/`
5. Update import paths across all projects

#### Option B: Hybrid (Pragmatic)
**Pros:** Less disruption, maintains current workflow
**Cons:** Not fully aligned with AlgoKit standards

**Implementation:**
1. Keep current structure
2. Update `algokit.yaml` to define project type
3. Create `.algokit.toml` for workspace commands
4. Separate package.json into multiple files conceptually

**Recommendation:** Start with **Option B**, migrate to **Option A** later if needed.

---

### Phase 3: Configuration File Updates

#### 1. `.algokit.toml` (NEW FILE)
```toml
[algokit]
min_version = "v2.0.0"

[project]
type = 'workspace'
projects_root_path = '.'

[project.run]
# Frontend commands
dev-frontend = { commands = ['npm run dev:frontend'], description = 'Run frontend dev server' }
build-frontend = { commands = ['npm run build:frontend'], description = 'Build frontend' }

# Backend commands  
dev-backend = { commands = ['npm run dev'], description = 'Run backend server' }

# Smart contract commands
compile = { commands = ['npm run compile:algorand'], description = 'Compile smart contracts' }
deploy-local = { commands = ['npm run deploy:local'], description = 'Deploy to localnet' }

# Combined
dev-all = { commands = ['npm run dev'], description = 'Run full stack' }
```

#### 2. `algokit.yaml` Updates
```yaml
version: 1.0

project:
  name: foundersnet
  type: python  # Keep current
  artifacts: smart_contracts/artifacts

# ... keep existing networks configuration ...

# Add frontend configuration
frontend:
  framework: react
  port: 5173
  env_file: .env.localnet
```

#### 3. `vite.config.ts` Updates
```typescript
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

export default defineConfig({
  plugins: [
    react(),
    nodePolyfills({
      globals: {
        Buffer: true,
      },
    }),
  ],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
})
```

#### 4. New `.env.template` for Frontend
```bash
# Algorand Network Configuration
VITE_ALGOD_SERVER=http://localhost
VITE_ALGOD_PORT=4001
VITE_ALGOD_TOKEN=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
VITE_ALGOD_NETWORK=localnet

# Indexer Configuration  
VITE_INDEXER_SERVER=http://localhost
VITE_INDEXER_PORT=8980
VITE_INDEXER_TOKEN=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa

# KMD Configuration (LocalNet only)
VITE_KMD_SERVER=http://localhost
VITE_KMD_PORT=4002
VITE_KMD_TOKEN=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa

# Backend API
VITE_API_URL=http://localhost:5000
```

#### 5. Add ESLint/Prettier Configuration

**.eslintrc.cjs** (NEW)
```javascript
module.exports = {
  env: {
    browser: true,
    es2021: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'prettier',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint', 'react'],
  rules: {
    'react/react-in-jsx-scope': 'off',
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
}
```

**.prettierrc.cjs** (NEW)
```javascript
module.exports = {
  singleQuote: true,
  jsxSingleQuote: false,
  semi: false,
  tabWidth: 2,
  trailingComma: 'all',
  printWidth: 140,
  endOfLine: 'lf',
  arrowParens: 'always',
}
```

---

### Phase 4: Wallet Integration Refactoring

#### Current Implementation Issues:
- Direct Pera Wallet integration in `client/src/lib/algorand.ts`
- Custom wallet management
- No support for multiple wallets

#### Target Implementation:
Use `@txnlab/use-wallet-react` for unified wallet management.

**Updated `client/src/App.tsx` or `AlgorandApp.tsx`:**
```typescript
import { SupportedWallet, WalletId, WalletManager, WalletProvider } from '@txnlab/use-wallet-react'
import { SnackbarProvider } from 'notistack'

let supportedWallets: SupportedWallet[]

if (import.meta.env.VITE_ALGOD_NETWORK === 'localnet') {
  // LocalNet uses KMD
  supportedWallets = [
    {
      id: WalletId.KMD,
      options: {
        baseServer: import.meta.env.VITE_KMD_SERVER,
        token: String(import.meta.env.VITE_KMD_TOKEN),
        port: String(import.meta.env.VITE_KMD_PORT),
      },
    },
  ]
} else {
  // TestNet/MainNet uses multiple wallet providers
  supportedWallets = [
    { id: WalletId.DEFLY },
    { id: WalletId.PERA },
    { id: WalletId.EXODUS },
  ]
}

export default function App() {
  const walletManager = new WalletManager({
    wallets: supportedWallets,
    defaultNetwork: import.meta.env.VITE_ALGOD_NETWORK,
    networks: {
      [import.meta.env.VITE_ALGOD_NETWORK]: {
        algod: {
          baseServer: import.meta.env.VITE_ALGOD_SERVER,
          port: import.meta.env.VITE_ALGOD_PORT,
          token: String(import.meta.env.VITE_ALGOD_TOKEN),
        },
      },
    },
  })

  return (
    <SnackbarProvider maxSnack={3}>
      <WalletProvider manager={walletManager}>
        {/* Your app components */}
      </WalletProvider>
    </SnackbarProvider>
  )
}
```

#### Migration Steps:
1. ✅ Install `@txnlab/use-wallet` and `@txnlab/use-wallet-react`
2. ✅ Update wallet initialization in main app component
3. ✅ Replace `useAlgorandPredictionMarket` hook to use `useWallet` from use-wallet-react
4. ✅ Update all components using wallet functionality
5. ✅ Test with Pera Wallet on TestNet
6. ✅ Test with KMD on LocalNet

---

### Phase 5: Backend Integration

#### Current Setup:
- Express.js + PostgreSQL + Drizzle ORM
- Single package.json with mixed dependencies
- Server runs on port 5000

#### Recommended Changes:

1. **Separate Backend Package** (Optional but recommended)
   - Create `server/package.json` with backend-only dependencies
   - Move Express, PostgreSQL, Drizzle dependencies
   - Keep frontend dependencies in root `package.json`

2. **Update Scripts in Root `package.json`:**
```json
{
  "scripts": {
    "dev": "concurrently \"npm run dev:backend\" \"npm run dev:frontend\"",
    "dev:backend": "cross-env NODE_ENV=development tsx server/index.ts",
    "dev:frontend": "vite",
    "build": "npm run build:frontend && npm run build:backend",
    "build:frontend": "vite build",
    "build:backend": "esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist"
  }
}
```

3. **Add `concurrently` for parallel dev servers:**
```bash
npm install --save-dev concurrently
```

---

### Phase 6: Smart Contract Integration

#### Current State:
- Python smart contract in `smart_contracts/prediction_market.py`
- Compiled with `algokit compile py`
- Good alignment with AlgoKit standards ✓

#### Recommended Updates:

1. **Add smart contract TypeScript client generation:**
```json
{
  "scripts": {
    "generate:app-clients": "algokit project link --all",
    "dev:frontend": "npm run generate:app-clients && vite"
  }
}
```

2. **Update Contract Output Location:**
   - Keep artifacts in `smart_contracts/artifacts/`
   - Link to frontend at `client/src/contracts/`

3. **Add to `.algokit.toml`:**
```toml
[generate.app-clients]
contracts_dir = 'smart_contracts'
output_dir = 'client/src/contracts'
```

---

### Phase 7: Testing & CI/CD

#### Add Testing Infrastructure:

1. **Jest for Unit Tests** (Optional)
```bash
npm install --save-dev jest @types/jest ts-jest @testing-library/react @testing-library/jest-dom
```

2. **Playwright for E2E Tests** (Optional)
```bash
npm install --save-dev @playwright/test playwright
```

3. **Update package.json:**
```json
{
  "scripts": {
    "test": "npm run test:algorand",
    "test:unit": "jest",
    "test:e2e": "playwright test",
    "lint": "eslint client/src --ext ts,tsx",
    "lint:fix": "eslint client/src --ext ts,tsx --fix"
  }
}
```

#### GitHub Actions (already exists, but update):

**.github/workflows/ci.yml:**
```yaml
name: CI

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm ci
      - run: npm run lint
      - run: npm run build
      - run: npm test
```

---

## Implementation Checklist

### Phase 1: Dependencies (Week 1)
- [ ] Create backup branch: `git checkout -b pre-algokit-migration`
- [ ] Update `algosdk` to v3.0.0
- [ ] Update `@algorandfoundation/algokit-utils` to v9.0.0
- [ ] Add `@txnlab/use-wallet` and `@txnlab/use-wallet-react`
- [ ] Add `vite-plugin-node-polyfills`
- [ ] Update wallet dependencies (Pera, Defly)
- [ ] Remove or make optional Replit plugins
- [ ] Run `npm install` and resolve peer dependency conflicts
- [ ] Test that app starts without errors

### Phase 2: Configuration (Week 1-2)
- [ ] Create `.algokit.toml` workspace file
- [ ] Update `algokit.yaml` with frontend config
- [ ] Create `.env.template` file
- [ ] Update `vite.config.ts` with node polyfills
- [ ] Add ESLint configuration
- [ ] Add Prettier configuration
- [ ] Update `tsconfig.json` if needed

### Phase 3: Wallet Refactoring (Week 2)
- [ ] Install use-wallet packages
- [ ] Update App.tsx/AlgorandApp.tsx with WalletProvider
- [ ] Refactor `useAlgorandPredictionMarket` hook
- [ ] Update all wallet-dependent components
- [ ] Test wallet connection on LocalNet (KMD)
- [ ] Test wallet connection on TestNet (Pera)

### Phase 4: Scripts & Commands (Week 2)
- [ ] Update package.json scripts for workspace pattern
- [ ] Add `generate:app-clients` script
- [ ] Test all npm scripts work correctly
- [ ] Update documentation (README.md)

### Phase 5: Testing (Week 3)
- [ ] Run existing Algorand tests
- [ ] Test frontend builds successfully
- [ ] Test backend API endpoints
- [ ] Test full deployment to LocalNet
- [ ] Test full deployment to TestNet
- [ ] E2E testing of core workflows

### Phase 6: Documentation (Week 3)
- [ ] Update README.md with new structure
- [ ] Document environment variables
- [ ] Update deployment instructions
- [ ] Add troubleshooting section
- [ ] Update HACKATHON.md if needed

### Phase 7: Optional Enhancements (Week 4+)
- [ ] Add Jest unit tests
- [ ] Add Playwright E2E tests
- [ ] Restructure to full workspace (Option A)
- [ ] Add GitHub Actions workflows
- [ ] Add pre-commit hooks (husky + lint-staged)

---

## Risk Assessment

### High Risk Items:
1. **Wallet Integration Breaking**: Pera Wallet API changes
   - **Mitigation**: Test thoroughly, maintain backward compatibility
   
2. **Smart Contract Compatibility**: algosdk v3 ABI changes
   - **Mitigation**: Review algosdk migration guide, update contract interactions

3. **Dependency Conflicts**: Package version mismatches
   - **Mitigation**: Use exact versions, test incrementally

### Medium Risk Items:
1. **Build Configuration**: Vite/esbuild issues
   - **Mitigation**: Keep existing config, add features incrementally

2. **Environment Variables**: Missing or incorrect env vars
   - **Mitigation**: Create comprehensive `.env.template`

### Low Risk Items:
1. **Styling/UI**: TailwindCSS compatibility
   - **Mitigation**: Already well-configured

2. **Backend API**: Express.js unchanged
   - **Mitigation**: No changes to backend logic

---

## Rollback Plan

If migration encounters critical issues:

1. **Immediate Rollback:**
   ```bash
   git reset --hard pre-algokit-migration
   git clean -fd
   npm ci
   ```

2. **Partial Rollback:**
   - Revert specific dependency updates
   - Use git to cherry-pick working changes
   - Document what worked vs. what didn't

3. **Backup Strategy:**
   - Tag current working state before each phase
   - Keep dependencies locked with `package-lock.json`
   - Test in development before committing

---

## Success Criteria

✅ **Must Have:**
1. All existing features work without regression
2. Wallet connection works on LocalNet and TestNet
3. Smart contract deployment works
4. Frontend builds successfully
5. Backend API functional
6. No dependency conflicts
7. Documentation updated

🎯 **Should Have:**
1. Improved developer experience
2. Faster build times
3. Better error messages
4. Multi-wallet support
5. ESLint/Prettier configured

🌟 **Nice to Have:**
1. Automated tests passing
2. CI/CD pipeline working
3. Full workspace structure
4. E2E testing setup

---

## Timeline Estimate

- **Phase 1 (Dependencies):** 2-3 days
- **Phase 2 (Configuration):** 2-3 days
- **Phase 3 (Wallet Refactoring):** 3-4 days
- **Phase 4 (Scripts & Commands):** 1-2 days
- **Phase 5 (Testing):** 3-5 days
- **Phase 6 (Documentation):** 2-3 days
- **Phase 7 (Optional):** 1-2 weeks

**Total Minimum:** ~2 weeks  
**Total with Optional:** 3-4 weeks

---

## Next Steps

1. ✅ Review this migration plan
2. ⏳ Approve approach (Option A vs B for structure)
3. ⏳ Create backup branch
4. ⏳ Begin Phase 1: Dependency updates
5. ⏳ Test incrementally after each change
6. ⏳ Document any deviations or issues
7. ⏳ Update this plan as needed

---

## References

- [AlgoKit Fullstack Template](https://github.com/algorandfoundation/algokit-fullstack-template)
- [AlgoKit React Frontend Template](https://github.com/algorandfoundation/algokit-react-frontend-template)
- [AlgoKit Utils Documentation](https://github.com/algorandfoundation/algokit-utils-ts)
- [use-wallet Documentation](https://github.com/txnlab/use-wallet)
- [algosdk v3 Migration Guide](https://github.com/algorand/js-algorand-sdk)

---

**Document Version:** 1.0  
**Last Updated:** October 18, 2025  
**Author:** AI Assistant + FoundersNet Team
