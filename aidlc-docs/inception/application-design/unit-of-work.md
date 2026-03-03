# Units of Work

## Overview
This document defines the 8 units of work for the AI-driven Kanban SaaS application, organized for parallel development following a critical path execution strategy.

---

## Code Organization Strategy

### Repository Structure: Monorepo
- **Single repository** containing all units in subdirectories
- **Shared library package** for common code (models, utilities)
- **Single CDK app** with multiple stacks (one per unit + shared infrastructure)
- **Single deployment pipeline** deploying all units sequentially

### Directory Structure
```
kanban-saas/
├── packages/
│   ├── shared/                    # Shared library package
│   │   ├── src/
│   │   │   ├── models/           # Data models (Card, Tenant, Connection)
│   │   │   ├── types/            # TypeScript types and interfaces
│   │   │   ├── utils/            # Shared utilities
│   │   │   └── constants/        # Shared constants
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── infrastructure/            # Unit 1: Infrastructure Foundation
│   │   ├── src/
│   │   │   ├── stacks/
│   │   │   │   ├── network-stack.ts
│   │   │   │   ├── storage-stack.ts
│   │   │   │   └── config-stack.ts
│   │   │   └── app.ts
│   │   ├── package.json
│   │   └── cdk.json
│   │
│   ├── auth/                      # Unit 2: Authentication & Multi-Tenancy
│   │   ├── src/
│   │   │   ├── handlers/         # Lambda handlers
│   │   │   ├── services/         # AuthService, TenantService
│   │   │   ├── repositories/     # TenantRepository
│   │   │   └── middleware/       # AuthMiddleware
│   │   ├── infrastructure/       # CDK auth stack
│   │   ├── tests/
│   │   └── package.json
│   │
│   ├── card-api/                  # Unit 3: Card Management API
│   │   ├── src/
│   │   │   ├── handlers/         # CardHandler
│   │   │   ├── services/         # CardService
│   │   │   └── repositories/     # CardRepository
│   │   ├── infrastructure/       # CDK API stack
│   │   ├── tests/
│   │   └── package.json
│   │
│   ├── websocket/                 # Unit 4: WebSocket Real-Time
│   │   ├── src/
│   │   │   ├── handlers/         # WebSocket handlers
│   │   │   ├── services/         # NotificationService
│   │   │   └── repositories/     # ConnectionRepository
│   │   ├── infrastructure/       # CDK WebSocket stack
│   │   ├── tests/
│   │   └── package.json
│   │
│   ├── ai-task-creation/          # Unit 5: AI Task Creation
│   │   ├── src/
│   │   │   ├── handlers/         # AITaskCreationHandler
│   │   │   ├── services/         # AIService (task creation)
│   │   │   ├── bedrock/          # BedrockClient
│   │   │   ├── prompts/          # PromptManager
│   │   │   └── context/          # ContextAssembler
│   │   ├── infrastructure/       # CDK AI stack
│   │   ├── prompts/              # Prompt templates (deployed to Parameter Store)
│   │   ├── tests/
│   │   └── package.json
│   │
│   ├── ai-bottleneck/             # Unit 6: AI Bottleneck Detection
│   │   ├── src/
│   │   │   ├── handlers/         # Scheduled & Stream handlers
│   │   │   ├── services/         # AIService (bottleneck detection)
│   │   │   └── analysis/         # Analysis logic
│   │   ├── infrastructure/       # CDK EventBridge + Streams
│   │   ├── prompts/              # Bottleneck prompts
│   │   ├── tests/
│   │   └── package.json
│   │
│   ├── frontend/                  # Unit 7: Frontend Application
│   │   ├── src/
│   │   │   ├── components/       # React components
│   │   │   │   ├── board/
│   │   │   │   ├── cards/
│   │   │   │   └── ai/
│   │   │   ├── services/         # APIClient, WebSocketClient
│   │   │   ├── hooks/            # Custom React hooks
│   │   │   ├── context/          # React context (AuthProvider)
│   │   │   └── App.tsx
│   │   ├── infrastructure/       # CDK S3 + CloudFront stack
│   │   ├── public/
│   │   ├── tests/
│   │   └── package.json
│   │
│   └── observability/             # Unit 8: Observability & Analytics
│       ├── src/
│       │   ├── services/         # AnalyticsService
│       │   ├── repositories/     # AnalyticsRepository
│       │   └── dashboards/       # CloudWatch dashboard definitions
│       ├── infrastructure/       # CDK observability stack
│       ├── tests/
│       └── package.json
│
├── package.json                   # Root package.json (workspace config)
├── tsconfig.json                  # Root TypeScript config
├── .gitignore
└── README.md
```

