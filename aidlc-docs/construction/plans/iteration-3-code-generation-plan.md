# Code Generation Plan - Iteration 3: Team Management & Assignment

## Overview

**Unit**: Iteration 3 - Team Management & Assignment  
**Type**: Brownfield (extending existing application)  
**Workspace Root**: `/Users/homer/flowstate`  
**Timeline**: 3-4 hours  
**Focus**: Delivery velocity - keep it simple and functional

---

## Context

### Stories Implemented
- FR-1: Team Member Management (CRUD operations)
- FR-2: Card Assignment (multiple assignees per card)
- FR-3: Assignment Filtering (filter by assignee)
- FR-4: Workload-Based Bottleneck Detection (>8 points alert)
- FR-5: Unassigned Card Alerts (cards in active columns)
- FR-6: Workload Distribution Analysis (imbalance detection)
- FR-7: Duration Tracking Per Assignee (time assigned)

### Dependencies
- Existing: DynamoDB (CardsTable, ConnectionsTable)
- Existing: Lambda handlers (cards, websocket, ai-bottleneck)
- Existing: React frontend with WebSocket
- New: TeamMembersTable (DynamoDB)
- New: TeamMembersHandler (Lambda)

### Interfaces
- REST API: `/team-members` endpoints (GET, POST, PUT, DELETE)
- REST API: `/cards/{id}` extended with assignees field
- WebSocket: Broadcast team member and assignment changes
- WebSocket: Broadcast team workload alerts

---

## Code Generation Steps

### Phase 1: Backend - Type Definitions

#### Step 1: Extend Type Definitions
- [x] **File**: `backend/src/types/index.ts` (MODIFY EXISTING)
- [x] Add TeamMember interface
- [x] Add CreateTeamMemberRequest interface
- [x] Add UpdateTeamMemberRequest interface
- [x] Extend Card interface with assignees and assignedAt fields
- [x] Extend UpdateCardRequest with assignees field
- [x] Extend BottleneckAlert with new categories (team_member_overload, unassigned_card, workload_imbalance)
- [x] Add new alert structure fields (affectedTeamMember, currentWorkload, threshold, overloadedMembers, idleMembers)
- [x] **Story Coverage**: FR-1, FR-2, FR-4, FR-5, FR-6, FR-7

---

### Phase 2: Backend - DynamoDB Service Layer

#### Step 2: Extend DynamoDB Service
- [x] **File**: `backend/src/services/dynamodb.ts` (MODIFY EXISTING)
- [x] Add TEAM_MEMBERS_TABLE environment variable
- [x] Create teamMembersService object with methods:
  - [x] create(teamMember: TeamMember): Promise<TeamMember>
  - [x] get(id: string): Promise<TeamMember | null>
  - [x] list(): Promise<TeamMember[]>
  - [x] update(id: string, updates: Partial<TeamMember>): Promise<TeamMember>
  - [x] delete(id: string): Promise<void>
  - [x] checkNameExists(name: string, excludeId?: string): Promise<boolean>
- [x] Extend cardsService with methods:
  - [x] getCardsByAssignee(assigneeId: string): Promise<Card[]>
  - [x] unassignTeamMember(teamMemberId: string): Promise<void>
- [x] **Story Coverage**: FR-1, FR-2

---

### Phase 3: Backend - Team Members Handler

#### Step 3: Create Team Members Handler
- [x] **File**: `backend/src/handlers/team-members.ts` (CREATE NEW)
- [x] Import dependencies (AWS SDK, uuid, services, types)
- [x] Define CORS headers
- [x] Implement handler function with routes:
  - [x] GET /team-members - List all team members
  - [x] POST /team-members - Create team member (validate uniqueness)
  - [x] GET /team-members/{id} - Get single team member
  - [x] PUT /team-members/{id} - Update team member (validate uniqueness)
  - [x] DELETE /team-members/{id} - Delete and unassign from cards
- [x] Add name validation (trim, non-empty, max 100 chars)
- [x] Add uniqueness check using name-index GSI
- [x] Broadcast team_member_created, team_member_updated, team_member_deleted via WebSocket
- [x] Add error handling and logging
- [x] **Story Coverage**: FR-1

---

### Phase 4: Backend - Extend Cards Handler

