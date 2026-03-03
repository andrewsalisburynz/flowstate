import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { v4 as uuidv4 } from 'uuid';
import { invokeClaudeForTask } from '../services/bedrock';
import { cardsService } from '../services/dynamodb';
import { broadcastToAll } from '../services/websocket';
import { Card } from '../types';

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  // Handle OPTIONS for CORS
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const { description } = JSON.parse(event.body || '{}');
    
    if (!description) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Description required' }),
      };
    }

    // Get current board context
    const cards = await cardsService.list();
    const boardContext = {
      totalCards: cards.length,
      columns: ['To Do', 'In Progress', 'Done'],
    };

    // Call Bedrock
    const suggestion = await invokeClaudeForTask(description, boardContext);

    // Create card from AI suggestion
    const card: Card = {
      id: uuidv4(),
      title: suggestion.title,
      description: suggestion.description,
      column: 'To Do',
      position: 0,
      storyPoints: suggestion.storyPoints,
      priority: suggestion.priority,
      acceptanceCriteria: suggestion.acceptanceCriteria,
      aiGenerated: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await cardsService.create(card);

    // Broadcast to all clients
    await broadcastToAll({
      type: 'card_created',
      data: card,
    });

    return {
      statusCode: 201,
      headers,
      body: JSON.stringify(card),
    };

  } catch (error: any) {
    console.error('AI Task Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Failed to create AI task',
        message: error.message 
      }),
    };
  }
};
