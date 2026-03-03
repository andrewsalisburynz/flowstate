# Unit of Work Dependencies

## Overview
This document defines the dependency relationships between units, deployment order, and integration points.

---

## Dependency Matrix

| Unit | Depends On | Dependency Type | Integration Points |
|------|------------|-----------------|-------------------|
| 1. Infrastructure Foundation | None | N/A | Provides: DynamoDB tables, Parameter Store, AppConfig |
| 2. Authentication & Multi-Tenancy | Unit 1 | Build-time (CDK), Runtime (DynamoDB) | Provides: AuthMiddleware, Cognito tokens, Tenant API |
| 3. Card Management API | Units 1, 2 | Build-time (CDK), Runtime (Auth, DynamoDB) | Provides: Card REST API, Consumes: AuthMiddleware |
| 4. WebSocket Real-Time | Units 1, 2 | Build-time (CDK), Runtime (Auth, DynamoDB) | Provides: WebSocket API, NotificationService, Consumes: AuthMiddleware |
| 5. AI Task Creation | Units 1, 2, 4 | Build-time (CDK), Runtime (Auth, WebSocket, Bedrock) | Provides: AI Task API, Consumes: AuthMiddleware, WebSocket for responses |
| 6. AI Bottleneck Detection | Units 1, 3, 4, 5 | Build-time (CDK), Runtime (Card data, WebSocket, AI components) | Consumes: Card data, WebSocket for alerts, AI components |
| 7. Frontend Application | Units 3, 4, 5 | Runtime (REST API, WebSocket API) | Consumes: All backend APIs |
| 8. Observability & Analytics | All units | Build-time (CDK), Runtime (observes all) | Observes: All Lambda functions, APIs, DynamoDB |

---

## Deployment Order

### Sequential Deployment (Approved Approach)

**Stage 1: Foundation**
1. Unit 1: Infrastructure Foundation
   - Deploy first (no dependencies)
   - Creates base resources for all other units

**Stage 2: Authentication**
2. Unit 2: Authentication & Multi-Tenancy
   - Deploy after Unit 1
   - Requires DynamoDB tenant table

**Stage 3: Backend Services (can be deployed in parallel, but pipeline is sequential)**
3. Unit 3: Card Management API
4. Unit 4: WebSocket Real-Time
5. Unit 5: AI Task Creation
6. Unit 6: AI Bottleneck Detection

**Stage 4: Frontend & Observability**
7. Unit 7: Frontend Application
8. Unit 8: Observability & Analytics

### Deployment Pipeline Flow

```
Infrastructure Foundation (Unit 1)
  ↓
Authentication & Multi-Tenancy (Unit 2)
  ↓
Card Management API (Unit 3)
  ↓
WebSocket Real-Time (Unit 4)
  ↓
AI Task Creation (Unit 5)
  ↓
AI Bottleneck Detection (Unit 6)
  ↓
Frontend Application (Unit 7)
  ↓
Observability & Analytics (Unit 8)
  ↓
Integration Tests
  ↓
Deployment Complete
```

---

## Parallel Development Opportunities

While deployment is sequential, development can proceed in parallel:

### Phase 1: Foundation (Sequential Development)
- **Unit 1**: Infrastructure Foundation (must complete first)
- **Unit 2**: Authentication & Multi-Tenancy (must complete second)

### Phase 2: Core Services (Parallel Development)
Once Units 1-2 are complete, these can be developed simultaneously:
- **Unit 3**: Card Management API
- **Unit 4**: WebSocket Real-Time
- **Unit 5**: AI Task Creation (can start once Unit 4 API contracts defined)
- **Unit 6**: AI Bottleneck Detection (can start once Units 3-5 contracts defined)

### Phase 3: User Interface (Parallel Development)
Once API contracts from Phase 2 are defined:
- **Unit 7**: Frontend Application (can start once API contracts defined)
- **Unit 8**: Observability & Analytics (can develop alongside all units)

---

## Integration Points

### Unit 1: Infrastructure Foundation

