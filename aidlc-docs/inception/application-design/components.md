# Application Components

## Overview
This document defines the high-level component architecture for the AI-driven Kanban SaaS application, organized by layer and responsibility.

---

## Frontend Components (React)

### Board Components

#### `BoardContainer`
- **Purpose**: Main container for the Kanban board
- **Responsibilities**:
  - Manage board state (columns, cards)
  - Handle WebSocket connection and real-time updates
  - Coordinate card operations across columns
  - Manage loading and error states
- **Interface**: Receives tenantId, boardId; renders board UI

#### `ColumnComponent`
- **Purpose**: Represents a single Kanban column
- **Responsibilities**:
  - Render cards within the column
  - Handle drag-and-drop events
  - Display column metadata (title, card count, WIP limits)
  - Trigger card reordering within column
- **Interface**: Receives column data, card list; emits card move events

#### `CardComponent`
- **Purpose**: Individual Kanban card display
- **Responsibilities**:
  - Render card details (title, description, assignee, points)
  - Handle card interactions (click, drag, edit)
  - Display card status indicators
  - Show AI-generated badge if applicable
- **Interface**: Receives card data; emits edit, move, delete events

#### `CardDetailModal`
- **Purpose**: Detailed card view and editing
- **Responsibilities**:
  - Display full card information
  - Enable inline editing of card fields
  - Show acceptance criteria and history
  - Handle save/cancel operations
- **Interface**: Receives card data; emits update events

### AI Components

#### `AITaskInputComponent`
- **Purpose**: Natural language input for AI task creation
- **Responsibilities**:
  - Provide text input interface
  - Validate user input
  - Submit to AI service
  - Display loading state during AI processing
- **Interface**: Receives board context; emits AI request events

#### `AICardSuggestionModal`
- **Purpose**: Display AI-generated card for user confirmation
- **Responsibilities**:
  - Render AI-suggested card structure
  - Allow editing before acceptance
  - Handle approve/reject actions
  - Show confidence indicators
- **Interface**: Receives AI suggestion; emits accept/reject events

#### `BottleneckAlertComponent`
- **Purpose**: Display bottleneck detection alerts
- **Responsibilities**:
  - Render alert notifications
  - Show affected cards/columns
  - Provide dismiss/acknowledge actions
  - Display alert severity and recommendations
- **Interface**: Receives alert data; emits acknowledgment events

### Shared Components

#### `WebSocketClient`
- **Purpose**: Manage WebSocket connection and messaging
- **Responsibilities**:
  - Establish and maintain WebSocket connection
  - Handle connection lifecycle (connect, disconnect, reconnect)
  - Subscribe to board-specific channels
  - Broadcast and receive real-time updates
  - Handle authentication and tenant scoping
- **Interface**: Singleton service; provides subscribe/publish methods

#### `AuthProvider`
- **Purpose**: Authentication context and token management
- **Responsibilities**:
  - Manage authentication state
  - Store and refresh tokens
  - Provide tenant context
  - Handle login/logout flows
- **Interface**: React context provider; exposes auth state and methods

#### `APIClient`
- **Purpose**: HTTP client for REST API calls
- **Responsibilities**:
  - Make authenticated API requests
  - Handle request/response transformation
  - Manage error responses
  - Add tenant context to requests
- **Interface**: Service class; provides CRUD methods

---

## Backend API Components (Lambda Functions)

### REST API Handlers

#### `CardHandler`
- **Purpose**: Handle card CRUD operations
- **Responsibilities**:
  - Process card creation, read, update, delete requests
  - Validate request payloads
  - Enforce tenant scoping
  - Coordinate with CardService
  - Return formatted responses
- **Interface**: API Gateway REST integration; receives HTTP events

#### `TenantHandler`
- **Purpose**: Handle tenant management operations
- **Responsibilities**:
  - Process tenant CRUD operations
  - Manage tenant configuration
  - Handle team member operations
  - Enforce authorization
- **Interface**: API Gateway REST integration; receives HTTP events

