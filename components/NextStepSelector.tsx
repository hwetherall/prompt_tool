'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

interface RecommendationData {
  recommended: string;
  reasoning: string;
  alternatives: string[];
}

interface NextStepSelectorProps {
  currentSnippet: string;
  onClose: () => void;
}

export const NextStepSelector: React.FC<NextStepSelectorProps> = ({
  currentSnippet,
  onClose
}) => {
  const router = useRouter();
  const [recommendation, setRecommendation] = useState<RecommendationData | null>(null);
  const [missingItems, setMissingItems] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRecommendation();
  }, [currentSnippet]);

  const fetchRecommendation = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentSnippet })
      });

      if (!response.ok) {
        throw new Error('Failed to get recommendations');
      }

      const data = await response.json();
      setRecommendation(data.recommendation);
      setMissingItems(data.context.balancedSuggestions || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load recommendations');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFromScratch = () => {
    router.push('/snippets/new');
  };

  const handleFillTaxonomyGap = (snippetName?: string) => {
    const targetSnippet = snippetName || missingItems[0];
    if (targetSnippet) {
      router.push(`/snippets/new?prefill=${encodeURIComponent(targetSnippet)}`);
    } else {
      router.push('/snippets/new');
    }
  };

  const handleUseRecommendation = () => {
    if (recommendation?.recommended) {
      router.push(`/snippets/new?prefill=${encodeURIComponent(recommendation.recommended)}&ai_recommended=true`);
    }
  };

  const handleViewSnippet = () => {
    router.push(`/snippets/${encodeURIComponent(currentSnippet)}`);
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <Card className="w-full max-w-lg mx-4">
          <div className="flex items-center justify-center py-8">
            <LoadingSpinner />
            <span className="ml-3">Getting AI recommendations...</span>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
        <Card>
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-4">🎉 Snippet Created Successfully!</h2>
            <p className="text-gray-600 mb-6">
              <strong>{currentSnippet}</strong> has been saved. What would you like to do next?
            </p>

            <div className="grid md:grid-cols-3 gap-6">
              {/* Option 1: Create from Scratch */}
              <Card className="border-2 border-transparent hover:border-blue-200 transition-colors">
                <div className="p-4 text-center">
                  <div className="text-3xl mb-3">✨</div>
                  <h3 className="font-semibold mb-2">Create from Scratch</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Start fresh with a completely new snippet idea
                  </p>
                  <Button 
                    onClick={handleCreateFromScratch}
                    variant="secondary"
                    fullWidth
                  >
                    New Snippet
                  </Button>
                </div>
              </Card>

              {/* Option 2: Fill Taxonomy Gap */}
              <Card className="border-2 border-transparent hover:border-green-200 transition-colors">
                <div className="p-4 text-center">
                  <div className="text-3xl mb-3">📋</div>
                  <h3 className="font-semibold mb-2">Fill Taxonomy Gap</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Work on missing items from your master taxonomy
                  </p>
                  
                  {missingItems.length > 0 ? (
                    <div className="space-y-2">
                      <Button 
                        onClick={() => handleFillTaxonomyGap()}
                        variant="secondary"
                        fullWidth
                        size="sm"
                      >
                        {missingItems[0]}
                      </Button>
                      {missingItems.slice(1, 3).map((item, index) => (
                        <Button
                          key={index}
                          onClick={() => handleFillTaxonomyGap(item)}
                          variant="secondary"
                          fullWidth
                          size="sm"
                          className="text-xs"
                        >
                          {item}
                        </Button>
                      ))}
                    </div>
                  ) : (
                    <Button 
                      onClick={() => handleFillTaxonomyGap()}
                      variant="secondary"
                      fullWidth
                    >
                      Browse Gaps
                    </Button>
                  )}
                </div>
              </Card>

              {/* Option 3: AI Recommendation */}
              <Card className="border-2 border-transparent hover:border-purple-200 transition-colors">
                <div className="p-4 text-center">
                  <div className="text-3xl mb-3">🤖</div>
                  <h3 className="font-semibold mb-2">AI Recommended</h3>
                  
                  {recommendation ? (
                    <div className="space-y-3">
                      <div className="bg-purple-50 rounded-lg p-3">
                        <div className="font-medium text-purple-800 text-sm mb-1">
                          {recommendation.recommended}
                        </div>
                        <p className="text-xs text-purple-600">
                          {recommendation.reasoning}
                        </p>
                      </div>
                      
                      <Button 
                        onClick={handleUseRecommendation}
                        fullWidth
                        variant="primary"
                      >
                        Use This Recommendation
                      </Button>
                      
                      {recommendation.alternatives.length > 0 && (
                        <details className="text-left">
                          <summary className="text-xs cursor-pointer text-gray-500 hover:text-gray-700">
                            View alternatives ({recommendation.alternatives.length})
                          </summary>
                          <div className="mt-2 space-y-1">
                            {recommendation.alternatives.slice(0, 3).map((alt, index) => (
                              <Button
                                key={index}
                                onClick={() => handleFillTaxonomyGap(alt)}
                                variant="secondary"
                                size="sm"
                                fullWidth
                                className="text-xs"
                              >
                                {alt}
                              </Button>
                            ))}
                          </div>
                        </details>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-sm text-gray-500">
                        {error || 'Unable to get AI recommendation'}
                      </p>
                      <Button 
                        onClick={fetchRecommendation}
                        variant="secondary"
                        fullWidth
                        size="sm"
                      >
                        Retry
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            </div>

            {/* Bottom Actions */}
            <div className="mt-8 pt-6 border-t flex justify-between">
              <Button
                onClick={handleViewSnippet}
                variant="secondary"
              >
                View Created Snippet
              </Button>
              
              <Button
                onClick={onClose}
                variant="secondary"
              >
                Close
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};