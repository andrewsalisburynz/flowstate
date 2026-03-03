# Code Generation Plan - Iteration 2: AI Enhancements

## Unit Context

**Unit Name**: AI Enhancements (Rate Limiting + Card Splitting + Duration Tracking)

**Stories Implemented**: 
- FR-1: AI Rate Limiting with Exponential Backoff
- FR-2: AI Request Status Indicator
- FR-3: AI Card Splitting Detection
- FR-4: AI Card Splitting User Approval Workflow
- FR-5: Bottleneck Analysis Duration-Based Alerts

**Dependencies**:
- Existing: AWS Bedrock (Haiku 4.5), DynamoDB, Lambda, API Gateway
- No new external dependencies required

**Service Boundaries**:
- Backend: AI Task Handler, Bedrock Service, Cards Handler, Bottleneck Handler
- Frontend: App component with new UI elements
- Data: Card model extension

**Code Location**:
- Application Code: Workspace root (`backend/`, `frontend/`)
- Documentation: `aidlc-docs/construction/iteration-2/code/`

---

## Code Generation Steps

### Phase 1: Backend - Bedrock Service Enhancements

#### Step 1: Add Retry Logic Wrapper to Bedrock Service
- [x] **File**: `backend/src/services/bedrock.ts`
- [x] **Action**: Modify existing file
- [x] **Changes**:
  - Add `sleep(ms: number)` utility function
  - Add `isThrottlingError(error: any)` helper function
  - Add `invokeBedrockWithRetry(modelId, body, maxRetries)` wrapper function
  - Implement exponential backoff: 1s, 2s, 4s, 8s delays
  - Extract retry-after from Bedrock error responses
  - Return error with retry-after info after all retries exhausted

#### Step 2: Add Card Split Suggestion Method to Bedrock Service
- [x] **File**: `backend/src/services/bedrock.ts`
- [x] **Action**: Modify existing file
- [x] **Changes**:
  - Add `suggestCardSplit(card: AICardSuggestion)` method
  - Create prompt asking Claude to split large card into 2-4 smaller cards
  - Use `invokeBedrockWithRetry` for resilience
  - Parse response into array of smaller cards
  - Return `CardSplitSuggestion` object

#### Step 3: Update Existing Bedrock Methods to Use Retry Logic
- [x] **File**: `backend/src/services/bedrock.ts`
- [x] **Action**: Modify existing file
- [x] **Changes**:
  - Update `invokeClaudeForTask` to use `invokeBedrockWithRetry`
  - Update `analyzeBottlenecks` to use `invokeBedrockWithRetry`
  - Remove direct `client.send()` calls, use wrapper instead

---

### Phase 2: Backend - Type Definitions

#### Step 4: Add New TypeScript Interfaces
- [x] **File**: `backend/src/types/index.ts`
- [x] **Action**: Modify existing file
- [x] **Changes**:
  - Add `AICardSuggestion` interface (if not exists)
  - Add `CardSplitSuggestion` interface
  - Add `columnEnteredAt?: string` to Card interface
  - Export all new types

---

### Phase 3: Backend - AI Task Handler Enhancements

