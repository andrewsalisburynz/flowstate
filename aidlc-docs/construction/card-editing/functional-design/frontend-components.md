# Frontend Components - Card Editing Feature

## Component Hierarchy

```
App (existing)
  |
  +-- KanbanBoard (existing)
  |     |
  |     +-- Column (existing)
  |           |
  |           +-- Card (existing)
  |                 |
  |                 +-- onDoubleClick handler (NEW)
  |
  +-- EditCardModal (NEW)
        |
        +-- Modal Backdrop
        +-- Modal Container
              |
              +-- Modal Header
              +-- Error Display (conditional)
              +-- Form Fields (inline JSX)
              |     |
              |     +-- Title Input
              |     +-- Description Textarea
              |     +-- Story Points Dropdown
              |     +-- Priority Dropdown
              |     +-- Acceptance Criteria Textarea
              |
              +-- Modal Footer
                    |
                    +-- Cancel Button
                    +-- Save Button
```

## Component Specifications

### EditCardModal Component

**Purpose**: Display modal dialog for editing card fields

**Type**: Functional component with local state (useState)

**Props**:
```typescript
interface EditCardModalProps {
  card: Card | null;           // Card to edit, null when closed
  isOpen: boolean;             // Modal visibility
  onClose: () => void;         // Close handler
  onSave: (cardId: string, updates: CardUpdatePayload) => Promise<void>;
}
```

**State**:
```typescript
interface EditCardModalState {
  // Form field values
  title: string;
  description: string;
  storyPoints: number;
  priority: 'low' | 'medium' | 'high';
  acceptanceCriteria: string;
  
  // UI state
  isSaving: boolean;
  error: string | null;
  
  // Validation state
  errors: {
    title?: string;
    storyPoints?: string;
    priority?: string;
  };
}
```

**Lifecycle**:
1. **Mount**: Initialize state from card prop
2. **Edit**: Update state as user modifies fields
3. **Save**: Validate, call onSave prop, handle response
4. **Close**: Reset state, call onClose prop

**Rendering Logic**:
```typescript
if (!isOpen || !card) {
  return null; // Don't render when closed
}

return (
  <div className="modal-backdrop" onClick={handleBackdropClick}>
    <div className="modal-container" onClick={stopPropagation}>
      {/* Modal content */}
    </div>
  </div>
);
```

### Form Fields (Inline JSX)

All form fields are inline JSX within EditCardModal component (no separate components).

#### Title Input Field

**Structure**:
```jsx
<div className="form-field">
  <label htmlFor="title">Title *</label>
  <input
    id="title"
    type="text"
    value={title}
    onChange={(e) => setTitle(e.target.value)}
    maxLength={60}
    placeholder="Enter card title"
  />
  <div className="char-counter" style={{ color: title.length > 60 ? 'red' : 'gray' }}>
    {title.length}/60
  </div>
  {errors.title && (
    <div className="error-message">{errors.title}</div>
  )}
</div>
```

**Behavior**:
- Updates title state on change
- Shows character counter (X/60)
- Counter turns red if over 60 chars
- Shows validation error below field

#### Description Textarea Field

**Structure**:
```jsx
<div className="form-field">
  <label htmlFor="description">Description</label>
  <textarea
    id="description"
    value={description}
    onChange={(e) => setDescription(e.target.value)}
    rows={4}
    placeholder="Enter card description"
  />
</div>
```

**Behavior**:
- Updates description state on change
- No validation
- No character counter
- Multi-line input (4 rows)

#### Story Points Dropdown Field

**Structure**:
```jsx
<div className="form-field">
  <label htmlFor="storyPoints">Story Points *</label>
  <select
    id="storyPoints"
    value={storyPoints}
    onChange={(e) => setStoryPoints(parseInt(e.target.value))}
  >
    <option value="">Select story points</option>
    <option value="1">1</option>
    <option value="2">2</option>
    <option value="3">3</option>
    <option value="5">5</option>
    <option value="8">8</option>
    <option value="13">13</option>
  </select>
  {errors.storyPoints && (
    <div className="error-message">{errors.storyPoints}</div>
  )}
</div>
```

**Behavior**:
- Updates storyPoints state on change
- Parses value to integer
- Shows validation error below field
- Only allows valid Fibonacci values

#### Priority Dropdown Field

**Structure**:
```jsx
<div className="form-field">
  <label htmlFor="priority">Priority *</label>
  <select
    id="priority"
    value={priority}
    onChange={(e) => setPriority(e.target.value)}
  >
    <option value="">Select priority</option>
    <option value="low">Low</option>
    <option value="medium">Medium</option>
    <option value="high">High</option>
  </select>
  {errors.priority && (
    <div className="error-message">{errors.priority}</div>
  )}
</div>
```

