# Integration Test Instructions - Iteration 3

## Purpose

Test interactions between backend services, database, and frontend to ensure all iteration 3 features work correctly end-to-end.

---

## Prerequisites

### Deployed Infrastructure
- KanbanStorageStack deployed (TeamMembersTable created)
- KanbanApiStack deployed (TeamMembersHandler Lambda created)
- Frontend deployed to S3 + CloudFront

### Environment Setup
- AWS credentials configured
- API URL and WebSocket URL configured in frontend `.env.local`
- Browser with developer tools (Chrome recommended)

---

## Test Scenarios

### Scenario 1: Team Member CRUD Operations

**Description**: Test creating, reading, updating, and deleting team members

**Setup**:
1. Open frontend in browser
2. Navigate to Team tab
3. Open browser DevTools (F12) → Network tab

**Test Steps**:

1. **Create Team Member**:
   - Click "Add Team Member" button
   - Enter name: "Alice Johnson"
   - Click "Save"
   - **Expected**: Team member appears in list, sorted alphabetically
   - **Verify**: Network tab shows `POST /team-members` with 201 status

2. **Create Duplicate Name** (should fail):
   - Click "Add Team Member" button
   - Enter name: "alice johnson" (case-insensitive)
   - Click "Save"
   - **Expected**: Error message "Team member with this name already exists"
   - **Verify**: Network tab shows `POST /team-members` with 409 status

3. **Create Additional Members**:
   - Add "Bob Smith" (success)
   - Add "Carol Davis" (success)
   - **Expected**: List shows 3 members, alphabetically sorted

4. **Edit Team Member**:
   - Click "Edit" on "Bob Smith"
   - Change name to "Robert Smith"
   - Click "Save"
   - **Expected**: Name updates, list re-sorts
   - **Verify**: Network tab shows `PUT /team-members/{id}` with 200 status

5. **Delete Team Member**:
   - Click "Delete" on "Carol Davis"
   - Confirm deletion
   - **Expected**: Member removed from list
   - **Verify**: Network tab shows `DELETE /team-members/{id}` with 204 status

**Cleanup**: Leave Alice Johnson and Robert Smith for next scenarios

---

### Scenario 2: Card Assignment

**Description**: Test assigning team members to cards

**Setup**:
1. Navigate to Board tab
2. Ensure at least 2 team members exist (from Scenario 1)
3. Create a test card if none exist

**Test Steps**:

1. **Assign Single Team Member**:
   - Find a card in "To Do" column
   - Click the "Assigned to" dropdown
   - Select "Alice Johnson"
   - **Expected**: Alice's name appears as badge below dropdown
   - **Expected**: "Assigned just now" duration displays
   - **Verify**: Network tab shows `PUT /cards/{id}` with assignees field

2. **Assign Multiple Team Members**:
   - On same card, hold Ctrl/Cmd and select "Robert Smith"
   - **Expected**: Both Alice and Robert badges display
   - **Expected**: Duration updates to "Assigned just now"

3. **Unassign Team Member**:
   - Deselect "Alice Johnson" from dropdown
   - **Expected**: Only Robert's badge remains
   - **Expected**: Duration still shows (assignedAt persists)

4. **Unassign All**:
   - Deselect "Robert Smith"
   - **Expected**: No badges display
   - **Expected**: Duration text disappears

5. **Verify Assignment Persistence**:
   - Refresh page (F5)
   - **Expected**: Assignments persist after reload

**Cleanup**: Leave some cards assigned for next scenarios

---

### Scenario 3: Assignment Filtering

**Description**: Test filtering cards by assignee

**Setup**:
1. Ensure multiple cards exist with different assignees
2. Navigate to Board tab

**Test Steps**:

1. **Filter by Assignee**:
   - Click "Filter by Assignee" dropdown
   - Select "Alice Johnson"
   - **Expected**: Only cards assigned to Alice display
   - **Expected**: Card counts update per column
   - **Expected**: URL or state reflects filter (optional)

2. **Switch Filter**:
   - Select "Robert Smith" from dropdown
   - **Expected**: Only Robert's cards display
   - **Expected**: Card counts update

3. **Clear Filter**:
   - Select "All" from dropdown
   - **Expected**: All cards display again
   - **Expected**: Original card counts restore

4. **Filter with No Matches**:
   - Create new team member "Charlie Brown" (no assignments)
   - Filter by "Charlie Brown"
   - **Expected**: No cards display (empty columns)
   - **Expected**: Card counts show 0

**Cleanup**: Reset filter to "All"

