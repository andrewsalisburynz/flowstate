# Data Models - Iteration 3

## TeamMember Entity

### TypeScript Interface

```typescript
interface TeamMember {
  id: string              // UUID, primary key
  name: string            // Unique (case-insensitive), required
  createdAt: string       // ISO 8601 timestamp
  updatedAt: string       // ISO 8601 timestamp
}
```

### Field Specifications

#### id
- **Type**: String (UUID v4)
- **Required**: Yes
- **Generated**: Auto-generated on creation
- **Immutable**: Yes
- **Example**: `"550e8400-e29b-41d4-a716-446655440000"`

#### name
- **Type**: String
- **Required**: Yes
- **Constraints**:
  - Min length: 1 character
  - Max length: 100 characters
  - Must be unique (case-insensitive)
  - Cannot be empty or whitespace only
- **Validation**: Trim whitespace, check uniqueness
- **Example**: `"John Doe"`

#### createdAt
- **Type**: String (ISO 8601 timestamp)
- **Required**: Yes
- **Generated**: Auto-generated on creation
- **Immutable**: Yes
- **Example**: `"2026-03-04T12:00:00.000Z"`

#### updatedAt
- **Type**: String (ISO 8601 timestamp)
- **Required**: Yes
- **Generated**: Auto-generated on creation and update
- **Mutable**: Yes (updated on every modification)
- **Example**: `"2026-03-04T13:30:00.000Z"`

---

## Card Entity (Extended)

### Updated TypeScript Interface

```typescript
interface Card {
  // Existing fields
  id: string
  title: string
  description: string
  column: string
  position: number
  storyPoints?: number
  priority?: 'low' | 'medium' | 'high'
  aiGenerated?: boolean
  acceptanceCriteria?: string[]
  columnEnteredAt?: string
  createdAt: string
  updatedAt: string
  
  // NEW FIELDS
  assignees?: string[]    // Array of TeamMember IDs
  assignedAt?: string     // ISO 8601 timestamp of last assignment change
}
```

### New Field Specifications

#### assignees
- **Type**: Array of Strings (TeamMember IDs)
- **Required**: No (optional, can be empty or undefined)
- **Constraints**:
  - Each ID must be a valid UUID
  - Each ID must reference an existing TeamMember
  - No duplicate IDs in array
  - Max 10 assignees per card
- **Default**: `[]` (empty array) or `undefined`
- **Example**: `["550e8400-e29b-41d4-a716-446655440000", "660e8400-e29b-41d4-a716-446655440001"]`

#### assignedAt
- **Type**: String (ISO 8601 timestamp)
- **Required**: No (optional)
- **Generated**: Set when assignees field is modified
- **Mutable**: Yes (updated when assignees change)
- **Behavior**:
  - Set to current timestamp when assignees array changes
  - Not updated if assignees array remains the same
  - Cleared (set to undefined) if assignees becomes empty
- **Example**: `"2026-03-04T14:00:00.000Z"`

---

## Business Rules

### TeamMember Business Rules

#### BR-TM-1: Name Uniqueness
- Team member names must be unique (case-insensitive)
- Comparison: Convert to lowercase before checking
- Scope: Global across all team members
- Error: Return 409 Conflict if name exists

#### BR-TM-2: Name Validation
- Name cannot be empty string
- Name cannot be only whitespace
- Name must be trimmed before storage
- Error: Return 400 Bad Request if invalid

#### BR-TM-3: Deletion Cascade
- When team member is deleted, remove from all card assignees
- Update all affected cards' assignedAt timestamp
- Broadcast card_updated events for affected cards
- No error if team member has no assignments

#### BR-TM-4: Immutable ID
- Team member ID cannot be changed after creation
- ID is auto-generated and never exposed for modification
- Error: Return 400 Bad Request if ID modification attempted

---

### Card Assignment Business Rules

#### BR-CA-1: Assignee Validation
- All assignee IDs must reference existing team members
- Validate each ID before updating card
- Error: Return 400 Bad Request with invalid ID if not found

#### BR-CA-2: Assignment Timestamp
- Set assignedAt when assignees array changes
- Do not update assignedAt if assignees array unchanged
- Clear assignedAt if assignees becomes empty
- Use current server timestamp (UTC)

#### BR-CA-3: Multiple Assignees
- Card can have 0 to 10 assignees
- No duplicate assignee IDs allowed
- Order of assignees in array is preserved
- Error: Return 400 Bad Request if >10 assignees

#### BR-CA-4: Unassigned Cards
- Cards with no assignees are valid
- Empty assignees array is equivalent to undefined
- Unassigned cards in "In Progress" or "Done" trigger low severity alert

---

### Workload Calculation Business Rules

#### BR-WL-1: Workload Definition
- Workload = sum of story points for cards assigned to team member in "In Progress" column
- Only count cards in "In Progress" column
- Cards without story points count as 0
- Cards with multiple assignees count full story points for each assignee

