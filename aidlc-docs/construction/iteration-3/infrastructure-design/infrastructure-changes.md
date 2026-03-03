# Infrastructure Changes - Iteration 3

## Overview

**Scope**: Minimal infrastructure changes - add new DynamoDB table and update Lambda permissions

**No Changes Required**:
- API Gateway (REST and WebSocket) - existing endpoints sufficient
- Lambda function configurations - no new functions needed
- CloudFront distribution - no changes
- S3 buckets - no changes
- EventBridge rules - no changes

**Changes Required**:
- Add TeamMembersTable to DynamoDB
- Update Lambda IAM permissions
- Add environment variables to Lambda functions

---

## DynamoDB Changes

### New Table: TeamMembersTable

**File**: `infrastructure/lib/storage-stack.ts`

**Changes**:
```typescript
// Add new table property
public readonly teamMembersTable: dynamodb.Table;

// In constructor, after existing tables:
this.teamMembersTable = new dynamodb.Table(this, 'TeamMembersTable', {
  partitionKey: {
    name: 'id',
    type: dynamodb.AttributeType.STRING,
  },
  billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
  removalPolicy: cdk.RemovalPolicy.RETAIN,
  pointInTimeRecovery: true,
  encryption: dynamodb.TableEncryption.AWS_MANAGED,
});

// Add GSI for name uniqueness
this.teamMembersTable.addGlobalSecondaryIndex({
  indexName: 'name-index',
  partitionKey: {
    name: 'nameLowercase',
    type: dynamodb.AttributeType.STRING,
  },
  projectionType: dynamodb.ProjectionType.ALL,
});

// Export table name
new cdk.CfnOutput(this, 'TeamMembersTableName', {
  value: this.teamMembersTable.tableName,
  exportName: 'TeamMembersTableName',
});
```

**Deployment Impact**:
- Creates new DynamoDB table
- No downtime for existing services
- Table starts empty (no data migration)

---

## Lambda Changes

### New Lambda Function: TeamMembersHandler

**File**: `infrastructure/lib/api-stack.ts`

**Changes**:
```typescript
// Import storage stack
const storageStack = /* reference to storage stack */;

// Create new Lambda function
const teamMembersHandler = new lambda.Function(this, 'TeamMembersHandler', {
  runtime: lambda.Runtime.NODEJS_20_X,
  handler: 'handlers/team-members.handler',
  code: lambda.Code.fromAsset('backend/dist'),
  layers: [nodeModulesLayer],
  environment: {
    CARDS_TABLE_NAME: storageStack.cardsTable.tableName,
    TEAM_MEMBERS_TABLE_NAME: storageStack.teamMembersTable.tableName,
    CONNECTIONS_TABLE_NAME: storageStack.connectionsTable.tableName,
    WS_API_ENDPOINT: wsApi.apiEndpoint,
  },
  timeout: cdk.Duration.seconds(30),
  memorySize: 512,
});

// Grant permissions
storageStack.teamMembersTable.grantReadWriteData(teamMembersHandler);
storageStack.cardsTable.grantReadWriteData(teamMembersHandler); // For unassignment
storageStack.connectionsTable.grantReadData(teamMembersHandler); // For WebSocket
```

**API Gateway Integration**:
```typescript
// Add routes to REST API
const teamMembersResource = api.root.addResource('team-members');

// GET /team-members
teamMembersResource.addMethod('GET', new apigateway.LambdaIntegration(teamMembersHandler));

// POST /team-members
teamMembersResource.addMethod('POST', new apigateway.LambdaIntegration(teamMembersHandler));

// GET /team-members/{id}
const teamMemberResource = teamMembersResource.addResource('{id}');
teamMemberResource.addMethod('GET', new apigateway.LambdaIntegration(teamMembersHandler));

// PUT /team-members/{id}
teamMemberResource.addMethod('PUT', new apigateway.LambdaIntegration(teamMembersHandler));

// DELETE /team-members/{id}
teamMemberResource.addMethod('DELETE', new apigateway.LambdaIntegration(teamMembersHandler));
```

---

### Updated Lambda: CardsHandler

**File**: `infrastructure/lib/api-stack.ts`

