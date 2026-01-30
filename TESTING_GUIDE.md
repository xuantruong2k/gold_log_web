# Testing Guide for Interview Preparation

## Overview

This document explains different types of tests, testing strategies, and best practices - perfect preparation for discussing testing in your interview.

---

## Test Types (The Testing Pyramid)

### 1. Unit Tests ⚡ (Fast, Many)

**What**: Test individual functions/methods in isolation
**Why**: Catch bugs early, fast feedback, easy to debug
**Tools**: Vitest, Jest, Mocha

**Examples from our project:**

```typescript
// Testing a utility function
describe('formatCurrency', () => {
  it('should format VND currency correctly', () => {
    expect(formatCurrency(75000000, 'VND')).toBe('75,000,000 VND');
  });

  it('should handle zero values', () => {
    expect(formatCurrency(0, 'VND')).toBe('0 VND');
  });
});
```

**When to use:**
- ✅ Pure functions (same input → same output)
- ✅ Business logic calculations
- ✅ Data transformations
- ✅ Validation rules

**Benefits:**
- Very fast (milliseconds)
- Easy to write and maintain
- Precise error localization
- Good for TDD (Test-Driven Development)

---

### 2. Integration Tests 🔗 (Medium Speed, Moderate Number)

**What**: Test how multiple units work together
**Why**: Ensure components interact correctly
**Tools**: React Testing Library, Vitest, MSW (Mock Service Worker)

**Examples from our project:**

```typescript
// Testing a React hook that uses API calls
describe('useDashboardSummary', () => {
  it('should calculate portfolio correctly with mixed transactions', () => {
    // Mock API response
    vi.mocked(useTransactions).mockReturnValue({
      data: { data: mockTransactions },
      isLoading: false,
      error: null,
    });

    const { result } = renderHook(() => useDashboardSummary());

    // Test integration of multiple calculations
    expect(result.current.summary.currentHoldings).toBe(100);
    expect(result.current.summary.totalInvested).toBe(11300000000);
    expect(result.current.summary.averageBuyPrice).toBeCloseTo(75333333.33);
  });
});
```

**When to use:**
- ✅ React components with state
- ✅ Custom hooks
- ✅ API client integration
- ✅ Form submissions
- ✅ User workflows (multi-step)

**Key technique - Mocking:**

```typescript
// Mock external dependencies
vi.mock('./useTransactions');
vi.mock('axios');

// Mock API responses with MSW
const handlers = [
  rest.get('/api/transactions', (req, res, ctx) => {
    return res(ctx.json({ data: mockTransactions }));
  }),
];
```

---

### 3. End-to-End (E2E) Tests 🌐 (Slow, Few)

**What**: Test complete user flows in real browser
**Why**: Ensure the whole system works together
**Tools**: Playwright, Cypress, Selenium

**Example workflow:**

```typescript
// Playwright E2E test
test('user can create and export transaction', async ({ page }) => {
  // Login
  await page.goto('/');
  await page.click('text=Sign in with Google');
  // ... OAuth flow ...

  // Create transaction
  await page.goto('/transactions');
  await page.click('text=Add Transaction');
  await page.fill('input[name="quantity"]', '10');
  await page.fill('input[name="pricePerUnit"]', '75000000');
  await page.click('button:has-text("Save")');

  // Verify success
  await expect(page.locator('text=Transaction created successfully')).toBeVisible();

  // Export
  await page.click('text=Export');
  await page.click('text=Export as CSV');
  // Verify download
});
```

**When to use:**
- ✅ Critical user paths (signup, checkout, payment)
- ✅ Cross-browser compatibility
- ✅ Performance testing
- ✅ Visual regression testing

**Challenges:**
- Slow (seconds to minutes)
- Flaky (network issues, timing problems)
- Expensive to maintain
- Requires full environment setup

---

## Testing Strategies

### Test-Driven Development (TDD) 🔴🟢🔵

**The Red-Green-Refactor Cycle:**

```
1. 🔴 RED: Write failing test first
2. 🟢 GREEN: Write minimal code to pass
3. 🔵 REFACTOR: Improve code quality
4. Repeat
```

**Example:**

```typescript
// 1. RED: Write test first (fails)
describe('calculateProfit', () => {
  it('should calculate profit correctly', () => {
    expect(calculateProfit(100, 80)).toBe(20);
  });
});

// 2. GREEN: Write simplest code to pass
function calculateProfit(sell: number, buy: number) {
  return sell - buy;
}

// 3. REFACTOR: Improve (add validation, edge cases)
function calculateProfit(sell: number, buy: number): number {
  if (sell < 0 || buy < 0) throw new Error('Invalid price');
  return Math.max(0, sell - buy);
}

// 4. Add more tests
it('should return 0 for negative profit', () => {
  expect(calculateProfit(80, 100)).toBe(0);
});
```

**Benefits:**
- Forces you to think about requirements first
- Leads to testable code
- Built-in regression protection
- Confidence to refactor

