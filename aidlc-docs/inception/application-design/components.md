# Components - Iteration 3

## Overview

This document defines the components and their responsibilities for team management and assignment features.

---

## Backend Components

### 1. TeamMember Component

**Purpose**: Represent a team member entity

**Responsibilities**:
- Store team member data (id, name, timestamps)
- Enforce uniqueness constraints
- Provide CRUD operations

**Data Model**:
```typescript
interface TeamMember {
  id: string              // UUID
  name: string            // Unique, case-insensitive
  createdAt: string       // ISO timestamp
  updatedAt: string       // ISO timestamp
}
```

**Business Rules**:
- Name must be unique (case-insensitive)
- Name cannot be empty
- ID is auto-generated (UUID)
- Timestamps are auto-managed

---

### 2. TeamMembersService

**Purpose**: Business logic for team member operations

**Responsibilities**:
- Create team members with uniqueness validation
- Retrieve team members (list, get by ID)
- Update team member information
- Delete team members and handle card unassignment
- Check name uniqueness

**Methods**:
```typescript
class TeamMembersService {
  async create(name: string): Promise<TeamMember>
  async list(): Promise<TeamMember[]>
  async getById(id: string): Promise<TeamMember | null>
  async update(id: string, name: string): Promise<TeamMember>
  async delete(id: string): Promise<void>
  async isNameUnique(name: string, excludeId?: string): Promise<boolean>
}
```

**Dependencies**:
- DynamoDB client
- CardsService (for unassignment on delete)

---

### 3. TeamMembersHandler (Lambda)

**Purpose**: HTTP API handler for team member endpoints

**Responsibilities**:
- Handle HTTP requests for team member CRUD
- Validate input
- Call TeamMembersService
- Return appropriate HTTP responses
- Broadcast changes via WebSocket

**Endpoints**:
- `GET /team-members` - List all
- `POST /team-members` - Create
- `GET /team-members/{id}` - Get by ID
- `PUT /team-members/{id}` - Update
- `DELETE /team-members/{id}` - Delete

**Dependencies**:
- TeamMembersService
- WebSocket service (for broadcasting)

---

### 4. CardsService (Extended)

**Purpose**: Extended to support assignment operations

**New Responsibilities**:
- Assign team members to cards
- Unassign team members from cards
- Track assignment timestamps
- Validate assignee IDs exist
- Unassign all cards when team member deleted

**New/Modified Methods**:
```typescript
class CardsService {
  // Existing methods...
  
  async assignTeamMembers(cardId: string, assigneeIds: string[]): Promise<Card>
  async unassignTeamMember(teamMemberId: string): Promise<void>
  async getCardsByAssignee(assigneeId: string): Promise<Card[]>
}
```

**Dependencies**:
- DynamoDB client
- TeamMembersService (for validation)

---

### 5. CardsHandler (Extended)

**Purpose**: Extended to support assignment in PUT endpoint

**New Responsibilities**:
- Accept assignees field in PUT requests
- Validate assignee IDs
- Update assignedAt timestamp when assignees change
- Broadcast assignment changes

**Modified Endpoint**:
- `PUT /cards/{id}` - Now accepts `assignees` field

---

### 6. BottleneckAnalysisService (Extended)

**Purpose**: Extended to analyze team member workload

**New Responsibilities**:
- Calculate workload per team member
- Detect overloaded team members (>8 points in progress)
- Detect unassigned cards in active columns
- Detect workload imbalance across team
- Generate recommendations

**New Methods**:
```typescript
class BottleneckAnalysisService {
  // Existing methods...
  
  async analyzeTeamWorkload(cards: Card[], teamMembers: TeamMember[]): Promise<Alert[]>
  async detectOverloadedMembers(cards: Card[], teamMembers: TeamMember[]): Promise<Alert[]>
  async detectUnassignedCards(cards: Card[]): Promise<Alert[]>
  async detectWorkloadImbalance(cards: Card[], teamMembers: TeamMember[]): Promise<Alert[]>
}
```

**Dependencies**:
- CardsService
- TeamMembersService

---

### 7. AIBottleneckHandler (Extended)

**Purpose**: Extended to include team workload analysis

**New Responsibilities**:
- Fetch team members
- Call team workload analysis
- Combine AI alerts with team workload alerts
- Broadcast all alerts

