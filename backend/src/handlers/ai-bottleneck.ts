import { EventBridgeEvent } from 'aws-lambda';
import { analyzeBottlenecks } from '../services/bedrock';
import { cardsService, teamMembersService } from '../services/dynamodb';
import { broadcastToAll } from '../services/websocket';
import { bottleneckAnalysisService } from '../services/bottleneck-analysis';

export const handler = async (event: EventBridgeEvent<string, any>): Promise<void> => {
  try {
    const cards = await cardsService.list();
    
    if (cards.length === 0) {
      return;
    }

    // Get AI-based bottleneck alerts
    const aiAlerts = await analyzeBottlenecks(cards);

    // Get team members for workload analysis
    const teamMembers = await teamMembersService.list();

    // Analyze team workload
    const teamWorkloadAlerts = await bottleneckAnalysisService.analyzeTeamWorkload(cards, teamMembers);

    // Add duration-based alerts for aging cards
    const durationAlerts: any[] = [];
    const now = Date.now();
    
    for (const card of cards) {
      if (card.columnEnteredAt) {
        const enteredAt = new Date(card.columnEnteredAt).getTime();
        const durationMs = now - enteredAt;
        const durationDays = durationMs / (1000 * 60 * 60 * 24);
        
        if (durationDays > 14) {
          // High severity for cards >14 days
          durationAlerts.push({
            severity: 'high',
            category: 'aging_cards',
            message: `Card "${card.title}" has been in ${card.column} for ${Math.floor(durationDays)} days`,
            affectedCards: [card.id],
            affectedColumn: card.column,
            recommendations: [
              'Review card complexity and consider breaking it down',
              'Check for blockers preventing progress',
              'Reassess priority and urgency'
            ]
          });
        } else if (durationDays > 7) {
          // Medium severity for cards >7 days
          durationAlerts.push({
            severity: 'medium',
            category: 'aging_cards',
            message: `Card "${card.title}" has been in ${card.column} for ${Math.floor(durationDays)} days`,
            affectedCards: [card.id],
            affectedColumn: card.column,
            recommendations: [
              'Monitor progress closely',
              'Consider if additional resources are needed',
              'Check if card scope is appropriate'
            ]
          });
        }
      }
    }

    // Combine all alerts: AI + team workload + duration
    const allAlerts = [...aiAlerts, ...teamWorkloadAlerts, ...durationAlerts];

    if (allAlerts.length > 0) {
      // Broadcast alerts to all clients
      await broadcastToAll({
        type: 'bottleneck_alerts',
        data: allAlerts,
      });
    }

  } catch (error) {
    console.error('Bottleneck analysis error:', error);
  }
};