#### Step 5: Implement Split Detection in AI Task Handler
- [x] **File**: `backend/src/handlers/ai-task.ts`
- [x] **Action**: Modify existing file
- [x] **Changes**:
  - After `invokeClaudeForTask`, check if `storyPoints > 8`
  - If yes, call `suggestCardSplit(suggestion)`
  - Return split suggestion to frontend (don't create cards yet)
  - Return HTTP 200 with `{ type: 'split_suggestion', original, splitCards }`
  - If no split needed, create card as before

#### Step 6: Enhanced Error Handling with Retry Info
- [x] **File**: `backend/src/handlers/ai-task.ts`
- [x] **Action**: Modify existing file
- [x] **Changes**:
  - Catch throttling errors from Bedrock service
  - Extract `retryAfter` from error
  - Return HTTP 429 with structured error: `{ error, retryAfter, message }`
  - Keep existing error handling for other error types

---

### Phase 4: Backend - Cards Handler Duration Tracking

#### Step 7: Add Column Entry Timestamp Tracking
- [x] **File**: `backend/src/handlers/cards.ts`
- [x] **Action**: Modify existing file
- [x] **Changes**:
  - In PUT handler, detect if `column` field changed
  - Compare `updates.column` with existing card's column
  - If column changed, set `columnEnteredAt` to `new Date().toISOString()`
  - If column unchanged, don't modify `columnEnteredAt`
  - Ensure `columnEnteredAt` is included in update

---

### Phase 5: Backend - Bottleneck Handler Duration Alerts

#### Step 8: Add Duration-Based Alert Logic
- [x] **File**: `backend/src/handlers/ai-bottleneck.ts`
- [x] **Action**: Modify existing file
- [x] **Changes**:
  - For each card, check if `columnEnteredAt` exists
  - If exists, calculate `duration = Date.now() - new Date(columnEnteredAt).getTime()`
  - Convert duration to days: `durationDays = duration / (1000 * 60 * 60 * 24)`
  - If `durationDays > 14`, create high severity alert
  - If `durationDays > 7`, create medium severity alert
  - Add duration alerts to existing bottleneck analysis results
  - Include card ID, column, duration in days in alert

---

### Phase 6: Frontend - AI Request Status Management

#### Step 9: Add AI Request Status State
- [x] **File**: `frontend/src/App.tsx`
- [x] **Action**: Modify existing file
- [x] **Changes**:
  - Add `aiRequestStatus` state: 'ready' | 'processing' | 'retrying' | 'rate-limited'
  - Add `retryCountdown` state: number (seconds remaining)
  - Add `retryTimer` ref for countdown interval
  - Initialize states in component

#### Step 10: Implement Countdown Timer Logic
- [x] **File**: `frontend/src/App.tsx`
- [x] **Action**: Modify existing file
- [x] **Changes**:
  - Add `useEffect` to manage countdown timer
  - When `retryCountdown > 0`, decrement every second
  - When `retryCountdown` reaches 0, set status to 'ready'
  - Clear interval on unmount

---

### Phase 7: Frontend - AI Request Status UI

#### Step 11: Add Status Indicator Component
- [x] **File**: `frontend/src/App.tsx`
- [x] **Action**: Modify existing file
- [x] **Changes**:
  - Add status indicator near "Create with AI" button
  - Show different messages based on `aiRequestStatus`:
    - 'ready': "✓ Ready" (green)
    - 'processing': "⏳ Processing..." (blue)
    - 'retrying': "🔄 Retrying..." (yellow)
    - 'rate-limited': "⏱️ Rate Limited - Wait {countdown}s" (red)
  - Style with color-coded backgrounds

#### Step 12: Update AI Button State
- [x] **File**: `frontend/src/App.tsx`
- [x] **Action**: Modify existing file
- [x] **Changes**:
  - Disable "Generate Card" button when `aiRequestStatus === 'rate-limited'`
  - Show loading spinner when `aiRequestStatus === 'processing'`
  - Update button text based on status

---

### Phase 8: Frontend - Enhanced AI Request Handling

#### Step 13: Update createAICard Function
- [x] **File**: `frontend/src/App.tsx`
- [x] **Action**: Modify existing file
- [x] **Changes**:
  - Set `aiRequestStatus` to 'processing' at start
  - Handle HTTP 429 responses (rate limited)
  - Extract `retryAfter` from error response
  - Set `retryCountdown` and `aiRequestStatus` to 'rate-limited'
  - Handle split suggestion responses (type: 'split_suggestion')
  - If split suggested, show split preview modal
  - If no split, create card as before
  - Set status back to 'ready' on success

---

### Phase 9: Frontend - Card Split Preview Modal

#### Step 14: Add Split Preview State
- [x] **File**: `frontend/src/App.tsx`
- [x] **Action**: Modify existing file
- [x] **Changes**:
  - Add `showSplitPreview` state: boolean
  - Add `splitSuggestion` state: CardSplitSuggestion | null
  - Add functions: `handleApproveSplit()`, `handleRejectSplit()`

#### Step 15: Implement Split Approval Logic
- [x] **File**: `frontend/src/App.tsx`
- [x] **Action**: Modify existing file
- [x] **Changes**:
  - `handleApproveSplit()`: Loop through split cards, POST each to `/cards`
  - `handleRejectSplit()`: POST original card to `/cards`
  - Close modal after approval/rejection
  - Show success/error feedback

#### Step 16: Add Split Preview Modal UI
- [x] **File**: `frontend/src/App.tsx`
- [x] **Action**: Modify existing file
- [x] **Changes**:
  - Add modal component for split preview
  - Show original card with "Too Large" badge
  - Show split cards (2-4) with details
  - Display story points comparison (original vs. sum of splits)
  - Add "Create Split Cards" button (calls `handleApproveSplit`)
  - Add "Create Original Anyway" button (calls `handleRejectSplit`)
  - Style with clear visual hierarchy

---

### Phase 10: Frontend - Styling

#### Step 17: Add Status Indicator Styles
- [x] **File**: `frontend/src/App.css`
- [x] **Action**: Modify existing file
- [x] **Changes**:
  - Add `.ai-status-indicator` class
  - Add status-specific classes: `.status-ready`, `.status-processing`, `.status-retrying`, `.status-rate-limited`
  - Color-code: green (ready), blue (processing), yellow (retrying), red (rate-limited)
  - Add countdown timer styling

#### Step 18: Add Split Preview Modal Styles
- [x] **File**: `frontend/src/App.css`
- [x] **Action**: Modify existing file
- [x] **Changes**:
  - Add `.split-preview-modal` class
  - Add `.split-original-card` and `.split-suggested-cards` classes
  - Add `.split-comparison` class for story points comparison
  - Add button styles for approve/reject actions
  - Ensure modal is responsive and accessible

---

### Phase 11: Documentation

#### Step 19: Create Code Summary Document
- [x] **File**: `aidlc-docs/construction/iteration-2/code/code-summary.md`
- [x] **Action**: Create new file
- [x] **Changes**:
  - Document all modified files with change descriptions
  - List new interfaces and types
  - Explain retry logic implementation
  - Describe split detection workflow
  - Document duration tracking approach
  - Include code snippets for key changes

#### Step 20: Update README with New Features
- [x] **File**: `README.md`
- [x] **Action**: Modify existing file
- [x] **Changes**:
  - Add section for iteration 2 features
  - Document AI rate limiting behavior
  - Explain card splitting feature
  - Describe duration-based bottleneck alerts
  - Update feature list

---

## Checkpoint Summary

**Total Steps**: 20
**Files Modified**: 7 (backend: 5, frontend: 2)
**Files Created**: 1 (documentation)
**New Interfaces**: 2 (CardSplitSuggestion, AICardSuggestion)
**Estimated Time**: 2.5-3.5 hours

---

## Story Traceability

- **FR-1 (Rate Limiting)**: Steps 1, 3, 6, 9, 10, 11, 12, 13, 17
- **FR-2 (Status Indicator)**: Steps 9, 10, 11, 12, 17
- **FR-3 (Split Detection)**: Steps 2, 5
- **FR-4 (Split Approval)**: Steps 14, 15, 16, 18
- **FR-5 (Duration Tracking)**: Steps 4, 7, 8

---

## Dependencies

**Step Dependencies**:
- Steps 1-3 must complete before Step 5 (AI Task Handler needs Bedrock service)
- Step 4 must complete before Steps 5, 7, 8 (type definitions needed)
- Steps 9-10 must complete before Steps 11-13 (state management before UI)
- Steps 14-15 must complete before Step 16 (logic before UI)

**No Blocking Dependencies**: All backend and frontend work can proceed in parallel after Step 4.

---

## Success Criteria

Code generation is complete when:
- [x] All 20 steps marked [x]
- [x] All 5 functional requirements implemented
- [x] TypeScript compiles without errors
- [x] No duplicate files created (brownfield rule)
- [x] All modified files use existing structure
- [x] Documentation updated
- [x] Ready for Build and Test phase
