# Component Inventory

## Application Packages

### Backend Package
- **Name**: backend
- **Purpose**: Lambda function code for all serverless compute
- **Type**: Application
- **Language**: TypeScript
- **Runtime**: Node.js 20
- **Components**:
  - 4 Lambda handlers (cards, ai-task, ai-bottleneck, websocket)
  - 3 service modules (dynamodb, bedrock, websocket)
  - 1 types module

### Frontend Package
- **Name**: flowstate
- **Purpose**: React SPA for Kanban board UI
- **Type**: Application
- **Language**: TypeScript + React 18
- **Build Tool**: Vite
- **Components**:
  - 1 main React component (App.tsx)
  - Styling (App.css, index.css)
  - Entry point (main.tsx)

## Infrastructure Packages

### Infrastructure Package
- **Name**: infrastructure
- **Purpose**: AWS CDK for infrastructure provisioning
- **Type**: Infrastructure
- **Language**: TypeScript
- **CDK Version**: 2.110.0
- **Stacks**:
  - StorageStack (DynamoDB tables)
  - ApiStack (Lambda, API Gateway, EventBridge)
  - FrontendStack (S3, CloudFront)

## Lambda Functions

### 1. Cards Handler
- **Function Name**: CardsHandler
- **Runtime**: Node.js 20
- **Memory**: 128 MB
- **Timeout**: 30 seconds
- **Handler**: `handlers/cards.handler`
- **Trigger**: REST API Gateway
- **Permissions**: DynamoDB read/write (Cards + Connections), WebSocket management
- **Responsibilities**: CRUD operations on cards, broadcast changes

### 2. AI Task Handler
- **Function Name**: AiTaskHandler
- **Runtime**: Node.js 20
- **Memory**: 512 MB
- **Timeout**: 60 seconds
- **Handler**: `handlers/ai-task.handler`
- **Trigger**: REST API Gateway (POST /ai-task)
- **Permissions**: DynamoDB read/write (Cards), DynamoDB read (Connections), Bedrock invoke, WebSocket management
- **Responsibilities**: Generate cards from natural language via Claude

### 3. AI Bottleneck Handler
- **Function Name**: AiBottleneckHandler
- **Runtime**: Node.js 20
- **Memory**: 512 MB
- **Timeout**: 60 seconds
- **Handler**: `handlers/ai-bottleneck.handler`
- **Trigger**: EventBridge (every 5 minutes)
- **Permissions**: DynamoDB read (Cards + Connections), Bedrock invoke, WebSocket management
- **Responsibilities**: Analyze board for bottlenecks, broadcast alerts

### 4. WebSocket Connect Handler
- **Function Name**: WsConnectHandler
- **Runtime**: Node.js 20
- **Memory**: 128 MB
- **Timeout**: 30 seconds
- **Handler**: `handlers/websocket.connect`
- **Trigger**: WebSocket API ($connect route)
- **Permissions**: DynamoDB write (Connections)
- **Responsibilities**: Add connection to Connections table

### 5. WebSocket Disconnect Handler
- **Function Name**: WsDisconnectHandler
- **Runtime**: Node.js 20
- **Memory**: 128 MB
- **Timeout**: 30 seconds
- **Handler**: `handlers/websocket.disconnect`
- **Trigger**: WebSocket API ($disconnect route)
- **Permissions**: DynamoDB write (Connections)
- **Responsibilities**: Remove connection from Connections table

### 6. WebSocket Message Handler
- **Function Name**: WsMessageHandler
- **Runtime**: Node.js 20
- **Memory**: 128 MB
- **Timeout**: 30 seconds
- **Handler**: `handlers/websocket.message`
- **Trigger**: WebSocket API ($default route)
- **Permissions**: None (placeholder)
- **Responsibilities**: Acknowledge incoming messages

## Frontend Components

### React Components
- **App.tsx**: Main Kanban board component
  - Manages card state
  - Handles drag-and-drop
  - Manages modals for card creation and AI task generation
  - Manages alerts panel
  - Maintains WebSocket connection

## Infrastructure Stacks

### StorageStack
- **Resources**:
  - Cards DynamoDB table
  - Connections DynamoDB table
- **Outputs**:
  - CardsTableName
  - ConnectionsTableName

### ApiStack
- **Resources**:
  - Lambda layer (shared dependencies)
  - 6 Lambda functions
  - REST API Gateway
  - WebSocket API Gateway
  - EventBridge rule
  - IAM roles and policies
- **Outputs**:
  - RestApiUrl
  - WebSocketUrl

### FrontendStack
- **Resources**:
  - S3 bucket
  - CloudFront distribution
  - Origin access control
  - S3 bucket deployment
- **Outputs**:
  - WebsiteURL
  - CloudFrontDistributionId
  - S3BucketName

## AWS Services Used

### Compute
- **AWS Lambda**: 6 functions for serverless compute
- **AWS Lambda Layers**: Shared dependencies (node_modules)

### API & Integration
- **API Gateway (REST)**: Synchronous card CRUD operations
- **API Gateway (WebSocket)**: Real-time event broadcasting
- **EventBridge**: Scheduled bottleneck detection (5-minute intervals)

### Data Storage
- **DynamoDB**: Cards table + Connections table
- **S3**: Frontend asset storage

### AI & ML
- **Amazon Bedrock**: Claude 3 Sonnet for AI features

### Content Delivery
- **CloudFront**: Global CDN for frontend

### Monitoring & Logging
- **CloudWatch**: Logs and metrics

## Total Count

| Category | Count |
|---|---|
| **Application Packages** | 2 (backend, frontend) |
| **Infrastructure Packages** | 1 (infrastructure) |
| **Lambda Functions** | 6 |
| **DynamoDB Tables** | 2 |
| **API Gateways** | 2 (REST + WebSocket) |
| **CDK Stacks** | 3 |
| **AWS Services** | 10+ |

## Deployment Architecture

```
Development/Production Environment
├── AWS Account
│   ├── Region: ap-southeast-2 (configurable)
│   ├── Storage Stack
│   │   ├── DynamoDB: Cards table
│   │   └── DynamoDB: Connections table
│   ├── API Stack
│   │   ├── Lambda Layer (dependencies)
│   │   ├── 6 Lambda Functions
│   │   ├── REST API Gateway
│   │   ├── WebSocket API Gateway
│   │   └── EventBridge Rule
│   └── Frontend Stack
│       ├── S3 Bucket
│       └── CloudFront Distribution
└── Client
    ├── Browser (React SPA)
    └── WebSocket Client
```

