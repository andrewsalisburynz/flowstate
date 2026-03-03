# Requirements Verification Questions

Please answer the following questions to clarify and validate the requirements for the AI-driven Kanban board SaaS product.

---

## Question 1
What should be the default Kanban board column structure?

A) Simple 3-column (To Do, In Progress, Done)
B) Standard 4-column (Backlog, To Do, In Progress, Done)
C) Extended 5-column (Backlog, To Do, In Progress, Review, Done)
D) Custom columns defined by tenant
E) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Question 2
For the authentication mechanism, which approach should we use?

A) AWS Cognito with email/password
B) AWS Cognito with social login (Google, GitHub)
C) AWS Cognito with both email/password and social login
D) Custom authentication system
E) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Question 3
How should team members be added to a tenant?

A) Manual invitation by admin (email invite with signup link)
B) Self-service signup with tenant code
C) Admin creates accounts directly
D) SSO integration (future-proofed)
E) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Question 4
For the AI task creation feature, where should users input their natural language description?

A) Dedicated "Create with AI" button/modal
B) Inline in the board (special input field)
C) Both options available
D) Chat-style interface
E) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Question 5
When AI generates a card suggestion, how should it be presented to the user for confirmation?

A) Modal dialog with all fields editable before saving
B) Preview card on board (ghost/draft state) with approve/reject buttons
C) Side panel with detailed view and edit capability
D) Simple notification with accept/reject
E) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Question 6
For bottleneck detection alerts, how should they be displayed to users?

A) Toast notifications (dismissible)
B) Dedicated alerts panel/sidebar
C) Badge/indicator on affected cards or columns
D) Email notifications
E) Other (please describe after [Answer]: tag below)

[Answer]: C

---

## Question 7
What data should be stored for each card in DynamoDB?

A) Minimal (id, title, description, column, assignee, tenant)
B) Standard (minimal + created date, updated date, story points, priority)
C) Extended (standard + acceptance criteria, tags, comments, history)
D) Comprehensive (extended + attachments, custom fields, relationships)
E) Other (please describe after [Answer]: tag below)

[Answer]: C

---

## Question 8
For the scheduled full-board bottleneck analysis, what frequency should EventBridge use?

A) Every 5 minutes
B) Every 15 minutes
C) Every 30 minutes
D) Every hour
E) Other (please describe after [Answer]: tag below)

[Answer]: C

---

## Question 9
Should the Phase 1 MVP support multiple boards per tenant?

A) Yes, multiple boards per tenant
B) No, single board per tenant (multi-board deferred to Phase 2)
C) Single board but architecture ready for multi-board
D) Other (please describe after [Answer]: tag below)

[Answer]: B

---

## Question 10
For the React frontend, what component library or design system should be used?

A) Material-UI (MUI)
B) Ant Design
C) Chakra UI
D) Custom component library (built from scratch)
E) Other (please describe after [Answer]: tag below)

[Answer]: C

---

## Question 11
What should be the DynamoDB table design approach for multi-tenancy?

A) Single table design with tenant as partition key
B) Separate table per tenant
C) Single table with composite keys (tenant + entity)
D) Multiple tables with tenant scoping
E) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Question 12
For AI prompt templates in Parameter Store, what versioning strategy should be used?

A) Simple versioning (v1, v2, v3)
B) Semantic versioning (1.0.0, 1.1.0, 2.0.0)
C) Date-based versioning (2026-03-03)
D) No versioning (single latest version)
E) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Question 13
What level of testing should be included in Phase 1 MVP?

A) Unit tests only (Lambda functions)
B) Unit + integration tests (API + Lambda + DynamoDB)
C) Unit + integration + E2E tests (full user flows)
D) Minimal testing (manual testing only for speed)
E) Other (please describe after [Answer]: tag below)

[Answer]: C

---

## Question 14
For the CDK infrastructure, should we use TypeScript or Python?

A) TypeScript (matches Lambda language)
B) Python
C) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Question 15
What should be the Lambda runtime for backend functions?

A) Node.js 20.x (TypeScript)
B) Node.js 18.x (TypeScript)
C) Python 3.12
D) Python 3.11
E) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Question 16
For WebSocket connections, how should connection state be managed?

A) DynamoDB table storing connectionId + tenant + userId
B) ElastiCache/Redis for connection state
C) In-memory (Lambda only, no persistence)
D) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Question 17
Should the frontend be a single-page application (SPA) or server-side rendered (SSR)?

A) SPA (React with client-side routing)
B) SSR (Next.js or similar)
C) Static site generation (SSG)
D) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Question 18
For cost tracking per tenant, what granularity is needed?

A) High granularity (track every Lambda invocation, Bedrock call, DynamoDB operation)
B) Medium granularity (aggregate by service per tenant per day)
C) Low granularity (monthly totals per tenant)
D) No tracking in Phase 1 (defer to Phase 2)
E) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Question 19
What should be the Bedrock model configuration for AI features?

A) Claude 3 Sonnet (balanced performance and cost)
B) Claude 3 Haiku (fastest, lowest cost)
C) Claude 3 Opus (highest quality, highest cost)
D) Configurable per tenant (different tiers)
E) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Question 20
For the aggressive timeline (end of tomorrow), what is the acceptable trade-off?

A) Full feature set with basic UI/UX
B) Core features only with polished UI/UX
C) Core features with basic UI/UX (speed prioritized)
D) Prototype/demo quality (not production-ready)
E) Other (please describe after [Answer]: tag below)

[Answer]: A

---

**Instructions**: 
1. Please answer each question by filling in the letter choice (A, B, C, D, or E) after the [Answer]: tag
2. If you choose "Other" or want to provide additional context, add your description after the [Answer]: tag
3. Let me know when you've completed all questions so I can proceed with the analysis