### Build System
- **Package manager**: npm workspaces (or yarn workspaces)
- **Build tool**: TypeScript compiler + esbuild for Lambda bundling
- **Testing**: Jest for unit tests, integration tests per unit
- **Linting**: ESLint + Prettier

### Deployment Model
- **Single CDK app** in `packages/infrastructure/`
- **Multiple stacks** (one per unit + shared infrastructure)
- **Deployment order**: Sequential (foundation → auth → APIs → frontend)
- **Environment management**: CDK context for dev/staging/prod

---

## Unit Definitions

### Unit 1: Infrastructure Foundation

**Purpose**: Provision base AWS infrastructure required by all other units

**Responsibilities**:
- Create DynamoDB tables (cards, tenants, connections, analytics)
- Configure Parameter Store for AI prompts
- Set up AWS AppConfig for feature flags
- Provision base networking (if needed for future)
- Configure IAM roles and policies (base)

**Components**:
- NetworkStack (VPC, security groups - minimal for Phase 1)
- StorageStack (DynamoDB tables with indexes and streams)
- ConfigStack (Parameter Store, AppConfig)

**Deliverables**:
- CDK infrastructure code in `packages/infrastructure/`
- DynamoDB table definitions with tenant scoping
- Parameter Store structure for prompts
- AppConfig setup for feature flags

**Dependencies**: None (foundation unit)

**Success Criteria**:
- All DynamoDB tables created with correct schemas
- Parameter Store ready for prompt storage
- AppConfig configured for feature flag management
- IAM roles created for Lambda execution

**Estimated Effort**: 2-3 hours

---

### Unit 2: Authentication & Multi-Tenancy

**Purpose**: Implement user authentication and tenant management

**Responsibilities**:
- Configure AWS Cognito User Pool
- Implement authentication flows (login, logout, token refresh)
- Implement tenant CRUD operations
- Implement team member management
- Provide AuthMiddleware for other units
- Extract tenant context from JWT tokens

**Components**:
- AuthStack (Cognito User Pool, User Pool Client)
- AuthHandler (login, logout, refresh Lambda functions)
- TenantHandler (tenant CRUD Lambda functions)
- AuthService (authentication orchestration)
- TenantService (tenant management orchestration)
- TenantRepository (tenant data access)
- AuthMiddleware (JWT validation, tenant extraction)

**Deliverables**:
- Cognito User Pool configured
- Auth Lambda functions (login, logout, refresh)
- Tenant Lambda functions (CRUD operations)
- AuthMiddleware for use by other units
- CDK auth stack

**Dependencies**:
- Unit 1 (requires DynamoDB tenant table)

**Success Criteria**:
- Users can register and login via Cognito
- JWT tokens issued and validated
- Tenant CRUD operations working
- AuthMiddleware successfully extracts tenant context
- Multi-tenant isolation enforced

**Estimated Effort**: 3-4 hours

---

### Unit 3: Card Management API

**Purpose**: Implement REST API for card CRUD operations

**Responsibilities**:
- Handle card creation, read, update, delete operations
- Enforce tenant scoping on all card operations
- Validate card data
- Trigger real-time notifications on card changes
- Track card operation metrics

**Components**:
- APIStack (API Gateway REST API)
- CardHandler (REST endpoint Lambda functions)
- CardService (card business logic orchestration)
- CardRepository (card data access with tenant scoping)

**Deliverables**:
- REST API endpoints (/cards POST, GET, PUT, DELETE)
- Card Lambda functions with business logic
- CardService with orchestration
- CardRepository with DynamoDB access patterns
- API Gateway configuration
- CDK API stack

**Dependencies**:
- Unit 1 (requires DynamoDB cards table)
- Unit 2 (requires AuthMiddleware for authentication)

**Success Criteria**:
- Card CRUD operations working via REST API
- Tenant scoping enforced on all operations
- Cards persisted in DynamoDB
- API returns proper error responses
- Integration tests passing

**Estimated Effort**: 4-5 hours

---

### Unit 4: WebSocket Real-Time

**Purpose**: Implement WebSocket for real-time multi-user synchronization

**Responsibilities**:
- Manage WebSocket connection lifecycle (connect, disconnect)
- Store connection state (connectionId, userId, tenantId, boardId)
- Broadcast messages to connected clients
- Scope broadcasts by tenant and board
- Handle connection failures and cleanup

