# Unit of Work - Requirements Mapping

## Overview
This document maps functional requirements to units of work, ensuring complete coverage across all units.

**Note**: User Stories stage was skipped for timeline efficiency. This document maps requirements directly to units.

---

## Requirements Coverage Matrix

| Requirement | Primary Unit | Supporting Units | Coverage Status |
|-------------|--------------|------------------|-----------------|
| FR1: Intelligent Task Management | Unit 5 | Units 2, 4 | ✅ Complete |
| FR2: Kanban Board Core Features | Unit 3, Unit 7 | Units 2, 4 | ✅ Complete |
| FR3: Proactive Bottleneck Detection | Unit 6 | Units 3, 4, 5 | ✅ Complete |
| FR4: Multi-Tenancy | Unit 2 | All units | ✅ Complete |
| FR5: User Authentication & Authorization | Unit 2 | All units | ✅ Complete |
| NFR1: Serverless AWS-Native Architecture | Unit 1 | All units | ✅ Complete |
| NFR2: Performance | Units 3, 4, 5, 6 | Unit 1 | ✅ Complete |
| NFR3: Scalability | Unit 1 | All units | ✅ Complete |
| NFR4: Security & Compliance | Unit 2 | All units | ✅ Complete |
| NFR5: Observability | Unit 8 | All units | ✅ Complete |
| NFR6: AI Quality & Iteration | Units 5, 6 | Unit 1 | ✅ Complete |
| NFR7: Operational Excellence | Units 1, 8 | All units | ✅ Complete |
| NFR8: Cost Model | Unit 8 | All units | ✅ Complete |

---

## Detailed Requirements Mapping

### FR1: Intelligent Task Management (AI-Powered)

**Primary Unit**: Unit 5 - AI Task Creation

**Requirements**:
- FR1.1: Users describe work in natural language via text input
- FR1.2: AI structures input into card with title, description, acceptance criteria, story points, assignee, priority
- FR1.3: AI-generated card suggestions returned to user for confirmation before persistence
- FR1.4: Human oversight preserved at every step

**Unit Breakdown**:
- **Unit 5**: AI Task Creation
  - Implement AITaskCreationHandler
  - Integrate with Bedrock (Claude)
  - Implement PromptManager for prompt templates
  - Implement ContextAssembler for board context
  - Parse AI responses into structured card suggestions
  - Return suggestions via WebSocket (async)
  
- **Unit 2**: Authentication & Multi-Tenancy (Supporting)
  - Provide AuthMiddleware for AI API authentication
  - Extract tenant context for scoped AI operations
  
- **Unit 4**: WebSocket Real-Time (Supporting)
  - Deliver AI suggestions to user via WebSocket
  - Enable async response pattern

- **Unit 7**: Frontend Application (Supporting)
  - Provide AITaskInputComponent for natural language input
  - Display AI suggestions in AICardSuggestionModal
  - Handle user confirmation/rejection

**Success Criteria**:
- User can input natural language description
- AI generates structured card suggestion
- Suggestion delivered via WebSocket
- User can approve/reject before persistence

---

### FR2: Kanban Board Core Features

**Primary Units**: Unit 3 - Card Management API, Unit 7 - Frontend Application

**Requirements**:
- FR2.1: Visual board with columns (To Do, In Progress, Done)
- FR2.2: Card creation, editing, and deletion
- FR2.3: Drag-and-drop card movement between columns
- FR2.4: Card assignment to team members
- FR2.5: Multi-user real-time synchronization

**Unit Breakdown**:
- **Unit 3**: Card Management API
  - Implement CardHandler for CRUD operations
  - Implement CardService for business logic
  - Implement CardRepository for data access
  - Enforce tenant scoping on all operations
  - Trigger notifications on card changes
  
- **Unit 7**: Frontend Application
  - Implement BoardContainer for board display
  - Implement ColumnComponent for column rendering
  - Implement CardComponent for card display
  - Implement drag-and-drop functionality
  - Implement CardDetailModal for editing
  
- **Unit 4**: WebSocket Real-Time (Supporting)
  - Broadcast card changes to all board users
  - Enable real-time multi-user sync
  
- **Unit 2**: Authentication & Multi-Tenancy (Supporting)
  - Authenticate all card operations
  - Scope cards to tenant

**Success Criteria**:
- Board displays with columns and cards
- Users can create, edit, delete cards
- Drag-and-drop moves cards between columns
- Changes appear in real-time for all users

---

### FR3: Proactive Bottleneck Detection (AI-Powered)

**Primary Unit**: Unit 6 - AI Bottleneck Detection

**Requirements**:
- FR3.1: Continuous AI analysis of board state
- FR3.2: Surface risks (aging cards, workload imbalance, bottlenecks)
- FR3.3: Two analysis modes (scheduled full-board, event-driven scoped)
- FR3.4: AI returns empty result if nothing worth surfacing
- FR3.5: Alerts pushed to users via WebSocket