**Dependencies**:
- TeamMembersService
- BottleneckAnalysisService
- Bedrock service (existing)

---

## Frontend Components

### 8. TeamPage Component

**Purpose**: Manage team members

**Responsibilities**:
- Display list of team members
- Add new team member form
- Edit team member inline
- Delete team member with confirmation
- Handle API calls for CRUD operations

**State**:
```typescript
{
  teamMembers: TeamMember[]
  loading: boolean
  showAddForm: boolean
  editingId: string | null
}
```

**UI Elements**:
- Team member list
- "Add Team Member" button
- Add form (name input + save/cancel)
- Edit/Delete buttons per member

---

### 9. Card Component (Extended)

**Purpose**: Extended to support assignment

**New Responsibilities**:
- Display assigned team members
- Show assignment dropdown (multi-select)
- Update assignments via API
- Display assignment duration

**New Props**:
```typescript
{
  teamMembers: TeamMember[]
  onAssignmentChange: (cardId: string, assigneeIds: string[]) => void
}
```

**New UI Elements**:
- Assignment dropdown (multi-select)
- Assigned team member names display
- Assignment duration text

---

### 10. BoardView Component (Extended)

**Purpose**: Extended to support filtering by assignee

**New Responsibilities**:
- Display assignee filter dropdown
- Filter cards by selected assignee
- Show "All" option to clear filter

**New State**:
```typescript
{
  selectedAssignee: string | null  // null = "All"
}
```

**New UI Elements**:
- Filter dropdown in header
- Options: "All", then team member names

---

### 11. AlertsPanel Component (Extended)

**Purpose**: Extended to display team workload alerts

**New Responsibilities**:
- Display team_member_overload alerts
- Display unassigned_card alerts
- Display workload_imbalance alerts
- Show team member names in alerts
- Display workload metrics

**New Alert Types**:
- `team_member_overload`
- `unassigned_card`
- `workload_imbalance`

---

## Component Dependencies

```
TeamMembersHandler
  ├─> TeamMembersService
  │     └─> DynamoDB
  └─> WebSocketService

CardsHandler (extended)
  ├─> CardsService (extended)
  │     ├─> DynamoDB
  │     └─> TeamMembersService (validation)
  └─> WebSocketService

AIBottleneckHandler (extended)
  ├─> TeamMembersService
  ├─> CardsService
  ├─> BottleneckAnalysisService (extended)
  │     ├─> TeamMembersService
  │     └─> CardsService
  ├─> BedrockService
  └─> WebSocketService

TeamPage (frontend)
  └─> API: /team-members

Card (frontend, extended)
  ├─> API: PUT /cards/{id}
  └─> Props: teamMembers

BoardView (frontend, extended)
  └─> State: selectedAssignee filter

AlertsPanel (frontend, extended)
  └─> WebSocket: bottleneck_alerts
```

---

## Data Flow

### Team Member Creation
1. User enters name in TeamPage
2. TeamPage → POST /team-members
3. TeamMembersHandler validates uniqueness
4. TeamMembersService creates in DynamoDB
5. WebSocket broadcasts team_member_created
6. TeamPage updates list

### Card Assignment
1. User selects assignees in Card dropdown
2. Card → PUT /cards/{id} with assignees
3. CardsHandler validates assignee IDs
4. CardsService updates card, sets assignedAt
5. WebSocket broadcasts card_updated
6. Board updates card display

### Workload Analysis
1. EventBridge triggers AIBottleneckHandler (every 5 min)
2. Handler fetches cards and team members
3. BottleneckAnalysisService calculates workload
4. Detects overload, unassigned, imbalance
5. Combines with AI alerts
6. WebSocket broadcasts bottleneck_alerts
7. AlertsPanel displays alerts

---

## Summary

**New Components**: 3
- TeamMember (entity)
- TeamMembersService (business logic)
- TeamMembersHandler (API)
- TeamPage (UI)

**Extended Components**: 5
- CardsService (assignment methods)
- CardsHandler (assignees field)
- BottleneckAnalysisService (workload analysis)
- AIBottleneckHandler (team workload)
- Card (assignment UI)
- BoardView (filter)
- AlertsPanel (new alert types)

**Total Components**: 11 (3 new + 8 existing/extended)
