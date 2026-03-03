# API Documentation

## REST API

**Base URL**: `https://xtv386hpgi.execute-api.ap-southeast-2.amazonaws.com/prod/`

### Card Endpoints

#### GET /cards
- **Purpose**: List all cards on the board
- **Method**: GET
- **Request**: No body
- **Response**: Array of Card objects
- **Status**: 200 OK
- **Example Response**:
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Implement login page",
    "description": "Create a login page with email and password fields",
    "column": "To Do",
    "position": 0,
    "storyPoints": 5,
    "priority": "high",
    "acceptanceCriteria": ["Email validation", "Password validation", "Error handling"],
    "aiGenerated": true,
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  }
]
```

#### GET /cards/{id}
- **Purpose**: Retrieve a single card by ID
- **Method**: GET
- **Path Parameters**: `id` (string, UUID)
- **Request**: No body
- **Response**: Card object
- **Status**: 200 OK or 404 Not Found
- **Example Response**: Same as single card in GET /cards

#### POST /cards
- **Purpose**: Create a new card
- **Method**: POST
- **Request Body**:
```json
{
  "title": "string (required)",
  "description": "string (required)",
  "column": "string (required, one of: 'To Do', 'In Progress', 'Done')",
  "position": "number (optional, default: 0)",
  "storyPoints": "number (optional)",
  "priority": "string (optional, one of: 'low', 'medium', 'high')",
  "acceptanceCriteria": "string[] (optional)"
}
```
- **Response**: Created Card object
- **Status**: 201 Created
- **Side Effects**: Broadcasts `card_created` event to all WebSocket clients

#### PUT /cards/{id}
- **Purpose**: Update an existing card
- **Method**: PUT
- **Path Parameters**: `id` (string, UUID)
- **Request Body**: Partial Card object (all fields optional)
```json
{
  "title": "string (optional)",
  "description": "string (optional)",
  "column": "string (optional)",
  "position": "number (optional)",
  "storyPoints": "number (optional)",
  "priority": "string (optional)",
  "acceptanceCriteria": "string[] (optional)"
}
```
- **Response**: Updated Card object
- **Status**: 200 OK
- **Side Effects**: Broadcasts `card_updated` event to all WebSocket clients

#### DELETE /cards/{id}
- **Purpose**: Delete a card
- **Method**: DELETE
- **Path Parameters**: `id` (string, UUID)
- **Request**: No body
- **Response**: Empty body
- **Status**: 204 No Content
- **Side Effects**: Broadcasts `card_deleted` event to all WebSocket clients

### AI Task Endpoint

#### POST /ai-task
- **Purpose**: Generate a structured card from natural language description
- **Method**: POST
- **Request Body**:
```json
{
  "description": "string (required, natural language task description)"
}
```
- **Response**: Created Card object with AI-generated fields
- **Status**: 201 Created
- **Side Effects**: Broadcasts `card_created` event to all WebSocket clients
- **Example Request**:
```json
{
  "description": "Create a login page with email and password fields, including validation and error handling"
}
```
- **Example Response**:
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440001",
  "title": "Create login page with validation",
  "description": "Implement a login page with email and password input fields, including client-side validation and error handling for invalid credentials",
  "column": "To Do",
  "position": 0,
  "storyPoints": 8,
  "priority": "high",
  "acceptanceCriteria": [
    "Email field with validation",
    "Password field with validation",
    "Error messages for invalid input",
    "Submit button functionality"
  ],
  "aiGenerated": true,
  "createdAt": "2024-01-15T10:35:00Z",
  "updatedAt": "2024-01-15T10:35:00Z"
}
```
- **Error Responses**:
  - 400 Bad Request: Missing or invalid description
  - 500 Internal Server Error: Bedrock invocation failed

## WebSocket API

**Base URL**: `wss://a2ha2ia4wd.execute-api.ap-southeast-2.amazonaws.com/prod`

### Connection Lifecycle

#### $connect
- **Purpose**: Establish WebSocket connection
- **Trigger**: Client initiates WebSocket connection
- **Handler**: WS Connect Handler
- **Side Effects**: Connection ID added to Connections table with 24-hour TTL
- **Response**: 200 OK

#### $disconnect
- **Purpose**: Close WebSocket connection
- **Trigger**: Client closes connection or connection times out
- **Handler**: WS Disconnect Handler
- **Side Effects**: Connection ID removed from Connections table
- **Response**: 200 OK

#### $default
- **Purpose**: Handle incoming WebSocket messages
- **Trigger**: Client sends message on WebSocket
- **Handler**: WS Message Handler
- **Response**: 200 OK (message acknowledged)

### Broadcast Events

Events are sent from server to all connected clients in JSON format:

#### card_created
- **Trigger**: New card created via POST /cards or POST /ai-task
- **Payload**:
```json
{
  "type": "card_created",
  "data": {
    "id": "string",
    "title": "string",
    "description": "string",
    "column": "string",
    "position": "number",
    "storyPoints": "number",
    "priority": "string",
    "acceptanceCriteria": "string[]",
    "aiGenerated": "boolean",
    "createdAt": "string",
    "updatedAt": "string"
  }
}
```

#### card_updated
- **Trigger**: Card updated via PUT /cards/{id}
- **Payload**:
```json
{
  "type": "card_updated",
  "data": {
    "id": "string",
    "title": "string",
    "description": "string",
    "column": "string",
    "position": "number",
    "storyPoints": "number",
    "priority": "string",
    "acceptanceCriteria": "string[]",
    "aiGenerated": "boolean",
    "createdAt": "string",
    "updatedAt": "string"
  }
}
```

