# Component Methods - Iteration 3

## Backend Service Methods

### TeamMembersService

#### create(name: string): Promise<TeamMember>
**Purpose**: Create a new team member

**Input**:
- `name`: string (team member name)

**Process**:
1. Validate name is not empty
2. Check name uniqueness (case-insensitive)
3. Generate UUID for id
4. Set createdAt and updatedAt timestamps
5. Save to DynamoDB TeamMembersTable
6. Return created TeamMember

**Output**: TeamMember object

**Errors**:
- `ValidationError`: Name is empty
- `ConflictError`: Name already exists

---

#### list(): Promise<TeamMember[]>
**Purpose**: Get all team members

**Process**:
1. Scan TeamMembersTable
2. Sort by name (ascending)
3. Return array

**Output**: Array of TeamMember objects

---

#### getById(id: string): Promise<TeamMember | null>
**Purpose**: Get team member by ID

**Input**:
- `id`: string (team member ID)

**Process**:
1. Query TeamMembersTable by id
2. Return team member or null if not found

**Output**: TeamMember object or null

---

#### update(id: string, name: string): Promise<TeamMember>
**Purpose**: Update team member name

**Input**:
- `id`: string (team member ID)
- `name`: string (new name)

**Process**:
1. Validate name is not empty
2. Check name uniqueness (excluding current ID)
3. Get existing team member
4. Update name and updatedAt
5. Save to DynamoDB
6. Return updated TeamMember

**Output**: Updated TeamMember object

**Errors**:
- `NotFoundError`: Team member not found
- `ValidationError`: Name is empty
- `ConflictError`: Name already exists

---

#### delete(id: string): Promise<void>
**Purpose**: Delete team member and unassign from all cards

**Input**:
- `id`: string (team member ID)

**Process**:
1. Get all cards assigned to this team member
2. Remove team member from assignees array in each card
3. Delete team member from TeamMembersTable
4. Return void

**Output**: void

**Errors**:
- `NotFoundError`: Team member not found

---

#### isNameUnique(name: string, excludeId?: string): Promise<boolean>
**Purpose**: Check if name is unique

**Input**:
- `name`: string (name to check)
- `excludeId`: string (optional, ID to exclude from check)

**Process**:
1. Query name-index GSI with lowercase name
2. If excludeId provided, filter out that ID
3. Return true if no matches, false otherwise

**Output**: boolean

---

### CardsService (Extended Methods)

#### assignTeamMembers(cardId: string, assigneeIds: string[]): Promise<Card>
**Purpose**: Assign team members to a card

**Input**:
- `cardId`: string (card ID)
- `assigneeIds`: string[] (array of team member IDs)

**Process**:
1. Validate all assignee IDs exist in TeamMembersTable
2. Get existing card
3. Update assignees field
4. Set assignedAt to current timestamp
5. Set updatedAt to current timestamp
6. Save to DynamoDB
7. Return updated card

**Output**: Updated Card object

**Errors**:
- `NotFoundError`: Card not found
- `ValidationError`: Invalid assignee ID

---

#### unassignTeamMember(teamMemberId: string): Promise<void>
**Purpose**: Remove team member from all assigned cards

**Input**:
- `teamMemberId`: string (team member ID to unassign)

**Process**:
1. Scan CardsTable for cards with this assignee
2. For each card, remove teamMemberId from assignees array
3. Update each card in DynamoDB
4. Return void

**Output**: void

---

#### getCardsByAssignee(assigneeId: string): Promise<Card[]>
**Purpose**: Get all cards assigned to a team member

**Input**:
- `assigneeId`: string (team member ID)

**Process**:
1. Scan CardsTable
2. Filter cards where assignees contains assigneeId
3. Return filtered cards

**Output**: Array of Card objects

---

### BottleneckAnalysisService (Extended Methods)

