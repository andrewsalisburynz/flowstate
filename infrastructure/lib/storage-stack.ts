import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';

export class StorageStack extends cdk.Stack {
  public readonly cardsTable: dynamodb.Table;
  public readonly connectionsTable: dynamodb.Table;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Cards table
    this.cardsTable = new dynamodb.Table(this, 'CardsTable', {
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      stream: dynamodb.StreamViewType.NEW_AND_OLD_IMAGES,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // GSI for querying by column
    this.cardsTable.addGlobalSecondaryIndex({
      indexName: 'ColumnIndex',
      partitionKey: { name: 'column', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'position', type: dynamodb.AttributeType.NUMBER },
    });

    // WebSocket connections table
    this.connectionsTable = new dynamodb.Table(this, 'ConnectionsTable', {
      partitionKey: { name: 'connectionId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      timeToLiveAttribute: 'ttl',
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    new cdk.CfnOutput(this, 'CardsTableName', {
      value: this.cardsTable.tableName,
      exportName: 'CardsTableName',
    });

    new cdk.CfnOutput(this, 'ConnectionsTableName', {
      value: this.connectionsTable.tableName,
      exportName: 'ConnectionsTableName',
    });
  }
}