#### card_deleted
- **Trigger**: Card deleted via DELETE /cards/{id}
- **Payload**:
```json
{
  "type": "card_deleted",
  "data": {
    "id": "string"
  }
}
```

#### bottleneck_alerts
- **Trigger**: EventBridge triggers AI Bottleneck Handler every 5 minutes
- **Payload**:
```json
{
  "type": "bottleneck_alerts",
  "data": [
    {
      "severity": "low|medium|high",
      "category": "aging_cards|workload_imbalance|column_bottleneck",
      "message": "string",
      "affectedCards": ["string"],
      "affectedColumn": "string",
      "recommendations": ["string"]
    }
  ]
}
```

## Internal Service Interfaces

### DynamoDB Service (dynamodb.ts)

#### cardsService.create(card: Card): Promise<Card>
- Creates a new card in the Cards table
- Returns the created card

#### cardsService.get(id: string): Promise<Card | null>
- Retrieves a card by ID
- Returns card or null if not found

#### cardsService.update(id: string, updates: Partial<Card>): Promise<Card>
- Updates a card with partial data
- Automatically sets updatedAt timestamp
- Returns updated card

#### cardsService.delete(id: string): Promise<void>
- Deletes a card by ID

#### cardsService.list(): Promise<Card[]>
- Retrieves all cards from the table
- Returns array of cards

#### cardsService.listByColumn(column: string): Promise<Card[]>
- Retrieves all cards in a specific column using ColumnIndex GSI
- Returns array of cards

#### connectionsService.add(connectionId: string): Promise<void>
- Adds a WebSocket connection to the Connections table
- Sets TTL to 24 hours from now

#### connectionsService.remove(connectionId: string): Promise<void>
- Removes a WebSocket connection from the Connections table

#### connectionsService.list(): Promise<string[]>
- Retrieves all active connection IDs
- Returns array of connection IDs

### Bedrock Service (bedrock.ts)

#### invokeClaudeForTask(description: string, boardContext: any): Promise<AICardSuggestion>
- Invokes Claude 3 Sonnet to generate structured task from natural language
- Parameters:
  - `description`: Natural language task description
  - `boardContext`: Object with totalCards and columns array
- Returns AICardSuggestion with title, description, acceptanceCriteria, storyPoints, priority
- Throws error if Bedrock invocation fails

#### analyzeBottlenecks(cards: any[]): Promise<BottleneckAlert[]>
- Invokes Claude 3 Sonnet to analyze board for bottlenecks
- Parameters:
  - `cards`: Array of all cards on the board
- Returns array of BottleneckAlert objects
- Returns empty array if no bottlenecks detected
- Throws error if Bedrock invocation fails

### WebSocket Service (websocket.ts)

#### broadcastToAll(message: any): Promise<void>
- Sends a message to all connected WebSocket clients
- Parameters:
  - `message`: Object with type and data properties
- Retrieves all connections from DynamoDB
- Sends message to each connection via API Gateway Management API
- Automatically removes stale connections (410 Gone)
- Gracefully handles broadcast failures

## Data Models

### Card
```typescript
interface Card {
  id: string;                          // UUID
  title: string;                       // Max 60 chars
  description: string;                 // Detailed description
  column: string;                      // "To Do", "In Progress", or "Done"
  position: number;                    // Order within column
  storyPoints?: number;                // Fibonacci: 1, 2, 3, 5, 8, 13
  priority?: 'low' | 'medium' | 'high';
  acceptanceCriteria?: string[];       // Array of criteria
  aiGenerated?: boolean;               // True if created via AI
  createdAt: string;                   // ISO timestamp
  updatedAt: string;                   // ISO timestamp
}
```

### CreateCardRequest
```typescript
interface CreateCardRequest {
  title: string;
  description: string;
  column: string;
  position?: number;
  storyPoints?: number;
  priority?: 'low' | 'medium' | 'high';
  acceptanceCriteria?: string[];
}
```

### UpdateCardRequest
```typescript
interface UpdateCardRequest {
  title?: string;
  description?: string;
  column?: string;
  position?: number;
  storyPoints?: number;
  priority?: 'low' | 'medium' | 'high';
  acceptanceCriteria?: string[];
}
```

### AICardSuggestion
```typescript
interface AICardSuggestion {
  title: string;
  description: string;
  acceptanceCriteria: string[];
  storyPoints: number;
  priority: 'low' | 'medium' | 'high';
}
```

### BottleneckAlert
```typescript
interface BottleneckAlert {
  severity: 'low' | 'medium' | 'high';
  category: 'aging_cards' | 'workload_imbalance' | 'column_bottleneck';
  message: string;
  affectedCards?: string[];
  affectedColumn?: string;
  recommendations: string[];
}
```

## CORS Configuration

All REST endpoints include CORS headers:
- `Access-Control-Allow-Origin: *`
- `Access-Control-Allow-Methods: GET,POST,PUT,DELETE,OPTIONS`
- `Access-Control-Allow-Headers: Content-Type`

OPTIONS requests are handled with 200 OK response.

## Error Handling

### HTTP Status Codes
- **200 OK**: Successful GET or PUT
- **201 Created**: Successful POST
- **204 No Content**: Successful DELETE
- **400 Bad Request**: Invalid request body or missing required fields
- **404 Not Found**: Card not found
- **500 Internal Server Error**: Server error (DynamoDB, Bedrock, or Lambda error)

### Error Response Format
```json
{
  "error": "Error message",
  "message": "Additional details (if available)"
}
```

