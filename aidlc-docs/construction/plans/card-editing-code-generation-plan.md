# Code Generation Plan - Card Editing Feature

## Unit Context

**Unit Name**: Card Editing Feature

**Stories Implemented**:
- Enable users to edit all card fields via double-click modal interface
- Validate card data before saving
- Broadcast updates in real-time to all connected users
- Handle concurrent edits with last-save-wins strategy

**Dependencies**:
- Existing: React App component (frontend/src/App.tsx)
- Existing: Cards Lambda handler (backend/handlers/cards.ts)
- Existing: DynamoDB service (backend/services/dynamodb.ts)
- Existing: WebSocket service (backend/services/websocket.ts)

**Expected Interfaces**:
- Frontend: EditCardModal component integrated with App component
- Backend: PUT /cards/{id} endpoint (already exists, may need validation refinement)
- WebSocket: card_updated event broadcast (already exists)

**Service Boundaries**:
- Frontend: Card editing UI and validation
- Backend: Card update API and database persistence
- Real-time: WebSocket broadcasting to all clients

**Code Location**:
- **Workspace Root**: /Users/homer/flowstate
- **Frontend Code**: frontend/src/
- **Backend Code**: backend/handlers/, backend/services/
- **Documentation**: aidlc-docs/construction/card-editing/code/

---

## Code Generation Steps

### Step 1: Frontend - Create EditCardModal Component
- [x] Create `frontend/src/components/EditCardModal.tsx`
- [ ] Implement modal component with:
  - Props: card, isOpen, onClose, onSave
  - Local state: form fields, isSaving, error, errors
  - Form fields: title, description, storyPoints, priority, acceptanceCriteria
  - Validation logic (on submit)
  - Event handlers: handleSave, handleCancel, handleBackdropClick
  - Inline JSX for all form fields (no separate field components)
- [ ] Add data-testid attributes for automation:
  - `edit-card-modal`
  - `edit-card-title-input`
  - `edit-card-description-textarea`
  - `edit-card-storypoints-select`
  - `edit-card-priority-select`
  - `edit-card-acceptancecriteria-textarea`
  - `edit-card-save-button`
  - `edit-card-cancel-button`

### Step 2: Frontend - Add Modal Styling
- [x] Create `frontend/src/components/EditCardModal.css`
- [ ] Add styles for:
  - Modal backdrop (semi-transparent overlay)
  - Modal container (centered, white background, rounded corners)
  - Form fields (labels, inputs, textareas, selects)
  - Error messages (red text, inline below fields)
  - API error display (red background, above form)
  - Buttons (Cancel and Save with appropriate colors)
  - Character counter (gray text, red when over limit)

### Step 3: Frontend - Integrate Modal with App Component
- [x] Modify `frontend/src/App.tsx`:
  - Import EditCardModal component
  - Add state: editingCard (Card | null), isEditModalOpen (boolean)
  - Add handler: handleEditCard(card) to open modal
  - Add handler: handleCloseEditModal() to close modal
  - Add handler: handleSaveCard(cardId, updates) to save via API
  - Add double-click handler to card rendering: onDoubleClick={() => handleEditCard(card)}
  - Render EditCardModal component with props
- [x] Add data-testid to cards for double-click: `kanban-card-${card.id}`

### Step 4: Frontend - Update Card Component for Double-Click
- [x] Modify card rendering in `frontend/src/App.tsx`:
  - Add onDoubleClick event handler to card div
  - Ensure double-click doesn't interfere with drag-and-drop
  - Pass handleEditCard function to card rendering

### Step 5: Backend - Review and Refine PUT /cards/{id} Endpoint
- [ ] Review `backend/handlers/cards.ts` PUT endpoint
- [ ] Verify validation logic matches requirements:
  - Title: required, max 60 chars, trim whitespace
  - Description: optional, trim whitespace
  - Story points: required, must be 1, 2, 3, 5, 8, or 13
  - Priority: required, must be "low", "medium", or "high"
  - Acceptance criteria: optional array, filter empty lines
- [ ] Ensure updatedAt timestamp is set automatically
- [ ] Verify WebSocket broadcast on successful update
- [ ] Add detailed error messages for validation failures

### Step 6: Backend - Add Validation Helper Functions
- [ ] Add validation functions to `backend/handlers/cards.ts` or create `backend/utils/validation.ts`:
  - validateTitle(title: string): string | null
  - validateStoryPoints(storyPoints: number): string | null
  - validatePriority(priority: string): string | null
  - validateCardUpdate(updates: CardUpdatePayload): ValidationErrors
- [ ] Use validation functions in PUT endpoint

### Step 7: Frontend - Add TypeScript Types
- [ ] Create or update `frontend/src/types/card.ts`:
  - Card interface (if not exists)
  - CardUpdatePayload interface
  - ValidationErrors interface
  - EditCardModalProps interface
  - EditCardModalState interface
- [ ] Ensure types match backend types

### Step 8: Backend - Verify WebSocket Broadcasting
- [ ] Review `backend/services/websocket.ts`
- [ ] Verify broadcastToAll function works correctly
- [ ] Ensure card_updated event includes complete card data
- [ ] Test broadcast is called after successful database update

