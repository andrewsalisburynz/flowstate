# Component Dependencies and Communication Patterns

## Overview
This document defines the dependency relationships and communication patterns between all application components.

---

## Dependency Matrix

### Frontend Layer Dependencies

| Component | Depends On | Communication Pattern |
|-----------|------------|----------------------|
| BoardContainer | WebSocketClient, APIClient, AuthProvider | Direct method calls |
| ColumnComponent | BoardContainer (parent) | Props and callbacks |
| CardComponent | BoardContainer (parent) | Props and callbacks |
| AITaskInputComponent | APIClient, BoardContainer | Direct calls + callbacks |
| AICardSuggestionModal | BoardContainer (parent) | Props and callbacks |
| WebSocketClient | AuthProvider | Direct method calls |
| APIClient | AuthProvider | Direct method calls |

### Backend API Layer Dependencies

| Component | Depends On | Communication Pattern |
|-----------|------------|----------------------|
| CardHandler | CardService, AuthMiddleware, ErrorHandler | Direct method calls |
| TenantHandler | TenantService, AuthMiddleware, ErrorHandler | Direct method calls |
| AuthHandler | AuthService, ErrorHandler | Direct method calls |
| WebSocketConnectionHandler | ConnectionRepository, AuthService | Direct method calls |
| WebSocketMessageHandler | CardService, NotificationService, AuthMiddleware | Direct method calls |
| WebSocketBroadcastHandler | ConnectionRepository, APIGateway | Direct method calls |
| AITaskCreationHandler | AIService, AuthMiddleware, ErrorHandler | Direct method calls |
| AIBottleneckScheduledHandler | AIService, NotificationService | Direct method calls |
| AIBottleneckStreamHandler | AIService, NotificationService | Event-driven trigger |

### Service Layer Dependencies

| Service | Depends On | Communication Pattern |
|---------|------------|----------------------|
| CardService | CardRepository, NotificationService, AIService, AnalyticsService | Direct method calls |
| AIService | BedrockClient, PromptManager, ContextAssembler, AIResponseParser, CardRepository, NotificationService, AnalyticsService | Direct method calls |
| NotificationService | ConnectionRepository, WebSocketBroadcastHandler, AnalyticsService | Direct method calls |
| AnalyticsService | Kinesis, AnalyticsRepository, CloudWatch | Direct method calls |
| TenantService | TenantRepository, AnalyticsService | Direct method calls |
| AuthService | Cognito, TenantRepository | Direct method calls |

### Data Access Layer Dependencies

| Component | Depends On | Communication Pattern |
|-----------|------------|----------------------|
| CardRepository | DynamoDB | AWS SDK calls |
| TenantRepository | DynamoDB | AWS SDK calls |
| ConnectionRepository | DynamoDB | AWS SDK calls |
| AnalyticsRepository | DynamoDB | AWS SDK calls |

### AI Layer Dependencies

| Component | Depends On | Communication Pattern |
|-----------|------------|----------------------|
| BedrockClient | AWS Bedrock | AWS SDK calls |
| PromptManager | Parameter Store | AWS SDK calls |
| ContextAssembler | CardRepository, TenantRepository | Direct method calls |
| AIResponseParser | None | Standalone utility |

---

## Communication Patterns

### 1. Synchronous REST API Calls

**Pattern**: Frontend → API Gateway → Lambda Handler → Service → Repository → DynamoDB

**Example Flow** (Create Card):
```
CardComponent (Frontend)
  → APIClient.createCard()
    → API Gateway REST /cards POST
      → CardHandler.handleCreate()
        → CardService.createCard()
          → CardRepository.create()
            → DynamoDB PutItem
          → NotificationService.broadcastToBoard()
            → ConnectionRepository.listByBoard()
            → WebSocketBroadcastHandler.broadcast()
          → AnalyticsService.trackCardOperation()
        → Return Card
      → Return HTTP 201 + Card JSON
    → Update local state
  → Re-render UI
```

**Characteristics**:
- Request-response pattern
- Client waits for response
- Used for user-initiated CRUD operations
- Timeout: 30 seconds (API Gateway limit)

---

