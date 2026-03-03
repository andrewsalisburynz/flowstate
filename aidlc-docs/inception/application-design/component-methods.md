# Component Methods

## Overview
This document defines method signatures for all application components. Detailed business rules and implementation logic will be defined in Functional Design (per-unit, CONSTRUCTION phase).

---

## Frontend Components

### BoardContainer

```typescript
class BoardContainer {
  // Lifecycle
  componentDidMount(): void
  componentWillUnmount(): void
  
  // State Management
  loadBoard(boardId: string): Promise<Board>
  refreshBoard(): Promise<void>
  
  // WebSocket
  connectWebSocket(): void
  disconnectWebSocket(): void
  handleWebSocketMessage(message: WebSocketMessage): void
  
  // Card Operations
  handleCardCreate(card: Card): Promise<void>
  handleCardUpdate(cardId: string, updates: Partial<Card>): Promise<void>
  handleCardDelete(cardId: string): Promise<void>
  handleCardMove(cardId: string, targetColumn: string, position: number): Promise<void>
  
  // Rendering
  render(): JSX.Element
}
```

### ColumnComponent

```typescript
class ColumnComponent {
  // Drag and Drop
  onDragOver(event: DragEvent): void
  onDrop(event: DragEvent): void
  
  // Rendering
  render(): JSX.Element
}
```

### CardComponent

```typescript
class CardComponent {
  // Interactions
  onClick(): void
  onDragStart(event: DragEvent): void
  onDragEnd(event: DragEvent): void
  
  // Actions
  handleEdit(): void
  handleDelete(): void
  
  // Rendering
  render(): JSX.Element
}
```

### AITaskInputComponent

```typescript
class AITaskInputComponent {
  // Input Handling
  handleInputChange(value: string): void
  handleSubmit(): Promise<void>
  validateInput(value: string): boolean
  
  // State
  setLoading(loading: boolean): void
  setError(error: string | null): void
  
  // Rendering
  render(): JSX.Element
}
```

### WebSocketClient

```typescript
class WebSocketClient {
  // Connection Management
  connect(token: string, tenantId: string, boardId: string): Promise<void>
  disconnect(): void
  reconnect(): Promise<void>
  
  // Messaging
  subscribe(channel: string, callback: (message: any) => void): void
  unsubscribe(channel: string): void
  send(message: WebSocketMessage): void
  
  // State
  isConnected(): boolean
  getConnectionId(): string | null
}
```

---

## Backend API Components

### CardHandler

```typescript
class CardHandler {
  // HTTP Handlers
  handleCreate(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult>
  handleGet(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult>
  handleUpdate(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult>
  handleDelete(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult>
  handleList(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult>
  
  // Validation
  validateCreateRequest(body: any): ValidationResult
  validateUpdateRequest(body: any): ValidationResult
  
  // Response Formatting
  formatSuccessResponse(data: any, statusCode: number): APIGatewayProxyResult
  formatErrorResponse(error: Error, statusCode: number): APIGatewayProxyResult
}
```

### WebSocketConnectionHandler

```typescript
class WebSocketConnectionHandler {
  // Connection Lifecycle
  handleConnect(event: APIGatewayWebSocketEvent): Promise<APIGatewayProxyResult>
  handleDisconnect(event: APIGatewayWebSocketEvent): Promise<APIGatewayProxyResult>
  
  // Authentication
  validateToken(token: string): Promise<TokenPayload>
  extractTenantContext(token: TokenPayload): TenantContext
  
  // State Management
  storeConnection(connectionId: string, context: ConnectionContext): Promise<void>
  removeConnection(connectionId: string): Promise<void>
}
```

### AITaskCreationHandler

```typescript
class AITaskCreationHandler {
  // Main Handler
  handle(event: any): Promise<any>
  
  // Processing
  processTaskDescription(description: string, context: BoardContext): Promise<AICardSuggestion>
  assemblePromptContext(boardContext: BoardContext): PromptContext
  invokeAI(prompt: string, context: PromptContext): Promise<AIResponse>
  parseAIResponse(response: AIResponse): AICardSuggestion
  
  // Validation
  validateInput(description: string): ValidationResult
  validateAIResponse(response: AIResponse): boolean
}
```

---

## AI Service Components

### BedrockClient

```typescript
class BedrockClient {
  // Invocation
  invoke(prompt: string, config: BedrockConfig): Promise<BedrockResponse>
  invokeAsync(prompt: string, config: BedrockConfig): Promise<string> // Returns job ID
  
  // Configuration
  setModel(modelId: string): void
  setTemperature(temperature: number): void
  setMaxTokens(maxTokens: number): void
  
  // Monitoring
  trackTokenUsage(tenantId: string, tokens: number): void
  getUsageMetrics(tenantId: string): Promise<UsageMetrics>
}
```

### PromptManager

```typescript
class PromptManager {
  // Prompt Loading
  loadPrompt(promptName: string, version?: string): Promise<string>
  loadAllPrompts(): Promise<Map<string, string>>
  
  // Formatting
  formatPrompt(template: string, variables: Record<string, any>): string
  
  // Caching
  getCachedPrompt(promptName: string): string | null
  cachePrompt(promptName: string, content: string): void
  clearCache(): void
}
```

### ContextAssembler

```typescript
class ContextAssembler {
  // Context Assembly
  assembleBoardContext(tenantId: string, boardId: string): Promise<BoardContext>
  assembleCardContext(tenantId: string, cardId: string): Promise<CardContext>
  assembleHistoricalContext(tenantId: string, boardId: string, days: number): Promise<HistoricalContext>
  
  // Security
  validateTenantScope(tenantId: string, resourceId: string): Promise<boolean>
  
  // Optimization
  optimizeContextSize(context: any, maxTokens: number): any
}
```

