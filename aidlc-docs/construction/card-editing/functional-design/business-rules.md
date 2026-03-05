# Business Rules - Card Editing Feature

## Validation Rules

### VR1: Title Validation
**Rule**: Title must be non-empty and maximum 60 characters

**Validation Logic**:
```typescript
function validateTitle(title: string): string | null {
  const trimmed = title.trim();
  
  if (trimmed.length === 0) {
    return "Title is required";
  }
  
  if (title.length > 60) {
    return "Title must be 60 characters or less";
  }
  
  return null; // Valid
}
```

**Trigger**: On submit (when user clicks Save)

**Error Display**: Inline below title field in red text

**Character Counter**: Display "X/60" below title field

### VR2: Story Points Validation
**Rule**: Story points must be selected and be a valid Fibonacci number

**Validation Logic**:
```typescript
function validateStoryPoints(storyPoints: number | null): string | null {
  if (storyPoints === null || storyPoints === undefined) {
    return "Story points must be selected";
  }
  
  const validValues = [1, 2, 3, 5, 8, 13];
  if (!validValues.includes(storyPoints)) {
    return "Story points must be 1, 2, 3, 5, 8, or 13";
  }
  
  return null; // Valid
}
```

**Trigger**: On submit

**Error Display**: Inline below story points dropdown

**Allowed Values**: 1, 2, 3, 5, 8, 13

### VR3: Priority Validation
**Rule**: Priority must be selected

**Validation Logic**:
```typescript
function validatePriority(priority: string | null): string | null {
  if (!priority) {
    return "Priority must be selected";
  }
  
  const validValues = ['low', 'medium', 'high'];
  if (!validValues.includes(priority)) {
    return "Priority must be low, medium, or high";
  }
  
  return null; // Valid
}
```

**Trigger**: On submit

**Error Display**: Inline below priority dropdown

**Allowed Values**: "low", "medium", "high"

### VR4: Description Validation
**Rule**: Description is optional, no validation required

**Validation Logic**: None

**Allowed Values**: Any string, including empty

### VR5: Acceptance Criteria Validation
**Rule**: Acceptance criteria is optional, no validation required

**Validation Logic**: None

**Allowed Values**: Any string, including empty

**Format**: Plain text, newline-separated

## Edit Initiation Rules

### EIR1: Double-Click Trigger
**Rule**: User must double-click on a card to open edit modal

**Behavior**:
- Single click: No action (existing drag behavior)
- Double-click: Open edit modal with card data
- Click area: Entire card surface (not just specific elements)

**Implementation**:
```typescript
<div onDoubleClick={() => handleEditCard(card)}>
  {/* Card content */}
</div>
```

### EIR2: Modal Population
**Rule**: Edit modal must be populated with current card data

**Behavior**:
- Load all editable fields from card
- Convert acceptanceCriteria array to newline-separated text
- Set form state with card values
- Display modal

**Data Transformation**:
```typescript
const formState = {
  title: card.title,
  description: card.description,
  storyPoints: card.storyPoints,
  priority: card.priority,
  acceptanceCriteria: card.acceptanceCriteria.join('\n')
};
```

### EIR3: AI-Generated Card Handling
**Rule**: AI-generated cards are fully editable with no restrictions

**Behavior**:
- No warning or confirmation when editing AI cards
- aiGenerated flag remains true after editing
- Edit modal appears identical for AI and manual cards

## Save Rules

### SR1: Save Trigger
**Rule**: Save only occurs when user explicitly clicks "Save" button

**Behavior**:
- No auto-save during editing
- No save on field blur
- No debounced save
- Only explicit Save button click triggers save

### SR2: Pre-Save Validation
**Rule**: All fields must be validated before API call

**Validation Sequence**:
1. Validate title (required, max 60 chars)
2. Validate story points (required, valid Fibonacci)
3. Validate priority (required, valid value)
4. If any validation fails: Display errors, keep modal open
5. If all validation passes: Proceed to API call

### SR3: Save Button State
**Rule**: Save button is always enabled during editing, disabled during save

**States**:
- **Editing**: Enabled, text "Save"
- **Saving**: Disabled, text "Saving..."
- **After Error**: Enabled, text "Save"

**Behavior**:
- User can click Save even with invalid data
- Validation errors shown on click
- Button disabled only during API call

### SR4: API Call
**Rule**: Call PUT /cards/{id} with updated card data