---

### Behavior-Driven Development (BDD)

**What**: Tests written in natural language (Given-When-Then)
**Tools**: Cucumber, Jest (with describe/it)

**Example:**

```typescript
describe('Transaction Export', () => {
  describe('Given user has 10 transactions', () => {
    describe('When user clicks "Export as CSV"', () => {
      it('Then should download CSV file with 10 rows', () => {
        // Arrange (Given)
        const transactions = createMockTransactions(10);

        // Act (When)
        const csv = exportToCSV(transactions);

        // Assert (Then)
        const lines = csv.split('\n');
        expect(lines).toHaveLength(11); // 1 header + 10 data rows
      });
    });
  });
});
```

---

## Mocking Techniques

### 1. Function Mocking

```typescript
// Mock a function
const mockFn = vi.fn();
mockFn.mockReturnValue('mocked value');
mockFn.mockResolvedValue('async value');

// Spy on existing function
const spy = vi.spyOn(console, 'log');
expect(spy).toHaveBeenCalledWith('Hello');
```

### 2. Module Mocking

```typescript
// Mock entire module
vi.mock('./api/transactions', () => ({
  createTransaction: vi.fn().mockResolvedValue({ id: '123' }),
  getTransactions: vi.fn().mockResolvedValue({ data: [] }),
}));
```

### 3. API Mocking (MSW - Mock Service Worker)

```typescript
// Mock HTTP requests
const handlers = [
  rest.post('/api/transactions', async (req, res, ctx) => {
    const body = await req.json();
    return res(
      ctx.status(201),
      ctx.json({ id: 'new-id', ...body })
    );
  }),

  rest.get('/api/transactions', (req, res, ctx) => {
    // Check query params
    const type = req.url.searchParams.get('type');
    return res(ctx.json({ data: filteredTransactions }));
  }),
];

const server = setupServer(...handlers);
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

### 4. Time Mocking

```typescript
// Mock system time
vi.setSystemTime(new Date('2026-01-31T12:00:00Z'));

// Mock setTimeout/setInterval
vi.useFakeTimers();
setTimeout(() => console.log('delayed'), 1000);
vi.advanceTimersByTime(1000); // Fast-forward
```

---

## Test Coverage

### What is Coverage?

- **Line Coverage**: % of code lines executed
- **Branch Coverage**: % of if/else paths taken
- **Function Coverage**: % of functions called
- **Statement Coverage**: % of statements executed

### Good Coverage Targets

```
Critical paths:     90-100% (auth, payment, data loss)
Business logic:     80-90%  (calculations, workflows)
UI components:      70-80%  (forms, interactions)
Overall:           75-85%  (realistic target)
```

### Run Coverage

```bash
npm run test:coverage

# Output:
File                  | % Stmts | % Branch | % Funcs | % Lines
----------------------|---------|----------|---------|--------
filterUtils.ts        |   100   |   100    |   100   |   100
exportUtils.ts        |   98.5  |   95.2   |   100   |   98.5
useDashboardSummary   |   92.3  |   87.5   |   100   |   92.3
```

---

## Testing Best Practices

### 1. AAA Pattern (Arrange-Act-Assert)

```typescript
it('should calculate total correctly', () => {
  // Arrange: Set up test data
  const transaction = createMockTransaction({
    quantity: 10,
    pricePerUnit: 75000000,
  });

  // Act: Execute the code under test
  const total = transaction.quantity * transaction.pricePerUnit;

  // Assert: Verify the result
  expect(total).toBe(750000000);
});
```

### 2. Test One Thing

```typescript
// ❌ Bad: Tests multiple concerns
it('should validate and save transaction', () => {
  expect(validateTransaction(data)).toBe(true);
  expect(saveTransaction(data)).resolves.toBe('saved');
});

// ✅ Good: Separate tests
it('should validate transaction data', () => {
  expect(validateTransaction(data)).toBe(true);
});

it('should save valid transaction', async () => {
  await expect(saveTransaction(data)).resolves.toBe('saved');
});
```

### 3. Use Descriptive Test Names

```typescript
// ❌ Bad
it('works', () => { ... });

// ✅ Good
it('should calculate average buy price correctly when user has multiple BUY transactions', () => { ... });
```

### 4. Test Edge Cases

```typescript
describe('calculateAverageBuyPrice', () => {
  it('should return 0 when no BUY transactions exist', () => { ... });
  it('should handle single BUY transaction', () => { ... });
  it('should calculate average across multiple BUY transactions', () => { ... });
  it('should ignore SELL transactions in average calculation', () => { ... });
  it('should handle very large numbers without overflow', () => { ... });
  it('should handle decimal quantities correctly', () => { ... });
});
```

### 5. Avoid Test Interdependence

```typescript
// ❌ Bad: Tests depend on each other
let sharedData;

it('test 1', () => {
  sharedData = setupData();
  expect(sharedData).toBeDefined();
});