**Unit Breakdown**:
- **Unit 6**: AI Bottleneck Detection
  - Implement AIBottleneckScheduledHandler (EventBridge trigger)
  - Implement AIBottleneckStreamHandler (DynamoDB Stream trigger)
  - Implement bottleneck analysis logic
  - Load bottleneck prompts from Parameter Store
  - Generate alerts only when issues detected
  - Broadcast alerts via NotificationService
  
- **Unit 3**: Card Management API (Supporting)
  - Provide card data for analysis
  - Trigger DynamoDB Stream on card changes
  
- **Unit 4**: WebSocket Real-Time (Supporting)
  - Broadcast bottleneck alerts to board users
  
- **Unit 5**: AI Task Creation (Supporting)
  - Reuse BedrockClient, PromptManager, ContextAssembler
  
- **Unit 7**: Frontend Application (Supporting)
  - Display alerts in BottleneckAlertComponent
  - Allow users to dismiss or act on alerts

**Success Criteria**:
- Scheduled analysis runs every 30 minutes
- Event-driven analysis triggers on card moves
- Alerts generated only when issues detected
- Alerts delivered via WebSocket
- Users can see and act on alerts

---

### FR4: Multi-Tenancy

**Primary Unit**: Unit 2 - Authentication & Multi-Tenancy

**Requirements**:
- FR4.1: Support multiple tenant organizations
- FR4.2: Complete data isolation between tenants
- FR4.3: Every database record scoped to tenant identifier
- FR4.4: WebSocket broadcasts scoped to tenant and board
- FR4.5: Tenant context extracted from authentication token

**Unit Breakdown**:
- **Unit 2**: Authentication & Multi-Tenancy
  - Implement TenantService for tenant management
  - Implement TenantRepository with tenant CRUD
  - Implement AuthMiddleware to extract tenant context
  - Enforce tenant scoping in all operations
  
- **All Units** (Supporting):
  - Import and use AuthMiddleware
  - Enforce tenant scoping in all data access
  - Include tenantId in all database records
  - Scope all operations to requesting tenant

**Success Criteria**:
- Multiple tenants can use system simultaneously
- No cross-tenant data leaks
- All operations scoped to tenant
- Tenant context flows through all layers

---

### FR5: User Authentication & Authorization

**Primary Unit**: Unit 2 - Authentication & Multi-Tenancy

**Requirements**:
- FR5.1: User authentication (Cognito)
- FR5.2: Tenant-scoped user access
- FR5.3: Team member management within tenant

**Unit Breakdown**:
- **Unit 2**: Authentication & Multi-Tenancy
  - Configure Cognito User Pool
  - Implement AuthHandler for login/logout
  - Implement AuthService for authentication orchestration
  - Implement team member management
  - Issue JWT tokens with tenant context
  
- **Unit 7**: Frontend Application (Supporting)
  - Implement AuthProvider for authentication state
  - Handle login/logout flows
  - Store and refresh tokens

**Success Criteria**:
- Users can register and login
- JWT tokens issued with tenant context
- Team members can be added/removed
- Authentication enforced on all operations

---

### NFR1: Serverless AWS-Native Architecture

**Primary Unit**: Unit 1 - Infrastructure Foundation

**Requirements**:
- NFR1.1: No servers to manage
- NFR1.2: All services AWS-native
- NFR1.3: Data residency within AWS
- NFR1.4: Infrastructure as Code via AWS CDK

**Unit Breakdown**:
- **Unit 1**: Infrastructure Foundation
  - Provision all base AWS resources
  - Use CDK for infrastructure as code
  - Configure serverless services (DynamoDB, Lambda, API Gateway)
  
- **All Units** (Supporting):
  - Use Lambda for all compute
  - Use DynamoDB for all storage
  - Use API Gateway for all APIs
  - Use Bedrock for AI (AWS-native)
  - Deploy via CDK stacks

**Success Criteria**:
- No EC2 instances or servers
- All resources provisioned via CDK
- Infrastructure reproducible from code
- Scales automatically with demand

---

### NFR2: Performance

**Primary Units**: Units 3, 4, 5, 6

**Requirements**:
- NFR2.1: Real-time card updates (sub-second latency via WebSocket)
- NFR2.2: AI task creation responses delivered asynchronously
- NFR2.3: Event-driven bottleneck analysis near real-time
- NFR2.4: Scheduled bottleneck analysis can afford higher latency

**Unit Breakdown**:
- **Unit 4**: WebSocket Real-Time
  - Maintain persistent WebSocket connections
  - Deliver messages with sub-second latency
  - Implement efficient broadcast logic
  
- **Unit 5**: AI Task Creation
  - Use async invocation pattern (non-blocking)
  - Return 202 Accepted immediately
  - Deliver results via WebSocket
  
- **Unit 6**: AI Bottleneck Detection
  - Event-driven analysis lightweight and fast
  - Scheduled analysis can be slower (thorough)
  
- **Unit 3**: Card Management API
  - Optimize DynamoDB access patterns
  - Use efficient queries and indexes

**Success Criteria**:
- WebSocket messages delivered in <1 second
- AI responses don't block user actions
- Event-driven analysis completes in <5 seconds
- Card operations complete in <500ms

---

### NFR5: Observability