#### `AuthHandler`
- **Purpose**: Handle authentication operations
- **Responsibilities**:
  - Process login/logout requests
  - Validate credentials with Cognito
  - Issue and refresh tokens
  - Manage user sessions
- **Interface**: API Gateway REST integration; receives HTTP events

### WebSocket Handlers

#### `WebSocketConnectionHandler`
- **Purpose**: Manage WebSocket connection lifecycle
- **Responsibilities**:
  - Handle connect/disconnect events
  - Store connection state in DynamoDB
  - Validate authentication tokens
  - Associate connections with tenant and board
- **Interface**: API Gateway WebSocket integration; receives connection events

#### `WebSocketMessageHandler`
- **Purpose**: Process incoming WebSocket messages
- **Responsibilities**:
  - Route messages to appropriate handlers
  - Validate message format and authorization
  - Coordinate with services for processing
  - Send responses via WebSocket
- **Interface**: API Gateway WebSocket integration; receives message events

#### `WebSocketBroadcastHandler`
- **Purpose**: Broadcast updates to connected clients
- **Responsibilities**:
  - Query connections by tenant and board
  - Send messages to multiple connections
  - Handle failed deliveries
  - Track broadcast metrics
- **Interface**: Invoked by services; receives broadcast requests

### AI Service Handlers

#### `AITaskCreationHandler`
- **Purpose**: Orchestrate AI-powered task creation
- **Responsibilities**:
  - Receive natural language input
  - Assemble context for AI prompt
  - Invoke Bedrock with formatted prompt
  - Parse and validate AI response
  - Return structured card suggestion
- **Interface**: Invoked via REST API or async; receives task description

#### `AIBottleneckScheduledHandler`
- **Purpose**: Perform scheduled full-board bottleneck analysis
- **Responsibilities**:
  - Triggered by EventBridge schedule
  - Load complete board state
  - Assemble historical context
  - Invoke Bedrock for analysis
  - Generate and broadcast alerts
- **Interface**: EventBridge trigger; receives scheduled event

#### `AIBottleneckStreamHandler`
- **Purpose**: Perform event-driven scoped bottleneck analysis
- **Responsibilities**:
  - Triggered by DynamoDB Stream on card changes
  - Load affected column and assignee context
  - Invoke Bedrock for scoped analysis
  - Generate and broadcast alerts if needed
- **Interface**: DynamoDB Stream trigger; receives stream records

### Shared Backend Components

#### `AuthMiddleware`
- **Purpose**: Authentication and authorization middleware
- **Responsibilities**:
  - Validate JWT tokens
  - Extract tenant and user context
  - Enforce authorization rules
  - Add context to request object
- **Interface**: Middleware function; wraps Lambda handlers

#### `ErrorHandler`
- **Purpose**: Centralized error handling
- **Responsibilities**:
  - Catch and log errors
  - Format error responses
  - Track error metrics
  - Sanitize error messages for clients
- **Interface**: Middleware function; wraps Lambda handlers

#### `LoggerUtil`
- **Purpose**: Structured logging utility
- **Responsibilities**:
  - Emit structured JSON logs
  - Include tenant context in all logs
  - Add correlation IDs
  - Support different log levels
- **Interface**: Utility class; provides logging methods

---

## AI Service Components

### AI Orchestration

#### `BedrockClient`
- **Purpose**: Interface to AWS Bedrock service
- **Responsibilities**:
  - Invoke Bedrock Claude model
  - Handle API authentication
  - Manage request/response formatting
  - Track token usage
  - Handle rate limiting and retries
- **Interface**: Service class; provides invoke methods

#### `PromptManager`
- **Purpose**: Manage AI prompt templates
- **Responsibilities**:
  - Load prompts from Parameter Store
  - Version prompt templates
  - Format prompts with dynamic context
  - Cache frequently used prompts
- **Interface**: Service class; provides prompt retrieval and formatting

#### `ContextAssembler`
- **Purpose**: Assemble context for AI prompts
- **Responsibilities**:
  - Gather board state (cards, columns, team members)
  - Load historical patterns
  - Format context for AI consumption
  - Enforce tenant scoping (security boundary)
  - Optimize context size for token efficiency
