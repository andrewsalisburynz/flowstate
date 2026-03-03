# Service Layer Design

## Overview
The service layer provides business logic orchestration, coordinating operations across repositories, external services, and other components. Services encapsulate complex workflows and ensure consistent business rule application.

---

## Service Architecture Principles

1. **Rich Service Layer**: Services contain significant business logic and orchestration
2. **Transaction Coordination**: Services manage multi-step operations
3. **Cross-Cutting Concerns**: Services handle logging, metrics, and error handling
4. **Tenant Scoping**: All service operations enforce tenant isolation
5. **Testability**: Services are designed for unit testing with mocked dependencies

---

## Core Services

### CardService

**Purpose**: Orchestrate all card-related business operations

**Responsibilities**:
- Coordinate card CRUD operations with CardRepository
- Enforce business rules (validation, state transitions)
- Trigger real-time notifications via NotificationService
- Initiate AI analysis on card changes
- Track card operation metrics via AnalyticsService
- Handle card move logic (column transitions, position updates)

**Dependencies**:
- CardRepository (data access)
- NotificationService (real-time updates)
- AIService (bottleneck detection triggers)
- AnalyticsService (usage tracking)

**Key Workflows**:

1. **Create Card Workflow**:
   ```
   Validate input → Create in repository → Broadcast to board → Track metrics → Return card
   ```

2. **Move Card Workflow**:
   ```
   Validate move → Update repository → Broadcast update → Trigger scoped AI analysis → Track metrics → Return card
   ```

3. **Update Card Workflow**:
   ```
   Validate updates → Update repository → Broadcast changes → Track metrics → Return card
   ```

**Interface**:
```typescript
interface ICardService {
  createCard(tenantId: string, card: CreateCardRequest): Promise<Card>
  updateCard(tenantId: string, cardId: string, updates: UpdateCardRequest): Promise<Card>
  deleteCard(tenantId: string, cardId: string): Promise<void>
  moveCard(tenantId: string, cardId: string, targetColumn: string, position: number): Promise<Card>
  getCard(tenantId: string, cardId: string): Promise<Card>
  listCards(tenantId: string, boardId: string, filters?: CardFilters): Promise<Card[]>
}
```

---

### AIService

**Purpose**: Orchestrate all AI-powered features

**Responsibilities**:
- Coordinate AI task creation (context assembly, Bedrock invocation, response parsing)
- Coordinate bottleneck detection (scheduled and event-driven)
- Manage prompt selection and versioning via PromptManager
- Track AI usage metrics (token consumption, acceptance rates, alert actions)
- Handle AI errors and implement fallback strategies
- Enforce rate limiting and cost controls

**Dependencies**:
- BedrockClient (AI invocation)
- PromptManager (prompt templates)
- ContextAssembler (context gathering)
- AIResponseParser (response parsing)
- CardRepository (board state access)
- NotificationService (alert broadcasting)
- AnalyticsService (AI metrics tracking)

**Key Workflows**:

1. **AI Task Creation Workflow**:
   ```
   Validate input → Assemble context → Load prompt → Invoke Bedrock → Parse response → 
   Track tokens → Return suggestion (user confirms before persistence)
   ```

2. **Scheduled Bottleneck Analysis Workflow**:
   ```
   Load full board state → Assemble historical context → Load prompt → Invoke Bedrock → 
   Parse alerts → Filter empty results → Broadcast alerts → Track metrics
   ```

3. **Event-Driven Bottleneck Analysis Workflow**:
   ```
   Receive card change event → Load scoped context (column + assignee) → Load prompt → 
   Invoke Bedrock → Parse alert → Broadcast if needed → Track metrics
   ```

