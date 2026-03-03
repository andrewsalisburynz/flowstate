#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { StorageStack } from '../lib/storage-stack';
import { ApiStack } from '../lib/api-stack';
import { FrontendStack } from '../lib/frontend-stack';

const app = new cdk.App();

const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
};

// Storage stack (DynamoDB tables)
const storageStack = new StorageStack(app, 'KanbanStorageStack', { env });

// API stack (Lambda functions, API Gateway, WebSocket)
new ApiStack(app, 'KanbanApiStack', {
  env,
  cardsTable: storageStack.cardsTable,
  connectionsTable: storageStack.connectionsTable,
});

// Frontend stack (S3 + CloudFront)
new FrontendStack(app, 'FlowStateFrontendStack', { env });
