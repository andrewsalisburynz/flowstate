# Business Overview

## Business Context

FlowState is an AI-powered Kanban board SaaS product designed to transform the Kanban board from a **system of record** (passive tracking) into a **system of action** (proactive insight and workflow optimization). The product reduces cognitive overhead for teams by automating task structuring and proactively surfacing workflow bottlenecks.

## Business Transactions

The system implements the following core business transactions:

### 1. **Card Management** (CRUD Operations)
- **Create Card**: Users manually create cards with title, description, column, story points, priority, and acceptance criteria
- **Read Card**: Retrieve individual card details or list all cards on the board
- **Update Card**: Move cards between columns, update metadata, modify priority or story points
- **Delete Card**: Remove cards from the board
- **Real-time Sync**: All card changes broadcast to connected clients via WebSocket for multi-user synchronization

### 2. **AI Task Generation**
- **Natural Language Input**: User describes a task in natural language (e.g., "Create a login page with email validation")
- **AI Structuring**: Claude 3 Sonnet analyzes the description and generates structured card data
- **Suggestion Return**: AI returns title, description, acceptance criteria, story point estimate, and priority
- **User Confirmation**: User reviews and confirms before card is persisted
- **Card Creation**: Confirmed card is created and broadcast to all connected clients

### 3. **Bottleneck Detection & Alerting**
- **Scheduled Analysis**: Every 5 minutes, EventBridge triggers full board analysis
- **Pattern Recognition**: Claude analyzes cards for:
  - Aging cards (cards in same column >7 days)
  - Column bottlenecks (too many cards in one column)
  - Workload imbalance (uneven distribution across team members)
- **Alert Generation**: AI generates structured alerts with severity, category, message, affected cards, and recommendations
- **Real-time Broadcasting**: Alerts broadcast to all connected clients via WebSocket
- **User Acknowledgment**: Users can acknowledge alerts and clear acknowledged alerts

### 4. **Multi-User Real-time Collaboration**
- **WebSocket Connection**: Users establish persistent WebSocket connections
- **Event Broadcasting**: Card changes and alerts broadcast to all connected users
- **Connection Management**: Track active connections with TTL-based cleanup
- **Stale Connection Handling**: Automatically remove connections that fail to receive messages

## Business Dictionary

| Term | Definition |
|---|---|
| **Card** | A task or work item on the Kanban board with title, description, column, position, story points, priority, and acceptance criteria |
| **Column** | A workflow stage: "To Do", "In Progress", or "Done" |
| **Bottleneck** | A workflow impediment identified by AI: aging cards, column overload, or workload imbalance |
| **Alert** | A notification about a detected bottleneck with severity (low/medium/high), category, message, and recommendations |
| **Story Points** | Fibonacci-scaled estimate of task complexity (1, 2, 3, 5, 8, 13) |
| **Priority** | Task urgency level: low, medium, or high |
| **Acceptance Criteria** | Specific conditions that must be met for a card to be considered complete |
| **AI-Generated** | Card created via natural language input and Claude structuring, as opposed to manual creation |
| **Real-time Sync** | Multi-user board state synchronization via WebSocket without polling |

## Component-Level Business Descriptions

### Frontend (React SPA)
- **Purpose**: Provide users with an interactive Kanban board interface for task management and AI collaboration
- **Responsibilities**:
  - Display cards organized by column
  - Enable drag-and-drop card movement between columns
  - Provide modal dialogs for manual card creation and AI task generation
  - Display real-time alerts in a collapsible side panel
  - Maintain WebSocket connection for real-time updates
  - Persist user preferences (alerts panel state) to localStorage

### Backend - Cards Handler (Lambda)
- **Purpose**: Handle all card CRUD operations via REST API
- **Responsibilities**:
  - GET /cards - List all cards
  - GET /cards/{id} - Retrieve single card
  - POST /cards - Create new card
  - PUT /cards/{id} - Update card (move between columns, update metadata)
  - DELETE /cards/{id} - Delete card
  - Broadcast all changes to connected WebSocket clients

### Backend - AI Task Handler (Lambda)
- **Purpose**: Convert natural language task descriptions into structured Kanban cards
- **Responsibilities**:
  - Accept natural language task description via POST /ai-task
  - Invoke Claude 3 Sonnet via Bedrock with board context
  - Parse AI response and extract structured card data
  - Create card in DynamoDB
  - Broadcast new card to all connected clients

### Backend - AI Bottleneck Handler (Lambda)
- **Purpose**: Analyze board for workflow impediments and generate alerts
- **Responsibilities**:
  - Triggered by EventBridge every 5 minutes
  - Retrieve all cards from DynamoDB
  - Invoke Claude 3 Sonnet to analyze for bottlenecks
  - Generate alerts with severity, category, message, affected cards, and recommendations
  - Broadcast alerts to all connected WebSocket clients

### Backend - WebSocket Handler (Lambda)
- **Purpose**: Manage WebSocket connection lifecycle and message routing
- **Responsibilities**:
  - Handle $connect route: Add connection ID to connections table
  - Handle $disconnect route: Remove connection ID from connections table
  - Handle $default route: Acknowledge incoming messages
  - Maintain connection TTL for automatic cleanup

### Backend - DynamoDB Service
- **Purpose**: Persist and retrieve all application data
- **Responsibilities**:
  - Store cards with full metadata
  - Store active WebSocket connections with TTL
  - Provide query operations (list all cards, query by column)
  - Support updates with dynamic attribute mapping

### Backend - Bedrock Service
- **Purpose**: Invoke Claude 3 Sonnet for AI-powered features
- **Responsibilities**:
  - Generate structured task cards from natural language descriptions
  - Analyze board state for bottlenecks and generate alerts
  - Return structured JSON responses for downstream processing

### Backend - WebSocket Broadcast Service
- **Purpose**: Deliver real-time events to all connected clients
- **Responsibilities**:
  - Retrieve list of active connections from DynamoDB
  - Send messages to each connection via API Gateway Management API
  - Handle stale connections (410 Gone) by removing them
  - Gracefully handle broadcast failures

### Infrastructure - Storage Stack (CDK)
- **Purpose**: Provision DynamoDB tables for data persistence
- **Responsibilities**:
  - Create Cards table with partition key (id) and GSI for column queries
  - Create Connections table with TTL for automatic cleanup
  - Configure on-demand billing for automatic scaling

### Infrastructure - API Stack (CDK)
- **Purpose**: Provision Lambda functions, API Gateway, and EventBridge
- **Responsibilities**:
  - Create 5 Lambda functions (cards, ai-task, ai-bottleneck, ws-connect, ws-disconnect, ws-message)
  - Configure REST API Gateway with CORS
  - Configure WebSocket API Gateway with connect/disconnect/default routes
  - Create Lambda layer for shared dependencies
  - Set up EventBridge rule for 5-minute bottleneck detection schedule
  - Grant IAM permissions for DynamoDB, Bedrock, and WebSocket management

### Infrastructure - Frontend Stack (CDK)
- **Purpose**: Deploy React frontend to S3 with CloudFront CDN
- **Responsibilities**:
  - Create S3 bucket for frontend assets
  - Configure CloudFront distribution with origin access control
  - Deploy built React application to S3
  - Configure error responses (404/403 → index.html for SPA routing)
  - Provide global edge delivery via CloudFront