#### Step 4: Extend Cards Handler for Assignments
- [x] **File**: `backend/src/handlers/cards.ts` (MODIFY EXISTING)
- [x] Import teamMembersService
- [x] In PUT /cards/{id} route:
  - [x] Accept assignees field in request body
  - [x] Validate assignee IDs exist in TeamMembersTable
  - [x] Set assignedAt timestamp when assignees change
  - [x] Update card with new assignees and assignedAt
  - [x] Broadcast card_updated with assignment info
- [x] Add assignee validation helper function
- [x] **Story Coverage**: FR-2, FR-7

---

### Phase 5: Backend - Bottleneck Analysis Service

#### Step 5: Create Bottleneck Analysis Service
- [x] **File**: `backend/src/services/bottleneck-analysis.ts` (CREATE NEW)
- [x] Import types (Card, TeamMember, BottleneckAlert)
- [x] Implement analyzeTeamWorkload(cards: Card[], teamMembers: TeamMember[]): Promise<BottleneckAlert[]>
- [x] Implement detectOverloadedMembers(cards: Card[], teamMembers: TeamMember[]): Promise<BottleneckAlert[]>
  - [x] Filter cards in "In Progress"
  - [x] Calculate workload per team member (sum story points)
  - [x] Alert if workload > 8 points (high severity)
- [x] Implement detectUnassignedCards(cards: Card[]): Promise<BottleneckAlert[]>
  - [x] Filter cards in "In Progress" or "Done"
  - [x] Alert if no assignees (low severity)
- [x] Implement detectWorkloadImbalance(cards: Card[], teamMembers: TeamMember[]): Promise<BottleneckAlert[]>
  - [x] Identify overloaded (>8) and idle (0) members
  - [x] Alert if both exist (medium severity)
- [x] **Story Coverage**: FR-4, FR-5, FR-6

---

### Phase 6: Backend - Extend AI Bottleneck Handler

#### Step 6: Extend AI Bottleneck Handler
- [x] **File**: `backend/src/handlers/ai-bottleneck.ts` (MODIFY EXISTING)
- [x] Import teamMembersService and bottleneckAnalysisService
- [x] In handler function:
  - [x] Fetch all team members
  - [x] Call analyzeTeamWorkload with cards and team members
  - [x] Combine AI alerts with team workload alerts
  - [x] Broadcast all alerts via WebSocket
- [x] **Story Coverage**: FR-4, FR-5, FR-6

---

### Phase 7: Infrastructure - CDK Changes

#### Step 7: Update Storage Stack
- [x] **File**: `infrastructure/lib/storage-stack.ts` (MODIFY EXISTING)
- [x] Add teamMembersTable property
- [x] Create TeamMembersTable with:
  - [x] Partition key: id (String)
  - [x] Billing mode: PAY_PER_REQUEST
  - [x] Point-in-time recovery: enabled
  - [x] Encryption: AWS managed
- [x] Add GSI: name-index (partition key: nameLowercase)
- [x] Export table name as CfnOutput
- [x] **Story Coverage**: FR-1

#### Step 8: Update API Stack
- [x] **File**: `infrastructure/lib/api-stack.ts` (MODIFY EXISTING)
- [x] Create TeamMembersHandler Lambda:
  - [x] Runtime: Node.js 20
  - [x] Handler: handlers/team-members.handler
  - [x] Environment variables: CARDS_TABLE_NAME, TEAM_MEMBERS_TABLE_NAME, CONNECTIONS_TABLE_NAME, WS_API_ENDPOINT
  - [x] Timeout: 30 seconds
  - [x] Memory: 512 MB
- [x] Grant permissions:
  - [x] teamMembersTable.grantReadWriteData(teamMembersHandler)
  - [x] cardsTable.grantReadWriteData(teamMembersHandler)
  - [x] connectionsTable.grantReadData(teamMembersHandler)
- [x] Add API Gateway routes:
  - [x] GET /team-members
  - [x] POST /team-members
  - [x] GET /team-members/{id}
  - [x] PUT /team-members/{id}
  - [x] DELETE /team-members/{id}
- [x] Update CardsHandler:
  - [x] Add TEAM_MEMBERS_TABLE_NAME environment variable
  - [x] Grant teamMembersTable.grantReadData(cardsHandler)
- [x] Update AIBottleneckHandler:
  - [x] Add TEAM_MEMBERS_TABLE_NAME environment variable
  - [x] Grant teamMembersTable.grantReadData(aiBottleneckHandler)
- [x] **Story Coverage**: FR-1, FR-2, FR-4, FR-5, FR-6

---

