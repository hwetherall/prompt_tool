import { NextRequest, NextResponse } from 'next/server';
import { generateSnippetWithMultipleLLMs } from '@/lib/openrouter';
import { createGenerationSession, updateGenerationSession } from '@/lib/supabase';
import { extractTextFromWord, processRubricContent } from '@/lib/file-parser';
import type { Snippet } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    let snippetName: string;
    let context: string;
    let similarSnippets: Snippet[] = [];
    let rubricContent: string | undefined = undefined;
    let clientId: string | undefined = undefined;

    // Check if the request is multipart/form-data
    const contentType = request.headers.get('content-type') || '';
    
    if (contentType.includes('multipart/form-data')) {
      // Handle form data with file upload
      const formData = await request.formData();
      
      snippetName = formData.get('snippetName') as string;
      context = formData.get('context') as string;
      
      const similarSnippetsJson = formData.get('similarSnippets') as string;
      if (similarSnippetsJson) {
        try {
          similarSnippets = JSON.parse(similarSnippetsJson);
        } catch (e) {
          console.error('Failed to parse similar snippets:', e);
        }
      }
      
      // Handle client ID
      const clientIdValue = formData.get('clientId') as string;
      if (clientIdValue) {
        clientId = clientIdValue;
      }
      
      // Handle rubric file if present
      const rubricFile = formData.get('rubric') as File;
      if (rubricFile) {
        const buffer = Buffer.from(await rubricFile.arrayBuffer());
        const rawText = await extractTextFromWord(buffer);
        rubricContent = processRubricContent(rawText);
      }
    } else {
      // Handle regular JSON request
      const body = await request.json();
      snippetName = body.snippetName;
      context = body.context;
      similarSnippets = body.similarSnippets || [];
      clientId = body.clientId;
    }
    
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
      client_id: clientId,
      status: 'in_progress'
    } as any);
    
    // Enhance context with rubric if provided
    let enhancedContext = context;
    if (rubricContent) {
      enhancedContext = `${context}

--- EVALUATION RUBRIC ---
${rubricContent}`;
    }

    // Start generation process
    const { responses, finalContent } = await generateSnippetWithMultipleLLMs(
      {
        context: enhancedContext,
        snippetName,
        similarSnippets,
        rubricContent
      },
      (step: string, progress: number) => {
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
