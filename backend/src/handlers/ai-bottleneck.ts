import { EventBridgeEvent } from 'aws-lambda';
import { analyzeBottlenecks } from '../services/bedrock';
import { cardsService } from '../services/dynamodb';
import { broadcastToAll } from '../services/websocket';

export const handler = async (event: EventBridgeEvent<string, any>): Promise<void> => {
  try {
    const cards = await cardsService.list();
    
    if (cards.length === 0) {
      return;
    }

    const alerts = await analyzeBottlenecks(cards);

    if (alerts.length > 0) {
      // Broadcast alerts to all clients
      await broadcastToAll({
        type: 'bottleneck_alerts',
        data: alerts,
      });
    }

  } catch (error) {
    console.error('Bottleneck analysis error:', error);
  }
};