**Components**:
- WebSocketStack (API Gateway WebSocket API)
- WebSocketConnectionHandler (connect, disconnect Lambda)
- WebSocketMessageHandler (message routing Lambda)
- WebSocketBroadcastHandler (broadcast to connections)
- NotificationService (orchestrate broadcasts)
- ConnectionRepository (connection state management)

**Deliverables**:
- WebSocket API configured
- Connection lifecycle Lambda functions
- NotificationService for broadcasting
- ConnectionRepository with DynamoDB access
- CDK WebSocket stack

**Dependencies**:
- Unit 1 (requires DynamoDB connections table)
- Unit 2 (requires AuthMiddleware for connection authentication)

**Success Criteria**:
- WebSocket connections established and authenticated
- Connection state persisted in DynamoDB
- Broadcasts delivered to correct clients (tenant + board scoped)
- Stale connections cleaned up
- Multi-user sync working

**Estimated Effort**: 4-5 hours

---

### Unit 5: AI Task Creation

**Purpose**: Implement AI-powered task creation from natural language

**Responsibilities**:
- Accept natural language task descriptions
- Assemble context for AI prompt (board state, team members)
- Invoke AWS Bedrock (Claude) for card generation
- Parse and validate AI responses
- Return structured card suggestions to user
- Track AI usage metrics (token consumption, acceptance rates)

**Components**:
- AIStack (Bedrock access, Parameter Store prompts)
- AITaskCreationHandler (Lambda for AI orchestration)
- BedrockClient (Bedrock API integration)
- PromptManager (load prompts from Parameter Store)
- ContextAssembler (gather board context)
- AIResponseParser (parse JSON responses)
- AIService (AI orchestration)

**Deliverables**:
- AI task creation Lambda function
- BedrockClient with Claude integration
- PromptManager with Parameter Store integration
- ContextAssembler with tenant-scoped context gathering
- AI prompts stored in Parameter Store
- CDK AI stack

**Dependencies**:
- Unit 1 (requires Parameter Store, DynamoDB for context)
- Unit 2 (requires AuthMiddleware)
- Unit 4 (requires WebSocket for async response delivery)

**Success Criteria**:
- Natural language input converted to structured card
- AI responses returned via WebSocket
- Prompts loaded from Parameter Store
- Token usage tracked per tenant
- User confirmation required before persistence

**Estimated Effort**: 5-6 hours

---

### Unit 6: AI Bottleneck Detection

**Purpose**: Implement proactive bottleneck detection (scheduled + event-driven)

**Responsibilities**:
- Perform scheduled full-board analysis (EventBridge trigger)
- Perform event-driven scoped analysis (DynamoDB Stream trigger)
- Detect aging cards, workload imbalance, column bottlenecks
- Generate alerts only when issues detected
- Broadcast alerts via WebSocket
- Track alert actions (dismissed, acted upon)

**Components**:
- AIBottleneckScheduledHandler (EventBridge Lambda)
- AIBottleneckStreamHandler (DynamoDB Stream Lambda)
- AIService (bottleneck analysis orchestration)
- BedrockClient (reused from Unit 5)
- PromptManager (reused from Unit 5)
- ContextAssembler (reused from Unit 5)

**Deliverables**:
- Scheduled analysis Lambda function
- Event-driven analysis Lambda function
- EventBridge schedule configuration
- DynamoDB Stream trigger configuration
- Bottleneck detection prompts in Parameter Store
- CDK EventBridge + Streams configuration

**Dependencies**:
- Unit 1 (requires DynamoDB cards table with Streams)
- Unit 3 (requires card data)
- Unit 4 (requires WebSocket for alert broadcasting)
- Unit 5 (reuses AI components)

**Success Criteria**:
- Scheduled analysis runs every 30 minutes
- Event-driven analysis triggers on card moves
- Alerts generated only when issues detected
- Alerts broadcast to affected board users
- Alert actions tracked for metrics

**Estimated Effort**: 4-5 hours

---

### Unit 7: Frontend Application

**Purpose**: Implement React SPA for Kanban board UI

**Responsibilities**:
- Render Kanban board with columns and cards
- Implement drag-and-drop card movement
- Provide AI task input interface
- Display AI card suggestions for confirmation
- Show bottleneck alerts
- Maintain real-time sync via WebSocket
- Handle authentication and routing

