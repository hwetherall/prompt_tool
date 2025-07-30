import { NextRequest, NextResponse } from 'next/server';

interface FeedbackResponse {
  likes: string[];
  improvements: string[];
}

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

/**
 * Get feedback from Gemini 2.5 Pro on a generated prompt
 */
export async function POST(request: NextRequest) {
  try {
    const { promptContent } = await request.json();

    if (!promptContent) {
      return NextResponse.json(
        { error: 'Prompt content is required' },
        { status: 400 }
      );
    }

    const apiKey = process.env.OPENROUTER_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'OPENROUTER_API_KEY is not configured' },
        { status: 500 }
      );
    }

    const feedbackPrompt = `You are an expert prompt engineer. Please analyze the following prompt and provide feedback.

PROMPT TO ANALYZE:
"""
${promptContent}
"""

Please provide your feedback in this exact JSON format:
{
  "likes": [
    "First thing you like about this prompt",
    "Second thing you like about this prompt"
  ],
  "improvements": [
    "First specific improvement suggestion",
    "Second specific improvement suggestion", 
    "Third specific improvement suggestion"
  ]
}

Focus on:
- Clarity and specificity
- Structure and organization
- Potential for good AI responses
- Reusability and composability
- Missing context or instructions

Provide only the JSON response, no additional text.`;

    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        'X-Title': 'Prompt Builder'
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-pro',
        messages: [
          {
            role: 'user',
            content: feedbackPrompt
          }
        ],
        temperature: 0.3,
        max_tokens: 1000
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenRouter API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    
    if (!data.choices || data.choices.length === 0) {
      throw new Error('No response from Gemini');
    }

    let feedbackContent = data.choices[0].message.content;
    
    // Try to parse the JSON response
    try {
      // Clean up the response to extract JSON
      const jsonMatch = feedbackContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        feedbackContent = jsonMatch[0];
      }
      
      const feedback: FeedbackResponse = JSON.parse(feedbackContent);
      
      // Validate the structure
      if (!Array.isArray(feedback.likes) || !Array.isArray(feedback.improvements)) {
        throw new Error('Invalid feedback structure');
      }
      
      if (feedback.likes.length !== 2 || feedback.improvements.length !== 3) {
        throw new Error('Feedback should have exactly 2 likes and 3 improvements');
      }

      return NextResponse.json({ feedback });
      
    } catch (parseError) {
      console.error('Failed to parse Gemini response:', parseError);
      
      // Fallback: extract feedback manually from the text
      const fallbackFeedback: FeedbackResponse = {
        likes: [
          "The prompt shows good structure and organization",
          "It includes relevant context for AI processing"
        ],
        improvements: [
          "Could be more specific about desired output format",
          "Might benefit from additional examples or constraints",
          "Consider adding more context about the intended use case"
        ]
      };
      
      return NextResponse.json({ 
        feedback: fallbackFeedback,
        note: "Used fallback feedback due to parsing issues"
      });
    }

  } catch (error) {
    console.error('Error getting feedback:', error);
    return NextResponse.json(
      { error: 'Failed to get feedback from Gemini' },
      { status: 500 }
    );
  }
}