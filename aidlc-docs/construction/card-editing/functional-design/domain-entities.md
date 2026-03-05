# Domain Entities - Card Editing Feature

## Core Entities

### Card Entity
The primary domain entity representing a task or work item on the Kanban board.

**Entity Structure**:
```typescript
interface Card {
  // Identity
  id: string;                    // UUID, immutable
  
  // Editable Content Fields
  title: string;                 // Max 60 chars, required
  description: string;           // Unlimited length, optional
  acceptanceCriteria: string[];  // Array of criteria strings, optional
  
  // Editable Metadata Fields
  storyPoints: number;           // Fibonacci: 1, 2, 3, 5, 8, 13
  priority: 'low' | 'medium' | 'high';
  
  // Non-Editable Position Fields
  column: 'To Do' | 'In Progress' | 'Done';
  position: number;              // Order within column
  
  // System Metadata (Non-Editable)
  aiGenerated: boolean;          // True if created by AI
  createdAt: string;             // ISO timestamp
  updatedAt: string;             // ISO timestamp, auto-updated
}
```

**Field Categories**:
- **Editable via Edit Modal**: title, description, acceptanceCriteria, storyPoints, priority
- **Editable via Drag-and-Drop**: column, position
- **System-Managed**: id, aiGenerated, createdAt, updatedAt

### EditFormState Entity
Represents the temporary state of the card while being edited in the modal.

**Entity Structure**:
```typescript
interface EditFormState {
  // Form Field Values (mirrors editable Card fields)
  title: string;
  description: string;
  storyPoints: number;
  priority: 'low' | 'medium' | 'high';
  acceptanceCriteria: string;    // Plain text (newline-separated)
  
  // UI State
  isOpen: boolean;               // Modal visibility
  isSaving: boolean;             // Save operation in progress
  error: string | null;          // API error message
  
  // Validation State
  errors: ValidationErrors;
  
  // Original Card Reference
  cardId: string;                // ID of card being edited
}
```

**State Lifecycle**:
1. **Initialization**: Populated from Card when modal opens
2. **Editing**: Updated as user modifies fields
3. **Validation**: Errors populated on save attempt
4. **Persistence**: Transformed to Card update payload
5. **Cleanup**: Reset when modal closes

### ValidationErrors Entity
Represents validation errors for form fields.

**Entity Structure**:
```typescript
interface ValidationErrors {
  title?: string;        // "Title is required" or "Title must be 60 characters or less"
  storyPoints?: string;  // "Story points must be selected"
  priority?: string;     // "Priority must be selected"
}
```

**Error Messages**:
- **title**: 
  - Empty: "Title is required"
  - Too long: "Title must be 60 characters or less"
- **storyPoints**: 
  - Not selected: "Story points must be selected"
- **priority**: 
  - Not selected: "Priority must be selected"

### CardUpdatePayload Entity
Represents the data sent to the backend API for updating a card.

**Entity Structure**:
```typescript
interface CardUpdatePayload {
  title: string;                 // Trimmed, validated
  description: string;           // Trimmed
  storyPoints: number;           // Validated Fibonacci number
  priority: 'low' | 'medium' | 'high';
  acceptanceCriteria: string[];  // Converted from text to array
}
```

**Transformation Rules**:
- **title**: Trim whitespace, validate length
- **description**: Trim whitespace
- **storyPoints**: Parse to integer, validate against allowed values
- **priority**: Validate against allowed values
- **acceptanceCriteria**: Split by newline, trim each line, filter empty lines

### WebSocketCardUpdateEvent Entity
Represents the real-time update event broadcast to all clients.

**Entity Structure**:
```typescript
interface WebSocketCardUpdateEvent {
  action: 'card_updated';
  data: Card;                    // Complete updated card object
}
```

**Broadcasting Rules**:
- **Trigger**: After successful database update
- **Recipients**: All connected WebSocket clients
- **Payload**: Complete Card entity with all fields

## Entity Relationships

```
Card (Database)
    |
    | Read on double-click
    v
EditFormState (UI)
    |
    | User edits
    v
ValidationErrors (UI)
    |
    | Validation passes
    v
CardUpdatePayload (API Request)
    |
    | API call
    v
Card (Database - Updated)
    |
    | Broadcast
    v
WebSocketCardUpdateEvent (Real-time)
    |
    | Received by clients
    v
Card (UI - All Clients)
```

## Entity Constraints