**Interface**:
```typescript
interface IAIService {
  // Task Creation
  createTaskFromDescription(tenantId: string, boardId: string, description: string): Promise<AICardSuggestion>
  
  // Bottleneck Detection
  analyzeBottlenecks(tenantId: string, boardId: string, mode: 'full' | 'scoped', scope?: AnalysisScope): Promise<BottleneckAlert[]>
  
  // Metrics
  trackSuggestionAcceptance(tenantId: string, suggestionId: string, accepted: boolean): Promise<void>
  trackAlertAction(tenantId: string, alertId: string, action: AlertAction): Promise<void>
  getAIMetrics(tenantId: string, period: TimePeriod): Promise<AIMetrics>
}
```

---

### NotificationService

**Purpose**: Orchestrate real-time notifications via WebSocket

**Responsibilities**:
- Coordinate WebSocket message broadcasting
- Determine notification recipients (tenant and board scoping)
- Format notification messages for different event types
- Track notification delivery success/failure
- Handle failed deliveries (retry logic, dead letter queue)
- Manage notification priorities and throttling

**Dependencies**:
- ConnectionRepository (active connections)
- WebSocketBroadcastHandler (message delivery)
- AnalyticsService (delivery metrics)

**Key Workflows**:

1. **Board Broadcast Workflow**:
   ```
   Query connections by tenant + board → Format message → Send to each connection → 
   Track delivery → Handle failures → Log metrics
   ```

2. **Tenant Broadcast Workflow**:
   ```
   Query connections by tenant → Format message → Send to each connection → 
   Track delivery → Handle failures → Log metrics
   ```

3. **Targeted Notification Workflow**:
   ```
   Validate connection → Format message → Send to specific connection → 
   Track delivery → Handle failure → Log metrics
   ```

**Interface**:
```typescript
interface INotificationService {
  // Broadcasting
  broadcastToBoard(tenantId: string, boardId: string, message: NotificationMessage): Promise<BroadcastResult>
  broadcastToTenant(tenantId: string, message: NotificationMessage): Promise<BroadcastResult>
  sendToUser(tenantId: string, userId: string, message: NotificationMessage): Promise<DeliveryResult>
  sendToConnection(connectionId: string, message: NotificationMessage): Promise<DeliveryResult>
  
  // Message Formatting
  formatCardUpdate(card: Card, action: CardAction): NotificationMessage
  formatAIAlert(alert: BottleneckAlert): NotificationMessage
  formatAISuggestion(suggestion: AICardSuggestion): NotificationMessage
}
```

---

### AnalyticsService

**Purpose**: Orchestrate usage tracking and analytics

**Responsibilities**:
- Emit usage events to Kinesis
- Track feature usage (AI suggestions, alerts, card operations)
- Calculate cost attribution per tenant (Bedrock tokens, Lambda invocations, DynamoDB operations)
- Generate usage reports and dashboards
- Support product analytics queries

**Dependencies**:
- Kinesis (event streaming)
- AnalyticsRepository (usage data storage)
- CloudWatch (metrics emission)

**Key Workflows**:

1. **Event Tracking Workflow**:
   ```
   Receive event → Enrich with context (tenant, user, timestamp) → 
   Emit to Kinesis → Log to CloudWatch → Store in repository (if needed)
   ```

2. **Cost Attribution Workflow**:
   ```
   Query usage data by tenant → Calculate costs (Bedrock tokens, Lambda, DynamoDB) → 
   Aggregate by time period → Return cost breakdown
   ```

3. **Usage Report Workflow**:
   ```
   Query usage data → Aggregate metrics → Calculate trends → Format report → Return
   ```

**Interface**:
```typescript
interface IAnalyticsService {
  // Event Tracking
  trackCardOperation(tenantId: string, operation: CardOperation): Promise<void>
  trackAISuggestion(tenantId: string, suggestion: AICardSuggestion, accepted: boolean): Promise<void>
  trackAlertAction(tenantId: string, alert: BottleneckAlert, action: AlertAction): Promise<void>
  trackWebSocketMessage(tenantId: string, messageType: string): Promise<void>
  
  // Cost Attribution
  trackBedrockUsage(tenantId: string, tokens: number, cost: number): Promise<void>
  trackLambdaInvocation(tenantId: string, functionName: string, duration: number): Promise<void>
  getCostAttribution(tenantId: string, period: TimePeriod): Promise<CostBreakdown>
  
  // Usage Reports
  getUsageMetrics(tenantId: string, period: TimePeriod): Promise<UsageMetrics>
  getFeatureAdoption(tenantId: string): Promise<FeatureAdoptionMetrics>
}
```

