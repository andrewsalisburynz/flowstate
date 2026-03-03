# Database Schema - Iteration 3

## DynamoDB Tables

### New Table: TeamMembersTable

#### Table Configuration

**Table Name**: `TeamMembersTable` (actual name will include stack prefix)

**Partition Key**: `id` (String)

**Billing Mode**: PAY_PER_REQUEST (on-demand)

**Point-in-Time Recovery**: Enabled

**Encryption**: AWS managed keys

---

#### Attributes

| Attribute | Type | Description |
|-----------|------|-------------|
| id | String (S) | UUID, partition key |
| name | String (S) | Team member name |
| nameLowercase | String (S) | Lowercase name for uniqueness check |
| createdAt | String (S) | ISO 8601 timestamp |
| updatedAt | String (S) | ISO 8601 timestamp |

---

#### Global Secondary Index: name-index

**Purpose**: Enable uniqueness checks and lookups by name

**Index Name**: `name-index`

**Partition Key**: `nameLowercase` (String)

**Projection**: ALL (project all attributes)

**Billing Mode**: PAY_PER_REQUEST (same as table)

**Query Pattern**:
```typescript
// Check if name exists
const result = await dynamodb.query({
  TableName: 'TeamMembersTable',
  IndexName: 'name-index',
  KeyConditionExpression: 'nameLowercase = :name',
  ExpressionAttributeValues: {
    ':name': name.toLowerCase()
  }
});
```

---

#### Access Patterns

| Pattern | Method | Key/Index | Example |
|---------|--------|-----------|---------|
| Get by ID | GetItem | Partition key | `id = "uuid"` |
| List all | Scan | - | All items |
| Check name exists | Query | name-index | `nameLowercase = "john doe"` |
| Create | PutItem | Partition key | New item with UUID |
| Update | UpdateItem | Partition key | `id = "uuid"` |
| Delete | DeleteItem | Partition key | `id = "uuid"` |

---

#### Sample Item

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "John Doe",
  "nameLowercase": "john doe",
  "createdAt": "2026-03-04T12:00:00.000Z",
  "updatedAt": "2026-03-04T12:00:00.000Z"
}
```

---

### Updated Table: CardsTable

#### New Attributes

| Attribute | Type | Description |
|-----------|------|-------------|
| assignees | List (L) of String (S) | Array of team member IDs |
| assignedAt | String (S) | ISO 8601 timestamp of last assignment |

---

#### Updated Sample Item

```json
{
  "id": "card-uuid-123",
  "title": "Implement login feature",
  "description": "Build user authentication",
  "column": "In Progress",
  "position": 0,
  "storyPoints": 5,
  "priority": "high",
  "aiGenerated": false,
  "acceptanceCriteria": ["User can log in", "Password is validated"],
  "columnEnteredAt": "2026-03-01T10:00:00.000Z",
  "createdAt": "2026-03-01T09:00:00.000Z",
  "updatedAt": "2026-03-04T12:00:00.000Z",
  "assignees": [
    "550e8400-e29b-41d4-a716-446655440000",
    "660e8400-e29b-41d4-a716-446655440001"
  ],
  "assignedAt": "2026-03-04T12:00:00.000Z"
}
```

---

#### New Access Patterns

| Pattern | Method | Key/Index | Example |
|---------|--------|-----------|---------|
| Get cards by assignee | Scan + Filter | - | Filter `assignees` contains ID |
| Update assignees | UpdateItem | Partition key | Update `assignees` and `assignedAt` |

**Note**: Scan with filter is acceptable for now given expected data volume (<1000 cards). If performance becomes an issue, consider adding a GSI on assignees.

---

## CDK Infrastructure Code

### TeamMembersTable Definition

```typescript
// infrastructure/lib/storage-stack.ts

import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as cdk from 'aws-cdk-lib';

export class StorageStack extends cdk.Stack {
  public readonly cardsTable: dynamodb.Table;
  public readonly connectionsTable: dynamodb.Table;
  public readonly teamMembersTable: dynamodb.Table; // NEW

  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Existing tables...

