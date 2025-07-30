import { NextRequest, NextResponse } from 'next/server';
import { getComposedPrompts, createComposedPrompt } from '@/lib/supabase';

export async function GET() {
  try {
    const prompts = await getComposedPrompts();
    return NextResponse.json({ prompts });
  } catch (error) {
    console.error('Error fetching prompts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch prompts' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, template, rendered_content, used_snippets } = body;
    
    if (!name || !template) {
      return NextResponse.json(
        { error: 'Name and template are required' },
        { status: 400 }
      );
    }
    
    const prompt = await createComposedPrompt({
      name,
      template,
      rendered_content,
      used_snippets
    });
    
    return NextResponse.json({ prompt }, { status: 201 });
  } catch (error) {
    console.error('Error creating prompt:', error);
    return NextResponse.json(
      { error: 'Failed to create prompt' },
      { status: 500 }
    );
  }
}