# Requirements - Card Editing Feature

## Intent Analysis Summary

### User Request
"I want to be able to edit the cards that are on the board."

### Request Type
Enhancement - Adding edit capability to existing card functionality

### Scope Estimate
Single Component - Frontend React component + Backend Lambda handler modifications

### Complexity Estimate
Moderate - Requires UI modal, validation logic, API endpoint modification, and real-time broadcasting

---

## Functional Requirements

### FR1: Card Edit Initiation
- **FR1.1**: Users shall be able to initiate card editing by double-clicking on any card
- **FR1.2**: Double-click shall work on any visible part of the card (title, description area, metadata)
- **FR1.3**: Edit functionality shall be available for cards in all columns (To Do, In Progress, Done)

### FR2: Edit Interface
- **FR2.1**: Card editing shall be presented in a modal dialog (popup overlay)
- **FR2.2**: Modal shall display all card fields in an editable form
- **FR2.3**: Modal shall have a semi-transparent backdrop that dims the background board
- **FR2.4**: Modal shall be centered on the screen and responsive to different viewport sizes

### FR3: Editable Fields
- **FR3.1**: All card fields shall be editable:
  - Title (text input, max 60 characters)
  - Description (textarea, multi-line)
  - Story Points (dropdown: 1, 2, 3, 5, 8, 13)
  - Priority (dropdown: low, medium, high)
  - Acceptance Criteria (textarea, multi-line text block)
- **FR3.2**: The card's column position shall NOT be editable in the edit modal (use drag-and-drop instead)
- **FR3.3**: The card's ID, createdAt, and aiGenerated flag shall NOT be editable

### FR4: AI-Generated Card Handling
- **FR4.1**: AI-generated cards shall be fully editable with no restrictions
- **FR4.2**: The aiGenerated flag shall remain true after editing
- **FR4.3**: No warning or confirmation shall be required to edit AI-generated cards

### FR5: Field Validation
- **FR5.1**: Title field validation:
  - Required (cannot be empty)
  - Maximum 60 characters
  - Display character count (e.g., "45/60")
- **FR5.2**: Description field validation:
  - Optional (can be empty)
  - No maximum length
- **FR5.3**: Story Points validation:
  - Required
  - Must be one of: 1, 2, 3, 5, 8, 13
- **FR5.4**: Priority validation:
  - Required
  - Must be one of: low, medium, high
- **FR5.5**: Acceptance Criteria validation:
  - Optional (can be empty)
  - Edited as a single text block (not individual list items)
- **FR5.6**: Validation errors shall be displayed inline near the invalid field
- **FR5.7**: Save button shall be disabled when validation errors exist

### FR6: Save and Cancel Behavior
- **FR6.1**: Modal shall have two buttons: "Save" and "Cancel"
- **FR6.2**: Clicking "Save" button shall:
  - Validate all fields
  - If valid: save changes to database, broadcast to other users, close modal
  - If invalid: display validation errors, keep modal open
- **FR6.3**: Clicking "Cancel" button shall:
  - Discard all changes
  - Close modal without saving
- **FR6.4**: Clicking outside the modal (on backdrop) shall:
  - Discard all changes
  - Close modal without saving
  - Behave identically to clicking "Cancel"
- **FR6.5**: Pressing Escape key shall behave identically to clicking "Cancel"
- **FR6.6**: No auto-save functionality - changes only persist on explicit "Save" action

### FR7: Real-time Broadcasting
- **FR7.1**: Card updates shall be broadcast via WebSocket only when user clicks "Save"
- **FR7.2**: Broadcast message shall include complete updated card data
- **FR7.3**: All connected clients shall receive the card_updated event
- **FR7.4**: Receiving clients shall update their local card state immediately
- **FR7.5**: If the edited card is visible on another user's board, it shall update in real-time

### FR8: Concurrent Edit Handling
- **FR8.1**: Last save wins - no conflict detection or locking mechanism
- **FR8.2**: If two users edit the same card simultaneously, the second save shall overwrite the first
- **FR8.3**: No warning shall be displayed when another user is editing the same card
- **FR8.4**: Users shall see updates from other users via WebSocket broadcasts

### FR9: Edit History
- **FR9.1**: Edit history/audit trail is deferred to a future iteration
- **FR9.2**: Only the card's updatedAt timestamp shall be updated on save
- **FR9.3**: No tracking of who made changes or what fields were modified

### FR10: Backend API
- **FR10.1**: Existing PUT /cards/{id} endpoint shall be used for updates
- **FR10.2**: API shall validate all fields server-side (same rules as card creation)
- **FR10.3**: API shall return 400 Bad Request for validation errors
- **FR10.4**: API shall return 404 Not Found if card ID doesn't exist
- **FR10.5**: API shall update the updatedAt timestamp automatically
- **FR10.6**: API shall broadcast card_updated event to all WebSocket connections

---

## Non-Functional Requirements

### NFR1: Performance
- **NFR1.1**: Modal shall open within 100ms of double-click
- **NFR1.2**: Save operation shall complete within 500ms under normal conditions
- **NFR1.3**: WebSocket broadcast shall reach all clients within 200ms

