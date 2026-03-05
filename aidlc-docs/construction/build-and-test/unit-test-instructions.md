# Unit Test Execution - Card Editing Feature

## Overview

Unit tests verify individual components and functions work correctly in isolation.

---

## Frontend Unit Tests

### Test Files to Create

1. **frontend/src/components/EditCardModal.test.tsx**
   - Modal rendering tests
   - Form validation tests
   - Event handler tests
   - State management tests

### Run Frontend Unit Tests

```bash
cd frontend
npm test
```

**Expected Output**:
```
 PASS  src/components/EditCardModal.test.tsx
  EditCardModal
    ✓ renders when isOpen is true (XXms)
    ✓ does not render when isOpen is false (XXms)
    ✓ populates form fields with card data (XXms)
    ✓ displays validation error for empty title (XXms)
    ✓ displays validation error for title > 60 chars (XXms)
    ✓ disables save button during save (XXms)
    ✓ calls onClose when cancel button clicked (XXms)
    ✓ calls onClose when backdrop clicked (XXms)
    ✓ updates character counter as user types (XXms)
    ✓ displays API error in modal (XXms)

Test Suites: 1 passed, 1 total
Tests:       10 passed, 10 total
Time:        X.XXXs
```

### Test Coverage

**Target Coverage**: 80%+ for new components

**Check Coverage**:
```bash
cd frontend
npm test -- --coverage
```

**Expected Coverage**:
- EditCardModal.tsx: 80%+ lines covered
- App.tsx (edit handlers): 80%+ lines covered

---

## Backend Unit Tests

### Test Files to Create

1. **backend/src/handlers/cards.test.ts**
   - PUT endpoint validation tests
   - Success response tests
   - Error response tests

### Run Backend Unit Tests

```bash
cd backend
npm test
```

**Expected Output**:
```
 PASS  src/handlers/cards.test.ts
  PUT /cards/{id}
    ✓ updates card with valid data (XXms)
    ✓ returns 400 for empty title (XXms)
    ✓ returns 400 for title > 60 chars (XXms)
    ✓ returns 400 for invalid story points (XXms)
    ✓ returns 400 for invalid priority (XXms)
    ✓ returns 404 for non-existent card (XXms)
    ✓ updates updatedAt timestamp (XXms)
    ✓ broadcasts card_updated event (XXms)

Test Suites: 1 passed, 1 total
Tests:       8 passed, 8 total
Time:        X.XXXs
```

### Test Coverage

**Target Coverage**: 80%+ for modified handlers

**Check Coverage**:
```bash
cd backend
npm test -- --coverage
```

**Expected Coverage**:
- cards.ts (PUT endpoint): 80%+ lines covered
- Validation logic: 100% lines covered

---

## Manual Test Scenarios (Until Automated Tests Created)

### Frontend Manual Tests

#### Test 1: Modal Opens on Double-Click
1. Open application in browser
2. Double-click any card
3. **Expected**: Edit modal opens with card data populated

#### Test 2: Title Validation
1. Open edit modal
2. Clear title field
3. Click Save
4. **Expected**: "Title is required" error displayed
5. Enter title with 61+ characters
6. Click Save
7. **Expected**: "Title must be 60 characters or less" error displayed

#### Test 3: Character Counter
1. Open edit modal
2. Type in title field
3. **Expected**: Character counter updates (e.g., "45/60")
4. Type beyond 60 characters
5. **Expected**: Counter turns red

#### Test 4: Story Points Validation
1. Open edit modal
2. Select empty story points
3. Click Save
4. **Expected**: "Story points must be selected" error displayed

#### Test 5: Priority Validation
1. Open edit modal
2. Select empty priority
3. Click Save
4. **Expected**: "Priority must be selected" error displayed

#### Test 6: Successful Save
1. Open edit modal
2. Modify title, description, story points, priority
3. Click Save
4. **Expected**: Modal closes, card updates on board, success toast appears

#### Test 7: Cancel Button
1. Open edit modal
2. Modify fields
3. Click Cancel
4. **Expected**: Modal closes, no changes saved

#### Test 8: Click Outside to Cancel
1. Open edit modal
2. Modify fields
3. Click modal backdrop (outside modal)
4. **Expected**: Modal closes, no changes saved

#### Test 9: Escape Key to Cancel
1. Open edit modal
2. Modify fields
3. Press Escape key
4. **Expected**: Modal closes, no changes saved

#### Test 10: Loading State
1. Open edit modal
2. Modify fields
3. Click Save
4. **Expected**: Save button shows "Saving..." and is disabled
5. After save completes: Modal closes

### Backend Manual Tests

#### Test 1: Valid Update
```bash
curl -X PUT http://localhost:3000/cards/{id} \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Updated Title",
    "description": "Updated description",
    "storyPoints": 5,
    "priority": "high",
    "acceptanceCriteria": ["Criterion 1", "Criterion 2"]
  }'
```
**Expected**: 200 OK with updated card data

#### Test 2: Empty Title
```bash
curl -X PUT http://localhost:3000/cards/{id} \
  -H "Content-Type: application/json" \
  -d '{
    "title": "",
    "storyPoints": 5,
    "priority": "high"
  }'
```
**Expected**: 400 Bad Request with "Title is required" error

#### Test 3: Title Too Long
```bash
curl -X PUT http://localhost:3000/cards/{id} \
  -H "Content-Type: application/json" \
  -d '{
    "title": "This is a very long title that exceeds sixty characters limit",
    "storyPoints": 5,
    "priority": "high"
  }'
```
**Expected**: 400 Bad Request with "Title must be 60 characters or less" error

#### Test 4: Invalid Story Points
```bash
curl -X PUT http://localhost:3000/cards/{id} \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Valid Title",
    "storyPoints": 7,
    "priority": "high"
  }'
```
**Expected**: 400 Bad Request with "Story points must be 1, 2, 3, 5, 8, or 13" error

#### Test 5: Invalid Priority
```bash
curl -X PUT http://localhost:3000/cards/{id} \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Valid Title",
    "storyPoints": 5,
    "priority": "urgent"
  }'
```
**Expected**: 400 Bad Request with "Priority must be low, medium, or high" error

---

## Fixing Failing Tests

### If Frontend Tests Fail

1. **Check Error Message**: Read test output carefully
2. **Verify Component Logic**: Ensure EditCardModal logic matches test expectations
3. **Check Mock Data**: Verify test mocks match actual data structures
4. **Update Tests**: If requirements changed, update test expectations
5. **Rerun Tests**: `npm test` after fixes

### If Backend Tests Fail

1. **Check Error Message**: Read test output carefully
2. **Verify Validation Logic**: Ensure cards.ts validation matches test expectations
3. **Check Mock Services**: Verify DynamoDB and WebSocket mocks work correctly
4. **Update Tests**: If requirements changed, update test expectations
5. **Rerun Tests**: `npm test` after fixes

---

## Test Execution Checklist

- [ ] Frontend unit tests created
- [ ] Backend unit tests created
- [ ] All frontend tests pass
- [ ] All backend tests pass
- [ ] Test coverage meets 80% target
- [ ] Manual test scenarios executed
- [ ] All manual tests pass
- [ ] No console errors during testing
- [ ] No memory leaks detected

---

## Next Steps

After all unit tests pass:
1. Proceed to integration testing (see integration-test-instructions.md)
2. Perform manual end-to-end testing
3. Deploy to test environment
4. Conduct user acceptance testing

---

## Notes

- Unit tests should be created as part of future development
- Manual testing is sufficient for initial deployment
- Automated tests recommended before production release
- Test coverage should be monitored and improved over time