- **Interface**: Service class; provides context assembly methods

#### `AIResponseParser`
- **Purpose**: Parse and validate AI responses
- **Responsibilities**:
  - Parse JSON responses from Bedrock
  - Validate response structure
  - Handle malformed responses
  - Extract structured data
  - Log parsing errors
- **Interface**: Service class; provides parsing methods

---

## Data Access Components

### Repositories

#### `CardRepository`
- **Purpose**: Data access for card entities
- **Responsibilities**:
  - CRUD operations for cards
  - Query cards by column, assignee, tenant
  - Enforce tenant scoping on all operations
  - Handle DynamoDB access patterns
  - Manage indexes and queries
- **Interface**: Repository class; provides data access methods

#### `TenantRepository`
- **Purpose**: Data access for tenant entities
- **Responsibilities**:
  - CRUD operations for tenants
  - Query tenant configuration
  - Manage team member associations
  - Handle tenant metadata
- **Interface**: Repository class; provides data access methods

#### `ConnectionRepository`
- **Purpose**: Data access for WebSocket connections
- **Responsibilities**:
  - Store connection state (connectionId, userId, tenantId, boardId)
  - Query connections by tenant and board
  - Remove stale connections
  - Track connection metadata
- **Interface**: Repository class; provides connection management methods

#### `AnalyticsRepository`
- **Purpose**: Data access for usage analytics
- **Responsibilities**:
  - Store usage events (card created, AI suggestion accepted, alert dismissed)
  - Query usage patterns
  - Support cost attribution queries
  - Manage event retention
- **Interface**: Repository class; provides analytics data access

### Data Models

#### `CardModel`
- **Purpose**: Card entity data model
- **Responsibilities**:
  - Define card schema (id, title, description, column, assignee, etc.)
  - Validation rules
  - Serialization/deserialization
  - Tenant scoping attributes
- **Interface**: Data class; represents card entity

#### `TenantModel`
- **Purpose**: Tenant entity data model
- **Responsibilities**:
  - Define tenant schema (id, name, tier, configuration)
  - Validation rules
  - Serialization/deserialization
- **Interface**: Data class; represents tenant entity

#### `ConnectionModel`
- **Purpose**: WebSocket connection data model
- **Responsibilities**:
  - Define connection schema (connectionId, userId, tenantId, boardId, timestamp)
  - Validation rules
  - TTL management
- **Interface**: Data class; represents connection entity

---

## Service Layer Components

### Orchestration Services

#### `CardService`
- **Purpose**: Orchestrate card operations
- **Responsibilities**:
  - Coordinate card CRUD with repository
  - Trigger AI analysis on card changes
  - Broadcast card updates via WebSocket
  - Track card operation metrics
  - Handle business logic (validation, state transitions)
- **Interface**: Service class; provides business operation methods

#### `AIService`
- **Purpose**: Orchestrate AI operations
- **Responsibilities**:
  - Coordinate task creation flow (context assembly, Bedrock invocation, parsing)
  - Coordinate bottleneck detection flow
  - Manage prompt selection and versioning
  - Track AI usage metrics (token consumption, acceptance rates)
  - Handle AI errors and fallbacks
- **Interface**: Service class; provides AI operation methods

#### `NotificationService`
- **Purpose**: Orchestrate real-time notifications
- **Responsibilities**:
  - Coordinate WebSocket broadcasts
  - Determine notification recipients (tenant, board scoping)
  - Format notification messages
  - Track notification delivery
  - Handle delivery failures
- **Interface**: Service class; provides notification methods

#### `AnalyticsService`
- **Purpose**: Orchestrate usage tracking and analytics
- **Responsibilities**:
  - Emit usage events to Kinesis
  - Track feature usage (AI suggestions, alerts, card operations)
  - Calculate cost attribution per tenant
  - Generate usage reports
- **Interface**: Service class; provides analytics methods

---