**Behavior**:
- Updates priority state on change
- Shows validation error below field
- Only allows valid priority values

#### Acceptance Criteria Textarea Field

**Structure**:
```jsx
<div className="form-field">
  <label htmlFor="acceptanceCriteria">Acceptance Criteria</label>
  <textarea
    id="acceptanceCriteria"
    value={acceptanceCriteria}
    onChange={(e) => setAcceptanceCriteria(e.target.value)}
    rows={6}
    placeholder="Enter acceptance criteria (one per line)"
  />
  <div className="field-hint">Enter one criterion per line</div>
</div>
```

**Behavior**:
- Updates acceptanceCriteria state on change
- No validation
- Multi-line input (6 rows)
- Plain text (no rich formatting)

### Modal Buttons

#### Cancel Button

**Structure**:
```jsx
<button
  type="button"
  onClick={handleCancel}
  disabled={isSaving}
  className="btn-cancel"
>
  Cancel
</button>
```

**Behavior**:
- Calls handleCancel function
- Disabled during save operation
- Discards all changes
- Closes modal

#### Save Button

**Structure**:
```jsx
<button
  type="button"
  onClick={handleSave}
  disabled={isSaving}
  className="btn-save"
>
  {isSaving ? 'Saving...' : 'Save'}
</button>
```

**Behavior**:
- Calls handleSave function
- Disabled during save operation
- Text changes to "Saving..." during save
- Triggers validation and API call

### Error Display

#### API Error Display

**Structure**:
```jsx
{error && (
  <div className="api-error" role="alert">
    {error}
  </div>
)}
```

**Behavior**:
- Displayed above form fields
- Shows API error messages
- Red background with padding
- Dismisses on successful save

#### Validation Error Display

**Structure**:
```jsx
{errors.fieldName && (
  <div className="error-message" role="alert">
    {errors.fieldName}
  </div>
)}
```

**Behavior**:
- Displayed below each invalid field
- Red text, small font
- Shows field-specific error message
- Clears on successful validation

## Component State Management

### State Initialization

**When Modal Opens**:
```typescript
useEffect(() => {
  if (isOpen && card) {
    setTitle(card.title);
    setDescription(card.description);
    setStoryPoints(card.storyPoints);
    setPriority(card.priority);
    setAcceptanceCriteria(card.acceptanceCriteria.join('\n'));
    setIsSaving(false);
    setError(null);
    setErrors({});
  }
}, [isOpen, card]);
```

### State Updates

**Field Changes**:
```typescript
const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  setTitle(e.target.value);
};

const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
  setDescription(e.target.value);
};

const handleStoryPointsChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
  setStoryPoints(parseInt(e.target.value));
};

const handlePriorityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
  setPriority(e.target.value as 'low' | 'medium' | 'high');
};

const handleAcceptanceCriteriaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
  setAcceptanceCriteria(e.target.value);
};
```

### State Reset

**When Modal Closes**:
```typescript
const resetState = () => {
  setTitle('');
  setDescription('');
  setStoryPoints(0);
  setPriority('low');
  setAcceptanceCriteria('');
  setIsSaving(false);
  setError(null);
  setErrors({});
};
```

## Event Handlers

### handleSave

**Purpose**: Validate form and save card

**Implementation**:
```typescript
const handleSave = async () => {
  // Validate fields
  const validationErrors: ValidationErrors = {};
  
  if (title.trim().length === 0) {
    validationErrors.title = "Title is required";
  } else if (title.length > 60) {
    validationErrors.title = "Title must be 60 characters or less";
  }
  
  if (!storyPoints) {
    validationErrors.storyPoints = "Story points must be selected";
  }
  
  if (!priority) {
    validationErrors.priority = "Priority must be selected";
  }
  
  // If validation errors, display and return
  if (Object.keys(validationErrors).length > 0) {
    setErrors(validationErrors);
    return;
  }
  
  // Clear errors
  setErrors({});
  setError(null);
  
  // Set saving state
  setIsSaving(true);
  
  try {
    // Prepare payload
    const payload: CardUpdatePayload = {
      title: title.trim(),
      description: description.trim(),
      storyPoints: storyPoints,
      priority: priority,
      acceptanceCriteria: acceptanceCriteria
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0)
    };
    
    // Call onSave prop
    await onSave(card.id, payload);
    
    // Success - close modal
    onClose();
  } catch (err: any) {
    // Display error
    setError(err.message || 'Failed to save card');
  } finally {
    // Reset saving state
    setIsSaving(false);
  }
};
```

### handleCancel

**Purpose**: Close modal without saving

**Implementation**:
```typescript
const handleCancel = () => {
  if (!isSaving) {
    resetState();
    onClose();
  }
};
```

### handleBackdropClick