    // NEW: Team Members Table
    this.teamMembersTable = new dynamodb.Table(this, 'TeamMembersTable', {
      partitionKey: {
        name: 'id',
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN, // Retain data on stack deletion
      pointInTimeRecovery: true,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
    });

    // Add GSI for name uniqueness checks
    this.teamMembersTable.addGlobalSecondaryIndex({
      indexName: 'name-index',
      partitionKey: {
        name: 'nameLowercase',
        type: dynamodb.AttributeType.STRING,
      },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // Export table name for Lambda functions
    new cdk.CfnOutput(this, 'TeamMembersTableName', {
      value: this.teamMembersTable.tableName,
      exportName: 'TeamMembersTableName',
    });
  }
}
```

---

## Lambda IAM Permissions

### TeamMembersHandler Permissions

```typescript
// Grant read/write access to TeamMembersTable
teamMembersTable.grantReadWriteData(teamMembersHandler);

// Permissions granted:
// - dynamodb:GetItem
// - dynamodb:PutItem
// - dynamodb:UpdateItem
// - dynamodb:DeleteItem
// - dynamodb:Query (for name-index)
// - dynamodb:Scan
```

### CardsHandler Permissions (Extended)

```typescript
// Existing: read/write access to CardsTable
cardsTable.grantReadWriteData(cardsHandler);

// NEW: read access to TeamMembersTable (for assignee validation)
teamMembersTable.grantReadData(cardsHandler);

// Additional permissions granted:
// - dynamodb:GetItem (TeamMembersTable)
// - dynamodb:Query (TeamMembersTable)
```

### AIBottleneckHandler Permissions (Extended)

```typescript
// Existing: read access to CardsTable
cardsTable.grantReadData(aiBottleneckHandler);

// NEW: read access to TeamMembersTable
teamMembersTable.grantReadData(aiBottleneckHandler);

// Additional permissions granted:
// - dynamodb:GetItem (TeamMembersTable)
// - dynamodb:Scan (TeamMembersTable)
```

---

## Data Migration

### Migration Strategy

**No migration needed** - This is a new feature with new data:
- TeamMembersTable is a new table (starts empty)
- Card.assignees is a new optional field (existing cards have undefined/empty)
- Card.assignedAt is a new optional field (existing cards have undefined)

**Backward Compatibility**:
- Existing cards without assignees continue to work
- Frontend handles undefined assignees gracefully
- Bottleneck analysis skips cards without assignees

---

## Query Optimization

### TeamMembersTable Queries

#### Get All Team Members
```typescript
// Scan is acceptable - expected <50 team members
const result = await dynamodb.scan({
  TableName: 'TeamMembersTable'
});
// Cost: 1 RCU per 4KB, typically <1 RCU for all team members
```

#### Check Name Uniqueness
```typescript
// Query GSI - efficient lookup
const result = await dynamodb.query({
  TableName: 'TeamMembersTable',
  IndexName: 'name-index',
  KeyConditionExpression: 'nameLowercase = :name',
  ExpressionAttributeValues: {
    ':name': name.toLowerCase()
  }
});
// Cost: 1 RCU for strongly consistent read
```

### CardsTable Queries (Extended)

#### Get Cards by Assignee
```typescript
// Scan with filter - acceptable for <1000 cards
const result = await dynamodb.scan({
  TableName: 'CardsTable',
  FilterExpression: 'contains(assignees, :assigneeId)',
  ExpressionAttributeValues: {
    ':assigneeId': assigneeId
  }
});
// Cost: Scans entire table, ~1 RCU per 4KB
// Optimization: If performance becomes issue, add GSI on assignees
```

#### Update Card Assignees
```typescript
// UpdateItem - efficient single-item update
const result = await dynamodb.update({
  TableName: 'CardsTable',
  Key: { id: cardId },
  UpdateExpression: 'SET assignees = :assignees, assignedAt = :timestamp, updatedAt = :timestamp',
  ExpressionAttributeValues: {
    ':assignees': assigneeIds,
    ':timestamp': new Date().toISOString()
  }
});
// Cost: 1 WCU per 1KB
```

---

## Capacity Planning

### TeamMembersTable

**Expected Volume**:
- Team members: 10-50
- Item size: ~200 bytes per team member
- Total storage: <10 KB

**Read Capacity**:
- List all: 1-2 times per page load
- Check uniqueness: 1 per create/update
- Expected: <10 RCU/second

**Write Capacity**:
- Create: Infrequent (<1 per hour)
- Update: Rare (<1 per day)
- Delete: Very rare (<1 per week)
- Expected: <1 WCU/second

**Billing**: PAY_PER_REQUEST is cost-effective for this usage pattern

---

### CardsTable (Extended)

**Additional Storage**:
- assignees: ~40 bytes per assignee (UUID)
- assignedAt: ~30 bytes (ISO timestamp)
- Per card: ~70-400 bytes additional (1-10 assignees)
- Total additional: <400 KB for 1000 cards

**Additional Read Capacity**:
- Get cards by assignee: 1-2 times per filter change
- Expected additional: <5 RCU/second

**Additional Write Capacity**:
- Update assignees: 1-5 times per hour
- Expected additional: <1 WCU/second

**Impact**: Minimal - existing PAY_PER_REQUEST billing handles this easily

---

## Backup and Recovery

### TeamMembersTable Backup

**Point-in-Time Recovery**: Enabled
- Continuous backups for 35 days
- Restore to any point in time within backup window
- Cost: $0.20 per GB-month

**Manual Backups**: Not required for MVP
- Can be added later if needed
- Use AWS Backup service for scheduled backups

### Data Recovery Scenarios

#### Scenario 1: Accidental Team Member Deletion
**Recovery**:
1. Restore TeamMembersTable to point before deletion
2. Re-sync card assignments if needed
3. Broadcast updates via WebSocket

#### Scenario 2: Corrupted Assignee Data
**Recovery**:
1. Restore CardsTable to point before corruption
2. Verify referential integrity
3. Re-run bottleneck analysis

---

## Monitoring and Alarms

### CloudWatch Metrics

**TeamMembersTable**:
- `ConsumedReadCapacityUnits`
- `ConsumedWriteCapacityUnits`
- `UserErrors` (validation failures)
- `SystemErrors` (DynamoDB errors)

**CardsTable (Extended)**:
- Monitor for increased read/write capacity due to assignments

### Recommended Alarms

1. **High Error Rate**: Alert if UserErrors > 10 in 5 minutes
2. **Throttling**: Alert if ThrottledRequests > 0 (shouldn't happen with PAY_PER_REQUEST)
3. **High Latency**: Alert if SuccessfulRequestLatency > 100ms (p99)

---

## Summary

**New Tables**: 1
- TeamMembersTable with name-index GSI

**Extended Tables**: 1
- CardsTable with assignees and assignedAt fields

**New Indexes**: 1
- name-index GSI on TeamMembersTable

**IAM Permissions**: 3 Lambda functions updated
- TeamMembersHandler: read/write TeamMembersTable
- CardsHandler: read TeamMembersTable
- AIBottleneckHandler: read TeamMembersTable

**Capacity**: PAY_PER_REQUEST billing, minimal cost impact

**Migration**: None required, backward compatible
