# Integration Test Instructions - Iteration 2

## Purpose

Test interactions between backend services, AWS infrastructure, and frontend to ensure iteration 2 features work end-to-end.

---

## Test Environment Setup

### 1. Deploy Backend to AWS

```bash
cd infrastructure
npm run build
cdk deploy --all
```

**Verify Deployment**:
- API Gateway REST endpoint is accessible
- API Gateway WebSocket endpoint is accessible
- Lambda functions are deployed
- DynamoDB tables exist
- EventBridge rule is active

### 2. Start Frontend Development Server

```bash
cd frontend
npm run dev
```

**Verify Configuration**:
- `.env.local` has correct API URLs
- Frontend loads at http://localhost:5173
- No console errors on page load

### 3. Verify AWS Bedrock Access

```bash
aws bedrock list-foundation-models --region ap-southeast-2
```

**Expected**: Claude 3.5 Haiku model is available and accessible

---

## Integration Test Scenarios

### Scenario 1: AI Rate Limiting with Retry Logic

**Description**: Test that backend retry logic handles Bedrock throttling gracefully

**Setup**:
1. Frontend running locally
2. Backend deployed to AWS
3. Bedrock enabled

**Test Steps**:
1. Open FlowState in browser
2. Click "Create with AI" button
3. Enter task description: "Create a user authentication system"
4. Click "Generate Card"
5. Observe status indicator changes:
   - Should show "⏳ Processing..."
   - If throttled, should show "🔄 Retrying..."
   - Eventually shows "✓ Ready" or "⏱️ Rate Limited"

**Expected Results**:
- Status indicator updates in real-time
- Backend retries up to 3 times with exponential backoff
- If all retries fail, frontend shows countdown timer
- Card is created if any retry succeeds
- No unhandled errors in console

**Verification**:
```bash
# Check Lambda logs for retry attempts
aws logs tail /aws/lambda/FlowStateStack-AITaskHandler --follow
# Look for: "Retry attempt X of 3"
```

**Cleanup**: None required

---

### Scenario 2: Card Splitting Detection and Approval

**Description**: Test that large cards trigger split suggestion and user can approve/reject

**Setup**:
1. Frontend running locally
2. Backend deployed to AWS
3. Bedrock enabled

**Test Steps**:
1. Open FlowState in browser
2. Click "Create with AI" button
3. Enter large task description:
   ```
   Create a complete e-commerce platform with user authentication, product catalog, 
   shopping cart, payment processing, order management, inventory tracking, 
   admin dashboard, email notifications, and analytics reporting
   ```
4. Click "Generate Card"
5. Wait for AI processing
6. Observe split preview modal appears

**Expected Results**:
- AI detects card is too large (>8 story points)
- Split preview modal displays:
  - Original card with story points
  - 2-4 suggested split cards
  - Story points comparison
  - Two action buttons
- Clicking "Create Split Cards" creates all split cards
- Clicking "Create Original Anyway" creates original card
- Cards appear on board immediately
- Modal closes after action

**Verification**:
```bash
# Check Lambda logs for split detection
aws logs tail /aws/lambda/FlowStateStack-AITaskHandler --follow
# Look for: "Card too large, suggesting split"

# Check DynamoDB for created cards
aws dynamodb scan --table-name FlowStateStack-CardsTable
```

**Cleanup**: Delete test cards from board

---

### Scenario 3: Duration Tracking and Bottleneck Alerts

**Description**: Test that cards track duration in columns and generate alerts

**Setup**:
1. Frontend running locally
2. Backend deployed to AWS
3. At least one card on the board

**Test Steps**:
1. Create a test card manually
2. Move card to "In Progress" column
3. Wait for card to be saved (WebSocket update)
4. Check DynamoDB for `columnEnteredAt` timestamp:
   ```bash
   aws dynamodb scan --table-name FlowStateStack-CardsTable
   ```
5. Manually update `columnEnteredAt` to 8 days ago:
   ```bash
   aws dynamodb update-item \
     --table-name FlowStateStack-CardsTable \
     --key '{"id":{"S":"<card-id>"}}' \
     --update-expression "SET columnEnteredAt = :timestamp" \
     --expression-attribute-values '{":timestamp":{"S":"2026-02-24T10:00:00.000Z"}}'
   ```
6. Wait for next bottleneck analysis (runs every 5 minutes)
7. Observe alerts panel on frontend

**Expected Results**:
- `columnEnteredAt` is set when card moves to new column
- `columnEnteredAt` is preserved when card is updated without column change
- Bottleneck analysis detects cards >7 days (medium severity)
- Bottleneck analysis detects cards >14 days (high severity)
- Alerts appear in side panel via WebSocket
- Alert includes card title, column, duration in days, and recommendations