## Infrastructure Components (CDK)

### CDK Stacks

#### `NetworkStack`
- **Purpose**: Network infrastructure
- **Responsibilities**:
  - Define VPC (if needed for future)
  - Configure security groups
  - Set up network ACLs
  - Manage subnets
- **Interface**: CDK Stack; provisions network resources

#### `AuthStack`
- **Purpose**: Authentication infrastructure
- **Responsibilities**:
  - Provision Cognito User Pool
  - Configure user pool clients
  - Set up identity providers
  - Define authentication flows
- **Interface**: CDK Stack; provisions auth resources

#### `APIStack`
- **Purpose**: API infrastructure
- **Responsibilities**:
  - Provision API Gateway (REST + WebSocket)
  - Configure routes and integrations
  - Set up authorizers
  - Define request/response models
  - Configure CORS
- **Interface**: CDK Stack; provisions API resources

#### `ComputeStack`
- **Purpose**: Compute infrastructure
- **Responsibilities**:
  - Provision Lambda functions
  - Configure function settings (memory, timeout, environment)
  - Set up IAM roles and policies
  - Define function triggers
- **Interface**: CDK Stack; provisions compute resources

#### `StorageStack`
- **Purpose**: Storage infrastructure
- **Responsibilities**:
  - Provision DynamoDB tables
  - Configure indexes and streams
  - Set up S3 buckets (frontend hosting)
  - Define backup policies
- **Interface**: CDK Stack; provisions storage resources

#### `AIStack`
- **Purpose**: AI infrastructure
- **Responsibilities**:
  - Configure Bedrock access
  - Provision Parameter Store for prompts
  - Set up EventBridge schedules
  - Define AI-related IAM policies
- **Interface**: CDK Stack; provisions AI resources

#### `ObservabilityStack`
- **Purpose**: Observability infrastructure
- **Responsibilities**:
  - Provision CloudWatch dashboards
  - Configure log groups and retention
  - Set up alarms and notifications
  - Provision Kinesis streams for analytics
  - Define custom metrics
- **Interface**: CDK Stack; provisions observability resources

#### `FrontendStack`
- **Purpose**: Frontend infrastructure
- **Responsibilities**:
  - Provision S3 bucket for static hosting
  - Configure CloudFront distribution
  - Set up SSL certificates
  - Define cache behaviors
- **Interface**: CDK Stack; provisions frontend resources

### Reusable Constructs

#### `LambdaConstruct`
- **Purpose**: Reusable Lambda function construct
- **Responsibilities**:
  - Standardize Lambda configuration
  - Apply common settings (logging, tracing, environment)
  - Attach IAM policies
  - Configure VPC (if needed)
- **Interface**: CDK Construct; creates Lambda function

#### `DynamoDBTableConstruct`
- **Purpose**: Reusable DynamoDB table construct
- **Responsibilities**:
  - Standardize table configuration
  - Configure billing mode
  - Set up streams and indexes
  - Apply tags for cost attribution
- **Interface**: CDK Construct; creates DynamoDB table

---

## Component Summary

### Total Components: 50+

**Frontend**: 10 components (Board, Cards, AI, WebSocket, Auth, API Client)
**Backend API**: 10 Lambda handlers (REST, WebSocket, Auth)
**AI Services**: 4 components (Bedrock, Prompts, Context, Parser)
**Data Access**: 7 components (4 repositories, 3 models)
**Service Layer**: 4 orchestration services
**Infrastructure**: 8 CDK stacks + 2 reusable constructs

---

## Design Principles Applied

1. **Separation of Concerns**: Clear boundaries between layers (UI, API, Service, Data)
2. **Single Responsibility**: Each component has one primary purpose
3. **Tenant Scoping**: All data access enforces tenant isolation
4. **Serverless-First**: Components designed for Lambda and managed services
5. **Testability**: Repository pattern and service layer enable unit testing
6. **Observability**: Structured logging and metrics built into all components
7. **Security**: Authentication and authorization at every layer
8. **Scalability**: Stateless components, async processing where appropriate
