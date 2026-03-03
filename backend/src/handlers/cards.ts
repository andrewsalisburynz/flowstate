import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { v4 as uuidv4 } from 'uuid';
import { cardsService } from '../services/dynamodb';
import { broadcastToAll } from '../services/websocket';
import { Card, CreateCardRequest, UpdateCardRequest } from '../types';

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const httpMethod = event.httpMethod;
  const pathParameters = event.pathParameters;

  try {
    const method = event.httpMethod;
    const path = event.path;

    // OPTIONS for CORS
    if (method === 'OPTIONS') {
      return { statusCode: 200, headers, body: '' };
    }

    // GET /cards - List all cards
    if (method === 'GET' && path === '/cards') {
      const cards = await cardsService.list();
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(cards),
      };
    }

    // GET /cards/{id} - Get single card
    if (method === 'GET' && path.startsWith('/cards/')) {
      const id = path.split('/')[2];
      const card = await cardsService.get(id);
      
      if (!card) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ error: 'Card not found' }),
        };
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(card),
      };
    }

    // POST /cards - Create card
    if (method === 'POST' && path === '/cards') {
      const request: CreateCardRequest = JSON.parse(event.body || '{}');
      
      const card: Card = {
        id: uuidv4(),
        title: request.title,
        description: request.description,
        column: request.column,
        position: request.position || 0,
        storyPoints: request.storyPoints,
        priority: request.priority,
        acceptanceCriteria: request.acceptanceCriteria,
        aiGenerated: false,
        columnEnteredAt: new Date().toISOString(), // Set initial column entry time
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await cardsService.create(card);
      
      // Broadcast to all connected clients
      await broadcastToAll({
        type: 'card_created',
        data: card,
      });

      return {
        statusCode: 201,
        headers,
        body: JSON.stringify(card),
      };
    }

    // PUT /cards/{id} - Update card
    if (method === 'PUT' && path.startsWith('/cards/')) {
      const id = path.split('/')[2];
      const updates: UpdateCardRequest = JSON.parse(event.body || '{}');
      
      // Check if column is being changed to track duration
      if (updates.column) {
        const existingCard = await cardsService.get(id);
        if (existingCard && existingCard.column !== updates.column) {
          // Column changed, set columnEnteredAt to current timestamp
          (updates as any).columnEnteredAt = new Date().toISOString();
        }
      }
      
      const card = await cardsService.update(id, updates);
      
      // Broadcast to all connected clients
      await broadcastToAll({
        type: 'card_updated',
        data: card,
      });

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(card),
      };
    }

    // DELETE /cards/{id} - Delete card
    if (method === 'DELETE' && path.startsWith('/cards/')) {
      const id = path.split('/')[2];
      
      await cardsService.delete(id);
      
      // Broadcast to all connected clients
      await broadcastToAll({
        type: 'card_deleted',
        data: { id },
      });

      return {
        statusCode: 204,
        headers,
        body: '',
      };
    }

    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ error: 'Not found' }),
    };

  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};
