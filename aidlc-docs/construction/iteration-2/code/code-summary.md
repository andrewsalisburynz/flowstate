# Code Summary - Iteration 2: AI Enhancements

## Overview

This iteration adds three major AI enhancements to FlowState:
1. **AI Rate Limiting with Exponential Backoff** - Retry logic to maximize successful requests
2. **AI Card Splitting Detection** - Automatically detect and suggest splitting large cards
3. **Duration-Based Bottleneck Analysis** - Alert on cards stuck in columns too long

**Timeline**: 3-4 hours
**Completion Date**: 2026-03-04

---

## Files Modified

### Backend (5 files)

#### 1. `backend/src/services/bedrock.ts`
**Changes**: Added retry logic and card splitting functionality

**New Functions**:
```typescript
// Utility to pause execution
function sleep(ms: number): Promise<void>

// Check if error is throttling-related
function isThrottlingError(error: any): boolean

// Retry wrapper with exponential backoff
async function invokeBedrockWithRetry(
  modelId: string, 
  body: any, 
  maxRetries: number = 3
): Promise<any>

// Suggest splitting large cards
async function suggestCardSplit(
  card: AICardSuggestion
): Promise<CardSplitSuggestion>
```

**Key Implementation Details**:
- Exponential backoff delays: 1s, 2s, 4s, 8s
- Max 3 retries before returning error
- Extracts `retryAfter` from Bedrock throttling errors
- Updated `invokeClaudeForTask()` and `analyzeBottlenecks()` to use retry wrapper
- Split suggestion uses Claude to break large cards into 2-4 smaller cards

---

#### 2. `backend/src/types/index.ts`
**Changes**: Added new TypeScript interfaces

**New Interfaces**:
```typescript
interface CardSplitSuggestion {
  originalCard: {
    title: string
    description: string
    storyPoints: number
    priority: string
    acceptanceCriteria: string[]
  }
  reason: string
  splitCards: Array<{
    title: string
    description: string
    storyPoints: number
    priority: string
    acceptanceCriteria: string[]
  }>
}
```

**Modified Interfaces**:
```typescript
interface Card {
  // ... existing fields
  columnEnteredAt?: string  // NEW: Track when card entered current column
}
```

---

#### 3. `backend/src/handlers/ai-task.ts`
**Changes**: Added split detection and enhanced error handling