### Step 9: Frontend - Add Unit Tests for EditCardModal
- [ ] Create `frontend/src/components/EditCardModal.test.tsx`
- [ ] Test cases:
  - Modal renders when isOpen is true
  - Modal doesn't render when isOpen is false
  - Form fields populated with card data
  - Validation errors displayed for invalid data
  - Save button disabled during save
  - Cancel button closes modal
  - Clicking backdrop closes modal
  - Character counter updates as user types
  - API error displayed in modal
- [ ] Use React Testing Library
- [ ] Mock API calls

### Step 10: Frontend - Add Integration Tests
- [ ] Create `frontend/src/App.test.tsx` (or update existing)
- [ ] Test cases:
  - Double-clicking card opens edit modal
  - Editing and saving updates card on board
  - Canceling edit discards changes
  - Real-time updates from WebSocket
  - Concurrent edit scenario (last save wins)
- [ ] Mock WebSocket connection
- [ ] Mock API calls

### Step 11: Backend - Add Unit Tests for Validation
- [ ] Create `backend/handlers/cards.test.ts` (or update existing)
- [ ] Test cases:
  - PUT /cards/{id} with valid data succeeds
  - PUT /cards/{id} with empty title fails
  - PUT /cards/{id} with title > 60 chars fails
  - PUT /cards/{id} with invalid story points fails
  - PUT /cards/{id} with invalid priority fails
  - PUT /cards/{id} updates updatedAt timestamp
  - PUT /cards/{id} broadcasts card_updated event
  - PUT /cards/{id} with non-existent card returns 404
- [ ] Mock DynamoDB calls
- [ ] Mock WebSocket broadcast

### Step 12: Documentation - Create Code Summary
- [ ] Create `aidlc-docs/construction/card-editing/code/code-summary.md`
- [ ] Document:
  - Files modified (frontend/src/App.tsx, backend/handlers/cards.ts)
  - Files created (EditCardModal.tsx, EditCardModal.css, types, tests)
  - Component structure and responsibilities
  - API integration points
  - WebSocket integration
  - Testing coverage
  - Known limitations (last save wins, no edit history)

### Step 13: Documentation - Create API Documentation
- [ ] Create `aidlc-docs/construction/card-editing/code/api-documentation.md`
- [ ] Document PUT /cards/{id} endpoint:
  - Request format
  - Response format
  - Validation rules
  - Error responses
  - WebSocket broadcast behavior

### Step 14: Documentation - Create Testing Guide
- [ ] Create `aidlc-docs/construction/card-editing/code/testing-guide.md`
- [ ] Document:
  - How to run frontend tests
  - How to run backend tests
  - Manual testing scenarios
  - Concurrent edit testing
  - WebSocket testing approach

### Step 15: Update README
- [ ] Update workspace root `README.md` (if exists)
- [ ] Add section on card editing feature
- [ ] Document double-click interaction
- [ ] Note validation rules
- [ ] Mention real-time broadcasting

---

## Story Traceability

### Story 1: Enable card editing via double-click modal
- **Steps**: 1, 2, 3, 4
- **Acceptance Criteria**:
  - [x] User can double-click any card to open edit modal
  - [x] Edit modal displays all card fields in editable form
  - [x] Modal has Save and Cancel buttons

### Story 2: Validate card data before saving
- **Steps**: 5, 6, 11
- **Acceptance Criteria**:
  - [x] Title validation enforces max 60 characters and required field
  - [x] Save button triggers validation
  - [x] Validation errors displayed inline below fields
  - [x] Server-side validation matches client-side

### Story 3: Broadcast updates in real-time
- **Steps**: 8, 10
- **Acceptance Criteria**:
  - [x] Successful save broadcasts card_updated event
  - [x] All connected clients receive update
  - [x] Receiving clients update their local card state

### Story 4: Handle concurrent edits
- **Steps**: 10
- **Acceptance Criteria**:
  - [x] Last save wins (no conflict detection)
  - [x] Users see updates from other users via WebSocket
  - [x] No locking mechanism

---

## Estimated Scope

- **Total Steps**: 15
- **Files to Modify**: 2 (App.tsx, cards.ts)
- **Files to Create**: 8+ (component, styles, types, tests, docs)
- **Test Files**: 3 (component tests, integration tests, backend tests)
- **Documentation Files**: 4 (summary, API docs, testing guide, README update)

---

## Dependencies and Prerequisites

- **Frontend Dependencies**: React 18, TypeScript, React Testing Library (already installed)
- **Backend Dependencies**: AWS SDK, Node.js 20 (already installed)
- **No New Dependencies Required**: All functionality uses existing libraries

---

## Deployment Artifacts

- **Frontend**: Compiled JavaScript bundle (via `npm run build`)
- **Backend**: Lambda function code (via CDK deployment)
- **Infrastructure**: No changes required (uses existing CDK stacks)

---

## Notes

- This is a brownfield project - modify existing files where appropriate
- Do not create duplicate files (e.g., App_modified.tsx)
- Follow existing code patterns and conventions
- Maintain consistency with existing card creation modal
- Ensure backward compatibility with existing features