#### BR-WL-2: Overload Threshold
- Team member is overloaded if workload > 8 story points
- Threshold is fixed at 8 points (not configurable)
- Generate high severity alert when overloaded
- Alert includes current workload and affected card IDs

#### BR-WL-3: Workload Imbalance
- Imbalance exists if some members are overloaded (>8) and others are idle (0)
- Only check team members with at least one card assigned (any column)
- Generate medium severity alert when imbalanced
- Alert includes lists of overloaded and idle members

#### BR-WL-4: Unassigned Card Detection
- Check cards in "In Progress" and "Done" columns only
- Card is unassigned if assignees is empty array or undefined
- Generate low severity alert for each unassigned card
- Alert includes card ID, title, and column

---

## Data Validation Rules

### TeamMember Validation

```typescript
function validateTeamMember(data: Partial<TeamMember>): ValidationResult {
  const errors: string[] = [];
  
  // Name validation
  if (!data.name || typeof data.name !== 'string') {
    errors.push('Name is required and must be a string');
  } else {
    const trimmedName = data.name.trim();
    if (trimmedName.length === 0) {
      errors.push('Name cannot be empty or whitespace only');
    }
    if (trimmedName.length > 100) {
      errors.push('Name cannot exceed 100 characters');
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}
```

### Card Assignment Validation

```typescript
function validateAssignees(assignees: string[]): ValidationResult {
  const errors: string[] = [];
  
  // Type check
  if (!Array.isArray(assignees)) {
    errors.push('Assignees must be an array');
    return { valid: false, errors };
  }
  
  // Length check
  if (assignees.length > 10) {
    errors.push('Cannot assign more than 10 team members to a card');
  }
  
  // UUID format check
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  for (const id of assignees) {
    if (!uuidRegex.test(id)) {
      errors.push(`Invalid UUID format: ${id}`);
    }
  }
  
  // Duplicate check
  const uniqueIds = new Set(assignees);
  if (uniqueIds.size !== assignees.length) {
    errors.push('Duplicate assignee IDs are not allowed');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}
```

---

## State Transitions

### TeamMember Lifecycle

```
[Created] ──────────────────────────────────────> [Deleted]
    │                                                  ▲
    │                                                  │
    └──> [Updated] ──> [Updated] ──> [Updated] ───────┘
```

**States**:
- **Created**: Team member created with name, ID, timestamps
- **Updated**: Name modified, updatedAt timestamp changed
- **Deleted**: Team member removed, unassigned from all cards

**Transitions**:
- Create → Created: Validate name uniqueness, generate ID
- Created → Updated: Validate new name uniqueness, update timestamp
- Updated → Updated: Can be updated multiple times
- Any → Deleted: Remove from all cards, delete record

---

### Card Assignment Lifecycle

```
[Unassigned] ←──────────────────────────────────> [Assigned]
     │                                                  │
     │                                                  │
     └──────────────> [Reassigned] <───────────────────┘
                            │
                            │
                            └──────────────────────────┘
```

**States**:
- **Unassigned**: assignees is empty or undefined
- **Assigned**: assignees contains one or more team member IDs
- **Reassigned**: assignees changed (added, removed, or replaced)

**Transitions**:
- Unassigned → Assigned: Set assignees, set assignedAt
- Assigned → Reassigned: Modify assignees, update assignedAt
- Assigned → Unassigned: Clear assignees, clear assignedAt
- Reassigned → Reassigned: Can be reassigned multiple times

---

## Data Integrity Constraints

### Referential Integrity

#### TeamMember → Card
- **Relationship**: One-to-Many (one team member can be assigned to many cards)
- **Constraint**: When team member is deleted, remove from all card assignees
- **Implementation**: Cascade delete (unassign from cards)
- **Enforcement**: Application layer (Lambda function)

#### Card → TeamMember
- **Relationship**: Many-to-Many (card can have multiple assignees, team member can be on multiple cards)
- **Constraint**: All assignee IDs must reference existing team members
- **Implementation**: Validation before update
- **Enforcement**: Application layer (Lambda function)

### Uniqueness Constraints

#### TeamMember.name
- **Constraint**: Unique (case-insensitive)
- **Implementation**: GSI on lowercase name
- **Enforcement**: DynamoDB + Application layer
- **Error Handling**: Return 409 Conflict if duplicate

#### TeamMember.id
- **Constraint**: Unique (primary key)
- **Implementation**: DynamoDB partition key
- **Enforcement**: DynamoDB
- **Error Handling**: Return 409 Conflict if duplicate (should never happen with UUID)

---

## Summary

**New Data Models**: 1
- TeamMember (4 fields)

**Extended Data Models**: 1
- Card (+2 fields: assignees, assignedAt)

**Business Rules**: 13
- TeamMember: 4 rules
- Card Assignment: 4 rules
- Workload Calculation: 4 rules
- Data Validation: 1 rule

**State Transitions**: 2
- TeamMember lifecycle (3 states)
- Card assignment lifecycle (3 states)

**Data Integrity Constraints**: 4
- Referential integrity (2)
- Uniqueness constraints (2)
