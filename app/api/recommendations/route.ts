import { NextRequest, NextResponse } from 'next/server';
import { getSnippets } from '@/lib/supabase';
import { parseTaxonomy, getMissingTaxonomyItems, analyzeCoverageGaps, getBalancedSuggestions } from '@/lib/taxonomy';
import { readFile } from 'fs/promises';
import { join } from 'path';

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

interface RecommendationResponse {
  recommended: string;
  reasoning: string;
  alternatives: string[];
}

export async function POST(request: NextRequest) {
  try {
    const { currentSnippet } = await request.json();

    if (!currentSnippet) {
      return NextResponse.json(
        { error: 'Current snippet name is required' },
        { status: 400 }
      );
    }

    // Get all existing snippets
    const existingSnippets = await getSnippets();
    const existingNames = existingSnippets.map(s => s.name);

    // Parse taxonomy from prompts.md
    const promptsPath = join(process.cwd(), 'prompts.md');
    const taxonomyContent = await readFile(promptsPath, 'utf-8');
    const taxonomy = parseTaxonomy(taxonomyContent);

    // Get missing items and coverage analysis
    const missingItems = getMissingTaxonomyItems(taxonomy, existingNames);
    const coverageAnalysis = analyzeCoverageGaps(taxonomy, existingNames);
    const balancedSuggestions = getBalancedSuggestions(taxonomy, existingNames, 8);

    // Prepare context for AI recommendation
    const analysisContext = `
CURRENT SNIPPET: ${currentSnippet}

EXISTING SNIPPETS (${existingNames.length} total):
${existingNames.slice(0, 20).join(', ')}${existingNames.length > 20 ? '...' : ''}

COVERAGE ANALYSIS:
${Object.entries(coverageAnalysis.categoryGaps).map(([category, stats]) => 
  `${category}: ${stats.covered}/${stats.total} (${Math.round(stats.covered/stats.total*100)}%)`
).join('\n')}

BALANCED SUGGESTIONS FOR BETTER COVERAGE:
${balancedSuggestions.slice(0, 5).join(', ')}

MISSING TAXONOMY ITEMS (sample):
${missingItems.slice(0, 10).join(', ')}

TAXONOMY STRUCTURE (sample):
${Object.keys(taxonomy.categories).slice(0, 15).join(', ')}
`;

    const apiKey = process.env.OPENROUTER_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'OPENROUTER_API_KEY is not configured' },
        { status: 500 }
      );
    }

    const recommendationPrompt = `You are an expert prompt engineer helping to systematically build a comprehensive prompt snippet library. 

${analysisContext}

Based on the current snippet that was just created and the coverage analysis above, recommend the SINGLE BEST next snippet to create that would:

1. Provide maximum strategic value for library completeness
2. Balance coverage across different categories (avoid over-concentration in one area)
3. Be complementary to the recently created snippet
4. Fill important gaps in the taxonomy

Respond in this exact JSON format:
{
  "recommended": "exact_snippet_name_from_taxonomy",
  "reasoning": "2-3 sentence explanation of why this is the optimal next choice",
  "alternatives": ["alternative1", "alternative2", "alternative3"]
}

Guidelines:
- Choose from the missing taxonomy items provided
- Prioritize categories with lower coverage percentages
- Consider logical progression (e.g., if just did geo_asia_japan, might suggest geo_asia_china OR diversify to geo_europe_uk)
- Avoid recommending items that already exist
- Alternatives should be 3 other good options from different categories

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
        model: 'moonshotai/moonshot-v1-8k',
        messages: [
          {
            role: 'user',
            content: recommendationPrompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1000
      })
    });

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.status}`);
    }

    const data = await response.json();
    let recommendationContent = data.choices[0].message.content;

    try {
      // Clean up the response to extract JSON
      const jsonMatch = recommendationContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        recommendationContent = jsonMatch[0];
      }
      
      const recommendation: RecommendationResponse = JSON.parse(recommendationContent);
      
      // Validate the recommendation
      if (!recommendation.recommended || !recommendation.reasoning || !Array.isArray(recommendation.alternatives)) {
        throw new Error('Invalid recommendation structure');
      }

      // Ensure recommended item is actually missing
      if (existingNames.map(n => n.toLowerCase()).includes(recommendation.recommended.toLowerCase())) {
        // Fallback to balanced suggestions
        recommendation.recommended = balancedSuggestions[0] || missingItems[0] || 'core_structure_chapter';
        recommendation.reasoning = 'Fallback recommendation based on coverage analysis due to duplicate detection.';
      }

      return NextResponse.json({
        recommendation,
        context: {
          totalExisting: existingNames.length,
          totalMissing: missingItems.length,
          overallCoverage: Math.round(coverageAnalysis.overallCoverage * 100),
          balancedSuggestions: balancedSuggestions.slice(0, 5)
        }
      });

    } catch (parseError) {
      console.error('Failed to parse AI recommendation:', parseError);
      
      // Fallback recommendation
      const fallbackRecommendation: RecommendationResponse = {
        recommended: balancedSuggestions[0] || missingItems[0] || 'core_structure_chapter',
        reasoning: 'Intelligent fallback based on coverage gap analysis to ensure balanced library development.',
        alternatives: balancedSuggestions.slice(1, 4)
      };
      
      return NextResponse.json({
        recommendation: fallbackRecommendation,
        context: {
          totalExisting: existingNames.length,
          totalMissing: missingItems.length,
          overallCoverage: Math.round(coverageAnalysis.overallCoverage * 100),
          balancedSuggestions: balancedSuggestions.slice(0, 5)
        },
        note: 'Used fallback recommendation due to AI parsing issues'
      });
    }

  } catch (error) {
    console.error('Error getting recommendations:', error);
    return NextResponse.json(
      { error: 'Failed to get recommendations' },
      { status: 500 }
    );
  }
}