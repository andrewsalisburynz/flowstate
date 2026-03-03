import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';

const client = new BedrockRuntimeClient({ region: process.env.AWS_REGION || 'us-east-1' });

// Utility function for delays
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Check if error is a throttling error
function isThrottlingError(error: any): boolean {
  return error.name === 'ThrottlingException' || 
         error.message?.includes('Too many requests') ||
         error.message?.includes('throttl');
}

// Wrapper function with exponential backoff retry logic
async function invokeBedrockWithRetry(
  modelId: string,
  body: string,
  maxRetries: number = 3
): Promise<any> {
  let attempt = 0;
  let delay = 1000; // Start with 1 second

  while (attempt <= maxRetries) {
    try {
      const response = await client.send(new InvokeModelCommand({
        modelId,
        contentType: 'application/json',
        accept: 'application/json',
        body,
      }));

      return JSON.parse(new TextDecoder().decode(response.body));
    } catch (error: any) {
      const isThrottled = isThrottlingError(error);
      
      if (isThrottled && attempt < maxRetries) {
        await sleep(delay);
        delay *= 2; // Exponential backoff: 1s, 2s, 4s, 8s
        attempt++;
      } else {
        // All retries exhausted or non-throttling error
        if (isThrottled) {
          // Extract retry-after if available
          const retryAfter = error.$metadata?.retryAfterSeconds || 60;
          const enhancedError: any = new Error(`Too many requests, please wait before trying again.`);
          enhancedError.retryAfter = retryAfter;
          enhancedError.isThrottling = true;
          throw enhancedError;
        }
        throw error;
      }
    }
  }

  // Should never reach here, but TypeScript needs it
  throw new Error('Max retries exceeded');
}

export async function invokeClaudeForTask(description: string, boardContext: any): Promise<any> {
  const prompt = `You are a helpful assistant that converts natural language task descriptions into structured Kanban cards.

Task description: "${description}"

Board context: ${JSON.stringify(boardContext)}

Return a JSON object with:
- title: string (concise task title, max 60 chars)
- description: string (detailed description)
- acceptanceCriteria: string[] (array of 2-4 acceptance criteria)
- storyPoints: number (1, 2, 3, 5, 8, or 13 - Fibonacci)
- priority: "low" | "medium" | "high"

Return ONLY valid JSON, no other text.`;

  try {
    const responseBody = await invokeBedrockWithRetry(
      'anthropic.claude-3-haiku-20240307-v1:0',
      JSON.stringify({
        anthropic_version: 'bedrock-2023-05-31',
        max_tokens: 1000,
        temperature: 0.3,
        messages: [{
          role: 'user',
          content: prompt,
        }],
      })
    );

    const content = responseBody.content[0].text;
    
    // Extract JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    throw new Error('Failed to parse AI response');
  } catch (error: any) {
    console.error('Bedrock error:', error);
    throw error; // Preserve error details including retryAfter
  }
}

export async function analyzeBottlenecks(cards: any[]): Promise<any[]> {
  const prompt = `Analyze this Kanban board for bottlenecks:

Cards: ${JSON.stringify(cards)}

Identify issues like:
- Aging cards (in same column >7 days)
- Column bottlenecks (too many cards in one column)
- Workload imbalance

Return JSON array of alerts. Each alert:
- severity: "low" | "medium" | "high"
- category: "aging_cards" | "workload_imbalance" | "column_bottleneck"
- message: string
- affectedCards: string[] (card IDs)
- affectedColumn: string (if applicable)
- recommendations: string[]

Return empty array [] if no issues found. Return ONLY valid JSON.`;

  try {
    const responseBody = await invokeBedrockWithRetry(
      'anthropic.claude-3-haiku-20240307-v1:0',
      JSON.stringify({
        anthropic_version: 'bedrock-2023-05-31',
        max_tokens: 2000,
        temperature: 0.3,
        messages: [{
          role: 'user',
          content: prompt,
        }],
      })
    );

    const content = responseBody.content[0].text;
    
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    return [];
  } catch (error: any) {
    console.error('Bedrock analysis error:', error);
    return [];
  }
}

// New function: Suggest card split for oversized cards
export async function suggestCardSplit(card: any): Promise<any> {
  const prompt = `You are a helpful assistant that splits large tasks into smaller, manageable cards.

Original card:
- Title: ${card.title}
- Description: ${card.description}
- Story Points: ${card.storyPoints}
- Acceptance Criteria: ${JSON.stringify(card.acceptanceCriteria)}

This card is too large (>${card.storyPoints} story points). Split it into 2-4 smaller cards, each with ≤8 story points.

Return a JSON object with:
- reason: string (why the split is recommended)
- splitCards: array of 2-4 cards, each with:
  - title: string (concise, max 60 chars)
  - description: string (detailed description)
  - acceptanceCriteria: string[] (2-4 criteria)
  - storyPoints: number (1, 2, 3, 5, or 8 - Fibonacci, must be ≤8)
  - priority: "low" | "medium" | "high"

Ensure split cards cover all aspects of the original card. Return ONLY valid JSON.`;

  try {
    const responseBody = await invokeBedrockWithRetry(
      'anthropic.claude-3-haiku-20240307-v1:0',
      JSON.stringify({
        anthropic_version: 'bedrock-2023-05-31',
        max_tokens: 2000,
        temperature: 0.3,
        messages: [{
          role: 'user',
          content: prompt,
        }],
      })
    );

    const content = responseBody.content[0].text;
    
    // Extract JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const splitSuggestion = JSON.parse(jsonMatch[0]);
      return {
        originalCard: card,
        ...splitSuggestion
      };
    }
    
    throw new Error('Failed to parse split suggestion');
  } catch (error: any) {
    console.error('Card split error:', error);
    throw error;
  }
}
