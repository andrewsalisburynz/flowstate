import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { v4 as uuidv4 } from 'uuid';
import { teamMembersService, cardsService } from '../services/dynamodb';
import { broadcastToAll } from '../services/websocket';
import { TeamMember, CreateTeamMemberRequest, UpdateTeamMemberRequest } from '../types';

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function validateName(name: string): string | null {
  if (!name || typeof name !== 'string') {
    return 'Name is required and must be a string';
  }
  
  const trimmedName = name.trim();
  if (trimmedName.length === 0) {
    return 'Name cannot be empty or whitespace only';
  }
  
  if (trimmedName.length > 100) {
    return 'Name cannot exceed 100 characters';
  }
  
  return null;
}

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const method = event.httpMethod;
    const path = event.path;

    // OPTIONS for CORS
    if (method === 'OPTIONS') {
      return { statusCode: 200, headers, body: '' };
    }

    // GET /team-members - List all team members
    if (method === 'GET' && path === '/team-members') {
      const teamMembers = await teamMembersService.list();
      // Sort by name
      teamMembers.sort((a, b) => a.name.localeCompare(b.name));
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(teamMembers),
      };
    }

    // GET /team-members/{id} - Get single team member
    if (method === 'GET' && path.startsWith('/team-members/')) {
      const id = path.split('/')[2];
      const teamMember = await teamMembersService.get(id);
      
      if (!teamMember) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ error: 'Team member not found' }),
        };
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(teamMember),
      };
    }

    // POST /team-members - Create team member
    if (method === 'POST' && path === '/team-members') {
      const request: CreateTeamMemberRequest = JSON.parse(event.body || '{}');
      
      // Validate name
      const nameError = validateName(request.name);
      if (nameError) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: nameError }),
        };
      }

      const trimmedName = request.name.trim();

      // Check uniqueness
      const nameExists = await teamMembersService.checkNameExists(trimmedName);
      if (nameExists) {
        return {
          statusCode: 409,
          headers,
          body: JSON.stringify({ error: 'Team member with this name already exists' }),
        };
      }

      const teamMember: TeamMember = {
        id: uuidv4(),
        name: trimmedName,
        nameLowercase: trimmedName.toLowerCase(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await teamMembersService.create(teamMember);
      
      // Broadcast to all connected clients
      await broadcastToAll({
        type: 'team_member_created',
        data: teamMember,
      });

      return {
        statusCode: 201,
        headers,
        body: JSON.stringify(teamMember),
      };
    }

    // PUT /team-members/{id} - Update team member
    if (method === 'PUT' && path.startsWith('/team-members/')) {
      const id = path.split('/')[2];
      const request: UpdateTeamMemberRequest = JSON.parse(event.body || '{}');
      
      // Validate name
      const nameError = validateName(request.name);
      if (nameError) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: nameError }),
        };
      }

      const trimmedName = request.name.trim();

      // Check if team member exists
      const existingMember = await teamMembersService.get(id);
      if (!existingMember) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ error: 'Team member not found' }),
        };
      }

      // Check uniqueness (excluding current ID)
      const nameExists = await teamMembersService.checkNameExists(trimmedName, id);
      if (nameExists) {
        return {
          statusCode: 409,
          headers,
          body: JSON.stringify({ error: 'Team member with this name already exists' }),
        };
      }

      const teamMember = await teamMembersService.update(id, {
        name: trimmedName,
        nameLowercase: trimmedName.toLowerCase(),
      });
      
      // Broadcast to all connected clients
      await broadcastToAll({
        type: 'team_member_updated',
        data: teamMember,
      });

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(teamMember),
      };
    }

    // DELETE /team-members/{id} - Delete team member
    if (method === 'DELETE' && path.startsWith('/team-members/')) {
      const id = path.split('/')[2];
      
      // Check if team member exists
      const existingMember = await teamMembersService.get(id);
      if (!existingMember) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ error: 'Team member not found' }),
        };
      }

      // Unassign from all cards
      await cardsService.unassignTeamMember(id);

      // Delete team member
      await teamMembersService.delete(id);
      
      // Broadcast to all connected clients
      await broadcastToAll({
        type: 'team_member_deleted',
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
