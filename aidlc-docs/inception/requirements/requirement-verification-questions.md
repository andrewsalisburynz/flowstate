# Requirements Verification Questions - Card Editing Feature

Please answer the following questions to help clarify the card editing requirements for FlowState.

## Question 1
Which card fields should be editable?

A) All fields (title, description, story points, priority, acceptance criteria)
B) Only basic fields (title and description)
C) Only metadata fields (story points, priority)
D) Custom selection of fields
E) Other (please describe after [Answer]: tag below)

[Answer]: A

## Question 2
How should users initiate card editing?

A) Double-click on a card
B) Click an "Edit" button on the card
C) Right-click context menu
D) Multiple methods (e.g., double-click OR edit button)
E) Other (please describe after [Answer]: tag below)

[Answer]: A

## Question 3
Where should the edit interface appear?

A) In-place editing (edit directly on the card)
B) Modal dialog (popup overlay)
C) Side panel (slide-in from right)
D) Separate page/view
E) Other (please describe after [Answer]: tag below)

[Answer]: B

## Question 4
Should AI-generated cards be editable?

A) Yes, all cards including AI-generated ones should be editable
B) No, AI-generated cards should be read-only
C) AI-generated cards editable but with a warning/confirmation
D) Only certain fields editable for AI-generated cards
E) Other (please describe after [Answer]: tag below)

[Answer]: A

## Question 5
How should validation work for edited fields?

A) Same validation as card creation (title max 60 chars, required fields, etc.)
B) More lenient validation for edits
C) Stricter validation with additional checks
D) Field-specific validation rules
E) Other (please describe after [Answer]: tag below)

[Answer]: A

## Question 6
Should card edits be broadcast in real-time to other users?

A) Yes, immediately broadcast all edits via WebSocket
B) No, only broadcast when user saves/closes the edit dialog
C) Broadcast only certain field changes (e.g., title, column)
D) Debounced broadcasting (wait for user to stop typing)
E) Other (please describe after [Answer]: tag below)

[Answer]: A

## Question 7
What should happen if two users try to edit the same card simultaneously?

A) Last save wins (no conflict detection)
B) Show warning that another user is editing
C) Lock the card when someone starts editing
D) Merge changes intelligently
E) Other (please describe after [Answer]: tag below)

[Answer]: A

## Question 8
Should there be an edit history or audit trail?

A) Yes, track all changes with timestamps and user info
B) No, just update the card's updatedAt timestamp
C) Track only for certain fields (e.g., acceptance criteria)
D) Optional feature for future iteration
E) Other (please describe after [Answer]: tag below)

[Answer]: D

## Question 9
Should users be able to cancel edits?

A) Yes, with explicit Cancel button that reverts all changes
B) Yes, by clicking outside the edit interface
C) Yes, with both Cancel button and click-outside behavior
D) No, auto-save all changes immediately
E) Other (please describe after [Answer]: tag below)

[Answer]: B

## Question 10
Should acceptance criteria be editable as a list?

A) Yes, allow adding/removing/editing individual criteria items
B) Yes, but edit as a single text block
C) No, acceptance criteria should be read-only
D) Only allow adding new criteria, not editing existing ones
E) Other (please describe after [Answer]: tag below)

[Answer]: B