**Primary Unit**: Unit 8 - Observability & Analytics

**Requirements**:
- NFR5.1: Structured logging with tenant context
- NFR5.2: Three visibility layers (system health, usage patterns, cost attribution)
- NFR5.3: CloudWatch for logs, metrics, dashboards, alarms
- NFR5.4: Kinesis for user behavior tracking

**Unit Breakdown**:
- **Unit 8**: Observability & Analytics
  - Configure CloudWatch dashboards
  - Set up CloudWatch alarms
  - Provision Kinesis streams
  - Implement AnalyticsService
  - Track usage events and costs
  
- **All Units** (Supporting):
  - Emit structured logs with tenant context
  - Emit custom metrics
  - Track usage events
  - Include correlation IDs

**Success Criteria**:
- Dashboards show real-time system health
- Alarms trigger on errors
- Usage events tracked in Kinesis
- Cost attribution working per tenant
- All logs include tenant context

---

### NFR6: AI Quality & Iteration

**Primary Units**: Units 5, 6

**Requirements**:
- NFR6.1: AI prompts versioned and stored in Parameter Store
- NFR6.2: Prompt improvement without code deployment
- NFR6.3: All prompts return structured JSON
- NFR6.4: Low temperature for consistency
- NFR6.5: Prompts include dynamic context
- NFR6.6: Usage data tracking for AI feature validation

**Unit Breakdown**:
- **Unit 5**: AI Task Creation
  - Store prompts in Parameter Store
  - Implement PromptManager for versioning
  - Configure Bedrock with low temperature
  - Assemble dynamic context
  - Parse JSON responses
  
- **Unit 6**: AI Bottleneck Detection
  - Store bottleneck prompts in Parameter Store
  - Reuse PromptManager
  - Track alert acceptance rates
  
- **Unit 8**: Observability & Analytics (Supporting)
  - Track AI suggestion acceptance rates
  - Track alert action rates
  - Provide AI quality metrics

**Success Criteria**:
- Prompts stored in Parameter Store
- Prompts can be updated without deployment
- AI responses consistently structured
- Usage metrics tracked for validation

---

## Cross-Unit Requirements

### Multi-Unit Coordination Required

**Real-Time Multi-User Sync** (FR2.5):
- Unit 3: Card API triggers notifications
- Unit 4: WebSocket broadcasts changes
- Unit 7: Frontend receives and displays updates

**AI Task Creation End-to-End** (FR1):
- Unit 7: Frontend captures input
- Unit 5: AI generates suggestion
- Unit 4: WebSocket delivers suggestion
- Unit 7: Frontend displays for confirmation
- Unit 3: Card API persists approved card

**Bottleneck Detection End-to-End** (FR3):
- Unit 3: Card changes trigger streams
- Unit 6: AI analyzes and generates alerts
- Unit 4: WebSocket broadcasts alerts
- Unit 7: Frontend displays alerts

---

## Requirements Coverage Validation

### All Functional Requirements Covered
- ✅ FR1: Intelligent Task Management (Units 5, 2, 4, 7)
- ✅ FR2: Kanban Board Core Features (Units 3, 7, 4, 2)
- ✅ FR3: Proactive Bottleneck Detection (Units 6, 3, 4, 5, 7)
- ✅ FR4: Multi-Tenancy (Unit 2, All units)
- ✅ FR5: User Authentication & Authorization (Units 2, 7)

### All Non-Functional Requirements Covered
- ✅ NFR1: Serverless AWS-Native Architecture (Unit 1, All units)
- ✅ NFR2: Performance (Units 3, 4, 5, 6)
- ✅ NFR3: Scalability (Unit 1, All units)
- ✅ NFR4: Security & Compliance (Unit 2, All units)
- ✅ NFR5: Observability (Unit 8, All units)
- ✅ NFR6: AI Quality & Iteration (Units 5, 6, 8)
- ✅ NFR7: Operational Excellence (Units 1, 8, All units)
- ✅ NFR8: Cost Model (Unit 8, All units)

### No Gaps Identified
All requirements from requirements.md are mapped to one or more units. No functional or non-functional requirements are missing coverage.

---

## Unit Priority Based on Requirements

### Critical Path Units (Must Complete First)
1. **Unit 1**: Infrastructure Foundation - Required by all
2. **Unit 2**: Authentication & Multi-Tenancy - Required for security

### High Priority Units (Core Features)
3. **Unit 3**: Card Management API - Core functionality
4. **Unit 4**: WebSocket Real-Time - Core functionality
5. **Unit 5**: AI Task Creation - Key differentiator
6. **Unit 6**: AI Bottleneck Detection - Key differentiator

### User-Facing Units (Delivery)
7. **Unit 7**: Frontend Application - User interface

### Supporting Units (Operational)
8. **Unit 8**: Observability & Analytics - Operational excellence

---

## Summary

- **Total Requirements**: 13 (5 functional, 8 non-functional)
- **Total Units**: 8
- **Requirements Coverage**: 100%
- **Cross-Unit Requirements**: 3 (multi-user sync, AI task creation, bottleneck detection)
- **No Gaps**: All requirements mapped to units
