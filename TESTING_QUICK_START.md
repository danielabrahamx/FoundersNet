# 🧪 Testing Quick Start Guide

## Run Tests Now

```bash
# Run all tests
npm run test:unit

# Watch mode (re-runs on file changes)
npm run test:unit:watch

# With coverage report
npm run test:unit -- --coverage
```

## What's Being Tested?

### ✅ 334 Tests Covering:

1. **Application Core** (7 tests)
   - App loads successfully
   - Navigation works
   - Theme toggle works
   - Network indicator displays

2. **Wallet Integration** (6 tests)
   - Connection states
   - Error handling
   - Network configuration

3. **API Integration** (12 tests)
   - Event fetching
   - Error handling
   - Data transformations
   - State management

4. **Components** (8 tests)
   - Event cards
   - Loading states
   - Error states

5. **Existing Tests** (301 tests)
   - Infrastructure
   - Services
   - Utilities
   - Unit tests

## Test Files Location

```
client/src/test/
├── app.e2e.test.tsx          # Application tests
├── navigation.e2e.test.tsx   # Routing tests
├── wallet.e2e.test.tsx       # Wallet integration
├── components.e2e.test.tsx   # Component tests
├── integration.e2e.test.tsx  # Integration tests
└── setup.ts                  # Test configuration
```

## Current Results

✅ **91% Pass Rate** (304/334 tests passing)

## Quick Debugging

If a test fails:

1. **Check the error message** - it tells you what went wrong
2. **Run that test alone**:
   ```bash
   npm run test:unit -- app.e2e.test.tsx
   ```
3. **Use verbose output**:
   ```bash
   npm run test:unit -- --reporter=verbose
   ```

## Test Coverage Report

Generate HTML coverage report:
```bash
npm run test:unit -- --coverage
```

View report: Open `coverage/index.html` in your browser

## Key Commands

| Command | Purpose |
|---------|---------|
| `npm run test:unit` | Run all tests once |
| `npm run test:unit:watch` | Watch mode |
| `npm run test:unit -- --coverage` | Coverage report |
| `npm run test:unit -- <filename>` | Run specific file |
| `npm run test:unit -- --ui` | Visual UI mode |

## Documentation

- **Full Guide**: See `TEST_DOCUMENTATION.md`
- **Latest Results**: See `TEST_RESULTS.md`
- **CI/CD**: Tests run automatically on commits

## Need Help?

Check the full documentation in `TEST_DOCUMENTATION.md` for:
- Writing new tests
- Mock configuration
- Best practices
- Troubleshooting
