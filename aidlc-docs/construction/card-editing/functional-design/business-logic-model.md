# Business Logic Model - Card Editing Feature

## Overview
The card editing feature enables users to modify all card fields through a modal dialog interface. The business logic handles form state management, validation, API communication, and real-time broadcasting.

## Core Business Workflows

### 1. Edit Initiation Workflow
```
User double-clicks card
    |
    v
Capture card data
    |
    v
Open edit modal with populated fields
    |
    v
Initialize form state with card values
```

### 2. Edit and Validation Workflow
```
User modifies field(s)
    |
    v
Update local form state
    |
    v
User clicks "Save"
    |
    v
Validate all fields
    |
    +-- Valid? --> Save workflow
    |
    +-- Invalid? --> Display inline errors, keep modal open
```

### 3. Save Workflow
```
Validation passes
    |
    v
Disable Save button (show "Saving...")
    |
    v
Call PUT /cards/{id} API
    |
    +-- Success? --> Update local card state
    |                    |
    |                    v
    |                Broadcast via WebSocket
    |                    |
    |                    v
    |                Close modal
    |
    +-- Error? --> Display error in modal
                       |
                       v
                   Re-enable Save button
                       |
                       v
                   Allow user to retry
```

### 4. Cancel Workflow
```
User clicks "Cancel" OR clicks outside modal
    |
    v
Discard all form changes
    |
    v
Close modal
    |
    v
No API call, no broadcast
```

## Business Rules

### BR1: Field Editability
- **Editable Fields**: title, description, storyPoints, priority, acceptanceCriteria
- **Non-Editable Fields**: id, column, position, createdAt, updatedAt, aiGenerated
- **Rationale**: Column/position changed via drag-and-drop, metadata managed by system

### BR2: Validation Rules
- **Title**:
  - Required (cannot be empty or whitespace-only)
  - Maximum 60 characters
  - Trim whitespace before validation
- **Description**:
  - Optional (can be empty)
  - No maximum length
- **Story Points**:
  - Required
  - Must be one of: 1, 2, 3, 5, 8, 13 (Fibonacci sequence)
- **Priority**:
  - Required
  - Must be one of: "low", "medium", "high"
- **Acceptance Criteria**:
  - Optional (can be empty)
  - Edited as plain text block (no structured list)

### BR3: Validation Timing
- **When**: On submit (when user clicks "Save")
- **Why**: Simplest implementation, doesn't interrupt user while typing
- **Behavior**: If validation fails, display errors and keep modal open

### BR4: Save Button Behavior
- **State**: Always enabled (not disabled during editing)
- **On Click**: Trigger validation, show errors if invalid
- **During Save**: Disabled with "Saving..." text
- **After Error**: Re-enabled to allow retry

### BR5: Error Display
- **Location**: Inline below each invalid field
- **Format**: Red text with error message
- **Examples**:
  - "Title is required"
  - "Title must be 60 characters or less"
  - "Story points must be selected"

### BR6: Cancel Behavior
- **No Confirmation**: Clicking outside or Cancel always discards changes
- **No Dirty Check**: No warning if user has unsaved changes
- **Rationale**: Simplest UX, user can easily re-open and edit again

### BR7: API Error Handling
- **Display**: Show error message in modal (above form fields)
- **Keep Modal Open**: Allow user to see error and retry
- **Error Message Format**: "Failed to save card: [error details]"
- **Retry**: User can modify fields and click Save again

### BR8: Concurrent Edit Handling
- **Strategy**: Last save wins (no conflict detection)
- **No Locking**: Multiple users can edit same card simultaneously
- **Behavior**: Second save overwrites first save
- **Real-time Updates**: Users see updates via WebSocket after each save

### BR9: Real-time Broadcasting
- **Trigger**: Only on successful save (not during editing)
- **Event**: card_updated with complete card data
- **Recipients**: All connected WebSocket clients
- **Update**: Receiving clients update their local card state

### BR10: AI-Generated Card Handling
- **Editability**: Fully editable, no restrictions
- **Flag Preservation**: aiGenerated flag remains true after editing
- **No Warning**: No confirmation or warning when editing AI cards

## Data Transformations

### Input Transformation (Card → Form State)
```javascript
// When opening edit modal
const formState = {
  title: card.title,
  description: card.description,
  storyPoints: card.storyPoints,
  priority: card.priority,
  acceptanceCriteria: card.acceptanceCriteria.join('\n') // Array to text
};
```

### Output Transformation (Form State → API Payload)
```javascript
// When saving
const payload = {
  title: formState.title.trim(),
  description: formState.description.trim(),
  storyPoints: parseInt(formState.storyPoints),
  priority: formState.priority,
  acceptanceCriteria: formState.acceptanceCriteria
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0) // Remove empty lines
};
```

## State Management

### Form State Structure
```javascript
{
  // Form field values
  title: string,
  description: string,
  storyPoints: number,
  priority: 'low' | 'medium' | 'high',
  acceptanceCriteria: string, // Plain text, newline-separated
  
  // UI state
  isOpen: boolean,
  isSaving: boolean,
  error: string | null,
  
  // Validation state
  errors: {
    title?: string,
    storyPoints?: string,
    priority?: string
  }
}
```

### State Management Approach
- **Strategy**: Local component state (useState)
- **Scope**: Edit modal component only
- **No Global State**: No Redux, Context, or external state management
- **Rationale**: Simplest implementation, modal is self-contained

## Integration Points

### Backend API
- **Endpoint**: PUT /cards/{id}
- **Method**: HTTP PUT
- **Headers**: Content-Type: application/json
- **Request Body**: Updated card fields
- **Response**: Updated card object
- **Error Codes**:
  - 400: Validation error
  - 404: Card not found
  - 500: Server error

### WebSocket
- **Event**: card_updated
- **Payload**: Complete updated card object
- **Direction**: Backend → All clients
- **Trigger**: After successful database update

### Local State
- **Update**: After successful save, update cards array in App component
- **Optimistic Update**: No - wait for API response before updating UI
- **Rationale**: Simpler error handling, ensures consistency

## Error Scenarios

### ES1: Validation Failure
- **Trigger**: User clicks Save with invalid data
- **Behavior**: Display inline errors, keep modal open
- **Recovery**: User corrects errors and clicks Save again

### ES2: API Error
- **Trigger**: API returns error response
- **Behavior**: Display error message in modal, keep modal open
- **Recovery**: User can retry or cancel

### ES3: Network Error
- **Trigger**: Network request fails
- **Behavior**: Display "Network error" message in modal
- **Recovery**: User can retry when network is restored

### ES4: Card Not Found
- **Trigger**: Card deleted by another user before save
- **Behavior**: Display "Card no longer exists" error
- **Recovery**: User closes modal, card removed from board via WebSocket

## Performance Considerations

### PC1: Modal Rendering
- **Optimization**: Render modal only when open (conditional rendering)
- **Benefit**: Reduces initial page load and memory usage

### PC2: Form State Updates
- **Approach**: Direct state updates (no debouncing)
- **Rationale**: Validation only on submit, no performance impact

### PC3: API Calls
- **Frequency**: One call per save action
- **Caching**: No caching needed (always use latest data)

### PC4: WebSocket Broadcasting
- **Frequency**: One broadcast per successful save
- **Payload Size**: Complete card object (~1-2 KB)
- **Impact**: Minimal, existing infrastructure handles this
