import { NextRequest, NextResponse } from 'next/server';
import { renderTemplate, validateTemplate } from '@/lib/snippet-utils';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { template } = body;
    
    if (!template) {
      return NextResponse.json(
        { error: 'Template is required' },
        { status: 400 }
      );
    }
    
    // Validate template syntax
    const validation = validateTemplate(template);
    if (!validation.valid) {
      return NextResponse.json(
        { error: 'Invalid template', errors: validation.errors },
        { status: 400 }
      );
    }
    
    // Render the template
    const result = await renderTemplate(template);
    
    if (result.errors.length > 0 && result.rendered === template) {
      // If there are errors and nothing was rendered, return error
      return NextResponse.json(
        { error: 'Failed to render template', errors: result.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json({
      rendered: result.rendered,
      usedSnippets: result.usedSnippets,
      errors: result.errors
    });
  } catch (error) {
    console.error('Error rendering template:', error);
    return NextResponse.json(
      { error: 'Failed to render template' },
      { status: 500 }
    );
  }
}
