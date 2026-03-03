# Unit of Work Plan

## Purpose
Decompose the AI-driven Kanban SaaS application into manageable units of work for parallel development and deployment.

---

## Decomposition Strategy

Based on the application design, we'll decompose into 8 units organized by functional domain and deployment independence:

1. **Infrastructure Foundation** - Base AWS resources
2. **Authentication & Multi-Tenancy** - User auth and tenant management
3. **Card Management API** - REST API for card operations
4. **WebSocket Real-Time** - WebSocket for multi-user sync
5. **AI Task Creation** - AI-powered task generation
6. **AI Bottleneck Detection** - Proactive bottleneck analysis
7. **Frontend Application** - React SPA
8. **Observability & Analytics** - Monitoring and usage tracking

---

## Execution Checklist

### Phase 1: Define Units

- [ ] **1.1 Define Unit 1: Infrastructure Foundation**
  - [ ] Identify components (CDK stacks for base infrastructure)
  - [ ] Define responsibilities (VPC, DynamoDB tables, Parameter Store, AppConfig)
  - [ ] Specify deliverables (CDK infrastructure code)
  - [ ] Determine dependencies (none - foundation for all others)

- [ ] **1.2 Define Unit 2: Authentication & Multi-Tenancy**
  - [ ] Identify components (Cognito, TenantService, AuthService, Lambda handlers)
  - [ ] Define responsibilities (user authentication, tenant CRUD, authorization)
  - [ ] Specify deliverables (Auth Lambda functions, CDK auth stack)
  - [ ] Determine dependencies (Unit 1 - requires DynamoDB tables)

- [ ] **1.3 Define Unit 3: Card Management API**
  - [ ] Identify components (CardHandler, CardService, CardRepository)
  - [ ] Define responsibilities (card CRUD operations, REST API endpoints)
  - [ ] Specify deliverables (Card Lambda functions, API Gateway REST config)
  - [ ] Determine dependencies (Unit 1, Unit 2 - requires auth and database)

- [ ] **1.4 Define Unit 4: WebSocket Real-Time**
  - [ ] Identify components (WebSocket handlers, ConnectionRepository, NotificationService)
  - [ ] Define responsibilities (connection management, real-time broadcasting)
  - [ ] Specify deliverables (WebSocket Lambda functions, API Gateway WebSocket config)
  - [ ] Determine dependencies (Unit 1, Unit 2 - requires auth and connection table)

- [ ] **1.5 Define Unit 5: AI Task Creation**
  - [ ] Identify components (AITaskCreationHandler, BedrockClient, PromptManager, ContextAssembler)
  - [ ] Define responsibilities (natural language to structured card via Bedrock)
  - [ ] Specify deliverables (AI Lambda function, prompts in Parameter Store)
  - [ ] Determine dependencies (Unit 1, Unit 2, Unit 4 - requires auth, database, WebSocket for async response)

- [ ] **1.6 Define Unit 6: AI Bottleneck Detection**
  - [ ] Identify components (AIBottleneckScheduledHandler, AIBottleneckStreamHandler, AIService)
  - [ ] Define responsibilities (scheduled and event-driven bottleneck analysis)
  - [ ] Specify deliverables (AI Lambda functions, EventBridge schedule, DynamoDB Stream trigger)
  - [ ] Determine dependencies (Unit 1, Unit 3, Unit 4 - requires card data and WebSocket for alerts)

- [ ] **1.7 Define Unit 7: Frontend Application**
  - [ ] Identify components (React components, WebSocketClient, APIClient)
  - [ ] Define responsibilities (UI for Kanban board, AI features, real-time sync)
  - [ ] Specify deliverables (React SPA, S3/CloudFront deployment)
  - [ ] Determine dependencies (Unit 3, Unit 4, Unit 5 - requires APIs)

- [ ] **1.8 Define Unit 8: Observability & Analytics**
  - [ ] Identify components (CloudWatch dashboards, Kinesis streams, AnalyticsService)
  - [ ] Define responsibilities (logging, metrics, cost tracking, usage analytics)
  - [ ] Specify deliverables (CDK observability stack, dashboards, alarms)
  - [ ] Determine dependencies (All units - observes all components)

### Phase 2: Map Dependencies

- [ ] **2.1 Create Dependency Matrix**
  - [ ] Identify build-time dependencies (CDK stack dependencies)
  - [ ] Identify runtime dependencies (API calls, service invocations)
  - [ ] Determine deployment order (foundation first, then dependent units)
  - [ ] Identify parallel development opportunities

