# Requirements Document - Iteration 3: Team Management & Assignment

## Executive Summary

**Iteration**: 3  
**Focus**: Team member management, card assignment, and bottleneck detection integration  
**Timeline**: 3-4 hours  
**Priority**: Delivery velocity - keep it simple and functional

---

## Functional Requirements

### FR-1: Team Member Management

**Description**: Add ability to create, view, edit, and delete team members.

**User Story**: As a team lead, I want to manage team members so I can assign work to them.

**Acceptance Criteria**:
- User can add a new team member with a name
- User can view a list of all team members
- User can edit a team member's name
- User can delete a team member (hard delete, unassigns from all cards)
- Team member names must be unique (case-insensitive)
- Team members are stored in a new DynamoDB table (TeamMembersTable)

**Data Model**:
```typescript
interface TeamMember {
  id: string              // UUID
  name: string            // Unique, case-insensitive
  createdAt: string       // ISO timestamp
  updatedAt: string       // ISO timestamp
}
```

**UI Location**: New "Team" page/tab in the app

**Display**: Simple list with names

---

### FR-2: Card Assignment

**Description**: Assign one or more team members to cards.

**User Story**: As a team lead, I want to assign team members to cards so I can track who is working on what.

**Acceptance Criteria**:
- User can assign multiple team members to a card
- Assignment happens via dropdown/select on the card itself (inline editing)
- Unassigned cards are allowed (assignment is optional)
- Assignments are displayed as team member names on the card
- User can reassign cards freely at any time
- Assignments are stored in the Card model in DynamoDB

**Data Model Update**:
```typescript
interface Card {
  // ... existing fields
  assignees?: string[]    // Array of team member IDs
}
```

**UI Location**: Dropdown/select on card (inline editing)

**Display**: Team member names as text on card

---

### FR-3: Assignment Filtering

**Description**: Filter cards by assignee in the board view.

**User Story**: As a team member, I want to filter cards by assignee so I can see my assigned work.

**Acceptance Criteria**:
- Filter dropdown in board view shows all team members
- Selecting a team member filters cards to show only those assigned to them
- "All" option shows all cards (no filter)
- Filter persists during session but resets on page reload

---

### FR-4: Workload-Based Bottleneck Detection

**Description**: Detect when team members are overloaded based on story points in "In Progress".

**User Story**: As a team lead, I want to be alerted when team members are overloaded so I can rebalance work.

**Acceptance Criteria**:
- Calculate workload as sum of story points for cards assigned to a team member in "In Progress" column
- Alert when a team member has >8 story points in "In Progress" (high severity)
- Alert includes team member name, current workload, and affected card IDs
- Recommendations include: reassign cards, break down large cards, move cards back to "To Do"

**Alert Structure**:
```typescript
{
  severity: 'high',
  category: 'team_member_overload',
  message: 'Team member [Name] is overloaded with [X] story points in progress',
  affectedTeamMember: 'team-member-id',
  affectedCards: ['card-id-1', 'card-id-2'],
  currentWorkload: 13,
  threshold: 8,
  recommendations: [
    'Reassign cards to less busy team members',
    'Break down large cards into smaller tasks',
    'Move some cards back to To Do'
  ]
}
```

---

### FR-5: Unassigned Card Alerts

**Description**: Alert on unassigned cards in "In Progress" or "Done" columns.

**User Story**: As a team lead, I want to be alerted about unassigned cards in active columns so I can ensure accountability.

**Acceptance Criteria**:
- Alert when a card in "In Progress" or "Done" has no assignees (low severity)
- Alert includes card ID, title, and column
- Recommendation: Assign the card to a team member

**Alert Structure**:
```typescript
{
  severity: 'low',
  category: 'unassigned_card',
  message: 'Card "[Title]" in [Column] is unassigned',
  affectedCards: ['card-id'],
  affectedColumn: 'In Progress',
  recommendations: [
    'Assign this card to a team member'
  ]
}
```

---

### FR-6: Workload Distribution Analysis

**Description**: Detect when workload is unbalanced across the team.

**User Story**: As a team lead, I want to be alerted when work is unevenly distributed so I can rebalance.

**Acceptance Criteria**:
- Analyze workload distribution across all team members
- Alert when some team members are overloaded (>8 points) while others are idle (0 points) (medium severity)
- Alert includes list of overloaded and idle team members
- Recommendation: Reassign work from overloaded to idle team members

**Alert Structure**:
```typescript
{
  severity: 'medium',
  category: 'workload_imbalance',
  message: 'Workload is unbalanced: [X] overloaded, [Y] idle',
  overloadedMembers: [
    { id: 'id', name: 'Name', workload: 13 }
  ],
  idleMembers: [
    { id: 'id', name: 'Name', workload: 0 }
  ],
  recommendations: [
    'Reassign work from overloaded to idle team members'
  ]
}
```

---

### FR-7: Duration Tracking Per Assignee

**Description**: Track how long cards have been assigned to each team member.

**User Story**: As a team lead, I want to see how long cards have been with each assignee so I can identify blockers.

**Acceptance Criteria**:
- When a card is assigned or reassigned, record timestamp
- Display duration on card (e.g., "Assigned to John for 3 days")
- Include in bottleneck analysis (alert if assigned >7 days)

**Data Model Update**:
```typescript
interface Card {
  // ... existing fields
  assignedAt?: string     // ISO timestamp when last assigned/reassigned
}
```