---

## Data Access Components

### CardRepository

```typescript
class CardRepository {
  // CRUD Operations
  create(card: Card): Promise<Card>
  getById(tenantId: string, cardId: string): Promise<Card | null>
  update(tenantId: string, cardId: string, updates: Partial<Card>): Promise<Card>
  delete(tenantId: string, cardId: string): Promise<void>
  
  // Queries
  listByBoard(tenantId: string, boardId: string): Promise<Card[]>
  listByColumn(tenantId: string, boardId: string, column: string): Promise<Card[]>
  listByAssignee(tenantId: string, assigneeId: string): Promise<Card[]>
  
  // Tenant Scoping
  validateTenantAccess(tenantId: string, cardId: string): Promise<boolean>
}
```

### ConnectionRepository

```typescript
class ConnectionRepository {
  // Connection Management
  create(connection: Connection): Promise<void>
  delete(connectionId: string): Promise<void>
  
  // Queries
  getByConnectionId(connectionId: string): Promise<Connection | null>
  listByTenant(tenantId: string): Promise<Connection[]>
  listByBoard(tenantId: string, boardId: string): Promise<Connection[]>
  
  // Cleanup
  removeStaleConnections(olderThan: Date): Promise<number>
}
```

---

## Service Layer Components

### CardService

```typescript
class CardService {
  // Business Operations
  createCard(tenantId: string, card: CreateCardRequest): Promise<Card>
  updateCard(tenantId: string, cardId: string, updates: UpdateCardRequest): Promise<Card>
  deleteCard(tenantId: string, cardId: string): Promise<void>
  moveCard(tenantId: string, cardId: string, targetColumn: string, position: number): Promise<Card>
  
  // Orchestration
  createCardWithNotification(tenantId: string, boardId: string, card: CreateCardRequest): Promise<Card>
  moveCardWithAnalysis(tenantId: string, cardId: string, targetColumn: string): Promise<Card>
  
  // Validation
  validateCardData(card: any): ValidationResult
  validateCardMove(card: Card, targetColumn: string): ValidationResult
}
```

### AIService

```typescript
class AIService {
  // Task Creation
  createTaskFromDescription(tenantId: string, boardId: string, description: string): Promise<AICardSuggestion>
  
  // Bottleneck Detection
  analyzeBottlenecks(tenantId: string, boardId: string, mode: 'full' | 'scoped'): Promise<BottleneckAlert[]>
  analyzeScopedBottleneck(tenantId: string, boardId: string, column: string, assignee?: string): Promise<BottleneckAlert | null>
  
  // Metrics
  trackAISuggestionAcceptance(tenantId: string, suggestionId: string, accepted: boolean): void
  trackAlertAction(tenantId: string, alertId: string, action: 'dismissed' | 'acted'): void
  getAIMetrics(tenantId: string): Promise<AIMetrics>
}
```

### NotificationService

```typescript
class NotificationService {
  // Broadcasting
  broadcastToBoard(tenantId: string, boardId: string, message: NotificationMessage): Promise<void>
  broadcastToTenant(tenantId: string, message: NotificationMessage): Promise<void>
  sendToConnection(connectionId: string, message: NotificationMessage): Promise<void>
  
  // Message Formatting
  formatCardUpdate(card: Card, action: 'created' | 'updated' | 'deleted'): NotificationMessage
  formatAIAlert(alert: BottleneckAlert): NotificationMessage
  
  // Delivery Tracking
  trackDelivery(connectionId: string, messageId: string, success: boolean): void
}
```

---

## Infrastructure Components (CDK)

### APIStack

```typescript
class APIStack extends Stack {
  // Stack Construction
  constructor(scope: Construct, id: string, props: APIStackProps)
  
  // Resource Creation
  createRestAPI(): RestApi
  createWebSocketAPI(): WebSocketApi
  createAuthorizer(): Authorizer
  
  // Integration
  addLambdaIntegration(path: string, method: string, lambda: Function): void
  addWebSocketRoute(routeKey: string, lambda: Function): void
}
```

### ComputeStack

```typescript
class ComputeStack extends Stack {
  // Stack Construction
  constructor(scope: Construct, id: string, props: ComputeStackProps)
  
  // Lambda Creation
  createLambdaFunction(id: string, config: LambdaConfig): Function
  createLambdaLayer(id: string, code: Code): LayerVersion
  
  // IAM
  createExecutionRole(id: string, policies: PolicyStatement[]): Role
  attachPolicy(lambda: Function, policy: PolicyStatement): void
}
```

---

## Method Signature Conventions

### Naming Conventions
- **Handlers**: `handle*` (handleCreate, handleUpdate)
- **Queries**: `get*`, `list*`, `find*`
- **Commands**: `create*`, `update*`, `delete*`, `move*`
- **Validation**: `validate*`
- **Formatting**: `format*`
- **Tracking**: `track*`

### Return Types
- **Async operations**: `Promise<T>`
- **Void operations**: `Promise<void>` or `void`
- **Optional results**: `T | null`
- **Collections**: `T[]` or `Map<K, V>`

### Error Handling
- All async methods can throw errors
- Validation methods return `ValidationResult` objects
- HTTP handlers return formatted error responses

---

**Note**: Detailed business rules, validation logic, and implementation details will be defined in Functional Design stage (per-unit, CONSTRUCTION phase).