- [ ] **2.2 Define Integration Points**
  - [ ] API contracts between units (REST endpoints, WebSocket messages)
  - [ ] Shared data models (Card, Tenant, Connection)
  - [ ] Event schemas (DynamoDB Stream records, EventBridge events)
  - [ ] Authentication flow across units

- [ ] **2.3 Specify Communication Patterns**
  - [ ] Synchronous calls (REST API)
  - [ ] Asynchronous messaging (WebSocket)
  - [ ] Event-driven triggers (Streams, EventBridge)
  - [ ] Shared state (DynamoDB tables)

### Phase 3: Map Stories to Units

- [ ] **3.1 Assign Stories to Units**
  - [ ] Map each user story (if exists) to primary unit
  - [ ] Identify cross-unit stories requiring coordination
  - [ ] Ensure all functional requirements covered

- [ ] **3.2 Validate Coverage**
  - [ ] Verify all requirements mapped to units
  - [ ] Check for gaps in functionality
  - [ ] Ensure no duplicate responsibilities

### Phase 4: Define Code Organization (Greenfield)

- [ ] **4.1 Define Repository Structure**
  - [ ] Determine monorepo vs multi-repo approach
  - [ ] Define directory structure for each unit
  - [ ] Specify shared code organization (models, utilities)
  - [ ] Document build and deployment structure

- [ ] **4.2 Define Deployment Model**
  - [ ] Specify CDK app structure (single app vs multiple)
  - [ ] Define stack organization per unit
  - [ ] Determine deployment pipeline approach
  - [ ] Document environment management (dev, staging, prod)

### Phase 5: Generate Unit Artifacts

- [ ] **5.1 Generate unit-of-work.md**
  - [ ] Document all 8 units with definitions and responsibilities
  - [ ] Include code organization strategy
  - [ ] Specify deliverables per unit
  - [ ] Define success criteria per unit

- [ ] **5.2 Generate unit-of-work-dependency.md**
  - [ ] Create dependency matrix showing relationships
  - [ ] Document deployment order
  - [ ] Identify parallel development opportunities
  - [ ] Specify integration points and contracts

- [ ] **5.3 Generate unit-of-work-story-map.md**
  - [ ] Map requirements to units (stories if available)
  - [ ] Show coverage across all units
  - [ ] Identify cross-unit requirements
  - [ ] Validate completeness

- [ ] **5.4 Validate Unit Decomposition**
  - [ ] Verify all components assigned to units
  - [ ] Check dependency consistency
  - [ ] Ensure deployment order is valid
  - [ ] Confirm parallel development opportunities

---

## Decomposition Questions

### Question 1
For the repository structure, what approach should we use?

A) Monorepo (single repository with all units in subdirectories)
B) Multi-repo (separate repository per unit)
C) Hybrid (monorepo for backend, separate repo for frontend)
D) Other (please describe after [Answer]: tag below)

[Answer]: A

---

### Question 2
For the CDK infrastructure code organization, what structure should we use?

A) Single CDK app with multiple stacks (one app, 8+ stacks)
B) Multiple CDK apps (one per unit with its own stacks)
C) Hybrid (shared infrastructure app + unit-specific apps)
D) Other (please describe after [Answer]: tag below)

[Answer]: A

---

### Question 3
For shared code (data models, utilities), how should it be organized?

A) Separate shared library package (imported by all units)
B) Duplicated in each unit (no shared dependencies)
C) Shared directory in monorepo (relative imports)
D) Other (please describe after [Answer]: tag below)

[Answer]: A

---

### Question 4
For the deployment pipeline, what approach should we use?

A) Single pipeline deploying all units sequentially
B) Separate pipeline per unit (independent deployment)
C) Hybrid (shared infrastructure pipeline + unit pipelines)
D) Other (please describe after [Answer]: tag below)

[Answer]: A

---

### Question 5
For the development workflow, what unit execution order should we prioritize?

A) Sequential (complete Unit 1, then Unit 2, etc.)
B) Parallel (start all units simultaneously)
C) Critical path (Units 1-2 sequential, then 3-6 parallel, then 7-8)
D) Other (please describe after [Answer]: tag below)

[Answer]: C

---

**Instructions**: 
1. Please answer each question by filling in the letter choice after the [Answer]: tag
2. If you choose "Other" or want to provide additional context, add your description after the [Answer]: tag
3. Let me know when you've completed all questions so I can proceed with unit generation