it('test 2', () => {
  // Fails if test 1 doesn't run first!
  expect(sharedData.value).toBe(100);
});

// ✅ Good: Each test is independent
beforeEach(() => {
  sharedData = setupData();
});

it('test 1', () => {
  expect(sharedData).toBeDefined();
});

it('test 2', () => {
  expect(sharedData.value).toBe(100);
});
```

---

## Common Testing Anti-Patterns

### 1. Testing Implementation Details

```typescript
// ❌ Bad: Tests internal state
it('should set loading to true', () => {
  component.setState({ loading: true });
  expect(component.state.loading).toBe(true);
});

// ✅ Good: Tests user-visible behavior
it('should show loading spinner while fetching', () => {
  render(<TransactionList />);
  expect(screen.getByText('Loading...')).toBeInTheDocument();
});
```

### 2. Too Many Mocks

```typescript
// ❌ Bad: Mocking everything
vi.mock('./useAuth');
vi.mock('./useTransactions');
vi.mock('./usePagination');
vi.mock('./useFilters');
// ... you're not testing anything real!

// ✅ Good: Only mock external dependencies
vi.mock('axios'); // Mock network
// Test real hooks and components
```

### 3. Flaky Tests

```typescript
// ❌ Bad: Time-dependent test
it('should show message after 1 second', async () => {
  render(<Component />);
  await new Promise(resolve => setTimeout(resolve, 1000));
  expect(screen.getByText('Message')).toBeInTheDocument();
});

// ✅ Good: Use waitFor with timeout
it('should show message after delay', async () => {
  render(<Component />);
  await waitFor(() => {
    expect(screen.getByText('Message')).toBeInTheDocument();
  }, { timeout: 2000 });
});
```

---

## Interview Discussion Points

### "Tell me about your testing experience"

**Good answer structure:**

1. **Types you've used**: "I work primarily with unit and integration tests using Vitest and React Testing Library. I've also written E2E tests with Playwright for critical user flows."

2. **Real example**: "In my gold trading app, I wrote comprehensive tests for the portfolio calculation logic because wrong math means wrong investment data - that's P0 priority."

3. **Coverage approach**: "I aim for 75-85% coverage overall, with 90%+ on critical paths like authentication and financial calculations."

4. **Tools**: "I use Vitest for speed, MSW for API mocking, and React Testing Library because it encourages testing user behavior rather than implementation."

### "What's your approach to testing?"

1. **Test the right things**: "I focus on user behavior and business logic, not implementation details."

2. **Follow the pyramid**: "Many fast unit tests, fewer integration tests, very few E2E tests."

3. **TDD when appropriate**: "For complex business logic like profit calculations, I write tests first. For UI exploration, I prototype then add tests."

4. **Continuous improvement**: "I review test failures seriously - they're either catching real bugs (good!) or the test is flaky/wrong (needs fixing)."

### "How do you decide what to test?"

**Priority matrix:**
```
High Impact + High Risk = MUST test (auth, payment, data loss)
High Impact + Low Risk  = Should test (happy path workflows)
Low Impact + High Risk  = Could test (edge cases)
Low Impact + Low Risk   = Don't test (getter/setter, trivial UI)
```

---

## Our Project Test Statistics

```bash
✅ Total Tests: 87 passed

Test Files:
- filterUtils.test.ts        (37 tests) - Date ranges, query strings, filters
- exportUtils.test.ts        (34 tests) - CSV/JSON export, special characters
- useDashboardSummary.test.tsx (14 tests) - Portfolio calculations
- constants.test.ts           (2 tests)  - Basic utility tests

Coverage Areas:
✅ Date range calculations (all 7 presets)
✅ Filter serialization/deserialization
✅ CSV escaping (quotes, commas, newlines)
✅ JSON formatting and precision
✅ Portfolio math (BUY/SELL/average price)
✅ Edge cases (empty data, overflow, negatives)
✅ Mocking (API calls, system time, DOM operations)
```

---

## Key Takeaways for Interview

1. **The Testing Pyramid**: Many unit tests, fewer integration, very few E2E
2. **TDD Red-Green-Refactor**: Write test → Make it pass → Refactor
3. **AAA Pattern**: Arrange → Act → Assert
4. **Mocking**: Only mock external dependencies, not your own code
5. **Coverage**: 75-85% overall, 90%+ for critical paths
6. **Test Behavior**: What users see, not how code works internally
7. **Real Examples**: Always have 2-3 specific test examples ready to discuss

---

## Resources for Further Learning

- **React Testing Library**: https://testing-library.com/react
- **Vitest Documentation**: https://vitest.dev/
- **Kent C. Dodds Blog**: https://kentcdodds.com/blog
- **Martin Fowler - Testing**: https://martinfowler.com/testing/
- **Testing JavaScript (Course)**: https://testingjavascript.com/

---

**Remember**: Tests are not about achieving 100% coverage. They're about **confidence** - confidence to refactor, confidence to deploy, confidence that your code works! 🚀

Good luck with your interview! 🎉