---

### Scenario 4: Workload-Based Bottleneck Detection

**Description**: Test overload alerts when team member has >8 story points in progress

**Setup**:
1. Create cards with story points totaling >8 for one team member
2. Move cards to "In Progress" column
3. Wait 5 minutes for EventBridge trigger (or manually trigger Lambda)

**Test Steps**:

1. **Create Overload Condition**:
   - Create card "Task A" with 5 story points, assign to Alice, move to "In Progress"
   - Create card "Task B" with 5 story points, assign to Alice, move to "In Progress"
   - **Expected**: Alice has 10 story points in progress (>8 threshold)

2. **Wait for Alert**:
   - Wait up to 5 minutes for bottleneck analysis to run
   - **Expected**: Alert panel opens automatically
   - **Expected**: High severity alert appears:
     - Message: "Team member Alice Johnson is overloaded with 10 story points in progress"
     - Shows affected card IDs
     - Shows current workload (10) and threshold (8)
     - Recommendations displayed

3. **Verify Alert Details**:
   - Check alert shows:
     - Team member name: "Alice Johnson"
     - Current workload: 10 pts
     - Threshold: 8 pts
     - Affected cards: Task A, Task B
     - Recommendations: "Reassign cards...", "Break down large cards...", "Move some cards back to To Do"

4. **Acknowledge Alert**:
   - Click checkmark to acknowledge
   - **Expected**: Alert marked as acknowledged
   - **Expected**: Alert persists in panel

5. **Resolve Overload**:
   - Move "Task B" back to "To Do"
   - Wait for next analysis cycle
   - **Expected**: Alert no longer appears in new analysis

**Cleanup**: Move cards back to "To Do"

---

### Scenario 5: Unassigned Card Alerts

**Description**: Test alerts for unassigned cards in active columns

**Setup**:
1. Create cards without assignees
2. Move to "In Progress" or "Done"

**Test Steps**:

1. **Create Unassigned Card in Progress**:
   - Create card "Unassigned Task"
   - Do NOT assign any team member
   - Move to "In Progress"
   - Wait for bottleneck analysis

2. **Verify Alert**:
   - **Expected**: Low severity alert appears:
     - Message: "Card 'Unassigned Task' in In Progress is unassigned"
     - Shows affected card ID
     - Shows affected column
     - Recommendation: "Assign this card to a team member"

3. **Resolve by Assigning**:
   - Assign team member to card
   - Wait for next analysis
   - **Expected**: Alert no longer appears

4. **Test in Done Column**:
   - Create another unassigned card
   - Move to "Done"
   - **Expected**: Similar low severity alert for Done column

**Cleanup**: Assign or delete test cards

---

### Scenario 6: Workload Imbalance Detection

**Description**: Test alerts when some members are overloaded while others are idle

**Setup**:
1. Ensure at least 2 team members exist
2. Create workload imbalance

**Test Steps**:

1. **Create Imbalance**:
   - Assign 10 story points in "In Progress" to Alice (overloaded)
   - Assign 0 story points to Robert (idle)
   - Wait for bottleneck analysis

2. **Verify Alert**:
   - **Expected**: Medium severity alert appears:
     - Message: "Workload is unbalanced: 1 overloaded, 1 idle"
     - Shows overloaded members: Alice (10 pts)
     - Shows idle members: Robert (0 pts)
     - Recommendation: "Reassign work from overloaded to idle team members"

3. **Resolve Imbalance**:
   - Reassign some cards from Alice to Robert
   - Wait for next analysis
   - **Expected**: Alert no longer appears when balanced

**Cleanup**: Balance workload or move cards to "To Do"

---

### Scenario 7: Assignment Duration Tracking

**Description**: Test assignment duration display

**Setup**:
1. Assign team member to card
2. Wait some time

**Test Steps**:

1. **Initial Assignment**:
   - Assign Alice to a card
   - **Expected**: "Assigned just now" displays

2. **Wait 1 Hour** (or adjust system time):
   - Refresh page
   - **Expected**: "Assigned 1 hour ago" displays

3. **Wait 1 Day** (or adjust system time):
   - Refresh page
   - **Expected**: "Assigned 1 day ago" displays

4. **Reassignment Updates Duration**:
   - Unassign and reassign Alice
   - **Expected**: Duration resets to "Assigned just now"

**Cleanup**: None required

---

### Scenario 8: Team Member Deletion Cascade

**Description**: Test that deleting team member unassigns them from all cards

**Setup**:
1. Create team member "Test User"
2. Assign to multiple cards