### Card Constraints
- **id**: Must be valid UUID
- **title**: 1-60 characters, non-empty after trim
- **description**: 0-unlimited characters
- **acceptanceCriteria**: Array of strings, can be empty
- **storyPoints**: Must be 1, 2, 3, 5, 8, or 13
- **priority**: Must be "low", "medium", or "high"
- **column**: Must be "To Do", "In Progress", or "Done"
- **position**: Non-negative integer
- **aiGenerated**: Boolean
- **createdAt**: ISO 8601 timestamp
- **updatedAt**: ISO 8601 timestamp

### EditFormState Constraints
- **title**: String, validated on submit
- **description**: String, no validation
- **storyPoints**: Number, validated on submit
- **priority**: String, validated on submit
- **acceptanceCriteria**: String (plain text), no validation
- **isOpen**: Boolean
- **isSaving**: Boolean
- **error**: String or null
- **errors**: Object with optional string properties
- **cardId**: Must match existing Card id

### CardUpdatePayload Constraints
- **title**: 1-60 characters after trim, required
- **description**: Any string after trim
- **storyPoints**: Must be 1, 2, 3, 5, 8, or 13
- **priority**: Must be "low", "medium", or "high"
- **acceptanceCriteria**: Array of non-empty strings

## Entity Lifecycle

### Card Lifecycle
```
Created (via card creation or AI generation)
    |
    v
Displayed on board
    |
    v
User double-clicks
    |
    v
Loaded into EditFormState
    |
    v
User edits and saves
    |
    v
Updated in database
    |
    v
Broadcast via WebSocket
    |
    v
Updated in all clients' UI
```

### EditFormState Lifecycle
```
Modal opens
    |
    v
Initialize from Card
    |
    v
User edits fields
    |
    v
User clicks Save
    |
    v
Validate fields
    |
    +-- Valid --> Transform to CardUpdatePayload --> API call
    |
    +-- Invalid --> Populate errors --> Display errors
    |
    v
API response
    |
    +-- Success --> Close modal --> Reset state
    |
    +-- Error --> Display error --> Keep modal open
```

## Data Transformations

### Card → EditFormState
```typescript
function cardToFormState(card: Card): EditFormState {
  return {
    title: card.title,
    description: card.description,
    storyPoints: card.storyPoints,
    priority: card.priority,
    acceptanceCriteria: card.acceptanceCriteria.join('\n'),
    isOpen: true,
    isSaving: false,
    error: null,
    errors: {},
    cardId: card.id
  };
}
```

### EditFormState → CardUpdatePayload
```typescript
function formStateToPayload(formState: EditFormState): CardUpdatePayload {
  return {
    title: formState.title.trim(),
    description: formState.description.trim(),
    storyPoints: formState.storyPoints,
    priority: formState.priority,
    acceptanceCriteria: formState.acceptanceCriteria
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
  };
}
```

### API Response → Card
```typescript
function apiResponseToCard(response: any): Card {
  // API returns complete Card object
  return response as Card;
}
```

## Validation Rules by Entity

### Card Validation (Server-Side)
- **title**: Required, max 60 chars
- **description**: Optional, no max
- **storyPoints**: Required, must be 1, 2, 3, 5, 8, or 13
- **priority**: Required, must be "low", "medium", or "high"
- **acceptanceCriteria**: Optional array

### EditFormState Validation (Client-Side)
- **title**: 
  - Required: `title.trim().length > 0`
  - Max length: `title.length <= 60`
- **storyPoints**: Required: `storyPoints !== null && storyPoints !== undefined`
- **priority**: Required: `priority !== null && priority !== undefined`
- **description**: No validation
- **acceptanceCriteria**: No validation

### CardUpdatePayload Validation (Both Sides)
- Same as Card validation
- Ensures consistency between client and server

## Entity Invariants

### Card Invariants
- **id** never changes after creation
- **aiGenerated** never changes after creation
- **createdAt** never changes after creation
- **updatedAt** always updated on save
- **column** and **position** only changed via drag-and-drop (not edit modal)

### EditFormState Invariants
- **cardId** never changes while modal is open
- **isOpen** is true while modal is visible
- **isSaving** is true only during API call
- **errors** is empty object when no validation errors exist

## Entity Storage

### Card Storage
- **Location**: DynamoDB Cards table
- **Partition Key**: id
- **Attributes**: All Card fields
- **Indexes**: ColumnIndex (column + position)

### EditFormState Storage
- **Location**: React component state (useState)
- **Scope**: Edit modal component only
- **Lifetime**: While modal is open
- **Cleanup**: Reset when modal closes

### ValidationErrors Storage
- **Location**: React component state (part of EditFormState)
- **Scope**: Edit modal component only
- **Lifetime**: Until next validation or modal close
- **Cleanup**: Reset on successful save or modal close
