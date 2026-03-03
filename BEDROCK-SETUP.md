# Enable Amazon Bedrock Model Access

Your Kanban app is working, but the AI features need Bedrock model access to be enabled.

## Error
```
Model access is denied due to IAM user or service role is not authorized 
to perform the required AWS Marketplace actions
```

## What Changed

AWS has updated Bedrock! Models are now automatically enabled on first use, but **Anthropic models (Claude) require submitting use case details for first-time users**.

## Solution: Enable Claude Access

### Step 1: Go to Bedrock Playground

1. Go to the AWS Bedrock console: https://console.aws.amazon.com/bedrock/
2. In the left sidebar, click **"Playgrounds"** → **"Chat"**
3. Select **"Claude 3 Sonnet"** from the model dropdown
4. You'll be prompted to submit use case details (first-time only)

### Step 2: Submit Use Case Details

Fill out the form with:
- **Use case**: "Building an AI-powered Kanban board for task management"
- **Description**: "Using Claude to generate structured task cards from natural language descriptions and analyze workflow bottlenecks"
- **Industry**: Select your industry (or "Technology")

### Step 3: Wait for Approval

- Usually approved within minutes
- You'll receive an email notification
- Once approved, the model is enabled account-wide

### Alternative: Try the Model in Playground

After submitting use case details:
1. Try sending a test message in the Bedrock playground
2. If it works, your Kanban app AI features will work too
3. Refresh your Kanban app and try AI task creation again

## After Enabling Access

1. Wait 1-2 minutes
2. Try the AI task creation again in your Kanban app
3. It should work immediately!

## Alternative: Test Without AI

Your Kanban app works perfectly without AI features:
- ✅ Create cards manually
- ✅ Drag and drop between columns
- ✅ Edit and delete cards
- ✅ Real-time WebSocket sync

The AI features are optional enhancements:
- AI task creation (requires Bedrock)
- AI bottleneck detection (requires Bedrock)

## Cost Note

Claude 3 Sonnet pricing:
- Input: $0.003 per 1K tokens (~750 words)
- Output: $0.015 per 1K tokens

For light usage (10-20 AI tasks per day): ~$0.50-1.00/month

## Troubleshooting

If you still get errors after enabling access:
1. Check the region matches (ap-southeast-2)
2. Verify IAM permissions include `bedrock:InvokeModel`
3. Wait 2-3 minutes after enabling access
4. Check CloudWatch logs: `aws logs tail /aws/lambda/KanbanApiStack-AiTaskHandlerF3A94527-yZBBnluKApBc --follow`
