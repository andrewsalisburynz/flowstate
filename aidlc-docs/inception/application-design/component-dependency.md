# Component Dependencies - Iteration 3

## Dependency Graph

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────┐                                                │
│  │  TeamPage    │──────────────────────┐                        │
│  └──────────────┘                      │                        │
│         │                               │                        │
│         │ API calls                     │                        │
│         ▼                               │                        │
│  ┌──────────────┐     ┌──────────────┐ │  ┌──────────────┐     │
│  │  BoardView   │────▶│    Card      │ │  │ AlertsPanel  │     │
│  │  (extended)  │     │  (extended)  │ │  │  (extended)  │     │
│  └──────────────┘     └──────────────┘ │  └──────────────┘     │
│         │                     │         │         │              │
│         │ filter              │ assign  │         │ display      │
│         │                     │         │         │              │
└─────────┼─────────────────────┼─────────┼─────────┼──────────────┘
          │                     │         │         │
          │                     │         │         │
          ▼                     ▼         ▼         ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API GATEWAY (REST + WS)                     │
└─────────────────────────────────────────────────────────────────┘
          │                     │         │         │
          │                     │         │         │
          ▼                     ▼         ▼         ▼
┌─────────────────────────────────────────────────────────────────┐
│                         BACKEND (Lambda)                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────┐                                            │
│  │ TeamMembers      │                                            │
│  │ Handler (NEW)    │                                            │
│  └──────────────────┘                                            │
│         │                                                         │
│         │ uses                                                    │
│         ▼                                                         │
│  ┌──────────────────┐         ┌──────────────────┐              │
│  │ TeamMembers      │◀────────│  Cards           │              │
│  │ Service (NEW)    │ validate│  Handler         │              │
│  └──────────────────┘         │  (extended)      │              │
│         │                     └──────────────────┘              │
│         │                              │                         │
│         │                              │ uses                    │
│         │                              ▼                         │
│         │                     ┌──────────────────┐              │
│         │                     │  Cards           │              │
│         │                     │  Service         │              │
│         │                     │  (extended)      │              │
│         │                     └──────────────────┘              │
│         │                              │                         │
│         │                              │ unassign                │
│         │◀─────────────────────────────┘                         │
│         │                                                         │
│         │                                                         │
│         ▼                                                         │
│  ┌──────────────────┐                                            │
│  │  DynamoDB        │                                            │
│  │  TeamMembers     │                                            │
│  │  Table (NEW)     │                                            │
│  └──────────────────┘                                            │
│                                                                   │
│  ┌──────────────────┐                                            │
│  │  AIBottleneck    │                                            │
│  │  Handler         │                                            │
│  │  (extended)      │                                            │
│  └──────────────────┘                                            │
│         │                                                         │
│         │ uses                                                    │
│         ▼                                                         │
│  ┌──────────────────┐                                            │
│  │  Bottleneck      │                                            │
│  │  Analysis        │                                            │
│  │  Service         │                                            │
│  │  (extended)      │                                            │
│  └──────────────────┘                                            │
│         │                                                         │
│         │ reads                                                   │
│         ▼                                                         │
│  ┌──────────────────┐         ┌──────────────────┐              │
│  │  TeamMembers     │         │  Cards           │              │
│  │  Service         │         │  Service         │              │
│  └──────────────────┘         └──────────────────┘              │
│         │                              │                         │
│         │                              │                         │
│         ▼                              ▼                         │
│  ┌──────────────────┐         ┌──────────────────┐              │
│  │  DynamoDB        │         │  DynamoDB        │              │
│  │  TeamMembers     │         │  Cards           │              │
│  │  Table           │         │  Table           │              │
│  └──────────────────┘         └──────────────────┘              │
│                                                                   │
│  ┌──────────────────┐                                            │
│  │  WebSocket       │                                            │
│  │  Service         │                                            │
│  └──────────────────┘                                            │
│         │                                                         │
│         │ broadcasts                                              │
│         ▼                                                         │
│  ┌──────────────────┐                                            │
│  │  DynamoDB        │                                            │
│  │  Connections     │                                            │
│  │  Table           │                                            │
│  └──────────────────┘                                            │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘
```

---

## Dependency Details

### Frontend Dependencies

#### TeamPage
- **Depends on**: REST API (/team-members endpoints)
- **Used by**: None (top-level page)
- **Data flow**: User input → API → State update

#### BoardView (extended)
- **Depends on**: Card component, filter state
- **Used by**: App component
- **Data flow**: Filter selection → Card filtering → Display

#### Card (extended)
- **Depends on**: REST API (PUT /cards), teamMembers prop
- **Used by**: BoardView
- **Data flow**: Assignment selection → API → State update

#### AlertsPanel (extended)
- **Depends on**: WebSocket (bottleneck_alerts event)
- **Used by**: App component
- **Data flow**: WebSocket event → Alert display

---

### Backend Dependencies

#### TeamMembersHandler (NEW)
- **Depends on**: 
  - TeamMembersService (business logic)
  - WebSocketService (broadcasting)
- **Used by**: API Gateway (REST endpoints)
- **Data flow**: HTTP request → Service → DynamoDB → Response

#### TeamMembersService (NEW)
- **Depends on**: 
  - DynamoDB client (TeamMembersTable)
  - CardsService (for unassignment on delete)
- **Used by**: 
  - TeamMembersHandler
  - CardsService (validation)
  - BottleneckAnalysisService (workload calculation)
- **Data flow**: Method call → DynamoDB query/update → Return data

#### CardsHandler (extended)
- **Depends on**: 
  - CardsService (business logic)
  - WebSocketService (broadcasting)
- **Used by**: API Gateway (REST endpoints)
- **Data flow**: HTTP request → Service → DynamoDB → Response

#### CardsService (extended)
- **Depends on**: 
  - DynamoDB client (CardsTable)
  - TeamMembersService (assignee validation)
- **Used by**: 
  - CardsHandler
  - TeamMembersService (unassignment)
  - BottleneckAnalysisService (workload calculation)
- **Data flow**: Method call → DynamoDB query/update → Return data

#### AIBottleneckHandler (extended)
- **Depends on**: 
  - TeamMembersService (fetch team members)
  - CardsService (fetch cards)
  - BottleneckAnalysisService (analysis)
  - BedrockService (AI analysis)
  - WebSocketService (broadcasting)
- **Used by**: EventBridge (scheduled trigger)
- **Data flow**: Trigger → Fetch data → Analyze → Broadcast alerts

#### BottleneckAnalysisService (extended)
- **Depends on**: 
  - TeamMembersService (team member data)
  - CardsService (card data)
- **Used by**: AIBottleneckHandler
- **Data flow**: Cards + TeamMembers → Analysis → Alerts

---

## Circular Dependency Resolution

### TeamMembersService ↔ CardsService

**Problem**: 
- TeamMembersService needs CardsService to unassign cards on delete
- CardsService needs TeamMembersService to validate assignee IDs

**Solution**:
- Both services access DynamoDB directly
- TeamMembersService.delete() directly updates CardsTable (no CardsService call)
- CardsService.assignTeamMembers() directly queries TeamMembersTable (no TeamMembersService call)
- This breaks the circular dependency

**Updated Flow**:
```
TeamMembersService.delete(id)
  └─> Query CardsTable for cards with assignee
  └─> Update each card to remove assignee
  └─> Delete from TeamMembersTable

