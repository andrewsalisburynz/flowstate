# Technology Stack

## Programming Languages

| Language | Version | Usage |
|---|---|---|
| **TypeScript** | 5.3.2 | All code (backend, frontend, infrastructure) |
| **JavaScript** | ES2020+ | Compiled output from TypeScript |
| **JSX/TSX** | React 18 | React component syntax |

## Frontend Framework & Tools

| Technology | Version | Purpose |
|---|---|---|
| **React** | 18.2.0 | UI component framework |
| **React DOM** | 18.2.0 | React rendering to DOM |
| **Vite** | 5.0.8 | Build tool and dev server |
| **@vitejs/plugin-react** | 4.2.1 | React JSX support in Vite |
| **TypeScript** | 5.3.2 | Type-safe JavaScript |

## Backend Runtime & Libraries

| Technology | Version | Purpose |
|---|---|---|
| **Node.js** | 20 | Lambda runtime |
| **AWS SDK v3** | 3.470.0 | AWS service clients |
| **@aws-sdk/client-dynamodb** | 3.470.0 | DynamoDB operations |
| **@aws-sdk/lib-dynamodb** | 3.470.0 | High-level DynamoDB API |
| **@aws-sdk/client-bedrock-runtime** | 3.470.0 | Bedrock Claude invocation |
| **@aws-sdk/client-apigatewaymanagementapi** | 3.470.0 | WebSocket message sending |
| **uuid** | 9.0.1 | Generate unique IDs |

## Infrastructure & Deployment

| Technology | Version | Purpose |
|---|---|---|
| **AWS CDK** | 2.110.0 | Infrastructure as Code |
| **aws-cdk-lib** | 2.110.0 | CDK constructs library |
| **constructs** | 10.3.0 | CDK construct base classes |
| **CloudFormation** | (AWS native) | Infrastructure provisioning |

## AWS Services

### Compute
- **AWS Lambda**: Serverless compute for all business logic
  - Runtime: Node.js 20
  - 6 functions total
  - On-demand scaling

### API & Integration
- **API Gateway (REST)**: Synchronous HTTP endpoints
  - CORS enabled
  - Automatic request/response transformation
- **API Gateway (WebSocket)**: Real-time bidirectional communication
  - $connect, $disconnect, $default routes
  - Automatic connection management
- **EventBridge**: Scheduled task execution
  - 5-minute schedule for bottleneck detection
  - Event-driven architecture

### Data Storage
- **DynamoDB**: NoSQL database
  - On-demand billing
  - Cards table (partition key: id)
  - Connections table (partition key: connectionId)
  - Global Secondary Index on Cards (column, position)
  - TTL on Connections (24-hour expiration)

### AI & Machine Learning
- **Amazon Bedrock**: Managed AI service
  - Model: Claude 3 Sonnet
  - Use cases: Task generation, bottleneck analysis
  - Temperature: 0.3 (low for consistency)

### Content Delivery
- **CloudFront**: Global CDN
  - Origin: S3 bucket
  - Caching: Optimized for SPA
  - Error responses: 404/403 → index.html

### Storage
- **S3**: Static asset storage
  - Private bucket (no public access)
  - Block all public access enabled
  - Auto-delete objects on stack removal

### Monitoring & Logging
- **CloudWatch**: Logs and metrics
  - Lambda execution logs
  - API Gateway access logs
  - Custom metrics (optional)

## Development Tools

| Tool | Version | Purpose |
|---|---|---|
| **npm** | (Node.js bundled) | Package manager |
| **TypeScript Compiler** | 5.3.2 | Compile TypeScript to JavaScript |
| **AWS CDK CLI** | 2.110.0 | Deploy infrastructure |

## Build & Deployment Pipeline

### Backend Build
```bash
cd backend
npm install
npm run build  # Compiles TypeScript to dist/
```

### Frontend Build
```bash
cd frontend
npm install
npm run build  # Compiles TypeScript + React to dist/
```

### Infrastructure Deployment
```bash
cd infrastructure
npm install
npm run build  # Compiles CDK TypeScript
cdk deploy --all  # Deploys all stacks
```