### 2. Asynchronous WebSocket Messages

**Pattern**: Backend → WebSocket API → Connected Clients

**Example Flow** (Card Update Broadcast):
```
CardService.updateCard()
  → NotificationService.broadcastToBoard(tenantId, boardId, cardUpdate)
    → ConnectionRepository.listByBoard(tenantId, boardId)
      → Returns [connection1, connection2, connection3]
    → For each connection:
      → WebSocketBroadcastHandler.sendToConnection(connectionId, message)
        → API Gateway WebSocket POST to connection
          → Client WebSocketClient receives message
            → BoardContainer.handleWebSocketMessage()
              → Update local state
              → Re-render UI
```

**Characteristics**:
- Server-initiated push
- No client request required
- Used for real-time multi-user sync
- Fire-and-forget (no response expected)

---

### 3. Event-Driven Processing (DynamoDB Streams)

**Pattern**: DynamoDB Change → Stream → Lambda Trigger → Processing

**Example Flow** (Card Move Triggers Scoped Analysis):
```
CardRepository.update(card, {column: 'In Progress'})
  → DynamoDB UpdateItem
    → DynamoDB Stream emits change record
      → AIBottleneckStreamHandler triggered
        → Extract card change details
        → AIService.analyzeBottlenecks(tenantId, boardId, 'scoped', {column: 'In Progress'})
          → ContextAssembler.assembleBoardContext() (scoped to column)
          → PromptManager.loadPrompt('bottleneck-scoped')
          → BedrockClient.invoke(prompt, context)
          → AIResponseParser.parse(response)
          → If alert generated:
            → NotificationService.broadcastToBoard(alert)
          → AnalyticsService.trackAlertAction()
```

**Characteristics**:
- Triggered by data changes
- Asynchronous processing
- No blocking of original operation
- Used for scoped bottleneck detection

---

### 4. Scheduled Processing (EventBridge)

**Pattern**: EventBridge Schedule → Lambda Trigger → Processing

**Example Flow** (Periodic Full Board Analysis):
```
EventBridge Rule (every 30 minutes)
  → AIBottleneckScheduledHandler triggered
    → For each active tenant/board:
      → AIService.analyzeBottlenecks(tenantId, boardId, 'full')
        → ContextAssembler.assembleBoardContext() (full board)
        → ContextAssembler.assembleHistoricalContext() (past 7 days)
        → PromptManager.loadPrompt('bottleneck-full')
        → BedrockClient.invoke(prompt, context)
        → AIResponseParser.parse(response)
        → If alerts generated:
          → NotificationService.broadcastToBoard(alerts)
        → AnalyticsService.trackAlertAction()
```

**Characteristics**:
- Time-based trigger
- Batch processing
- Independent of user actions
- Used for full board analysis

---

### 5. Async AI Processing

**Pattern**: Frontend → API → Lambda → Async AI → WebSocket Response

**Example Flow** (AI Task Creation):
```
AITaskInputComponent.handleSubmit()
  → APIClient.createAITask(description)
    → API Gateway REST /ai/tasks POST
      → AITaskCreationHandler.handle()
        → AIService.createTaskFromDescription()
          → ContextAssembler.assembleBoardContext()
          → PromptManager.loadPrompt('task-creation')
          → BedrockClient.invoke(prompt, context) [ASYNC - may take 5-10 seconds]
          → AIResponseParser.parse(response)
          → Generate suggestionId
          → NotificationService.sendToUser(userId, suggestion)
            → WebSocketBroadcastHandler.sendToConnection()
              → Client WebSocketClient receives suggestion
                → AICardSuggestionModal opens with suggestion
                  → User approves/rejects
                    → If approved: APIClient.createCard(suggestion)
        → Return HTTP 202 Accepted + suggestionId
      → Frontend shows loading state
```

**Characteristics**:
- Non-blocking API response
- Result delivered via WebSocket
- Better UX for long-running AI operations
- User confirmation before persistence

---

## Data Flow Diagrams

### User Action Flow

