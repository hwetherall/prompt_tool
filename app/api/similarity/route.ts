import { NextRequest, NextResponse } from 'next/server';
import { getSnippets } from '@/lib/supabase';
import { findSimilarSnippets } from '@/lib/similarity';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const name = searchParams.get('name');
    const limit = searchParams.get('limit');
    
    if (!name) {
      return NextResponse.json(
        { error: 'Name parameter is required' },
        { status: 400 }
      );
    }
    
    const allSnippets = await getSnippets();
    const similarSnippets = findSimilarSnippets(
      name,
      allSnippets,
      limit ? parseInt(limit, 10) : 5
    );
    
    return NextResponse.json({ similarSnippets });
  } catch (error) {
    console.error('Error finding similar snippets:', error);
    return NextResponse.json(
      { error: 'Failed to find similar snippets' },
      { status: 500 }
    );
  }
}
