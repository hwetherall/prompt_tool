import { SUPPORTED_MODELS } from './types';
import type { Snippet } from './types';

interface OpenRouterResponse {
  id: string;
  choices: {
    message: {
      content: string;
      role: string;
    };
  }[];
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

interface GenerationRequest {
  context: string;
  snippetName: string;
  similarSnippets: Snippet[];
  rubricContent?: string;
}

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

/**
 * Generate a prompt for creating a new snippet
 */
function createGenerationPrompt(request: GenerationRequest): string {
  const { context, snippetName, similarSnippets, rubricContent } = request;
  
  let prompt = `You are creating a prompt snippet called "${snippetName}".

User Context/Requirements:
${context}

`;

  if (rubricContent) {
    prompt += `Evaluation Rubric/Guidelines:
${rubricContent}

`;
  }

  if (similarSnippets.length > 0) {
    prompt += `Here are some similar snippets for reference:\n\n`;
    
    similarSnippets.forEach(snippet => {
      prompt += `Snippet: ${snippet.name}\n`;
      if (snippet.description) {
        prompt += `Description: ${snippet.description}\n`;
      }
      prompt += `Content:\n${snippet.content}\n\n---\n\n`;
    });
  }

  prompt += `Based on the context${rubricContent ? ', evaluation rubric,' : ''} and similar snippets (if provided), create a high-quality prompt snippet for "${snippetName}". 

The snippet should:
1. Be clear, specific, and reusable
2. Follow a similar structure to the reference snippets if applicable
3. Be self-contained but work well when composed with other snippets
4. Avoid redundancy with existing snippets
${rubricContent ? `5. Align with the evaluation criteria and guidelines provided in the rubric
6. Address all key points and requirements mentioned in the rubric` : ''}

Provide only the snippet content, without any additional explanation.`;

  return prompt;
}

/**
 * Generate snippet content using a specific LLM
 */
export async function generateWithLLM(
  modelId: string,
  request: GenerationRequest
): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY is not configured');
  }

  const prompt = createGenerationPrompt(request);

  const response = await fetch(OPENROUTER_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      'X-Title': 'Prompt Builder'
    },
    body: JSON.stringify({
      model: modelId,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 2000
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenRouter API error: ${response.status} - ${error}`);
  }

  const data: OpenRouterResponse = await response.json();
  
  if (!data.choices || data.choices.length === 0) {
    throw new Error('No response from OpenRouter');
  }

  return data.choices[0].message.content;
}

/**
 * Combine multiple LLM responses into a final version
 */
function createCombinerPrompt(
  snippetName: string,
  context: string,
  responses: Record<string, string>,
  rubricContent?: string
): string {
  let prompt = `You are combining multiple AI-generated versions of a prompt snippet called "${snippetName}".

Original Context: ${context}

`;

  if (rubricContent) {
    prompt += `Evaluation Rubric/Guidelines:
${rubricContent}

`;
  }

  prompt += `Here are the different versions:

`;

  Object.entries(responses).forEach(([model, content]) => {
    prompt += `=== Version from ${model} ===\n${content}\n\n`;
  });

  prompt += `Please analyze these versions and create a final, optimized version that:
1. Combines the best elements from each version
2. Maintains consistency and clarity
3. Removes any redundancy
4. Ensures the snippet is self-contained and reusable
${rubricContent ? '5. Strictly adheres to all evaluation criteria and guidelines in the rubric
6. Prioritizes rubric requirements when there are conflicts between versions' : ''}

Provide only the final snippet content, without any additional explanation.`;

  return prompt;
}

/**
 * Generate snippet using multiple LLMs and combine results
 */
export async function generateSnippetWithMultipleLLMs(
  request: GenerationRequest,
  onProgress?: (step: string, progress: number) => void
): Promise<{
  responses: Record<string, string>;
  finalContent: string;
}> {
  const responses: Record<string, string> = {};
  
  // Step 1: Generate with 3 different LLMs
  const generationModels = SUPPORTED_MODELS.slice(0, 3);
  
  for (let i = 0; i < generationModels.length; i++) {
    const model = generationModels[i];
    const progress = (i + 1) / 4 * 100;
    
    try {
      onProgress?.(`Generating with ${model.name}...`, progress * 0.75);
      const response = await generateWithLLM(model.id, request);
      responses[model.name] = response;
    } catch (error) {
      console.error(`Error with ${model.name}:`, error);
      responses[model.name] = `Error generating with ${model.name}`;
    }
  }

  // Step 2: Combine with the 4th LLM
  onProgress?.('Combining responses...', 90);
  
  const combinerModel = SUPPORTED_MODELS[3];
  const combinerPrompt = createCombinerPrompt(
    request.snippetName,
    request.context,
    responses,
    request.rubricContent
  );

  let finalContent: string;
  
  try {
    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        'X-Title': 'Prompt Builder'
      },
      body: JSON.stringify({
        model: combinerModel.id,
        messages: [
          {
            role: 'user',
            content: combinerPrompt
          }
        ],
        temperature: 0.5,
        max_tokens: 2000
      })
    });

    if (!response.ok) {
      throw new Error(`Combiner API error: ${response.status}`);
    }

    const data: OpenRouterResponse = await response.json();
    finalContent = data.choices[0].message.content;
  } catch (error) {
    console.error('Error combining responses:', error);
    // Fallback to the first successful response
    finalContent = Object.values(responses).find(r => !r.startsWith('Error')) || 'Failed to generate snippet';
  }

  onProgress?.('Generation complete!', 100);

  return {
    responses,
    finalContent
  };
}

/**
 * Test OpenRouter connection
 */
export async function testOpenRouterConnection(): Promise<boolean> {
  try {
    const response = await fetch('https://openrouter.ai/api/v1/models', {
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`
      }
    });
    
    return response.ok;
  } catch (error) {
    console.error('OpenRouter connection test failed:', error);
    return false;
  }
}