**Test Steps**:

1. **Assign to Multiple Cards**:
   - Assign "Test User" to 3 different cards
   - **Expected**: All 3 cards show "Test User" badge

2. **Delete Team Member**:
   - Navigate to Team tab
   - Delete "Test User"
   - Confirm deletion
   - **Expected**: Confirmation dialog mentions unassignment

3. **Verify Unassignment**:
   - Navigate to Board tab
   - Check all 3 cards
   - **Expected**: "Test User" badge removed from all cards
   - **Expected**: Other assignees (if any) remain

4. **Verify in Filter**:
   - Check assignee filter dropdown
   - **Expected**: "Test User" no longer appears

**Cleanup**: None required

---

### Scenario 9: WebSocket Real-Time Updates

**Description**: Test real-time updates across multiple browser tabs

**Setup**:
1. Open frontend in two browser tabs (Tab A and Tab B)
2. Navigate both to Team tab

**Test Steps**:

1. **Create Team Member in Tab A**:
   - Add "WebSocket Test User" in Tab A
   - **Expected**: User appears in Tab B automatically (no refresh)

2. **Update Team Member in Tab B**:
   - Edit name to "WS Test User" in Tab B
   - **Expected**: Name updates in Tab A automatically

3. **Delete in Tab A**:
   - Delete "WS Test User" in Tab A
   - **Expected**: User disappears from Tab B automatically

4. **Test Card Assignment Updates**:
   - Navigate both tabs to Board
   - Assign team member to card in Tab A
   - **Expected**: Assignment appears in Tab B automatically

**Cleanup**: Close extra tabs

---

## Integration Test Checklist

- [ ] Team member CRUD operations work correctly
- [ ] Name uniqueness validation enforced
- [ ] Card assignment (single and multiple) works
- [ ] Assignment filtering works correctly
- [ ] Overload alerts appear when >8 points in progress
- [ ] Unassigned card alerts appear in active columns
- [ ] Workload imbalance alerts appear correctly
- [ ] Assignment duration displays and updates
- [ ] Team member deletion unassigns from all cards
- [ ] WebSocket updates work in real-time
- [ ] All alerts display correct information
- [ ] All recommendations are relevant

---

## Expected Results Summary

### API Endpoints
- `GET /team-members`: Returns sorted list
- `POST /team-members`: Creates with uniqueness check
- `PUT /team-members/{id}`: Updates with uniqueness check
- `DELETE /team-members/{id}`: Deletes and unassigns
- `PUT /cards/{id}`: Accepts assignees field

### WebSocket Events
- `team_member_created`: Broadcasts new member
- `team_member_updated`: Broadcasts updates
- `team_member_deleted`: Broadcasts deletion
- `card_updated`: Broadcasts assignment changes
- `bottleneck_alerts`: Broadcasts team workload alerts

### Alert Types
- `team_member_overload`: High severity, >8 points
- `unassigned_card`: Low severity, active columns
- `workload_imbalance_team`: Medium severity, imbalanced

---

## Troubleshooting

### Team Member Not Appearing
- Check browser console for errors
- Check Network tab for API response
- Verify DynamoDB table has data
- Check Lambda CloudWatch logs

### Assignments Not Persisting
- Check PUT request in Network tab
- Verify assignees field in request body
- Check DynamoDB for updated card data
- Verify Lambda has write permissions

### Alerts Not Appearing
- Wait full 5 minutes for EventBridge trigger
- Check AIBottleneckHandler CloudWatch logs
- Verify WebSocket connection is active
- Check browser console for WebSocket messages

### WebSocket Not Updating
- Check WebSocket connection status (DevTools → Network → WS)
- Verify VITE_WS_URL is correct
- Check ConnectionsTable in DynamoDB
- Verify Lambda has WebSocket permissions

---

## Logs Location

### Backend Logs
- **CloudWatch**: `/aws/lambda/KanbanApiStack-TeamMembersHandler*`
- **CloudWatch**: `/aws/lambda/KanbanApiStack-CardsHandler*`
- **CloudWatch**: `/aws/lambda/KanbanApiStack-AiBottleneckHandler*`

### Frontend Logs
- **Browser Console**: F12 → Console tab
- **Network Logs**: F12 → Network tab

### Database
- **DynamoDB**: TeamMembersTable items
- **DynamoDB**: CardsTable items (check assignees field)

---

## Next Steps

After successful integration testing:
1. Document any issues found
2. Fix critical bugs
3. Proceed to performance testing (if applicable)
4. Prepare for production deployment
