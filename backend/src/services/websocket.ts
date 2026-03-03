import { ApiGatewayManagementApiClient, PostToConnectionCommand } from '@aws-sdk/client-apigatewaymanagementapi';
import { connectionsService } from './dynamodb';

let client: ApiGatewayManagementApiClient | null = null;

function getClient() {
  if (!client && process.env.WEBSOCKET_ENDPOINT) {
    client = new ApiGatewayManagementApiClient({
      endpoint: process.env.WEBSOCKET_ENDPOINT,
    });
  }
  return client;
}

export async function broadcastToAll(message: any): Promise<void> {
  const wsClient = getClient();
  
  // If WebSocket not configured, skip broadcasting
  if (!wsClient) {
    return;
  }

  try {
    const connections = await connectionsService.list();
    
    if (connections.length === 0) {
      return;
    }

    const promises = connections.map(async (connectionId) => {
      try {
        await wsClient.send(new PostToConnectionCommand({
          ConnectionId: connectionId,
          Data: Buffer.from(JSON.stringify(message)),
        }));
      } catch (error: any) {
        console.error(`Failed to send to ${connectionId}:`, error.message);
        // Remove stale connection
        if (error.statusCode === 410) {
          await connectionsService.remove(connectionId);
        }
      }
    });

    await Promise.allSettled(promises);
  } catch (error) {
    console.error('Broadcast error:', error);
  }
}