---

## Supporting Services

### TenantService

**Purpose**: Manage tenant operations and configuration

**Responsibilities**:
- Coordinate tenant CRUD operations
- Manage tenant configuration (tier, features, limits)
- Handle team member management
- Enforce tenant-level authorization
- Track tenant lifecycle events

**Dependencies**:
- TenantRepository (data access)
- AnalyticsService (tenant metrics)

**Interface**:
```typescript
interface ITenantService {
  createTenant(tenant: CreateTenantRequest): Promise<Tenant>
  updateTenant(tenantId: string, updates: UpdateTenantRequest): Promise<Tenant>
  getTenant(tenantId: string): Promise<Tenant>
  addTeamMember(tenantId: string, member: TeamMember): Promise<void>
  removeTeamMember(tenantId: string, memberId: string): Promise<void>
  getTenantFeatures(tenantId: string): Promise<FeatureFlags>
}
```

---

### AuthService

**Purpose**: Handle authentication and authorization

**Responsibilities**:
- Coordinate authentication with Cognito
- Issue and validate JWT tokens
- Extract tenant and user context from tokens
- Enforce authorization rules
- Manage user sessions

**Dependencies**:
- Cognito (authentication)
- TenantRepository (tenant validation)

**Interface**:
```typescript
interface IAuthService {
  login(email: string, password: string): Promise<AuthTokens>
  refreshToken(refreshToken: string): Promise<AuthTokens>
  logout(userId: string): Promise<void>
  validateToken(token: string): Promise<TokenPayload>
  extractTenantContext(token: string): Promise<TenantContext>
  checkAuthorization(userId: string, resource: string, action: string): Promise<boolean>
}
```

---

## Service Interaction Patterns

### Synchronous Service Calls
- CardService → NotificationService (immediate broadcast)
- AIService → BedrockClient (wait for AI response)
- AuthService → Cognito (validate credentials)

### Asynchronous Service Calls
- CardService → AIService (trigger analysis, don't wait)
- AIService → NotificationService (broadcast alerts)
- AnalyticsService → Kinesis (fire and forget)

### Event-Driven Triggers
- DynamoDB Stream → AIService (card change triggers scoped analysis)
- EventBridge Schedule → AIService (periodic full board analysis)

---

## Service Layer Benefits

1. **Encapsulation**: Business logic centralized in services, not scattered across handlers
2. **Reusability**: Services can be called from multiple handlers (REST, WebSocket, scheduled jobs)
3. **Testability**: Services can be unit tested with mocked dependencies
4. **Consistency**: Business rules applied consistently across all entry points
5. **Maintainability**: Changes to business logic isolated to service layer
6. **Observability**: Centralized logging and metrics in service layer

---

## Service Design Guidelines

1. **Single Responsibility**: Each service has one primary domain
2. **Dependency Injection**: Services receive dependencies via constructor
3. **Interface-Based**: Services implement interfaces for testability
4. **Stateless**: Services don't maintain state between calls
5. **Tenant-Scoped**: All operations enforce tenant isolation
6. **Error Handling**: Services throw domain-specific exceptions
7. **Logging**: All service operations emit structured logs with tenant context
8. **Metrics**: All service operations track relevant metrics

---

## Service Layer Summary

**Total Services**: 6 core services
- CardService (card operations)
- AIService (AI features)
- NotificationService (real-time updates)
- AnalyticsService (usage tracking)
- TenantService (tenant management)
- AuthService (authentication)

**Service Layer Depth**: Rich service layer with significant business logic and orchestration

**Orchestration Pattern**: Services coordinate across repositories, external services, and other services to implement complete business workflows
