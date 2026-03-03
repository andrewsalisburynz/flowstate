# Code Structure

## Build System

- **Type**: npm (Node Package Manager)
- **Language**: TypeScript
- **Compiler**: TypeScript 5.3.2
- **Build Tool**: Vite (frontend), tsc (backend/infrastructure)
- **Package Structure**: Monorepo with 3 independent packages

## Existing Files Inventory

### Backend Handlers
- `backend/src/handlers/cards.ts` - REST API handler for card CRUD
- `backend/src/handlers/ai-task.ts` - AI task generation from natural language
- `backend/src/handlers/ai-bottleneck.ts` - Bottleneck detection analysis
- `backend/src/handlers/websocket.ts` - WebSocket connection lifecycle

### Backend Services
- `backend/src/services/dynamodb.ts` - Data persistence layer
- `backend/src/services/bedrock.ts` - Claude 3 Sonnet AI integration
- `backend/src/services/websocket.ts` - Real-time broadcast service

### Frontend Components
- `frontend/src/App.tsx` - Main Kanban board component
- `frontend/src/App.css` - Kanban board styling
- `frontend/src/main.tsx` - React entry point
- `frontend/src/index.css` - Global styles

### Infrastructure Stacks
- `infrastructure/lib/storage-stack.ts` - DynamoDB tables
- `infrastructure/lib/api-stack.ts` - Lambda + API Gateway
- `infrastructure/lib/frontend-stack.ts` - S3 + CloudFront
- `infrastructure/bin/app.ts` - CDK app entry point

## Design Patterns

1. **Handler Pattern**: Separate HTTP routing from business logic
2. **Service Layer Pattern**: Encapsulate external service interactions
3. **Broadcast Pattern**: Send real-time updates to all connected clients
4. **React Hooks Pattern**: State management and side effects
5. **Modal Dialog Pattern**: Isolated UI for card creation
6. **Drag-and-Drop Pattern**: HTML5 drag events for card movement
7. **Infrastructure as Code**: CDK Constructs for AWS resources
8. **Stack Composition**: Organize resources into logical stacks

## Critical Dependencies

### Backend
- @aws-sdk/client-dynamodb (^3.470.0)
- @aws-sdk/client-bedrock-runtime (^3.470.0)
- @aws-sdk/client-apigatewaymanagementapi (^3.470.0)
- uuid (^9.0.1)

### Frontend
- react (^18.2.0)
- react-dom (^18.2.0)
- vite (^5.0.8)

### Infrastructure
- aws-cdk-lib (^2.110.0)
- constructs (^10.3.0)