**Purpose**: Close modal when clicking outside

**Implementation**:
```typescript
const handleBackdropClick = (e: React.MouseEvent) => {
  if (e.target === e.currentTarget && !isSaving) {
    handleCancel();
  }
};
```

### handleKeyDown

**Purpose**: Handle keyboard shortcuts

**Implementation**:
```typescript
const handleKeyDown = (e: React.KeyboardEvent) => {
  if (e.key === 'Escape' && !isSaving) {
    handleCancel();
  } else if (e.key === 'Enter' && e.ctrlKey) {
    handleSave();
  }
};
```

## Integration with App Component

### App Component Changes

**Add State**:
```typescript
const [editingCard, setEditingCard] = useState<Card | null>(null);
const [isEditModalOpen, setIsEditModalOpen] = useState(false);
```

**Add Handler**:
```typescript
const handleEditCard = (card: Card) => {
  setEditingCard(card);
  setIsEditModalOpen(true);
};

const handleCloseEditModal = () => {
  setIsEditModalOpen(false);
  setEditingCard(null);
};

const handleSaveCard = async (cardId: string, updates: CardUpdatePayload) => {
  // Call API
  const response = await fetch(`${API_URL}/cards/${cardId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates)
  });
  
  if (!response.ok) {
    throw new Error('Failed to save card');
  }
  
  const updatedCard = await response.json();
  
  // Update local state
  setCards(cards.map(c => c.id === cardId ? updatedCard : c));
  
  // WebSocket broadcast handled by backend
};
```

**Add Double-Click Handler to Cards**:
```typescript
<div
  className="card"
  draggable
  onDragStart={(e) => handleDragStart(e, card)}
  onDoubleClick={() => handleEditCard(card)}
>
  {/* Card content */}
</div>
```

**Render Modal**:
```typescript
<EditCardModal
  card={editingCard}
  isOpen={isEditModalOpen}
  onClose={handleCloseEditModal}
  onSave={handleSaveCard}
/>
```

## API Integration Points

### PUT /cards/{id} Endpoint

**Request**:
```typescript
fetch(`${API_URL}/cards/${cardId}`, {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    title: "Updated Title",
    description: "Updated description",
    storyPoints: 5,
    priority: "high",
    acceptanceCriteria: ["Criterion 1", "Criterion 2"]
  })
})
```

**Response (Success)**:
```json
{
  "id": "card-uuid",
  "title": "Updated Title",
  "description": "Updated description",
  "storyPoints": 5,
  "priority": "high",
  "acceptanceCriteria": ["Criterion 1", "Criterion 2"],
  "column": "In Progress",
  "position": 0,
  "aiGenerated": false,
  "createdAt": "2026-03-05T00:00:00Z",
  "updatedAt": "2026-03-05T00:15:00Z"
}
```

**Response (Error)**:
```json
{
  "error": "Validation failed",
  "details": "Title is required"
}
```

### WebSocket Integration

**Receiving Updates**:
```typescript
useEffect(() => {
  if (ws) {
    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      
      if (message.action === 'card_updated') {
        // Update local state
        setCards(cards.map(c => 
          c.id === message.data.id ? message.data : c
        ));
      }
    };
  }
}, [ws, cards]);
```

## Styling Requirements

### Modal Backdrop
```css
.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
```

### Modal Container
```css
.modal-container {
  background: white;
  border-radius: 8px;
  padding: 24px;
  max-width: 600px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}
```

### Form Field
```css
.form-field {
  margin-bottom: 16px;
}

.form-field label {
  display: block;
  margin-bottom: 4px;
  font-weight: 500;
}

.form-field input,
.form-field select,
.form-field textarea {
  width: 100%;
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 14px;
}
```

### Error Message
```css
.error-message {
  color: #d32f2f;
  font-size: 12px;
  margin-top: 4px;
}

.api-error {
  background: #ffebee;
  color: #c62828;
  padding: 12px;
  border-radius: 4px;
  margin-bottom: 16px;
}
```

### Buttons
```css
.btn-cancel,
.btn-save {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  margin-left: 8px;
}

.btn-cancel {
  background: #f5f5f5;
  color: #333;
}

.btn-save {
  background: #1976d2;
  color: white;
}

.btn-save:disabled {
  background: #ccc;
  cursor: not-allowed;
}
```

## Accessibility Features

### ARIA Attributes
- Modal has `role="dialog"`
- Modal has `aria-labelledby` pointing to title
- Error messages have `role="alert"`
- Form fields have associated labels

### Keyboard Navigation
- Tab: Navigate between fields
- Enter: Submit form (Ctrl+Enter)
- Escape: Close modal
- Focus trap within modal

### Focus Management
- Focus title field on modal open
- Return focus to card on modal close