**Request**:
```typescript
PUT /cards/{cardId}
Content-Type: application/json

{
  "title": "trimmed title",
  "description": "trimmed description",
  "storyPoints": 5,
  "priority": "high",
  "acceptanceCriteria": ["criterion 1", "criterion 2"]
}
```

**Response Handling**:
- **200 OK**: Update local state, broadcast, close modal
- **400 Bad Request**: Display validation error in modal
- **404 Not Found**: Display "Card not found" error
- **500 Server Error**: Display "Server error" message

### SR5: Successful Save
**Rule**: On successful save, update local state and broadcast

**Sequence**:
1. Receive updated card from API response
2. Update card in local cards array
3. WebSocket broadcast handled by backend
4. Close edit modal
5. Reset form state

### SR6: Failed Save
**Rule**: On failed save, display error and keep modal open

**Behavior**:
- Display error message above form fields
- Keep modal open
- Re-enable Save button
- Allow user to modify and retry
- User can also click Cancel to discard

## Cancel Rules

### CR1: Cancel Trigger
**Rule**: User can cancel by clicking Cancel button or clicking outside modal

**Triggers**:
- Click "Cancel" button
- Click modal backdrop (outside modal)
- Press Escape key

**Behavior**: All triggers have identical behavior

### CR2: Cancel Behavior
**Rule**: Cancel always discards changes without confirmation

**Behavior**:
- No "unsaved changes" warning
- No confirmation dialog
- Immediately close modal
- Discard all form changes
- No API call
- No WebSocket broadcast

**Rationale**: Simplest UX, user can easily re-open and edit

### CR3: Cancel During Save
**Rule**: Cancel button is disabled during save operation

**Behavior**:
- While isSaving is true, Cancel button is disabled
- User cannot close modal during API call
- Prevents race conditions and inconsistent state

## Real-Time Broadcasting Rules

### RTR1: Broadcast Trigger
**Rule**: Broadcast only occurs after successful database update

**Sequence**:
1. API call succeeds
2. Database updated
3. Backend broadcasts card_updated event
4. All WebSocket clients receive update

**No Broadcast When**:
- Validation fails
- API call fails
- User cancels edit
- User is still editing (not saved)

### RTR2: Broadcast Payload
**Rule**: Broadcast complete updated card object

**Event Structure**:
```typescript
{
  "action": "card_updated",
  "data": {
    "id": "card-uuid",
    "title": "Updated Title",
    "description": "Updated description",
    // ... all card fields
  }
}
```

### RTR3: Receiving Updates
**Rule**: All clients update their local card state on receiving broadcast

**Behavior**:
- Find card in local cards array by id
- Replace with updated card data
- Re-render UI
- If card is currently being edited by another user, their modal shows old data (last save wins)

## Concurrent Edit Rules

### CER1: No Locking
**Rule**: No card locking mechanism, multiple users can edit simultaneously

**Behavior**:
- User A opens edit modal for Card X
- User B can also open edit modal for Card X
- Both users see current card data when they open modal
- No warning that another user is editing

### CER2: Last Save Wins
**Rule**: If multiple users edit same card, last save overwrites previous saves

**Scenario**:
1. User A opens edit modal for Card X
2. User B opens edit modal for Card X
3. User A changes title to "Version A" and saves
4. User B sees update via WebSocket (modal still open with old data)
5. User B changes title to "Version B" and saves
6. Final result: Card X has title "Version B"
7. User A sees update via WebSocket

**Rationale**: Simplest implementation, no conflict resolution needed

### CER3: Real-Time Awareness
**Rule**: Users see updates from other users via WebSocket

