import { NextRequest, NextResponse } from 'next/server';
import { getSnippets, getSnippetsWithClientPriority } from '@/lib/supabase';
import { findSimilarSnippets } from '@/lib/similarity';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const name = searchParams.get('name');
    const limit = searchParams.get('limit');
    const clientId = searchParams.get('client_id');
    
    if (!name) {
      return NextResponse.json(
        { error: 'Name parameter is required' },
        { status: 400 }
      );
    }
    
    // Use client-aware snippet fetching if client_id is provided
    const allSnippets = clientId 
      ? await getSnippetsWithClientPriority(undefined, clientId)
      : await getSnippets();
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