#### analyzeTeamWorkload(cards: Card[], teamMembers: TeamMember[]): Promise<Alert[]>
**Purpose**: Analyze team workload and generate alerts

**Input**:
- `cards`: Card[] (all cards)
- `teamMembers`: TeamMember[] (all team members)

**Process**:
1. Call detectOverloadedMembers()
2. Call detectUnassignedCards()
3. Call detectWorkloadImbalance()
4. Combine all alerts
5. Return combined array

**Output**: Array of Alert objects

---

#### detectOverloadedMembers(cards: Card[], teamMembers: TeamMember[]): Promise<Alert[]>
**Purpose**: Detect team members with >8 story points in progress

**Input**:
- `cards`: Card[] (all cards)
- `teamMembers`: TeamMember[] (all team members)

**Process**:
1. Filter cards in "In Progress" column
2. For each team member:
   a. Find cards assigned to them
   b. Sum story points
   c. If sum > 8, create high severity alert
3. Return array of alerts

**Output**: Array of Alert objects

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

#### detectUnassignedCards(cards: Card[]): Promise<Alert[]>
**Purpose**: Detect unassigned cards in "In Progress" or "Done"

**Input**:
- `cards`: Card[] (all cards)

**Process**:
1. Filter cards in "In Progress" or "Done" columns
2. Filter cards with no assignees or empty assignees array
3. For each unassigned card, create low severity alert
4. Return array of alerts

**Output**: Array of Alert objects

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

#### detectWorkloadImbalance(cards: Card[], teamMembers: TeamMember[]): Promise<Alert[]>
**Purpose**: Detect workload imbalance (some overloaded, some idle)

**Input**:
- `cards`: Card[] (all cards)
- `teamMembers`: TeamMember[] (all team members)

**Process**:
1. Calculate workload for each team member (in progress cards)
2. Identify overloaded members (>8 points)
3. Identify idle members (0 points)
4. If both exist, create medium severity alert
5. Return array with single alert or empty array

**Output**: Array of Alert objects (0 or 1 alert)

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

## Frontend Component Methods

### TeamPage Component

#### handleAddTeamMember(name: string): Promise<void>
**Purpose**: Add a new team member

**Process**:
1. Validate name is not empty
2. POST /team-members with name
3. On success, add to local state
4. Clear form
5. Show success message

---

#### handleEditTeamMember(id: string, name: string): Promise<void>
**Purpose**: Update team member name

**Process**:
1. Validate name is not empty
2. PUT /team-members/{id} with name
3. On success, update local state
4. Exit edit mode
5. Show success message

---

#### handleDeleteTeamMember(id: string): Promise<void>
**Purpose**: Delete team member

**Process**:
1. Show confirmation dialog
2. If confirmed, DELETE /team-members/{id}
3. On success, remove from local state
4. Show success message

---

### Card Component (Extended)

#### handleAssignmentChange(assigneeIds: string[]): Promise<void>
**Purpose**: Update card assignments

**Process**:
1. PUT /cards/{cardId} with assignees field
2. On success, update local card state
3. Show success message

---

### BoardView Component (Extended)

#### handleFilterChange(assigneeId: string | null): void
**Purpose**: Filter cards by assignee

**Process**:
1. Set selectedAssignee state
2. Re-render board with filtered cards
3. If null, show all cards

---

## Summary

**New Service Methods**: 6
- TeamMembersService: create, list, getById, update, delete, isNameUnique

**Extended Service Methods**: 6
- CardsService: assignTeamMembers, unassignTeamMember, getCardsByAssignee
- BottleneckAnalysisService: analyzeTeamWorkload, detectOverloadedMembers, detectUnassignedCards, detectWorkloadImbalance

**New Frontend Methods**: 5
- TeamPage: handleAddTeamMember, handleEditTeamMember, handleDeleteTeamMember
- Card: handleAssignmentChange
- BoardView: handleFilterChange

**Total Methods**: 17 (6 new + 6 extended + 5 frontend)