**Split Detection Logic**:
- After generating card suggestion, check if `storyPoints > 8`
- If yes, call `suggestCardSplit()` from Bedrock service
- Return split suggestion to frontend (don't create cards yet)
- Response format: `{ type: 'split_suggestion', originalCard, splitCards, reason }`

**Enhanced Error Handling**:
- Catch throttling errors from Bedrock service
- Extract `retryAfter` from error object
- Return HTTP 429 with structured error: `{ error, retryAfter, message }`
- Other errors return HTTP 500 as before

---

#### 4. `backend/src/handlers/cards.ts`
**Changes**: Added column entry timestamp tracking

**Implementation**:
- In PUT handler, detect if `column` field changed
- Compare `updates.column` with existing card's column from DynamoDB
- If column changed, set `columnEnteredAt` to `new Date().toISOString()`
- If column unchanged, preserve existing `columnEnteredAt`
- On card creation (POST), set initial `columnEnteredAt`

---

#### 5. `backend/src/handlers/ai-bottleneck.ts`
**Changes**: Added duration-based alert logic

**Duration Alert Logic**:
```typescript
// For each card with columnEnteredAt
const duration = Date.now() - new Date(card.columnEnteredAt).getTime()
const durationDays = duration / (1000 * 60 * 60 * 24)

if (durationDays > 14) {
  // Create HIGH severity alert
} else if (durationDays > 7) {
  // Create MEDIUM severity alert
}
```

**Alert Structure**:
- Severity: 'high' (>14 days) or 'medium' (>7 days)
- Category: 'duration_alert'
- Message: Includes card title, column, and duration in days
- Recommendations: Suggest reviewing card, breaking down, or moving forward

**Integration**:
- Duration alerts are added to existing AI-generated bottleneck alerts
- Combined alerts sent via WebSocket to frontend

---

### Frontend (2 files)

#### 6. `frontend/src/App.tsx`
**Changes**: Added AI request status management, split preview modal, and enhanced UI

**New State Variables**:
```typescript
const [aiRequestStatus, setAiRequestStatus] = 
  useState<'ready' | 'processing' | 'retrying' | 'rate-limited'>('ready')
const [retryCountdown, setRetryCountdown] = useState(0)
const [showSplitPreview, setShowSplitPreview] = useState(false)
const [splitSuggestion, setSplitSuggestion] = 
  useState<CardSplitSuggestion | null>(null)
```

**Countdown Timer**:
```typescript
useEffect(() => {
  if (retryCountdown > 0) {
    const timer = setTimeout(() => {
      setRetryCountdown(retryCountdown - 1)
    }, 1000)
    return () => clearTimeout(timer)
  } else if (retryCountdown === 0 && aiRequestStatus === 'rate-limited') {
    setAiRequestStatus('ready')
  }
}, [retryCountdown, aiRequestStatus])
```

**Enhanced `createAICard()` Function**:
- Set status to 'processing' at start
- Handle HTTP 429 responses (rate limited)
- Extract `retryAfter` and set countdown
- Handle split suggestion responses (type: 'split_suggestion')
- Show split preview modal if split suggested
- Create card normally if no split

**Split Approval Functions**:
```typescript
// Create all split cards
async function handleApproveSplit()

// Create original card anyway
async function handleRejectSplit()
```

**UI Components Added**:
1. **Status Indicator** (in header):
   - Shows current AI request status
   - Color-coded: green (ready), blue (processing), yellow (retrying), red (rate-limited)
   - Displays countdown timer when rate-limited

2. **Split Preview Modal**:
   - Shows original card with "Too Large" indicator
   - Displays 2-4 suggested split cards
   - Shows story points comparison
   - Two action buttons: "Create Split Cards" or "Create Original Anyway"

---

#### 7. `frontend/src/App.css`
**Changes**: Added styles for status indicator and split preview modal

**Status Indicator Styles**:
```css
.ai-status-indicator { /* Base styles */ }
.status-ready { /* Green background */ }
.status-processing { /* Blue background with pulse animation */ }
.status-retrying { /* Yellow background with pulse animation */ }
.status-rate-limited { /* Red background */ }

@keyframes pulse { /* Pulsing animation for processing/retrying */ }
```

**Split Preview Modal Styles**:
```css
.split-preview-modal { /* Larger modal width */ }
.split-reason { /* Warning-style reason display */ }
.split-original-card { /* Original card container */ }
.split-suggested-cards { /* Split cards container */ }
.split-cards-grid { /* Responsive grid layout */ }
.card-preview { /* Card preview styling */ }
.story-points-badge { /* Story points display */ }
.priority-badge { /* Priority display */ }
.split-comparison { /* Story points comparison */ }
```

**Responsive Design**:
- Mobile-friendly grid layout
- Modal scrolling on small screens

---

## New Interfaces and Types

### CardSplitSuggestion
```typescript
interface CardSplitSuggestion {
  originalCard: {
    title: string
    description: string
    storyPoints: number
    priority: string
    acceptanceCriteria: string[]
  }
  reason: string  // Why the card should be split
  splitCards: Array<{
    title: string
    description: string
    storyPoints: number
    priority: string
    acceptanceCriteria: string[]
  }>
}
```

### Card Extension
```typescript
interface Card {
  // ... existing fields
  columnEnteredAt?: string  // ISO timestamp when card entered current column
}
```

---

## Implementation Patterns

### 1. Retry Logic Pattern
```typescript
async function invokeBedrockWithRetry(modelId, body, maxRetries = 3) {
  let lastError
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Attempt API call
      return await client.send(command)
    } catch (error) {
      if (isThrottlingError(error)) {
        if (attempt < maxRetries) {
          // Exponential backoff: 1s, 2s, 4s, 8s
          const delay = Math.pow(2, attempt) * 1000
          await sleep(delay)
          continue
        }
      }
      throw error
    }
  }
}
```

### 2. Split Detection Pattern
```typescript
// In ai-task.ts handler
const suggestion = await invokeClaudeForTask(description)

if (suggestion.storyPoints > 8) {
  const splitSuggestion = await suggestCardSplit(suggestion)
  return {
    statusCode: 200,
    body: JSON.stringify({
      type: 'split_suggestion',
      ...splitSuggestion
    })
  }
}

// Create card normally if not too large
```

### 3. Duration Tracking Pattern
```typescript
// In cards.ts PUT handler
const existingCard = await getCard(cardId)

if (updates.column && updates.column !== existingCard.column) {
  // Column changed - reset timestamp
  updates.columnEnteredAt = new Date().toISOString()
} else {
  // Column unchanged - preserve timestamp
  updates.columnEnteredAt = existingCard.columnEnteredAt
}
```

### 4. Duration Alert Pattern
```typescript
// In ai-bottleneck.ts
const durationAlerts = cards
  .filter(card => card.columnEnteredAt)
  .map(card => {
    const duration = Date.now() - new Date(card.columnEnteredAt).getTime()
    const durationDays = duration / (1000 * 60 * 60 * 24)
    
    if (durationDays > 14) {
      return createHighSeverityAlert(card, durationDays)
    } else if (durationDays > 7) {
      return createMediumSeverityAlert(card, durationDays)
    }
    return null
  })
  .filter(Boolean)

// Combine with AI alerts
const allAlerts = [...aiAlerts, ...durationAlerts]
```

---

## API Changes

### POST /ai-task
**New Response Types**:

1. **Split Suggestion** (HTTP 200):
```json
{
  "type": "split_suggestion",
  "originalCard": {
    "title": "...",
    "description": "...",
    "storyPoints": 13,
    "priority": "high",
    "acceptanceCriteria": ["..."]
  },
  "reason": "This card is too large...",
  "splitCards": [
    {
      "title": "...",
      "description": "...",
      "storyPoints": 5,
      "priority": "high",
      "acceptanceCriteria": ["..."]
    },
    // ... more split cards
  ]
}
```

2. **Rate Limited** (HTTP 429):
```json
{
  "error": "Too many requests",
  "retryAfter": 30,
  "message": "AI service rate limited. Please wait 30 seconds."
}
```

3. **Normal Card Creation** (HTTP 200):
```json
{
  "id": "...",
  "title": "...",
  "description": "...",
  "storyPoints": 5,
  // ... other card fields
}
```

---

## Testing Considerations

### Backend Testing
1. **Retry Logic**:
   - Test exponential backoff delays
   - Verify max retry limit
   - Test retryAfter extraction from errors

2. **Split Detection**:
   - Test threshold (>8 story points)
   - Verify split suggestion format
   - Test with various card sizes

3. **Duration Tracking**:
   - Test timestamp creation on column change
   - Verify timestamp preservation when column unchanged
   - Test duration calculation accuracy

4. **Duration Alerts**:
   - Test 7-day threshold (medium severity)
   - Test 14-day threshold (high severity)
   - Verify alert message format

### Frontend Testing
1. **Status Indicator**:
   - Test all 4 states (ready, processing, retrying, rate-limited)
   - Verify countdown timer accuracy
   - Test button disable when rate-limited

2. **Split Preview Modal**:
   - Test modal display on split suggestion
   - Verify approve split creates all cards
   - Verify reject split creates original card
   - Test modal close behavior

3. **Error Handling**:
   - Test rate limit error display
   - Test countdown timer reset
   - Test status transitions

---

## Success Criteria

✅ **All 20 steps completed**
✅ **All 5 functional requirements implemented**:
- FR-1: AI Rate Limiting with Exponential Backoff
- FR-2: AI Request Status Indicator
- FR-3: AI Card Splitting Detection
- FR-4: AI Card Splitting User Approval Workflow
- FR-5: Bottleneck Analysis Duration-Based Alerts

✅ **TypeScript compiles without errors**
✅ **No duplicate files created**
✅ **All modified files use existing structure**
✅ **Documentation updated**
✅ **Ready for Build and Test phase**

---

## Next Steps

1. **Build and Test**: Execute build instructions and run tests
2. **Manual Testing**: Test all three features end-to-end
3. **Performance Validation**: Verify retry logic reduces rate limiting
4. **User Acceptance**: Confirm features meet requirements

---

## Notes

- Model switched from Claude 3 Sonnet to Haiku 4.5 for better rate limits
- Timeline target: 3-4 hours (achieved)
- Deferred to iteration 3: Team management, card editing, authentication
- All code follows existing patterns and conventions
- No infrastructure changes required
