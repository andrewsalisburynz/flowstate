# Integration Test Instructions - Card Editing Feature

## Purpose

Test the complete card editing workflow from frontend to backend to database, ensuring all components work together correctly.

---

## Test Environment Setup

### 1. Start Local Development Environment

```bash
# Terminal 1: Start backend (if running locally)
cd backend
npm run dev

# Terminal 2: Start frontend
cd frontend
npm run dev
```

**OR**

### Deploy to AWS Test Environment

```bash
cd infrastructure
cdk deploy --all
```

### 2. Configure Environment Variables

**Frontend (.env.local)**:
```bash
VITE_API_URL=https://your-api-gateway-url.execute-api.ap-southeast-2.amazonaws.com/prod
VITE_WS_URL=wss://your-websocket-url.execute-api.ap-southeast-2.amazonaws.com/prod
```

### 3. Verify Services are Running

- Frontend: http://localhost:5173
- Backend API: Check API Gateway URL
- WebSocket: Check WebSocket URL
- DynamoDB: Verify tables exist (CardsTable, ConnectionsTable)

---

## Integration Test Scenarios

### Scenario 1: Complete Edit Workflow (Frontend → Backend → Database)

**Description**: Test the entire card editing flow from UI to database

**Setup**:
1. Open application in browser
2. Ensure at least one card exists on the board
3. Open browser DevTools (Network tab)

**Test Steps**:
1. Double-click a card
2. Verify edit modal opens with card data
3. Modify title to "Integration Test Card"
4. Modify description to "Testing complete workflow"
5. Change story points to 8
6. Change priority to "high"
7. Add acceptance criteria: "Test passes"
8. Click Save button

**Expected Results**:
- Modal shows "Saving..." state
- Network tab shows PUT request to /cards/{id}
- PUT request returns 200 OK
- Response contains updated card data
- Modal closes
- Card on board updates with new data
- Success toast appears: "Card updated successfully!"

**Verify in Database**:
```bash
# Check DynamoDB (if using AWS CLI)
aws dynamodb get-item \
  --table-name CardsTable \
  --key '{"id": {"S": "card-id-here"}}'
```

**Expected**: Card in database matches updated values

**Cleanup**: Card remains updated (no cleanup needed)

---

### Scenario 2: Real-Time Updates (WebSocket Broadcasting)

**Description**: Test that card updates are broadcast to all connected clients

**Setup**:
1. Open application in two browser tabs (Tab A and Tab B)
2. Ensure both tabs show the same board
3. Ensure at least one card exists

**Test Steps**:
1. In Tab A: Double-click a card
2. In Tab A: Change title to "Real-Time Test"
3. In Tab A: Click Save
4. Observe Tab B (do not interact with it)

**Expected Results**:
- Tab A: Modal closes, card updates
- Tab B: Card automatically updates to show "Real-Time Test" (without page refresh)
- Both tabs show identical card data

**Verify WebSocket**:
- Open DevTools → Network → WS tab
- Should see WebSocket connection active
- Should see "card_updated" message after save

**Cleanup**: Card remains updated

---

### Scenario 3: Validation Error Handling (Frontend → Backend)

**Description**: Test that validation errors are properly handled

**Setup**:
1. Open application in browser
2. Double-click any card

**Test Steps**:
1. Clear the title field (make it empty)
2. Click Save
3. Observe error message
4. Enter a title with 61+ characters
5. Click Save
6. Observe error message

**Expected Results**:
- Empty title: "Title is required" error displayed inline
- Long title: "Title must be 60 characters or less" error displayed
- Modal remains open
- Save button re-enabled after error
- No API call made (check Network tab)

**Cleanup**: Click Cancel to close modal

---

### Scenario 4: Concurrent Edits (Last Save Wins)

**Description**: Test that concurrent edits are handled correctly

**Setup**:
1. Open application in two browser tabs (Tab A and Tab B)
2. Ensure both tabs show the same board
3. Identify a specific card to edit

**Test Steps**:
1. In Tab A: Double-click the card
2. In Tab B: Double-click the same card
3. In Tab A: Change title to "Version A"
4. In Tab B: Change title to "Version B"
5. In Tab A: Click Save (wait for completion)
6. In Tab B: Click Save (wait for completion)
7. Observe both tabs

**Expected Results**:
- Tab A saves successfully, sees "Version A"
- Tab B receives WebSocket update, sees "Version A" on board (but modal still shows "Version B")
- Tab B saves successfully, overwrites with "Version B"
- Tab A receives WebSocket update, sees "Version B"
- Final state: Both tabs show "Version B" (last save wins)