```
User Interaction (Frontend)
  ↓
API Client (HTTP/WebSocket)
  ↓
API Gateway (REST/WebSocket)
  ↓
Lambda Handler (Auth + Validation)
  ↓
Service Layer (Business Logic)
  ↓
Repository Layer (Data Access)
  ↓
DynamoDB (Persistence)
```

### Real-Time Sync Flow

```
User A: Card Update
  ↓
CardService.updateCard()
  ↓
NotificationService.broadcastToBoard()
  ↓
WebSocket API
  ↓
User B, C, D: Receive Update
  ↓
UI Auto-Updates
```

### AI Analysis Flow

```
Card Move Event
  ↓
DynamoDB Stream
  ↓
AIBottleneckStreamHandler
  ↓
AIService (Context + Prompt + Bedrock)
  ↓
Alert Generated (if needed)
  ↓
NotificationService
  ↓
WebSocket Broadcast
  ↓
All Board Users: See Alert
```

---

## Dependency Injection Pattern

### Service Layer DI

```typescript
// CardService receives dependencies via constructor
class CardService {
  constructor(
    private cardRepository: ICardRepository,
    private notificationService: INotificationService,
    private aiService: IAIService,
    private analyticsService: IAnalyticsService
  ) {}
}

// Lambda handler instantiates service with dependencies
const cardRepository = new CardRepository(dynamoDBClient);
const notificationService = new NotificationService(connectionRepository, wsHandler);
const aiService = new AIService(bedrockClient, promptManager, contextAssembler);
const analyticsService = new AnalyticsService(kinesisClient);

const cardService = new CardService(
  cardRepository,
  notificationService,
  aiService,
  analyticsService
);
```

**Benefits**:
- Testability (mock dependencies in unit tests)
- Flexibility (swap implementations)
- Clear dependency graph

---

## Cross-Cutting Concerns

### Authentication Flow

```
All API Requests
  ↓
API Gateway Authorizer (validates JWT)
  ↓
AuthMiddleware (extracts tenant context)
  ↓
Handler (receives tenantId, userId in context)
  ↓
Service (enforces tenant scoping)
  ↓
Repository (filters by tenantId)
```

### Logging Flow

```
Any Component
  ↓
LoggerUtil.log(level, message, context)
  ↓
Structured JSON log with:
  - timestamp
  - level
  - message
  - tenantId
  - userId
  - correlationId
  - component
  ↓
CloudWatch Logs
```

### Error Handling Flow

```
Any Component throws Error
  ↓
ErrorHandler middleware catches
  ↓
Log error with context
  ↓
Emit error metric to CloudWatch
  ↓
Format error response (sanitized for client)
  ↓
Return to client
```

---

## Dependency Summary

### Frontend Dependencies
- **Total**: 7 components
- **External**: WebSocket API, REST API, Cognito (via AuthProvider)
- **Internal**: Component hierarchy with props/callbacks

### Backend Dependencies
- **Total**: 9 Lambda handlers
- **External**: API Gateway, DynamoDB, Bedrock, Cognito, EventBridge
- **Internal**: Service layer, repositories

### Service Layer Dependencies
- **Total**: 6 services
- **External**: DynamoDB, Bedrock, Kinesis, CloudWatch, Parameter Store
- **Internal**: Cross-service calls, repository layer

### Data Access Dependencies
- **Total**: 4 repositories
- **External**: DynamoDB only
- **Internal**: None (leaf nodes)

---

## Communication Pattern Summary

1. **Synchronous REST**: User CRUD operations (create, update, delete cards)
2. **Asynchronous WebSocket**: Real-time updates (card changes, AI alerts)
3. **Event-Driven Streams**: Scoped AI analysis (triggered by card moves)
4. **Scheduled Events**: Full board analysis (periodic EventBridge trigger)
5. **Async AI Processing**: AI task creation (non-blocking with WebSocket response)

---

## Architectural Benefits

1. **Loose Coupling**: Components depend on interfaces, not implementations
2. **Testability**: Dependency injection enables unit testing
3. **Scalability**: Stateless components scale horizontally
4. **Maintainability**: Clear dependency graph, easy to trace flows
5. **Observability**: Structured logging at every layer
6. **Security**: Tenant scoping enforced at every boundary
