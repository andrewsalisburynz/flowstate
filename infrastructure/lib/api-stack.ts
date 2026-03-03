import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as apigatewayv2 from 'aws-cdk-lib/aws-apigatewayv2';
import * as apigatewayv2Integrations from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import { Construct } from 'constructs';

interface ApiStackProps extends cdk.StackProps {
  cardsTable: dynamodb.ITable;
  connectionsTable: dynamodb.ITable;
}

export class ApiStack extends cdk.Stack {
  public readonly restApi: apigateway.RestApi;
  public readonly webSocketApi: apigatewayv2.WebSocketApi;

  constructor(scope: Construct, id: string, props: ApiStackProps) {
    super(scope, id, props);

    const { cardsTable, connectionsTable } = props;

    // Lambda Layer for shared dependencies
    const lambdaLayer = new lambda.LayerVersion(this, 'DependenciesLayer', {
      code: lambda.Code.fromAsset('../backend/layer'),
      compatibleRuntimes: [lambda.Runtime.NODEJS_20_X],
      description: 'Shared dependencies for Kanban Lambda functions',
    });

    // Common Lambda environment variables
    const commonEnv = {
      CARDS_TABLE: cardsTable.tableName,
      CONNECTIONS_TABLE: connectionsTable.tableName,
    };

    // Cards CRUD Lambda
    const cardsHandler = new lambda.Function(this, 'CardsHandler', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'handlers/cards.handler',
      code: lambda.Code.fromAsset('../backend/dist'),
      layers: [lambdaLayer],
      environment: commonEnv,
      timeout: cdk.Duration.seconds(30),
    });

    cardsTable.grantReadWriteData(cardsHandler);
    connectionsTable.grantReadData(cardsHandler);

