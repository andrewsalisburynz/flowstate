import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';

const client = new BedrockRuntimeClient({ region: process.env.AWS_REGION || 'us-east-1' });

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
    const response = await client.send(new InvokeModelCommand({
      modelId: 'anthropic.claude-3-sonnet-20240229-v1:0',
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify({
        anthropic_version: 'bedrock-2023-05-31',
        max_tokens: 1000,
        temperature: 0.3,
        messages: [{
          role: 'user',
          content: prompt,
        }],
      }),
    }));

    const responseBody = JSON.parse(new TextDecoder().decode(response.body));
    const content = responseBody.content[0].text;
    
    // Extract JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    throw new Error('Failed to parse AI response');
  } catch (error: any) {
    console.error('Bedrock error:', error);
    throw new Error(`AI service error: ${error.message}`);
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
    const response = await client.send(new InvokeModelCommand({
      modelId: 'anthropic.claude-3-sonnet-20240229-v1:0',
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify({
        anthropic_version: 'bedrock-2023-05-31',
        max_tokens: 2000,
        temperature: 0.3,
        messages: [{
          role: 'user',
          content: prompt,
        }],
      }),
    }));

    const responseBody = JSON.parse(new TextDecoder().decode(response.body));
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