**Behavior**:
- User A saves card
- User B receives WebSocket update
- User B's board updates immediately
- If User B has same card open in edit modal, modal shows old data
- User B can save their changes (will overwrite User A's changes)

## Error Handling Rules

### EHR1: Validation Error Display
**Rule**: Display validation errors inline below each invalid field

**Format**:
```html
<div class="error-message" style="color: red; font-size: 12px;">
  {errorMessage}
</div>
```

**Behavior**:
- Show error immediately after validation fails
- Clear error when user corrects the field and saves again
- Multiple errors can be displayed simultaneously

### EHR2: API Error Display
**Rule**: Display API errors in modal above form fields

**Format**:
```html
<div class="api-error" style="color: red; padding: 10px; background: #fee;">
  Failed to save card: {errorDetails}
</div>
```

**Behavior**:
- Show error after API call fails
- Keep modal open
- Allow user to retry or cancel

### EHR3: Network Error Handling
**Rule**: Display user-friendly message for network errors

**Error Messages**:
- Network timeout: "Network error. Please check your connection and try again."
- Server error: "Server error. Please try again later."
- Card not found: "This card no longer exists."

### EHR4: Error Recovery
**Rule**: User can recover from errors by retrying or canceling

**Recovery Options**:
- **Validation Error**: Correct invalid fields and click Save again
- **API Error**: Modify data and retry, or click Cancel
- **Network Error**: Wait for network and retry, or click Cancel

## UI State Rules

### UIR1: Loading State
**Rule**: Display loading state during save operation

**Behavior**:
- Save button text changes to "Saving..."
- Save button disabled
- Cancel button disabled
- Form fields remain enabled (user can see their data)

### UIR2: Character Counter
**Rule**: Display character counter for title field only

**Format**: "X/60" below title field

**Behavior**:
- Update counter as user types
- Show in red if over 60 characters
- Show in normal color if within limit

**Implementation**:
```typescript
<div style={{ color: title.length > 60 ? 'red' : 'gray' }}>
  {title.length}/60
</div>
```

### UIR3: Modal Backdrop
**Rule**: Modal has semi-transparent backdrop that dims background

**Behavior**:
- Backdrop covers entire screen
- Clicking backdrop closes modal (same as Cancel)
- Backdrop prevents interaction with board while modal open

### UIR4: Modal Positioning
**Rule**: Modal is centered on screen

**Behavior**:
- Horizontally centered
- Vertically centered
- Responsive to viewport size
- Scrollable if content exceeds viewport height

## Data Integrity Rules

### DIR1: Field Trimming
**Rule**: Trim whitespace from text fields before saving

**Fields to Trim**:
- title: Trim before validation and save
- description: Trim before save
- acceptanceCriteria: Trim each line before save

**Behavior**:
```typescript
const payload = {
  title: formState.title.trim(),
  description: formState.description.trim(),
  acceptanceCriteria: formState.acceptanceCriteria
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
};
```

### DIR2: Acceptance Criteria Transformation
**Rule**: Convert acceptance criteria from text to array

**Transformation**:
1. Split by newline character
2. Trim each line
3. Filter out empty lines
4. Result is array of non-empty strings

**Example**:
```
Input (text):
"Criterion 1\n\nCriterion 2\n  Criterion 3  \n\n"

Output (array):
["Criterion 1", "Criterion 2", "Criterion 3"]
```

### DIR3: Type Coercion
**Rule**: Ensure correct data types before API call

**Coercions**:
- storyPoints: Ensure number type (not string)
- priority: Ensure string type
- acceptanceCriteria: Ensure array type

### DIR4: Immutable Fields
**Rule**: Never modify non-editable fields

**Non-Editable Fields**:
- id: Never sent in update payload
- column: Changed via drag-and-drop only
- position: Changed via drag-and-drop only
- aiGenerated: Never modified
- createdAt: Never modified
- updatedAt: Managed by backend

## Business Constraints

### BC1: Required Fields
**Rule**: Title, story points, and priority are required

**Enforcement**:
- Client-side validation on submit
- Server-side validation on API call
- Cannot save card without these fields

### BC2: Optional Fields
**Rule**: Description and acceptance criteria are optional

**Behavior**:
- Can be empty strings
- Can be omitted from payload
- No validation required

### BC3: Story Points Range
**Rule**: Story points must be Fibonacci numbers: 1, 2, 3, 5, 8, 13

**Enforcement**:
- Dropdown only shows valid values
- Server validates against allowed values
- Invalid values rejected with 400 error

### BC4: Priority Values
**Rule**: Priority must be "low", "medium", or "high"

**Enforcement**:
- Dropdown only shows valid values
- Server validates against allowed values
- Invalid values rejected with 400 error

## Accessibility Rules

### AR1: Keyboard Navigation
**Rule**: Modal must be fully keyboard accessible

**Behavior**:
- Tab: Navigate between form fields
- Enter: Submit form (same as clicking Save)
- Escape: Close modal (same as clicking Cancel)
- Focus trap: Tab cycles within modal

### AR2: Focus Management
**Rule**: Focus title field when modal opens

**Behavior**:
- On modal open, set focus to title input
- User can immediately start typing
- Improves keyboard navigation UX

### AR3: ARIA Labels
**Rule**: Form fields must have proper labels

**Implementation**:
- Each input has associated <label>
- Error messages have role="alert"
- Modal has role="dialog"
