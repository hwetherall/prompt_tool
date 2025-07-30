import { NextRequest, NextResponse } from 'next/server';
import { generateSnippetWithMultipleLLMs } from '@/lib/openrouter';
import { createGenerationSession, updateGenerationSession } from '@/lib/supabase';
import type { Snippet } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { snippetName, context, similarSnippets } = body;
    
    if (!snippetName || !context) {
      return NextResponse.json(
        { error: 'Snippet name and context are required' },
        { status: 400 }
      );
    }
    
    // Create a generation session
    const session = await createGenerationSession({
      snippet_name: snippetName,
      user_context: context,
      similar_snippets: similarSnippets.map((s: Snippet) => s.name),
      status: 'in_progress'
    });
    
    // Start generation process
    const { responses, finalContent } = await generateSnippetWithMultipleLLMs(
      {
        context,
        snippetName,
        similarSnippets
      },
      (step, progress) => {
        // You could use Server-Sent Events here for real-time updates
        console.log(`${step}: ${progress}%`);
      }
    );
    
    // Update session with results
    const updatedSession = await updateGenerationSession(session.id, {
      llm_responses: {
        claude: responses['Claude 3 Opus'],
        gpt: responses['GPT-4 Turbo'],
        grok: responses['Grok Beta']
      },
      final_combined: finalContent,
      status: 'completed'
    });
    
    return NextResponse.json({
      sessionId: updatedSession.id,
      finalContent,
      responses
    });
  } catch (error: any) {
    console.error('Error generating snippet:', error);
    
    return NextResponse.json(
      { error: error.message || 'Failed to generate snippet' },
      { status: 500 }
    );
  }
}