CardsService.assignTeamMembers(cardId, assigneeIds)
  └─> Query TeamMembersTable to validate IDs
  └─> Update CardsTable with assignees
```

---

## Data Flow Scenarios

### Scenario 1: Create Team Member
```
User (TeamPage)
  └─> POST /team-members {name}
      └─> TeamMembersHandler
          └─> TeamMembersService.create(name)
              └─> Check uniqueness (DynamoDB query)
              └─> Create in TeamMembersTable
              └─> Return TeamMember
          └─> Broadcast team_member_created (WebSocket)
          └─> Return 201 + TeamMember
      └─> TeamPage updates state
```

### Scenario 2: Assign Team Members to Card
```
User (Card component)
  └─> PUT /cards/{id} {assignees: [id1, id2]}
      └─> CardsHandler
          └─> CardsService.assignTeamMembers(id, [id1, id2])
              └─> Validate assignee IDs (query TeamMembersTable)
              └─> Update card in CardsTable
              └─> Set assignedAt timestamp
              └─> Return updated Card
          └─> Broadcast card_updated (WebSocket)
          └─> Return 200 + Card
      └─> Card component updates display
```

### Scenario 3: Delete Team Member
```
User (TeamPage)
  └─> DELETE /team-members/{id}
      └─> TeamMembersHandler
          └─> TeamMembersService.delete(id)
              └─> Query CardsTable for cards with this assignee
              └─> Update each card to remove assignee
              └─> Delete from TeamMembersTable
              └─> Return void
          └─> Broadcast team_member_deleted (WebSocket)
          └─> Return 204
      └─> TeamPage removes from state
      └─> Cards update via WebSocket (assignee removed)
```

### Scenario 4: Workload Analysis
```
EventBridge (every 5 min)
  └─> AIBottleneckHandler
      └─> Fetch all cards (CardsService)
      └─> Fetch all team members (TeamMembersService)
      └─> BottleneckAnalysisService.analyzeTeamWorkload()
          └─> detectOverloadedMembers()
              └─> Calculate workload per member
              └─> Generate alerts for >8 points
          └─> detectUnassignedCards()
              └─> Find unassigned cards in active columns
              └─> Generate alerts
          └─> detectWorkloadImbalance()
              └─> Compare workloads
              └─> Generate alert if imbalanced
          └─> Return combined alerts
      └─> Combine with AI alerts (Bedrock)
      └─> Broadcast bottleneck_alerts (WebSocket)
  └─> AlertsPanel receives and displays
```

---

## Summary

**New Dependencies**: 3
- TeamMembersHandler → TeamMembersService
- TeamMembersService → TeamMembersTable (DynamoDB)
- TeamMembersService ↔ CardsTable (for unassignment)

**Extended Dependencies**: 4
- CardsService → TeamMembersTable (validation)
- BottleneckAnalysisService → TeamMembersService
- AIBottleneckHandler → TeamMembersService
- Frontend components → /team-members API

**Circular Dependencies Resolved**: 1
- TeamMembersService ↔ CardsService (resolved by direct DynamoDB access)

**Total Dependencies**: 7 new/extended