### Phase 8: Frontend - Type Definitions

#### Step 9: Extend Frontend Types
- [x] **File**: `frontend/src/App.tsx` (MODIFY EXISTING)
- [x] Add TeamMember interface
- [x] Extend Card interface with assignees and assignedAt fields
- [x] Extend Alert interface with new fields (affectedTeamMember, currentWorkload, threshold, overloadedMembers, idleMembers)
- [x] **Story Coverage**: FR-1, FR-2, FR-4, FR-5, FR-6, FR-7

---

### Phase 9: Frontend - Team Page Component

#### Step 10: Create Team Page Component
- [x] **File**: `frontend/src/components/TeamPage.tsx` (CREATE NEW)
- [x] Import React hooks (useState, useEffect)
- [x] Define TeamMember interface (if not imported)
- [x] Implement component state:
  - [x] teamMembers: TeamMember[]
  - [x] loading: boolean
  - [x] showAddForm: boolean
  - [x] editingId: string | null
  - [x] editingName: string
  - [x] newMemberName: string
  - [x] error: string | null
- [x] Implement useEffect to fetch team members on mount
- [x] Implement handleAddTeamMember function (POST /team-members)
- [x] Implement handleEditTeamMember function (PUT /team-members/{id})
- [x] Implement handleDeleteTeamMember function (DELETE /team-members/{id})
- [x] Render team member list with edit/delete buttons
- [x] Render add form with name input
- [x] Add data-testid attributes for automation
- [x] **Story Coverage**: FR-1

#### Step 11: Create Team Page Styles
- [x] **File**: `frontend/src/components/TeamPage.css` (CREATE NEW)
- [x] Style team page container
- [x] Style team member list
- [x] Style add form
- [x] Style edit/delete buttons
- [x] Add responsive design
- [x] **Story Coverage**: FR-1

---

### Phase 10: Frontend - Extend App Component

#### Step 12: Add Team Management to App
- [x] **File**: `frontend/src/App.tsx` (MODIFY EXISTING)
- [x] Import TeamPage component
- [x] Add state:
  - [x] teamMembers: TeamMember[]
  - [x] currentView: 'board' | 'team'
  - [x] selectedAssignee: string | null (for filtering)
- [x] Implement useEffect to fetch team members on mount
- [x] Implement WebSocket handlers for team member events:
  - [x] team_member_created
  - [x] team_member_updated
  - [x] team_member_deleted
- [x] Add navigation tabs (Board, Team)
- [x] Render TeamPage when currentView === 'team'
- [x] **Story Coverage**: FR-1

---

### Phase 11: Frontend - Card Assignment UI

#### Step 13: Add Assignment UI to Card Component
- [x] **File**: `frontend/src/App.tsx` (MODIFY EXISTING - Card rendering section)
- [x] Add assignee dropdown to card (multi-select)
- [x] Display assigned team member names on card
- [x] Calculate and display assignment duration (assignedAt to now)
- [x] Implement handleAssignmentChange function (PUT /cards/{id})
- [x] Update card state when assignment changes
- [x] Add data-testid attributes for automation
- [x] **Story Coverage**: FR-2, FR-7

---

### Phase 12: Frontend - Assignment Filtering

#### Step 14: Add Assignee Filter to Board View
- [x] **File**: `frontend/src/App.tsx` (MODIFY EXISTING - Board header section)
- [x] Add filter dropdown in board header
- [x] Populate with "All" + team member names
- [x] Implement handleFilterChange function
- [x] Filter cards based on selectedAssignee
- [x] Display filtered card count
- [x] Add data-testid attributes for automation
- [x] **Story Coverage**: FR-3

---

### Phase 13: Frontend - Alert Panel Updates

#### Step 15: Extend Alert Panel for Team Alerts
- [x] **File**: `frontend/src/App.tsx` (MODIFY EXISTING - Alert rendering section)
- [x] Add rendering for team_member_overload alerts
  - [x] Display team member name
  - [x] Display current workload and threshold
  - [x] Display affected card IDs
- [x] Add rendering for unassigned_card alerts
  - [x] Display card title and column
- [x] Add rendering for workload_imbalance alerts
  - [x] Display overloaded members list
  - [x] Display idle members list
- [x] Update alert styling for new categories
- [x] **Story Coverage**: FR-4, FR-5, FR-6

---

### Phase 14: Frontend - Styles