**Provides**:
- DynamoDB tables:
  - `cards` table (PK: tenantId#boardId, SK: cardId)
  - `tenants` table (PK: tenantId)
  - `connections` table (PK: connectionId, GSI: tenantId#boardId)
  - `analytics` table (PK: tenantId#date, SK: eventId)
- Parameter Store paths:
  - `/kanban-saas/prompts/task-creation`
  - `/kanban-saas/prompts/bottleneck-full`
  - `/kanban-saas/prompts/bottleneck-scoped`
- AppConfig application and environment

**Consumed By**: All units

---

### Unit 2: Authentication & Multi-Tenancy

**Provides**:
- Cognito User Pool (user authentication)
- JWT tokens (authentication tokens with tenant context)
- AuthMiddleware (exports for use by other units)
  ```typescript
  export const authMiddleware: Middleware
  export function extractTenantContext(token: string): TenantContext
  ```
- Tenant REST API:
  - `POST /tenants` - Create tenant
  - `GET /tenants/{tenantId}` - Get tenant
  - `PUT /tenants/{tenantId}` - Update tenant
  - `POST /tenants/{tenantId}/members` - Add team member

**Consumed By**: Units 3, 4, 5, 6, 7

**Integration Pattern**: 
- Other units import AuthMiddleware
- Lambda handlers use middleware to validate tokens and extract tenant context
- Frontend uses Cognito SDK for authentication

---

### Unit 3: Card Management API

**Provides**:
- Card REST API:
  - `POST /cards` - Create card
  - `GET /cards/{cardId}` - Get card
  - `PUT /cards/{cardId}` - Update card
  - `DELETE /cards/{cardId}` - Delete card
  - `GET /boards/{boardId}/cards` - List cards
  - `PUT /cards/{cardId}/move` - Move card to column

**Request/Response Format**:
```typescript
// POST /cards
Request: {
  boardId: string
  title: string
  description: string
  column: string
  assignee?: string
  storyPoints?: number
  priority?: string
}
Response: Card

// Card model
interface Card {
  id: string
  tenantId: string
  boardId: string
  title: string
  description: string
  column: string
  assignee?: string
  storyPoints?: number
  priority?: string
  createdAt: string
  updatedAt: string
}
```

**Consumed By**: Units 6 (reads card data), 7 (frontend)

**Integration Pattern**:
- Frontend makes REST API calls
- Unit 6 reads card data via CardRepository

---

### Unit 4: WebSocket Real-Time

**Provides**:
- WebSocket API:
  - `wss://{api-id}.execute-api.{region}.amazonaws.com/{stage}`
  - Connection lifecycle: `$connect`, `$disconnect`
  - Message routing: `$default`
- NotificationService (exports for use by other units)
  ```typescript
  export class NotificationService {
    broadcastToBoard(tenantId: string, boardId: string, message: NotificationMessage): Promise<void>
    sendToConnection(connectionId: string, message: NotificationMessage): Promise<void>
  }
  ```

**WebSocket Message Format**:
```typescript
// Client → Server
{
  action: string
  data: any
}

// Server → Client
{
  type: 'card_update' | 'ai_suggestion' | 'bottleneck_alert'
  data: any
  timestamp: string
}
```

**Consumed By**: Units 5 (AI responses), 6 (alerts), 7 (frontend)

**Integration Pattern**:
- Other units import NotificationService
- Services call NotificationService to broadcast messages
- Frontend establishes WebSocket connection and subscribes to messages

---

### Unit 5: AI Task Creation

**Provides**:
- AI Task Creation API:
  - `POST /ai/tasks` - Create task from natural language
  
**Request/Response Format**:
```typescript
// POST /ai/tasks
Request: {
  boardId: string
  description: string  // Natural language input
}
Response: {
  suggestionId: string
  status: 'processing'
}

// WebSocket response (async)
{
  type: 'ai_suggestion'
  data: {
    suggestionId: string
    card: {
      title: string
      description: string
      acceptanceCriteria: string[]
      storyPoints: number
      suggestedAssignee?: string
      priority: string
    }
  }
}
```

**Consumed By**: Unit 7 (frontend)

**Integration Pattern**:
- Frontend POSTs to AI API
- Receives immediate 202 Accepted response
- Listens for WebSocket message with AI suggestion
- User confirms/rejects suggestion
- If confirmed, frontend POSTs to Card API (Unit 3)

---

### Unit 6: AI Bottleneck Detection

**Provides**:
- Bottleneck alerts (via WebSocket, no direct API)

**WebSocket Alert Format**:
```typescript
{
  type: 'bottleneck_alert'
  data: {
    alertId: string
    severity: 'low' | 'medium' | 'high'
    category: 'aging_cards' | 'workload_imbalance' | 'column_bottleneck'
    message: string
    affectedCards?: string[]
    affectedColumn?: string
    affectedAssignee?: string
    recommendations: string[]
    timestamp: string
  }
}
```

**Consumed By**: Unit 7 (frontend displays alerts)

**Integration Pattern**:
- Scheduled Lambda runs periodically (EventBridge)
- Stream Lambda triggers on card changes (DynamoDB Streams)
- Both invoke AIService for analysis
- Alerts broadcast via NotificationService (Unit 4)
- Frontend receives and displays alerts

---

### Unit 7: Frontend Application

**Provides**:
- User interface (no API, consumes only)

**Consumes**:
- Unit 2: Cognito authentication, Tenant API
- Unit 3: Card REST API
- Unit 4: WebSocket API
- Unit 5: AI Task Creation API

**Integration Pattern**:
- React app hosted on S3 + CloudFront
- APIClient makes authenticated REST calls
- WebSocketClient maintains persistent connection
- AuthProvider manages authentication state

---

### Unit 8: Observability & Analytics

**Provides**:
- CloudWatch dashboards (read-only, no API)
- Analytics data (internal, no external API)

**Consumes**:
- All units (observes logs, metrics, events)

**Integration Pattern**:
- All Lambda functions emit structured logs
- All services emit custom metrics
- AnalyticsService emits events to Kinesis
- CloudWatch aggregates and visualizes

---

## Shared Code Dependencies

### Shared Library Package (`packages/shared/`)

**Exports**:
```typescript
// Models
export { Card, Tenant, Connection, User } from './models'

// Types
export { 
  TenantContext, 
  AuthTokens, 
  ValidationResult,
  NotificationMessage,
  WebSocketMessage
} from './types'

// Utilities
export { Logger, ErrorHandler, Validator } from './utils'

// Constants
export { HTTP_STATUS, ERROR_CODES, TABLE_NAMES } from './constants'
```

**Used By**: All units

**Integration Pattern**:
- All units import from `@kanban-saas/shared`
- Shared package published to npm workspace
- TypeScript path mapping for local development

---

## Cross-Unit Communication Patterns

### 1. Synchronous REST API Calls
- Frontend (Unit 7) → Card API (Unit 3)
- Frontend (Unit 7) → AI Task API (Unit 5)
- Frontend (Unit 7) → Tenant API (Unit 2)

### 2. Asynchronous WebSocket Messages
- Card API (Unit 3) → NotificationService (Unit 4) → Frontend (Unit 7)
- AI Task Creation (Unit 5) → NotificationService (Unit 4) → Frontend (Unit 7)
- AI Bottleneck (Unit 6) → NotificationService (Unit 4) → Frontend (Unit 7)

### 3. Event-Driven Triggers
- DynamoDB Streams (Unit 1) → AI Bottleneck Stream Handler (Unit 6)
- EventBridge Schedule (Unit 1) → AI Bottleneck Scheduled Handler (Unit 6)

### 4. Shared Service Invocations
- Card API (Unit 3) → NotificationService (Unit 4)
- AI Task Creation (Unit 5) → NotificationService (Unit 4)
- AI Bottleneck (Unit 6) → NotificationService (Unit 4)
- All units → AnalyticsService (Unit 8)

---

## Dependency Summary

### No Dependencies
- Unit 1: Infrastructure Foundation

### Single Dependency
- Unit 2: Authentication & Multi-Tenancy (depends on Unit 1)

### Multiple Dependencies
- Unit 3: Card Management API (depends on Units 1, 2)
- Unit 4: WebSocket Real-Time (depends on Units 1, 2)
- Unit 5: AI Task Creation (depends on Units 1, 2, 4)
- Unit 6: AI Bottleneck Detection (depends on Units 1, 3, 4, 5)
- Unit 7: Frontend Application (depends on Units 3, 4, 5)
- Unit 8: Observability & Analytics (depends on all units)

### Critical Path
```
Unit 1 → Unit 2 → Units 3,4,5,6 (parallel) → Units 7,8 (parallel)
```

**Longest Path**: Unit 1 → Unit 2 → Unit 4 → Unit 5 → Unit 7
**Estimated Duration**: 2-3h + 3-4h + 4-5h + 5-6h + 6-8h = 20-26 hours

With parallel development: ~16-21 hours