### NFR2: Usability
- **NFR2.1**: Edit modal shall be keyboard accessible (Tab navigation, Enter to save, Escape to cancel)
- **NFR2.2**: Form fields shall have clear labels and placeholders
- **NFR2.3**: Validation errors shall be clear and actionable
- **NFR2.4**: Modal shall be visually consistent with existing card creation modal

### NFR3: Reliability
- **NFR3.1**: Failed save operations shall display error message to user
- **NFR3.2**: Network errors shall not close the modal (allow user to retry)
- **NFR3.3**: Validation shall occur both client-side and server-side

### NFR4: Compatibility
- **NFR4.1**: Edit functionality shall work in all browsers supported by React 18
- **NFR4.2**: Modal shall be responsive and work on tablet-sized screens (768px+)
- **NFR4.3**: Edit functionality shall work with existing drag-and-drop behavior

### NFR5: Security
- **NFR5.1**: All API requests shall use HTTPS
- **NFR5.2**: Input sanitization shall prevent XSS attacks
- **NFR5.3**: Server-side validation shall prevent malicious payloads

---

## Technical Constraints

### TC1: Existing Architecture
- Must integrate with existing DynamoDB schema (no schema changes)
- Must use existing PUT /cards/{id} Lambda handler
- Must use existing WebSocket infrastructure for broadcasting
- Must maintain compatibility with existing card creation flow

### TC2: Technology Stack
- Frontend: React 18 + TypeScript
- Backend: AWS Lambda (Node.js 20)
- Database: DynamoDB (Cards table)
- Real-time: API Gateway WebSocket

### TC3: Deployment
- No infrastructure changes required (use existing CDK stacks)
- Frontend changes deployed via S3 + CloudFront
- Backend changes deployed via Lambda function updates

---

## User Scenarios

### Scenario 1: Edit Card Title
1. User double-clicks on a card in "To Do" column
2. Edit modal opens with all fields populated
3. User changes title from "Implement login" to "Implement user authentication"
4. User clicks "Save"
5. Modal closes, card updates on board
6. Other users see the updated title in real-time

### Scenario 2: Cancel Edit
1. User double-clicks on a card
2. Edit modal opens
3. User changes description and story points
4. User clicks outside the modal (on backdrop)
5. Modal closes without saving
6. Card remains unchanged on board

### Scenario 3: Validation Error
1. User double-clicks on a card
2. Edit modal opens
3. User deletes the title (makes it empty)
4. User clicks "Save"
5. Validation error appears: "Title is required"
6. Save button is disabled
7. User enters a new title
8. Save button becomes enabled
9. User clicks "Save" successfully

### Scenario 4: Edit AI-Generated Card
1. User double-clicks on an AI-generated card (has AI badge)
2. Edit modal opens normally
3. User edits acceptance criteria
4. User clicks "Save"
5. Card updates successfully
6. AI badge remains visible on card

### Scenario 5: Concurrent Edits (Last Save Wins)
1. User A opens edit modal for Card #123
2. User B opens edit modal for Card #123
3. User A changes title to "Version A" and saves
4. User B sees the update via WebSocket
5. User B changes title to "Version B" and saves
6. Final result: Card #123 has title "Version B"
7. User A sees the update via WebSocket

---

## Success Criteria

### SC1: Functional Completeness
- All card fields can be edited via double-click modal
- Save and cancel behaviors work as specified
- Real-time updates visible to all connected users

### SC2: User Experience
- Edit flow feels intuitive and responsive
- Validation errors are clear and helpful
- Modal design matches existing UI patterns

### SC3: Technical Quality
- No breaking changes to existing functionality
- Server-side validation prevents invalid data
- WebSocket broadcasting works reliably

### SC4: Testing
- Unit tests for validation logic
- Integration tests for API endpoint
- Manual testing of concurrent edit scenarios

---

## Out of Scope (Future Iterations)

- Edit history/audit trail (deferred per Q8:D)
- Optimistic locking or conflict detection
- In-place editing (not modal-based)
- Bulk edit of multiple cards
- Undo/redo functionality
- Edit permissions or role-based access control
- Editing card position/column via modal (use drag-and-drop)
- Individual acceptance criteria item management (edit as text block only)

---

## Dependencies

### Existing Components
- Cards Lambda handler (backend/handlers/cards.ts)
- DynamoDB service (backend/services/dynamodb.ts)
- WebSocket service (backend/services/websocket.ts)
- React App component (frontend/src/App.tsx)
- Card type definitions (backend/types/card.ts)

### Existing Infrastructure
- DynamoDB Cards table
- DynamoDB Connections table
- REST API Gateway (PUT /cards/{id} endpoint)
- WebSocket API Gateway

---

## Acceptance Criteria

- [ ] User can double-click any card to open edit modal
- [ ] Edit modal displays all card fields in editable form
- [ ] All fields (title, description, story points, priority, acceptance criteria) are editable
- [ ] Title validation enforces max 60 characters and required field
- [ ] Save button is disabled when validation errors exist
- [ ] Clicking "Save" persists changes and broadcasts to other users
- [ ] Clicking "Cancel" or outside modal discards changes
- [ ] AI-generated cards are fully editable
- [ ] Real-time updates visible to all connected users
- [ ] Last save wins for concurrent edits (no conflict detection)
- [ ] updatedAt timestamp is updated on save
- [ ] Edit functionality works without breaking existing features