#### Step 16: Update App Styles
- [x] **File**: `frontend/src/App.css` (MODIFY EXISTING)
- [x] Add styles for navigation tabs
- [x] Add styles for assignee dropdown (multi-select)
- [x] Add styles for assigned team member display
- [x] Add styles for assignment duration display
- [x] Add styles for assignee filter dropdown
- [x] Add styles for new alert types
- [x] Ensure responsive design
- [x] **Story Coverage**: FR-1, FR-2, FR-3, FR-4, FR-5, FR-6, FR-7

---

### Phase 15: Documentation

#### Step 17: Create Code Summary
- [x] **File**: `aidlc-docs/construction/iteration-3/code/code-summary.md` (CREATE NEW)
- [x] Document all modified files with changes
- [x] Document all new files with purpose
- [x] List API endpoints added/modified
- [x] List WebSocket events added
- [x] Document data model changes
- [x] Include deployment notes
- [x] **Story Coverage**: All

---

### Phase 16: Build Configuration

#### Step 18: Update Backend Package Dependencies
- [x] **File**: `backend/package.json` (VERIFY EXISTING)
- [x] Verify uuid dependency exists
- [x] Verify AWS SDK dependencies exist
- [x] No new dependencies needed
- [x] **Story Coverage**: All

#### Step 19: Update Frontend Package Dependencies
- [x] **File**: `frontend/package.json` (VERIFY EXISTING)
- [x] Verify React dependencies exist
- [x] No new dependencies needed
- [x] **Story Coverage**: All

---

## Execution Sequence

1. **Backend Types** (Step 1) - Foundation for all backend work
2. **Backend Services** (Steps 2-6) - Business logic and data access
3. **Infrastructure** (Steps 7-8) - Deploy new resources
4. **Frontend Types** (Step 9) - Foundation for frontend work
5. **Frontend Components** (Steps 10-16) - UI implementation
6. **Documentation** (Step 17) - Code summary
7. **Build Config** (Steps 18-19) - Verify dependencies

---

## Story Traceability

| Story | Steps |
|-------|-------|
| FR-1: Team Member Management | 1, 2, 3, 7, 9, 10, 11, 12, 16, 17 |
| FR-2: Card Assignment | 1, 2, 4, 9, 13, 16, 17 |
| FR-3: Assignment Filtering | 9, 14, 16, 17 |
| FR-4: Workload-Based Bottleneck Detection | 1, 5, 6, 9, 15, 17 |
| FR-5: Unassigned Card Alerts | 1, 5, 6, 9, 15, 17 |
| FR-6: Workload Distribution Analysis | 1, 5, 6, 9, 15, 17 |
| FR-7: Duration Tracking Per Assignee | 1, 4, 9, 13, 16, 17 |

---

## File Modification Summary

### Modified Files (Brownfield)
- `backend/src/types/index.ts` - Extend types
- `backend/src/services/dynamodb.ts` - Add team members service
- `backend/src/handlers/cards.ts` - Add assignment logic
- `backend/src/handlers/ai-bottleneck.ts` - Add team workload analysis
- `infrastructure/lib/storage-stack.ts` - Add TeamMembersTable
- `infrastructure/lib/api-stack.ts` - Add TeamMembersHandler, update permissions
- `frontend/src/App.tsx` - Add team management, assignment UI, filtering
- `frontend/src/App.css` - Add new styles

### New Files (Greenfield)
- `backend/src/handlers/team-members.ts` - Team members CRUD handler
- `backend/src/services/bottleneck-analysis.ts` - Team workload analysis
- `frontend/src/components/TeamPage.tsx` - Team management UI
- `frontend/src/components/TeamPage.css` - Team page styles
- `aidlc-docs/construction/iteration-3/code/code-summary.md` - Documentation

---

## Completion Criteria

- [x] All 19 steps completed and marked [x]
- [x] All 7 stories implemented
- [x] Backend compiles without errors
- [x] Frontend compiles without errors
- [x] Infrastructure deploys successfully
- [x] All files in correct locations (no duplicates)
- [x] Code summary documentation complete
- [x] Ready for Build and Test phase

---

## Notes

- **Brownfield Rules**: Modify existing files in-place, never create duplicates
- **Code Location**: Application code in workspace root, documentation in aidlc-docs/
- **Automation Friendly**: Add data-testid attributes to all interactive elements
- **Timeline**: 3-4 hours total, prioritize delivery velocity
- **Simplicity**: Keep implementation simple and functional, no fancy UI
