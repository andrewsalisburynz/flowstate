# 🌊 FlowState

AI-powered Kanban board built on AWS serverless architecture for seamless task management and workflow optimization.

## Features

- 📋 **Kanban Board** - Drag-and-drop cards between To Do, In Progress, and Done columns
- ✨ **AI Task Creation** - Generate structured task cards from natural language using Claude
- 🤖 **AI Bottleneck Detection** - Automatic workflow analysis every 5 minutes
- 🔄 **Real-time Sync** - WebSocket-powered live updates across all clients
- ☁️ **Serverless AWS** - Fully managed infrastructure with auto-scaling

## Architecture

```
React Frontend (Vite)
    ↓
API Gateway (REST + WebSocket)
    ↓
Lambda Functions (Node.js 20)
    ↓
DynamoDB + Amazon Bedrock (Claude)
```

## Tech Stack

**Frontend:**
- React 18 + TypeScript
- Vite
- Custom CSS (no frameworks)

**Backend:**
- AWS Lambda (Node.js 20)
- API Gateway (REST + WebSocket)
- DynamoDB
- Amazon Bedrock (Claude 3 Sonnet)
- EventBridge (scheduled bottleneck detection)

**Infrastructure:**
- AWS CDK (TypeScript)
- CloudFormation

## Quick Start

### Prerequisites

- Node.js 20+ (LTS)
- AWS Account with credentials configured
- AWS CDK bootstrapped in your region

### 1. Deploy Infrastructure

```bash
cd infrastructure
npm install
npm run build
cdk deploy --all
```

This deploys:
- DynamoDB tables (Cards + Connections)
- 5 Lambda functions
- REST API + WebSocket API
- EventBridge rule for bottleneck detection

### 2. Enable Bedrock (for AI features)

1. Go to [AWS Bedrock Console](https://console.aws.amazon.com/bedrock/)
2. Navigate to Playgrounds → Chat
3. Select "Claude 3 Sonnet"
4. Submit use case details (first-time only)
5. Wait for approval (usually instant)

See [BEDROCK-SETUP.md](BEDROCK-SETUP.md) for detailed instructions.

### 3. Run Frontend

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173

The frontend is already configured with your API URLs in `.env.local`.

## API Endpoints

**REST API:** `https://xtv386hpgi.execute-api.ap-southeast-2.amazonaws.com/prod/`

- `GET /cards` - List all cards
- `POST /cards` - Create a card
- `GET /cards/{id}` - Get a card
- `PUT /cards/{id}` - Update a card
- `DELETE /cards/{id}` - Delete a card
- `POST /ai-task` - AI-generated task creation

**WebSocket:** `wss://a2ha2ia4wd.execute-api.ap-southeast-2.amazonaws.com/prod`

Events: `card_created`, `card_updated`, `card_deleted`, `bottleneck_alerts`

## Project Structure

```
flowstate/
├── backend/              # Lambda function code
│   ├── src/
│   │   ├── handlers/    # API handlers
│   │   ├── services/    # Business logic
│   │   └── types/       # TypeScript types
│   └── layer/           # Lambda layer (node_modules)
├── frontend/            # React application
│   ├── src/
│   │   ├── App.tsx      # Main component
│   │   └── App.css      # Styles
│   └── public/
│       └── favicon.svg  # FlowState logo
├── infrastructure/      # AWS CDK
│   ├── lib/
│   │   ├── storage-stack.ts  # DynamoDB tables
│   │   └── api-stack.ts      # Lambda + API Gateway
│   └── bin/
│       └── app.ts       # CDK app entry
└── aidlc-docs/         # AI-DLC planning artifacts
```

## Development

**Backend:**
```bash
cd backend
npm install
npm run build
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

**Infrastructure:**
```bash
cd infrastructure
npm install
npm run build
cdk diff    # Preview changes
cdk deploy  # Deploy changes
```

## Costs

With AWS Free Tier:
- **DynamoDB:** Free (25 GB + 25 WCU/RCU)
- **Lambda:** Free (1M requests/month)
- **API Gateway:** Free (1M requests/month)
- **Bedrock Claude:** ~$0.003 per 1K input tokens

**Estimated:** $0-5/month for light usage (10-20 AI tasks/day)

## Clean Up

To remove all AWS resources:

```bash
cd infrastructure
cdk destroy --all
```

This deletes all infrastructure and stops billing.

## Planning Context

See [kanban-aidlc-context.md](kanban-aidlc-context.md) for the original planning and architectural decisions.

## License

MIT