---

## Non-Functional Requirements

### NFR-1: Performance
- Team member list should load in <500ms
- Assignment operations should complete in <300ms
- Bottleneck analysis should complete in <5 seconds

### NFR-2: Scalability
- Support up to 50 team members
- Support up to 1000 cards with assignments
- Efficient queries for workload calculation

### NFR-3: Usability
- Simple, intuitive UI for team management
- Inline assignment editing for quick updates
- Clear visual indication of assignments on cards

### NFR-4: Data Integrity
- Prevent duplicate team member names
- Handle team member deletion gracefully (unassign from cards)
- Maintain referential integrity between cards and team members

---

## API Changes

### New Endpoints

#### Team Members
- `GET /team-members` - List all team members
- `POST /team-members` - Create a team member
- `GET /team-members/{id}` - Get a team member
- `PUT /team-members/{id}` - Update a team member
- `DELETE /team-members/{id}` - Delete a team member (unassigns from all cards)

#### Card Assignment (extend existing endpoints)
- `PUT /cards/{id}` - Update card (now supports `assignees` field)

### Request/Response Examples

**Create Team Member**:
```json
POST /team-members
{
  "name": "John Doe"
}

Response:
{
  "id": "uuid",
  "name": "John Doe",
  "createdAt": "2026-03-04T12:00:00Z",
  "updatedAt": "2026-03-04T12:00:00Z"
}
```

**Assign Team Members to Card**:
```json
PUT /cards/{id}
{
  "assignees": ["team-member-id-1", "team-member-id-2"]
}
```

---

## Database Schema

### New Table: TeamMembersTable

**Partition Key**: `id` (String)

**Attributes**:
- `id`: String (UUID)
- `name`: String (unique, case-insensitive)
- `createdAt`: String (ISO timestamp)
- `updatedAt`: String (ISO timestamp)

**GSI**: `name-index` for uniqueness checks

### Updated Table: CardsTable

**New Attributes**:
- `assignees`: List of Strings (team member IDs)
- `assignedAt`: String (ISO timestamp, when last assigned/reassigned)

---

## UI Changes

### New: Team Page
- Navigation tab: "Team"
- Simple list of team members
- "Add Team Member" button
- Edit/Delete actions per team member

### Updated: Card Component
- Add assignee dropdown/select (multi-select)
- Display assigned team member names
- Show assignment duration (e.g., "Assigned 3 days ago")

### Updated: Board View
- Add filter dropdown: "Filter by Assignee"
- Options: "All", then list of team members

### Updated: Bottleneck Alerts Panel
- New alert types: team_member_overload, unassigned_card, workload_imbalance
- Display team member names in alerts
- Show workload metrics

---

## Implementation Priority

### Must-Have (Iteration 3)
1. ✅ Team member CRUD operations
2. ✅ Card assignment (multiple assignees)
3. ✅ Assignment display on cards
4. ✅ Assignment filtering
5. ✅ Workload-based bottleneck detection
6. ✅ Unassigned card alerts
7. ✅ Workload distribution analysis
8. ✅ Duration tracking per assignee

### Deferred (Future Iterations)
- AI-suggested assignees based on workload
- Split cards inheriting assignees
- Authentication and permissions
- Team roles and capacity planning
- Advanced time tracking

---

## Success Criteria

Iteration 3 is successful when:
- ✅ Team members can be added, edited, and deleted
- ✅ Cards can be assigned to multiple team members
- ✅ Assignments are displayed on cards
- ✅ Cards can be filtered by assignee
- ✅ Bottleneck detection alerts on overloaded team members (>8 points in progress)
- ✅ Bottleneck detection alerts on unassigned cards in active columns
- ✅ Bottleneck detection alerts on workload imbalance
- ✅ Duration tracking shows how long cards have been assigned
- ✅ All features work end-to-end in production
- ✅ Timeline: 3-4 hours

---

## Testing Strategy

### Manual Testing
1. Create team members
2. Assign team members to cards
3. Filter cards by assignee
4. Verify bottleneck alerts for overloaded team members
5. Verify alerts for unassigned cards
6. Verify workload distribution alerts
7. Test team member deletion (unassigns from cards)
8. Test assignment duration tracking

### Integration Testing
1. Team member CRUD via API
2. Card assignment via API
3. Bottleneck analysis with team workload
4. WebSocket updates for assignment changes

---

## Dependencies

- Existing: DynamoDB, Lambda, API Gateway, React, Bedrock
- New: TeamMembersTable in DynamoDB
- No new external dependencies

---

## Risks and Mitigation

**Risk**: Team member deletion could orphan cards  
**Mitigation**: Hard delete unassigns from all cards automatically

**Risk**: Workload calculation could be slow with many cards  
**Mitigation**: Efficient DynamoDB queries, calculate only for "In Progress" cards

**Risk**: Multiple assignees could complicate UI  
**Mitigation**: Simple text display, comma-separated names

**Risk**: Timeline is tight (3-4 hours)  
**Mitigation**: Keep implementation simple, no fancy UI, focus on functionality

---

## Notes

- **Delivery velocity is priority** - keep it simple and functional
- No authentication/permissions in this iteration
- No AI integration with assignments (deferred)
- No advanced time tracking (just basic duration)
- Focus on core functionality that works end-to-end
