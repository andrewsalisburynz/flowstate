# Requirement Verification Questions - Iteration 3

## Instructions
Please answer all questions by filling in the [Answer]: tags. For multiple-choice questions, select the option letter (A, B, C, D, etc.).

---

## Team Member Management

### Q1: Team Member Data Model
What information should we store for each team member?

Options:
A. Name only
B. Name + Email
C. Name + Email + Avatar/Photo
D. Name + Email + Avatar + Role/Title
E. Custom (please specify)

[Answer]: A

### Q2: Team Member Creation
How should team members be added to the system?

Options:
A. Simple form with manual entry (no authentication)
B. Invite via email with account creation
C. Import from external system (e.g., LDAP, Active Directory)
D. Self-registration with approval workflow
E. Other (please specify)

[Answer]: A

### Q3: Team Member Uniqueness
How should we ensure team members are unique?

Options:
A. By name (case-insensitive)
B. By email address
C. By unique ID/username
D. No uniqueness constraint
E. Other (please specify)

[Answer]: A

### Q4: Team Member Deletion
What should happen when a team member is deleted?

Options:
A. Hard delete - remove completely, unassign from all cards
B. Soft delete - mark as inactive, keep assignments
C. Prevent deletion if assigned to any cards
D. Transfer assignments to another team member first
E. Other (please specify)

[Answer]: A

### Q5: Team Member Editing
Should we be able to edit team member information after creation?

Options:
A. Yes, all fields editable
B. Yes, but email/ID cannot be changed
C. No, delete and recreate instead
D. Other (please specify)

[Answer]: A

---

## Card Assignment

### Q6: Assignment Model
How should team members be assigned to cards?

Options:
A. Single assignee per card
B. Multiple assignees per card
C. Single assignee + optional collaborators
D. Assignment with role (owner, contributor, reviewer)
E. Other (please specify)

[Answer]: B

### Q7: Assignment UI Location
Where should assignment happen in the UI?

Options:
A. Dropdown/select in card creation modal
B. Dropdown/select on card itself (inline editing)
C. Dedicated assignment modal/dialog
D. Drag-and-drop team members onto cards
E. Multiple locations (please specify which)

[Answer]: B

### Q8: Unassigned Cards
How should unassigned cards be handled?

Options:
A. Allow unassigned cards (assignment is optional)
B. Require assignment before card can be created
C. Auto-assign to a default team member
D. Show warning but allow unassigned
E. Other (please specify)

[Answer]: A

### Q9: Assignment Display
How should assignments be displayed on cards?

Options:
A. Team member name as text
B. Avatar/initials badge
C. Name + avatar
D. Just a count (e.g., "2 assignees")
E. Other (please specify)

[Answer]: A

### Q10: Reassignment
Should we be able to reassign cards to different team members?

Options:
A. Yes, freely reassign at any time
B. Yes, but only in certain columns (e.g., not in "Done")
C. Yes, but require approval/confirmation
D. No, assignment is permanent
E. Other (please specify)

[Answer]: A

---

## Bottleneck Detection Integration

### Q11: Workload Calculation
How should we calculate a team member's workload?

Options:
A. Count of assigned cards (regardless of column)
B. Count of assigned cards in "In Progress" only
C. Sum of story points for assigned cards
D. Sum of story points for assigned cards in "In Progress"
E. Other (please specify)

[Answer]: D

### Q12: Overload Threshold
What defines an "overloaded" team member?

Options:
A. More than X cards assigned (please specify X)
B. More than Y story points assigned (please specify Y)
C. More than Z cards in "In Progress" (please specify Z)
D. More than W story points in "In Progress" (please specify W)
E. Combination of above (please specify)

[Answer]: D (8 points)

### Q13: Overload Alert Severity
What severity should overload alerts have?

Options:
A. Always high severity
B. Medium if slightly over, high if significantly over
C. Based on how much over threshold (e.g., 10% over = medium, 50% over = high)
D. User-configurable
E. Other (please specify)