**Changes**:
```typescript
// Add environment variable
const cardsHandler = new lambda.Function(this, 'CardsHandler', {
  // ... existing config
  environment: {
    CARDS_TABLE_NAME: storageStack.cardsTable.tableName,
    TEAM_MEMBERS_TABLE_NAME: storageStack.teamMembersTable.tableName, // NEW
    CONNECTIONS_TABLE_NAME: storageStack.connectionsTable.tableName,
    WS_API_ENDPOINT: wsApi.apiEndpoint,
  },
});

// Add read permission for TeamMembersTable
storageStack.teamMembersTable.grantReadData(cardsHandler); // NEW
```

**Deployment Impact**:
- Updates existing Lambda function
- Adds environment variable
- Adds IAM permission
- No downtime (Lambda updates are atomic)

---

### Updated Lambda: AIBottleneckHandler

**File**: `infrastructure/lib/api-stack.ts`

**Changes**:
```typescript
// Add environment variable
const aiBottleneckHandler = new lambda.Function(this, 'AiBottleneckHandler', {
  // ... existing config
  environment: {
    CARDS_TABLE_NAME: storageStack.cardsTable.tableName,
    TEAM_MEMBERS_TABLE_NAME: storageStack.teamMembersTable.tableName, // NEW
    CONNECTIONS_TABLE_NAME: storageStack.connectionsTable.tableName,
    WS_API_ENDPOINT: wsApi.apiEndpoint,
  },
});

// Add read permission for TeamMembersTable
storageStack.teamMembersTable.grantReadData(aiBottleneckHandler); // NEW
```

**Deployment Impact**:
- Updates existing Lambda function
- Adds environment variable
- Adds IAM permission
- No downtime

---

## IAM Permissions Summary

### TeamMembersHandler (NEW)

**Permissions**:
```json
{
  "Effect": "Allow",
  "Action": [
    "dynamodb:GetItem",
    "dynamodb:PutItem",
    "dynamodb:UpdateItem",
    "dynamodb:DeleteItem",
    "dynamodb:Query",
    "dynamodb:Scan"
  ],
  "Resource": [
    "arn:aws:dynamodb:*:*:table/TeamMembersTable",
    "arn:aws:dynamodb:*:*:table/TeamMembersTable/index/name-index"
  ]
}
```

```json
{
  "Effect": "Allow",
  "Action": [
    "dynamodb:GetItem",
    "dynamodb:PutItem",
    "dynamodb:UpdateItem",
    "dynamodb:DeleteItem",
    "dynamodb:Query",
    "dynamodb:Scan"
  ],
  "Resource": "arn:aws:dynamodb:*:*:table/CardsTable"
}
```

```json
{
  "Effect": "Allow",
  "Action": [
    "dynamodb:Query",
    "dynamodb:Scan"
  ],
  "Resource": "arn:aws:dynamodb:*:*:table/ConnectionsTable"
}
```

---

### CardsHandler (UPDATED)

**New Permissions**:
```json
{
  "Effect": "Allow",
  "Action": [
    "dynamodb:GetItem",
    "dynamodb:Query"
  ],
  "Resource": "arn:aws:dynamodb:*:*:table/TeamMembersTable"
}
```

---

### AIBottleneckHandler (UPDATED)

**New Permissions**:
```json
{
  "Effect": "Allow",
  "Action": [
    "dynamodb:GetItem",
    "dynamodb:Query",
    "dynamodb:Scan"
  ],
  "Resource": "arn:aws:dynamodb:*:*:table/TeamMembersTable"
}
```

---

## Environment Variables

### TeamMembersHandler (NEW)
- `CARDS_TABLE_NAME`: CardsTable name
- `TEAM_MEMBERS_TABLE_NAME`: TeamMembersTable name
- `CONNECTIONS_TABLE_NAME`: ConnectionsTable name
- `WS_API_ENDPOINT`: WebSocket API endpoint

### CardsHandler (UPDATED)
- `TEAM_MEMBERS_TABLE_NAME`: TeamMembersTable name (NEW)

### AIBottleneckHandler (UPDATED)
- `TEAM_MEMBERS_TABLE_NAME`: TeamMembersTable name (NEW)

---

## Deployment Strategy

### Phase 1: Infrastructure Deployment
```bash
cd infrastructure
npm run build
cdk deploy KanbanStorageStack
```

**Result**:
- Creates TeamMembersTable
- Exports table name
- No impact on existing services

### Phase 2: API Stack Deployment
```bash
cdk deploy KanbanApiStack
```