**Components**:
- FrontendStack (S3 bucket, CloudFront distribution)
- BoardContainer (main board component)
- ColumnComponent (column display)
- CardComponent (card display)
- AITaskInputComponent (AI input)
- AICardSuggestionModal (AI suggestion display)
- BottleneckAlertComponent (alert display)
- WebSocketClient (WebSocket connection management)
- APIClient (REST API calls)
- AuthProvider (authentication context)

**Deliverables**:
- React application with all components
- WebSocket client with reconnection logic
- API client with authentication
- Drag-and-drop functionality
- AI feature UI
- S3 + CloudFront deployment
- CDK frontend stack

**Dependencies**:
- Unit 3 (requires Card Management API)
- Unit 4 (requires WebSocket API)
- Unit 5 (requires AI Task Creation API)

**Success Criteria**:
- Board renders with cards and columns
- Drag-and-drop working
- Real-time updates appear without refresh
- AI task creation working end-to-end
- Bottleneck alerts displayed
- Responsive design (desktop-first)

**Estimated Effort**: 6-8 hours

---

### Unit 8: Observability & Analytics

**Purpose**: Implement monitoring, logging, and usage analytics

**Responsibilities**:
- Configure CloudWatch dashboards for system health
- Set up CloudWatch alarms for errors and performance
- Implement structured logging across all Lambda functions
- Track usage events (card operations, AI suggestions, alerts)
- Calculate cost attribution per tenant
- Provide analytics queries and reports

**Components**:
- ObservabilityStack (CloudWatch dashboards, alarms, Kinesis)
- AnalyticsService (usage tracking orchestration)
- AnalyticsRepository (analytics data access)
- CloudWatch dashboard definitions
- Kinesis stream for event tracking

**Deliverables**:
- CloudWatch dashboards (system health, usage, costs)
- CloudWatch alarms (Lambda errors, API failures, DynamoDB throttling)
- Kinesis stream for analytics events
- AnalyticsService for event tracking
- Cost attribution queries
- CDK observability stack

**Dependencies**:
- All units (observes all components)

**Success Criteria**:
- Dashboards show real-time metrics
- Alarms trigger on errors
- Usage events tracked in Kinesis
- Cost attribution working per tenant
- Structured logs with tenant context

**Estimated Effort**: 3-4 hours

---

## Unit Summary

| Unit | Name | Effort | Dependencies | Parallel Group |
|------|------|--------|--------------|----------------|
| 1 | Infrastructure Foundation | 2-3h | None | Sequential |
| 2 | Authentication & Multi-Tenancy | 3-4h | Unit 1 | Sequential |
| 3 | Card Management API | 4-5h | Units 1, 2 | Parallel Group 1 |
| 4 | WebSocket Real-Time | 4-5h | Units 1, 2 | Parallel Group 1 |
| 5 | AI Task Creation | 5-6h | Units 1, 2, 4 | Parallel Group 1 |
| 6 | AI Bottleneck Detection | 4-5h | Units 1, 3, 4, 5 | Parallel Group 1 |
| 7 | Frontend Application | 6-8h | Units 3, 4, 5 | Parallel Group 2 |
| 8 | Observability & Analytics | 3-4h | All units | Parallel Group 2 |

**Total Estimated Effort**: 31-40 hours (with parallelization: ~20-24 hours)

---

## Development Workflow

### Critical Path Execution (Approved Approach)

**Phase 1: Foundation (Sequential)**
- Unit 1: Infrastructure Foundation (2-3h)
- Unit 2: Authentication & Multi-Tenancy (3-4h)
- **Total**: 5-7 hours

**Phase 2: Core Services (Parallel)**
- Unit 3: Card Management API (4-5h)
- Unit 4: WebSocket Real-Time (4-5h)
- Unit 5: AI Task Creation (5-6h)
- Unit 6: AI Bottleneck Detection (4-5h)
- **Total**: 5-6 hours (parallel execution)

**Phase 3: User Interface (Parallel)**
- Unit 7: Frontend Application (6-8h)
- Unit 8: Observability & Analytics (3-4h)
- **Total**: 6-8 hours (parallel execution)

**Overall Timeline**: 16-21 hours with optimal parallelization

---

## Success Criteria (Overall)

- All 8 units deployed and operational
- End-to-end workflows working (card CRUD, AI features, real-time sync)
- Multi-tenant isolation verified
- Observability tooling operational
- All integration tests passing
- System deployed to AWS and accessible
