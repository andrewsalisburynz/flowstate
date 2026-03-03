# FlowState - Quick Start Guide

Get your AI-powered Kanban board running in 5 minutes.

## Prerequisites

- AWS Account with credentials configured
- Node.js 18+
- AWS CDK installed (`npm install -g aws-cdk`)

## Step 1: Deploy to AWS (2 minutes)

```bash
cd infrastructure
npm install
cdk bootstrap  # First time only
cdk deploy --all
```

Copy the API URLs from the output:
- `RestApiUrl`: https://...
- `WebSocketUrl`: wss://...

## Step 2: Configure Frontend (30 seconds)

The frontend is already configured! Check `frontend/.env.local`:

```bash
VITE_API_URL=https://xtv386hpgi.execute-api.ap-southeast-2.amazonaws.com/prod
VITE_WS_URL=wss://a2ha2ia4wd.execute-api.ap-southeast-2.amazonaws.com/prod
```

## Step 3: Run Frontend (30 seconds)

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173

## Step 4: Enable AI Features (2 minutes)

1. Go to https://console.aws.amazon.com/bedrock/
2. Click Playgrounds → Chat
3. Select "Claude 3 Sonnet"
4. Submit use case details (first-time only)
5. Wait for approval (usually instant)

See [BEDROCK-SETUP.md](BEDROCK-SETUP.md) for details.

## You're Done! 🎉

Your FlowState board is ready:
- ✅ Create cards manually
- ✅ Drag between columns
- ✅ Real-time sync via WebSocket
- ✅ AI task creation (after Bedrock setup)
- ✅ AI bottleneck detection (runs every 5 minutes)

## Troubleshooting

**Frontend can't connect?**
- Check `.env.local` has correct URLs
- Verify API Gateway is deployed: `aws apigateway get-rest-apis`

**AI features not working?**
- Enable Bedrock access (see Step 4)
- Check Lambda logs: `aws logs tail /aws/lambda/KanbanApiStack-AiTaskHandler... --follow`

**Clean up everything:**
```bash
cd infrastructure
cdk destroy --all
```