[Answer]: A

### Q14: Unassigned Card Alerts
Should we alert on unassigned cards?

Options:
A. Yes, always alert on unassigned cards
B. Yes, but only for cards in "In Progress" or "Done"
C. Yes, but only after X days unassigned (please specify X)
D. No, unassigned cards are acceptable
E. Other (please specify)

[Answer]: B

### Q15: Unassigned Alert Severity
If we alert on unassigned cards, what severity?

Options:
A. Low severity
B. Medium severity
C. High severity
D. Depends on column (e.g., high for "In Progress", low for "To Do")
E. Other (please specify)

[Answer]: A

### Q16: Workload Distribution Analysis
Should we analyze workload distribution across the team?

Options:
A. Yes, alert if workload is unbalanced (some overloaded, some idle)
B. Yes, show distribution but don't alert
C. No, only alert on individual overload
D. Other (please specify)

[Answer]: A

### Q17: Alert Recommendations
What recommendations should overload alerts include?

Options:
A. Suggest reassigning specific cards to less busy team members
B. Suggest breaking down large cards
C. Suggest moving cards back to "To Do"
D. All of the above
E. Other (please specify)

[Answer]: D

---

## Data Storage

### Q18: Team Member Storage
Where should team member data be stored?

Options:
A. New DynamoDB table (TeamMembersTable)
B. Add to existing CardsTable with different partition key
C. Store in frontend only (localStorage)
D. External service/API
E. Other (please specify)

[Answer]: A

### Q19: Assignment Storage
How should card-to-team-member assignments be stored?

Options:
A. Add assignee field(s) to Card model in DynamoDB
B. Separate AssignmentsTable with card-member relationships
C. Store in both Card model and separate table
D. Other (please specify)

[Answer]: A

---

## UI/UX Considerations

### Q20: Team Management UI
Where should team member management happen?

Options:
A. New "Team" page/tab in the app
B. Settings/admin panel
C. Modal/dialog accessible from header
D. Sidebar panel
E. Other (please specify)

[Answer]: A

### Q21: Team Member List Display
How should the team member list be displayed?

Options:
A. Simple list with names
B. Card/tile layout with avatars
C. Table with sortable columns
D. Dropdown/select only (no dedicated list view)
E. Other (please specify)

[Answer]: A

### Q22: Assignment Filtering
Should we be able to filter cards by assignee?

Options:
A. Yes, filter dropdown in board view
B. Yes, dedicated "My Cards" view per team member
C. Yes, both filter and dedicated view
D. No filtering needed
E. Other (please specify)

[Answer]: A

---

## Scope and Priority

### Q23: Must-Have vs Nice-to-Have
Which features are must-have for Iteration 3?

Options:
A. All features (team management + assignment + bottleneck integration)
B. Team management + assignment only (defer bottleneck integration)
C. Basic team management + assignment (defer advanced features)
D. Let me specify (please list must-haves below)

[Answer]: A

If you selected D, please list must-have features:
[Answer]: 

### Q24: Timeline
What's your target timeline for Iteration 3?

Options:
A. Same as Iteration 2 (3-4 hours)
B. Longer (please specify)
C. As fast as possible
D. No specific timeline

[Answer]: A

---

## Additional Context

### Q25: Integration with Existing Features
Should team assignment integrate with existing features?

- AI card creation: Should AI suggest assignee based on workload?
  [Answer]: No

- Card splitting: Should split cards inherit assignee from original?
  [Answer]: No

- Duration tracking: Should we track time per assignee?
  [Answer]: Yes

### Q26: Future Considerations
Are there any future features we should keep in mind while designing this?

Examples: Authentication, permissions, team roles, capacity planning, time tracking, etc.

[Answer]: Nothing for now, delivery velocity is most important

---

## Summary
Once you've answered all questions, please respond with: "I have answered all questions in the requirement-verification-questions.md file."