## Type Definitions

| Package | Version | Purpose |
|---|---|---|
| **@types/node** | 20.10.0 | Node.js type definitions |
| **@types/react** | 18.2.45 | React type definitions |
| **@types/react-dom** | 18.2.18 | React DOM type definitions |
| **@types/aws-lambda** | 8.10.130 | AWS Lambda type definitions |
| **@types/uuid** | 9.0.7 | UUID type definitions |

## Architecture Patterns

### Serverless Architecture
- **Compute**: AWS Lambda (event-driven, auto-scaling)
- **API**: API Gateway (REST + WebSocket)
- **Data**: DynamoDB (managed, on-demand)
- **Orchestration**: EventBridge (scheduled tasks)

### Microservices Pattern
- **Cards Service**: CRUD operations
- **AI Task Service**: Natural language processing
- **AI Bottleneck Service**: Pattern analysis
- **WebSocket Service**: Real-time communication

### Infrastructure as Code
- **CDK**: TypeScript-based infrastructure definition
- **Stacks**: Logical grouping of resources
- **Constructs**: Reusable infrastructure components

## Performance Characteristics

### Lambda
- **Cold Start**: ~1-2 seconds (Node.js 20)
- **Warm Start**: <100ms
- **Memory**: 128-512 MB (configurable)
- **Timeout**: 30-60 seconds (configurable)
- **Concurrency**: Auto-scaling (default: 1000)

### DynamoDB
- **Billing Mode**: On-demand (pay per request)
- **Latency**: <10ms (typical)
- **Throughput**: Auto-scaling
- **Storage**: Unlimited

### API Gateway
- **Latency**: <100ms (typical)
- **Throughput**: Auto-scaling
- **Connections**: Unlimited (WebSocket)

### CloudFront
- **Latency**: <50ms (edge locations)
- **Cache**: Optimized for SPA
- **Bandwidth**: Unlimited

## Cost Optimization

### Free Tier Coverage
- **Lambda**: 1M requests/month
- **API Gateway**: 1M requests/month
- **DynamoDB**: 25 GB storage + 25 WCU/RCU
- **CloudFront**: 1 TB data transfer/month

### Estimated Monthly Cost (Light Usage)
- **Bedrock Claude**: ~$0.003 per 1K input tokens
- **DynamoDB**: $0 (within free tier)
- **Lambda**: $0 (within free tier)
- **API Gateway**: $0 (within free tier)
- **CloudFront**: $0 (within free tier)
- **Total**: $0-5/month for 10-20 AI tasks/day

## Security

### Authentication & Authorization
- **API Gateway**: CORS enabled for all origins (development)
- **IAM**: Least-privilege roles for Lambda functions
- **Bedrock**: AWS credentials via Lambda execution role

### Data Protection
- **DynamoDB**: Encryption at rest (AWS managed)
- **S3**: Private bucket with block public access
- **CloudFront**: HTTPS only
- **WebSocket**: WSS (WebSocket Secure)

### Network
- **Lambda**: No VPC (direct internet access for Bedrock)
- **DynamoDB**: VPC endpoint capable (not currently used)
- **API Gateway**: Public endpoints

## Scalability

### Horizontal Scaling
- **Lambda**: Auto-scales to 1000 concurrent executions
- **DynamoDB**: On-demand auto-scaling
- **API Gateway**: Auto-scales transparently
- **CloudFront**: Global edge locations

### Vertical Scaling
- **Lambda Memory**: 128-10,240 MB (configurable)
- **DynamoDB**: Unlimited storage
- **S3**: Unlimited storage

## Monitoring & Observability

### CloudWatch
- **Logs**: Lambda execution logs, API Gateway access logs
- **Metrics**: Lambda duration, errors, throttles
- **Alarms**: Optional (not currently configured)
- **Dashboards**: Optional (not currently configured)

### Structured Logging
- **Format**: JSON (CloudWatch Logs Insights compatible)
- **Context**: Request ID, function name, error details
- **Retention**: Default (indefinite)

