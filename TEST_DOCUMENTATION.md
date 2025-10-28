# FoundersNet E2E Test Documentation

## Overview

This document describes the end-to-end (E2E) test suite for FoundersNet, a Solana-based prediction market platform for startup success.

## Test Structure

### Test Files

1. **`app.e2e.test.tsx`** - Application-level tests
   - Application initialization
   - Page rendering
   - Network configuration
   - Error handling
   - Responsive design

2. **`navigation.e2e.test.tsx`** - Navigation and routing tests
   - Page navigation
   - Navigation links
   - Active route indicators
   - Deep linking

3. **`wallet.e2e.test.tsx`** - Solana wallet integration tests
   - Wallet connection states
   - Connected/disconnected UI
   - Wallet error handling
   - Network indicator

4. **`components.e2e.test.tsx`** - Component-specific tests
   - Event cards
   - Theme toggle
   - Loading states
   - Error states

5. **`integration.e2e.test.tsx`** - Integration tests
   - API integration
   - Solana blockchain integration
   - Configuration loading
   - Data flow
   - State management

## Running Tests

### Run All Tests
```bash
npm run test:unit
```

### Run Tests in Watch Mode
```bash
npm run test:unit:watch
```

### Run Tests with Coverage
```bash
npm run test:unit -- --coverage
```

### Run Specific Test File
```bash
npm run test:unit -- app.e2e.test.tsx
```

## Test Configuration

### Vitest Configuration

The test suite uses Vitest with the following configuration:

- **Environment**: jsdom (browser-like environment)
- **Setup File**: `client/src/test/setup.ts`
- **Test Timeout**: 10 seconds
- **Coverage Provider**: v8
- **Coverage Reports**: text, json, html

### Mock Configuration

The tests mock the following external dependencies:

1. **Solana Wallet Adapter** (`@solana/wallet-adapter-react`)
   - Provides controlled wallet states for testing
   - Mocks connection, disconnection, and transaction signing

2. **Wallet UI** (`@solana/wallet-adapter-react-ui`)
   - Mocks wallet buttons and modals

3. **Environment Configuration** (`config/environment`)
   - Provides test configuration values
   - Network: solana-devnet
   - Test program IDs and addresses

## Test Coverage

### Areas Covered

✅ **Application Initialization**
- App loads without crashing
- Correct page titles and descriptions
- Network indicator displays
- Wallet connection button shows

✅ **Navigation**
- Home page loads
- My Bets page accessible
- Navigation links work
- Active route indicators

✅ **Wallet Integration**
- Disconnected state UI
- Connected state UI
- Wallet connection errors
- Network configuration

✅ **API Integration**
- Event fetching
- Error handling
- Network timeouts
- Response parsing

✅ **Solana Integration**
- Address validation
- Lamports to SOL conversion
- SOL formatting
- Transaction handling

✅ **Configuration**
- Environment loading
- Configuration validation
- Network settings

✅ **Data Flow**
- Event creation flow
- Betting workflow
- Query caching
- Cache invalidation

## Test Data

### Mock Events
```typescript
{
  eventId: 1,
  name: 'Will Acme Corp raise Series A by Q4 2025?',
  endTime: Math.floor(Date.now() / 1000) + 86400,
  resolved: false,
  outcome: false,
  totalYesBets: 10,
  totalNoBets: 5,
  totalYesAmount: '5000000000', // 5 SOL
  totalNoAmount: '3000000000', // 3 SOL
}
```

### Mock Wallet Address
```
9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin
```

### Mock Program ID
```
Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS
```

## Writing New Tests

### Test Template

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

describe('Feature Name', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
  });

  it('should test specific behavior', async () => {
    // Arrange
    render(
      <QueryClientProvider client={queryClient}>
        <YourComponent />
      </QueryClientProvider>
    );

    // Act
    // ... user interactions

    // Assert
    await waitFor(() => {
      expect(screen.getByText('Expected Text')).toBeInTheDocument();
    });
  });
});
```

## Best Practices

1. **Use data-testid attributes** for reliable element selection
2. **Mock external dependencies** to ensure test isolation
3. **Test user behavior** not implementation details
4. **Use waitFor** for async operations
5. **Clean up after tests** using afterEach hooks
6. **Keep tests focused** on a single behavior
7. **Use descriptive test names** that explain what is being tested

## Continuous Integration

Tests should be run:
- Before every commit
- On pull requests
- Before deployments
- On scheduled builds

## Troubleshooting

### Common Issues

**Issue**: Tests timeout
- **Solution**: Increase testTimeout in vitest.config.ts

**Issue**: Mock not working
- **Solution**: Ensure vi.mock() is called before imports

**Issue**: DOM not updating
- **Solution**: Wrap assertions in waitFor()

**Issue**: Wallet adapter errors
- **Solution**: Check wallet adapter mocks are properly configured

## Future Improvements

- [ ] Add visual regression tests
- [ ] Add accessibility (a11y) tests
- [ ] Add performance tests
- [ ] Increase test coverage to >80%
- [ ] Add contract interaction tests with local validator
- [ ] Add end-to-end Playwright tests for browser automation

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library Docs](https://testing-library.com/)
- [Solana Testing Guide](https://docs.solana.com/developing/test-validator)
- [React Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
