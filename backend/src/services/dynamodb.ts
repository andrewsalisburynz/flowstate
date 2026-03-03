import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand, UpdateCommand, DeleteCommand, ScanCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { Card, TeamMember } from '../types';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const CARDS_TABLE = process.env.CARDS_TABLE!;
const CONNECTIONS_TABLE = process.env.CONNECTIONS_TABLE!;
const TEAM_MEMBERS_TABLE = process.env.TEAM_MEMBERS_TABLE || '';

export const cardsService = {
  async create(card: Card): Promise<Card> {
    await docClient.send(new PutCommand({
      TableName: CARDS_TABLE,
      Item: card,
    }));
    return card;
  },

  async get(id: string): Promise<Card | null> {
    const result = await docClient.send(new GetCommand({
      TableName: CARDS_TABLE,
      Key: { id },
    }));
    return result.Item as Card || null;
  },

  async update(id: string, updates: Partial<Card>): Promise<Card> {
    const updateExpressions: string[] = [];
    const expressionAttributeNames: Record<string, string> = {};
    const expressionAttributeValues: Record<string, any> = {};

    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined) {
        updateExpressions.push(`#${key} = :${key}`);
        expressionAttributeNames[`#${key}`] = key;
        expressionAttributeValues[`:${key}`] = value;
      }
    });

    updateExpressions.push('#updatedAt = :updatedAt');
    expressionAttributeNames['#updatedAt'] = 'updatedAt';
    expressionAttributeValues[':updatedAt'] = new Date().toISOString();

    const result = await docClient.send(new UpdateCommand({
      TableName: CARDS_TABLE,
      Key: { id },
      UpdateExpression: `SET ${updateExpressions.join(', ')}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW',
    }));

    return result.Attributes as Card;
  },

  async delete(id: string): Promise<void> {
    await docClient.send(new DeleteCommand({
      TableName: CARDS_TABLE,
      Key: { id },
    }));
  },

  async list(): Promise<Card[]> {
    const result = await docClient.send(new ScanCommand({
      TableName: CARDS_TABLE,
    }));
    return (result.Items as Card[]) || [];
  },

  async listByColumn(column: string): Promise<Card[]> {
    const result = await docClient.send(new QueryCommand({
      TableName: CARDS_TABLE,
      IndexName: 'ColumnIndex',
      KeyConditionExpression: '#column = :column',
      ExpressionAttributeNames: { '#column': 'column' },
      ExpressionAttributeValues: { ':column': column },
    }));
    return (result.Items as Card[]) || [];
  },

  async getCardsByAssignee(assigneeId: string): Promise<Card[]> {
    const allCards = await this.list();
    return allCards.filter(card => card.assignees?.includes(assigneeId));
  },

  async unassignTeamMember(teamMemberId: string): Promise<void> {
    const cards = await this.getCardsByAssignee(teamMemberId);
    
    for (const card of cards) {
      const updatedAssignees = card.assignees?.filter((id: string) => id !== teamMemberId) || [];
      await this.update(card.id, {
        assignees: updatedAssignees.length > 0 ? updatedAssignees : undefined,
        assignedAt: updatedAssignees.length > 0 ? card.assignedAt : undefined,
      });
    }
  },
};

export const connectionsService = {
  async add(connectionId: string): Promise<void> {
    await docClient.send(new PutCommand({
      TableName: CONNECTIONS_TABLE,
      Item: {
        connectionId,
        connectedAt: new Date().toISOString(),
        ttl: Math.floor(Date.now() / 1000) + 86400, // 24 hours
      },
    }));
  },

  async remove(connectionId: string): Promise<void> {
    await docClient.send(new DeleteCommand({
      TableName: CONNECTIONS_TABLE,
      Key: { connectionId },
    }));
  },

  async list(): Promise<string[]> {
    const result = await docClient.send(new ScanCommand({
      TableName: CONNECTIONS_TABLE,
    }));
    return (result.Items || []).map(item => item.connectionId);
  },
};


export const teamMembersService = {
  async create(teamMember: TeamMember): Promise<TeamMember> {
    await docClient.send(new PutCommand({
      TableName: TEAM_MEMBERS_TABLE,
      Item: teamMember,
    }));
    return teamMember;
  },

  async get(id: string): Promise<TeamMember | null> {
    const result = await docClient.send(new GetCommand({
      TableName: TEAM_MEMBERS_TABLE,
      Key: { id },
    }));
    return result.Item as TeamMember || null;
  },

  async list(): Promise<TeamMember[]> {
    const result = await docClient.send(new ScanCommand({
      TableName: TEAM_MEMBERS_TABLE,
    }));
    return (result.Items as TeamMember[]) || [];
  },

  async update(id: string, updates: Partial<TeamMember>): Promise<TeamMember> {
    const updateExpressions: string[] = [];
    const expressionAttributeNames: Record<string, string> = {};
    const expressionAttributeValues: Record<string, any> = {};

    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined) {
        updateExpressions.push(`#${key} = :${key}`);
        expressionAttributeNames[`#${key}`] = key;
        expressionAttributeValues[`:${key}`] = value;
      }
    });

    updateExpressions.push('#updatedAt = :updatedAt');
    expressionAttributeNames['#updatedAt'] = 'updatedAt';
    expressionAttributeValues[':updatedAt'] = new Date().toISOString();

    const result = await docClient.send(new UpdateCommand({
      TableName: TEAM_MEMBERS_TABLE,
      Key: { id },
      UpdateExpression: `SET ${updateExpressions.join(', ')}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW',
    }));

    return result.Attributes as TeamMember;
  },

  async delete(id: string): Promise<void> {
    await docClient.send(new DeleteCommand({
      TableName: TEAM_MEMBERS_TABLE,
      Key: { id },
    }));
  },

  async checkNameExists(name: string, excludeId?: string): Promise<boolean> {
    const result = await docClient.send(new QueryCommand({
      TableName: TEAM_MEMBERS_TABLE,
      IndexName: 'name-index',
      KeyConditionExpression: 'nameLowercase = :name',
      ExpressionAttributeValues: {
        ':name': name.toLowerCase(),
      },
    }));

    if (!result.Items || result.Items.length === 0) {
      return false;
    }

    if (excludeId) {
      return result.Items.some(item => item.id !== excludeId);
    }

    return true;
  },
};