**Result**:
- Creates TeamMembersHandler Lambda
- Updates CardsHandler Lambda (adds env var + permission)
- Updates AIBottleneckHandler Lambda (adds env var + permission)
- Adds new API Gateway routes
- Zero downtime (Lambda updates are atomic)

### Phase 3: Frontend Deployment
```bash
cd frontend
npm run build
aws s3 sync dist/ s3://bucket-name --delete
aws cloudfront create-invalidation --distribution-id ID --paths "/*"
```

**Result**:
- Deploys new frontend with Team page
- Updates existing components
- CloudFront cache invalidated

---

## Rollback Plan

### If Deployment Fails

**Phase 1 Failure (Storage Stack)**:
- TeamMembersTable creation fails
- Rollback: Delete stack, redeploy previous version
- Impact: None (new table not yet used)

**Phase 2 Failure (API Stack)**:
- Lambda update fails
- Rollback: CDK automatically rolls back to previous version
- Impact: Minimal (existing endpoints continue to work)

**Phase 3 Failure (Frontend)**:
- Frontend deployment fails
- Rollback: Redeploy previous frontend build
- Impact: Users see old UI, but backend is ready

### Manual Rollback

```bash
# Rollback API stack
cdk deploy KanbanApiStack --previous-version

# Rollback storage stack (if needed)
cdk deploy KanbanStorageStack --previous-version

# Rollback frontend
aws s3 sync previous-build/ s3://bucket-name --delete
aws cloudfront create-invalidation --distribution-id ID --paths "/*"
```

---

## Cost Impact

### New Resources

**TeamMembersTable**:
- Storage: <10 KB = $0.00 per month
- Read capacity: <10 RCU/sec = $0.00 per month (free tier)
- Write capacity: <1 WCU/sec = $0.00 per month (free tier)
- Point-in-time recovery: $0.20 per GB-month = $0.00 per month (<1 GB)

**TeamMembersHandler Lambda**:
- Invocations: ~100 per day = 3,000 per month
- Duration: ~100ms per invocation
- Memory: 512 MB
- Cost: $0.00 per month (within free tier of 1M requests)

**Total Additional Cost**: $0.00 - $0.50 per month

---

## Monitoring

### CloudWatch Metrics

**TeamMembersTable**:
- `ConsumedReadCapacityUnits`
- `ConsumedWriteCapacityUnits`
- `UserErrors`
- `SystemErrors`

**TeamMembersHandler Lambda**:
- `Invocations`
- `Duration`
- `Errors`
- `Throttles`

### Recommended Alarms

1. **Lambda Errors**: Alert if Errors > 5 in 5 minutes
2. **Lambda Throttles**: Alert if Throttles > 0
3. **DynamoDB Errors**: Alert if UserErrors > 10 in 5 minutes
4. **High Latency**: Alert if Duration p99 > 1000ms

---

## Testing Strategy

### Infrastructure Testing

1. **Validate CDK Synthesis**:
   ```bash
   cdk synth
   ```
   - Verify CloudFormation templates are valid
   - Check for any CDK errors

2. **Deploy to Test Environment**:
   ```bash
   cdk deploy --all --require-approval never
   ```
   - Deploy to test AWS account first
   - Verify all resources created successfully

3. **Verify Permissions**:
   - Test TeamMembersHandler can read/write TeamMembersTable
   - Test CardsHandler can read TeamMembersTable
   - Test AIBottleneckHandler can read TeamMembersTable

4. **Verify API Gateway Routes**:
   - Test GET /team-members
   - Test POST /team-members
   - Test PUT /team-members/{id}
   - Test DELETE /team-members/{id}

---

## Summary

**New Resources**: 2
- TeamMembersTable (DynamoDB)
- TeamMembersHandler (Lambda)

**Updated Resources**: 2
- CardsHandler (Lambda) - env var + permission
- AIBottleneckHandler (Lambda) - env var + permission

**New API Routes**: 5
- GET /team-members
- POST /team-members
- GET /team-members/{id}
- PUT /team-members/{id}
- DELETE /team-members/{id}

**Deployment Time**: ~5 minutes
- Storage stack: ~2 minutes
- API stack: ~2 minutes
- Frontend: ~1 minute

**Cost Impact**: $0.00 - $0.50 per month

**Risk**: Low - new resources, minimal changes to existing