    // WebSocket Connect Handler
    const wsConnectHandler = new lambda.Function(this, 'WsConnectHandler', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'handlers/websocket.connect',
      code: lambda.Code.fromAsset('../backend/dist'),
      layers: [lambdaLayer],
      environment: commonEnv,
      timeout: cdk.Duration.seconds(30),
    });

    connectionsTable.grantWriteData(wsConnectHandler);

    // WebSocket Disconnect Handler
    const wsDisconnectHandler = new lambda.Function(this, 'WsDisconnectHandler', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'handlers/websocket.disconnect',
      code: lambda.Code.fromAsset('../backend/dist'),
      layers: [lambdaLayer],
      environment: commonEnv,
      timeout: cdk.Duration.seconds(30),
    });

    connectionsTable.grantWriteData(wsDisconnectHandler);

    // WebSocket Message Handler
    const wsMessageHandler = new lambda.Function(this, 'WsMessageHandler', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'handlers/websocket.message',
      code: lambda.Code.fromAsset('../backend/dist'),
      layers: [lambdaLayer],
      environment: commonEnv,
      timeout: cdk.Duration.seconds(30),
    });

    // AI Task Creation Lambda
    const aiTaskHandler = new lambda.Function(this, 'AiTaskHandler', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'handlers/ai-task.handler',
      code: lambda.Code.fromAsset('../backend/dist'),
      layers: [lambdaLayer],
      environment: commonEnv,
      timeout: cdk.Duration.seconds(60),
      memorySize: 512,
    });

    cardsTable.grantReadWriteData(aiTaskHandler);
    connectionsTable.grantReadData(aiTaskHandler);
    
    // Grant Bedrock and AWS Marketplace access
    aiTaskHandler.addToRolePolicy(new iam.PolicyStatement({
      actions: [
        'bedrock:InvokeModel',
        'bedrock:InvokeModelWithResponseStream',
      ],
      resources: ['*'],
    }));
    
    aiTaskHandler.addToRolePolicy(new iam.PolicyStatement({
      actions: [
        'aws-marketplace:ViewSubscriptions',
        'aws-marketplace:Subscribe',
      ],
      resources: ['*'],
    }));

    // AI Bottleneck Detection Lambda
    const aiBottleneckHandler = new lambda.Function(this, 'AiBottleneckHandler', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'handlers/ai-bottleneck.handler',
      code: lambda.Code.fromAsset('../backend/dist'),
      layers: [lambdaLayer],
      environment: commonEnv,
      timeout: cdk.Duration.seconds(60),
      memorySize: 512,
    });

    cardsTable.grantReadData(aiBottleneckHandler);
    connectionsTable.grantReadData(aiBottleneckHandler);
    
    // Grant Bedrock and AWS Marketplace access
    aiBottleneckHandler.addToRolePolicy(new iam.PolicyStatement({
      actions: [
        'bedrock:InvokeModel',
        'bedrock:InvokeModelWithResponseStream',
      ],
      resources: ['*'],
    }));
    
    aiBottleneckHandler.addToRolePolicy(new iam.PolicyStatement({
      actions: [
        'aws-marketplace:ViewSubscriptions',
        'aws-marketplace:Subscribe',
      ],
      resources: ['*'],
    }));

    // REST API Gateway
    this.restApi = new apigateway.RestApi(this, 'KanbanRestApi', {
      restApiName: 'Kanban API',
      description: 'Kanban Board REST API',
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ['Content-Type', 'Authorization'],
      },
    });

    // Cards endpoints
    const cards = this.restApi.root.addResource('cards');
    cards.addMethod('GET', new apigateway.LambdaIntegration(cardsHandler));
    cards.addMethod('POST', new apigateway.LambdaIntegration(cardsHandler));

    const card = cards.addResource('{id}');
    card.addMethod('GET', new apigateway.LambdaIntegration(cardsHandler));
    card.addMethod('PUT', new apigateway.LambdaIntegration(cardsHandler));
    card.addMethod('DELETE', new apigateway.LambdaIntegration(cardsHandler));

    // AI Task endpoint
    const aiTask = this.restApi.root.addResource('ai-task');
    aiTask.addMethod('POST', new apigateway.LambdaIntegration(aiTaskHandler));

    // WebSocket API
    this.webSocketApi = new apigatewayv2.WebSocketApi(this, 'KanbanWebSocketApi', {
      connectRouteOptions: {
        integration: new apigatewayv2Integrations.WebSocketLambdaIntegration('ConnectIntegration', wsConnectHandler),
      },
      disconnectRouteOptions: {
        integration: new apigatewayv2Integrations.WebSocketLambdaIntegration('DisconnectIntegration', wsDisconnectHandler),
      },
      defaultRouteOptions: {
        integration: new apigatewayv2Integrations.WebSocketLambdaIntegration('MessageIntegration', wsMessageHandler),
      },
    });

    const wsStage = new apigatewayv2.WebSocketStage(this, 'ProdStage', {
      webSocketApi: this.webSocketApi,
      stageName: 'prod',
      autoDeploy: true,
    });

    // Grant WebSocket management permissions to handlers that broadcast
    const wsManagementPolicy = new iam.PolicyStatement({
      actions: ['execute-api:ManageConnections'],
      resources: [
        `arn:aws:execute-api:${this.region}:${this.account}:${this.webSocketApi.apiId}/${wsStage.stageName}/POST/@connections/*`,
      ],
    });

    cardsHandler.addToRolePolicy(wsManagementPolicy);
    aiTaskHandler.addToRolePolicy(wsManagementPolicy);
    aiBottleneckHandler.addToRolePolicy(wsManagementPolicy);

    // Update Lambda environment with WebSocket endpoint
    const wsEndpoint = `https://${this.webSocketApi.apiId}.execute-api.${this.region}.amazonaws.com/${wsStage.stageName}`;
    cardsHandler.addEnvironment('WEBSOCKET_ENDPOINT', wsEndpoint);
    aiTaskHandler.addEnvironment('WEBSOCKET_ENDPOINT', wsEndpoint);
    aiBottleneckHandler.addEnvironment('WEBSOCKET_ENDPOINT', wsEndpoint);

    // EventBridge rule for bottleneck detection (runs every 5 minutes)
    const bottleneckRule = new events.Rule(this, 'BottleneckDetectionRule', {
      schedule: events.Schedule.rate(cdk.Duration.minutes(5)),
      description: 'Trigger AI bottleneck detection every 5 minutes',
    });

    bottleneckRule.addTarget(new targets.LambdaFunction(aiBottleneckHandler));

    // Outputs
    new cdk.CfnOutput(this, 'RestApiUrl', {
      value: this.restApi.url,
      description: 'REST API URL',
      exportName: 'KanbanRestApiUrl',
    });

    new cdk.CfnOutput(this, 'WebSocketUrl', {
      value: `wss://${this.webSocketApi.apiId}.execute-api.${this.region}.amazonaws.com/${wsStage.stageName}`,
      description: 'WebSocket API URL',
      exportName: 'KanbanWebSocketUrl',
    });
  }
}