**Cleanup**: Card remains with "Version B"

---

### Scenario 5: Cancel Workflow (No Backend Call)

**Description**: Test that canceling edit doesn't make API calls

**Setup**:
1. Open application in browser
2. Open DevTools → Network tab
3. Double-click any card

**Test Steps**:
1. Modify title, description, and other fields
2. Click Cancel button

**Expected Results**:
- Modal closes immediately
- No PUT request in Network tab
- Card on board remains unchanged
- No WebSocket broadcast

**Alternative Test**:
1. Double-click card
2. Modify fields
3. Click outside modal (on backdrop)
4. Verify same results as above

**Cleanup**: No cleanup needed

---

### Scenario 6: API Error Handling

**Description**: Test error handling when API call fails

**Setup**:
1. Stop backend service (or use invalid API URL)
2. Open application in browser
3. Double-click any card

**Test Steps**:
1. Modify title to "Error Test"
2. Click Save
3. Observe error handling

**Expected Results**:
- Save button shows "Saving..."
- API call fails (Network tab shows error)
- Error message displayed in modal: "Failed to save card: [error details]"
- Modal remains open
- Save button re-enabled
- User can retry or cancel

**Cleanup**: 
1. Restart backend service
2. Click Cancel to close modal

---

### Scenario 7: AI-Generated Card Editing

**Description**: Test that AI-generated cards can be edited

**Setup**:
1. Create an AI-generated card (use "Create with AI" button)
2. Verify card has AI badge (✨ AI)

**Test Steps**:
1. Double-click the AI-generated card
2. Verify modal opens normally (no warning)
3. Modify title to "Edited AI Card"
4. Click Save

**Expected Results**:
- Modal opens without restrictions
- Save succeeds
- Card updates on board
- AI badge (✨ AI) remains visible
- aiGenerated flag remains true in database

**Cleanup**: Card remains updated

---

### Scenario 8: Field-Specific Validation

**Description**: Test validation for each field type

**Setup**:
1. Open application in browser
2. Double-click any card

**Test Steps**:
1. **Story Points**: Select empty value, click Save
   - Expected: "Story points must be selected" error
2. **Priority**: Select empty value, click Save
   - Expected: "Priority must be selected" error
3. **Description**: Clear description, click Save
   - Expected: Save succeeds (description is optional)
4. **Acceptance Criteria**: Clear acceptance criteria, click Save
   - Expected: Save succeeds (acceptance criteria is optional)

**Cleanup**: Click Cancel to close modal

---

## Integration Test Execution Checklist

- [ ] Local/test environment running
- [ ] Frontend accessible
- [ ] Backend API accessible
- [ ] WebSocket connection working
- [ ] DynamoDB tables accessible
- [ ] Scenario 1: Complete edit workflow passes
- [ ] Scenario 2: Real-time updates pass
- [ ] Scenario 3: Validation errors pass
- [ ] Scenario 4: Concurrent edits pass
- [ ] Scenario 5: Cancel workflow passes
- [ ] Scenario 6: API error handling passes
- [ ] Scenario 7: AI-generated card editing passes
- [ ] Scenario 8: Field-specific validation passes
- [ ] No console errors during testing
- [ ] No memory leaks detected

---

## Troubleshooting

### WebSocket Not Connecting

**Symptoms**: Real-time updates don't work

**Solution**:
1. Check WebSocket URL in .env.local
2. Verify WebSocket API Gateway is deployed
3. Check browser console for WebSocket errors
4. Verify Connections table exists in DynamoDB

### API Calls Failing

**Symptoms**: Save button shows error

**Solution**:
1. Check API URL in .env.local
2. Verify API Gateway is deployed
3. Check CORS configuration
4. Verify Lambda functions are deployed
5. Check CloudWatch logs for errors

### Cards Not Updating

**Symptoms**: Save succeeds but card doesn't update

**Solution**:
1. Check browser console for errors
2. Verify WebSocket connection is active
3. Check that card ID matches
4. Verify DynamoDB update succeeded
5. Check Lambda function logs

---

## Next Steps

After all integration tests pass:
1. Perform manual end-to-end testing
2. Test on different browsers (Chrome, Firefox, Safari)
3. Test on different devices (desktop, tablet)
4. Conduct user acceptance testing
5. Deploy to production environment

---

## Notes

- Integration tests verify the complete system works together
- Real-time updates are critical for multi-user scenarios
- Concurrent edit testing ensures data consistency
- Error handling ensures good user experience
- All scenarios should be tested before production deployment