**Verification**:
```bash
# Check Lambda logs for bottleneck analysis
aws logs tail /aws/lambda/FlowStateStack-AIBottleneckHandler --follow
# Look for: "Duration alert: Card X in column Y for Z days"

# Check WebSocket messages
# Open browser DevTools → Network → WS → Messages
# Look for: bottleneck_alerts event with duration alerts
```

**Cleanup**: Delete test card or reset `columnEnteredAt`

---

### Scenario 4: End-to-End AI Workflow

**Description**: Test complete AI workflow from creation to split to duration tracking

**Setup**:
1. Frontend running locally
2. Backend deployed to AWS
3. Bedrock enabled

**Test Steps**:
1. Create AI card with large description (triggers split)
2. Approve split to create multiple cards
3. Move one split card to "In Progress"
4. Verify `columnEnteredAt` is set
5. Move card to "Done"
6. Verify `columnEnteredAt` is updated
7. Create another AI card (test rate limiting if needed)

**Expected Results**:
- All iteration 2 features work together seamlessly
- No errors in console or Lambda logs
- WebSocket updates work correctly
- State is persisted in DynamoDB
- UI updates reflect backend state

**Verification**:
- Check all cards exist in DynamoDB
- Verify timestamps are correct
- Confirm WebSocket events were received
- Review Lambda logs for any errors

**Cleanup**: Delete test cards

---

### Scenario 5: WebSocket Real-Time Updates

**Description**: Test that WebSocket delivers real-time updates for all events

**Setup**:
1. Open FlowState in two browser windows
2. Backend deployed to AWS

**Test Steps**:
1. In Window 1: Create a card
2. In Window 2: Observe card appears immediately
3. In Window 1: Move card to "In Progress"
4. In Window 2: Observe card moves immediately
5. In Window 1: Delete card
6. In Window 2: Observe card disappears immediately
7. Wait for bottleneck analysis (5 minutes)
8. In both windows: Observe alerts appear simultaneously

**Expected Results**:
- All card operations sync in real-time
- Bottleneck alerts appear in both windows
- No delays or missed updates
- WebSocket connection remains stable

**Verification**:
```bash
# Check WebSocket connections in DynamoDB
aws dynamodb scan --table-name FlowStateStack-ConnectionsTable

# Check Lambda logs for WebSocket events
aws logs tail /aws/lambda/FlowStateStack-WebSocketHandler --follow
```

**Cleanup**: Close extra browser windows

---

## Integration Test Checklist

- [ ] Backend deployed to AWS successfully
- [ ] Frontend connects to backend APIs
- [ ] AI rate limiting with retry works end-to-end
- [ ] Card splitting detection and approval works
- [ ] Duration tracking persists correctly
- [ ] Bottleneck alerts include duration alerts
- [ ] WebSocket real-time updates work
- [ ] No errors in browser console
- [ ] No errors in Lambda logs
- [ ] All features work together seamlessly

---

## Troubleshooting

### WebSocket Connection Fails

**Symptoms**: No real-time updates, alerts don't appear

**Solution**:
1. Check WebSocket URL in `.env.local`
2. Verify WebSocket API is deployed
3. Check browser console for connection errors
4. Review Lambda logs for WebSocket handler

### AI Task Creation Fails

**Symptoms**: Error when generating AI cards

**Solution**:
1. Verify Bedrock is enabled in AWS account
2. Check Lambda has Bedrock permissions
3. Review Lambda logs for specific error
4. Verify model ID is correct (claude-3-5-haiku-20241022-v1:0)

### Duration Alerts Don't Appear

**Symptoms**: No alerts for old cards

**Solution**:
1. Verify EventBridge rule is enabled
2. Check `columnEnteredAt` exists in DynamoDB
3. Wait for next scheduled run (every 5 minutes)
4. Review bottleneck handler Lambda logs

### Split Detection Doesn't Trigger

**Symptoms**: Large cards don't show split preview

**Solution**:
1. Verify card has >8 story points
2. Check AI task handler logs for split detection
3. Verify Bedrock response includes story points
4. Test with different task descriptions

---

## Performance Validation

### Response Time Targets
- Card creation: < 2 seconds
- AI card generation: < 5 seconds (without retries)
- Card movement: < 500ms
- WebSocket message delivery: < 100ms

### Load Testing (Optional)
```bash
# Test concurrent AI requests
for i in {1..5}; do
  curl -X POST https://your-api-url/prod/ai-task \
    -H "Content-Type: application/json" \
    -d '{"description":"Test task '$i'"}' &
done
wait
```

**Expected**: All requests succeed or gracefully handle rate limiting

---

## Next Steps

After successful integration testing:
1. Document any issues found
2. Fix critical bugs
3. Proceed to performance testing (if needed)
4. Prepare for production deployment
