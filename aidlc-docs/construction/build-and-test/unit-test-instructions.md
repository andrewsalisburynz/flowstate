# Unit Test Execution - Iteration 2

## Current State

**Note**: The FlowState project currently does not have unit tests implemented. This was identified as technical debt in the code quality assessment.

## Recommended Unit Test Strategy

### Backend Unit Tests

#### Test Framework Setup
```bash
cd backend
npm install --save-dev jest @types/jest ts-jest @aws-sdk/client-bedrock-runtime-mock
```

#### Test Structure
```
backend/
├── src/
│   ├── handlers/
│   ├── services/
│   └── types/
└── tests/
    ├── unit/
    │   ├── handlers/
    │   │   ├── ai-task.test.ts
    │   │   ├── cards.test.ts
    │   │   └── ai-bottleneck.test.ts
    │   └── services/
    │       ├── bedrock.test.ts
    │       ├── dynamodb.test.ts
    │       └── websocket.test.ts
    └── jest.config.js
```

#### Key Test Cases for Iteration 2

**1. Bedrock Service Tests** (`tests/unit/services/bedrock.test.ts`):
- Test `sleep()` utility function
- Test `isThrottlingError()` with various error types
- Test `invokeBedrockWithRetry()` exponential backoff logic
- Test `suggestCardSplit()` response parsing
- Mock AWS Bedrock client responses

**2. AI Task Handler Tests** (`tests/unit/handlers/ai-task.test.ts`):
- Test split detection when storyPoints > 8
- Test normal card creation when storyPoints <= 8
- Test HTTP 429 error handling with retryAfter
- Test split suggestion response format
- Mock Bedrock service calls

**3. Cards Handler Tests** (`tests/unit/handlers/cards.test.ts`):
- Test `columnEnteredAt` timestamp creation on column change
- Test `columnEnteredAt` preservation when column unchanged
- Test initial `columnEnteredAt` on card creation
- Mock DynamoDB operations

**4. Bottleneck Handler Tests** (`tests/unit/handlers/ai-bottleneck.test.ts`):
- Test duration calculation from `columnEnteredAt`
- Test high severity alert creation (>14 days)
- Test medium severity alert creation (>7 days)
- Test alert message format
- Mock DynamoDB and Bedrock calls

### Frontend Unit Tests

#### Test Framework Setup
```bash
cd frontend
npm install --save-dev vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
```

#### Test Structure
```
frontend/
├── src/
│   ├── App.tsx
│   └── App.css
└── tests/
    ├── unit/
    │   ├── App.test.tsx
    │   ├── StatusIndicator.test.tsx
    │   └── SplitPreviewModal.test.tsx
    └── vitest.config.ts
```

#### Key Test Cases for Iteration 2

**1. Status Indicator Tests** (`tests/unit/StatusIndicator.test.tsx`):
- Test status display for all 4 states (ready, processing, retrying, rate-limited)
- Test countdown timer decrement
- Test status transition from rate-limited to ready when countdown reaches 0
- Test button disable when rate-limited

**2. Split Preview Modal Tests** (`tests/unit/SplitPreviewModal.test.tsx`):
- Test modal display with split suggestion data
- Test approve split creates all split cards
- Test reject split creates original card
- Test modal close behavior
- Mock fetch API calls

**3. AI Request Handling Tests** (`tests/unit/App.test.tsx`):
- Test `createAICard()` HTTP 429 handling
- Test `createAICard()` split suggestion handling
- Test `handleApproveSplit()` creates multiple cards
- Test `handleRejectSplit()` creates original card
- Mock API responses

---

## Run Unit Tests (When Implemented)

### Backend Tests
```bash
cd backend
npm test
```

**Expected Output**:
```
PASS tests/unit/services/bedrock.test.ts
PASS tests/unit/handlers/ai-task.test.ts
PASS tests/unit/handlers/cards.test.ts
PASS tests/unit/handlers/ai-bottleneck.test.ts

Test Suites: 4 passed, 4 total
Tests:       25 passed, 25 total
Snapshots:   0 total
Time:        3.5s
```

### Frontend Tests
```bash
cd frontend
npm test
```

**Expected Output**:
```
✓ tests/unit/StatusIndicator.test.tsx (5)
✓ tests/unit/SplitPreviewModal.test.tsx (6)
✓ tests/unit/App.test.tsx (8)

Test Files  3 passed (3)
Tests  19 passed (19)
Duration  2.1s
```

---

## Test Coverage Goals

**Backend**:
- Handlers: 80%+ coverage
- Services: 85%+ coverage
- Critical paths (retry logic, split detection): 95%+ coverage

**Frontend**:
- Components: 75%+ coverage
- State management: 80%+ coverage
- User interactions: 85%+ coverage

---

## Manual Testing (Current Approach)

Since unit tests are not yet implemented, manual testing is required:

### Backend Manual Testing
1. Deploy backend to AWS
2. Test AI task creation with various descriptions
3. Test split detection with large cards (>8 story points)
4. Test rate limiting by making rapid requests
5. Test duration tracking by moving cards between columns
6. Verify bottleneck alerts appear after 7 and 14 days

### Frontend Manual Testing
1. Start frontend dev server: `npm run dev`
2. Test status indicator displays correctly
3. Test countdown timer when rate-limited
4. Test split preview modal with large card
5. Test approve split creates multiple cards
6. Test reject split creates original card
7. Verify button disables when rate-limited

---

## Fix Failing Tests

If tests fail (when implemented):

1. **Review Test Output**:
   ```bash
   npm test -- --verbose
   ```

2. **Identify Failing Test Cases**:
   - Check error messages
   - Review stack traces
   - Identify which assertions failed

3. **Fix Code Issues**:
   - Update implementation to match expected behavior
   - Fix logic errors
   - Update mocks if needed

4. **Rerun Tests**:
   ```bash
   npm test
   ```

5. **Verify All Pass**:
   - Ensure all tests pass
   - Check coverage reports
   - Review any warnings

---

## Next Steps

**Immediate** (Manual Testing):
1. Deploy backend changes to AWS
2. Test all three features manually
3. Verify no regressions in existing functionality

**Future** (Implement Unit Tests):
1. Set up Jest for backend
2. Set up Vitest for frontend
3. Write unit tests for iteration 2 features
4. Achieve 80%+ test coverage
5. Add tests to CI/CD pipeline

---

## Test Execution Checklist

- [ ] Backend builds successfully
- [ ] Frontend builds successfully
- [ ] Manual testing of AI rate limiting completed
- [ ] Manual testing of card splitting completed
- [ ] Manual testing of duration tracking completed
- [ ] No regressions in existing features
- [ ] All critical paths tested
- [ ] Ready for integration testing
