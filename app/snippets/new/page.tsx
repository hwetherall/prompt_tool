'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { GenerationProgress } from '@/components/GenerationProgress';
import { SnippetCard } from '@/components/SnippetCard';
import type { Snippet } from '@/lib/types';
import { parseHierarchy } from '@/lib/similarity';
import type { SimilarityScore } from '@/lib/similarity';

export default function NewSnippetPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [context, setContext] = useState('');
  const [description, setDescription] = useState('');
  const [generatedContent, setGeneratedContent] = useState('');
  const [similarSnippets, setSimilarSnippets] = useState<SimilarityScore[]>([]);
  const [selectedSnippets, setSelectedSnippets] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');
  const [llmResponses, setLlmResponses] = useState<Record<string, string>>({});

  // Fetch similar snippets when name changes
  useEffect(() => {
    if (name && name.includes('_')) {
      fetchSimilarSnippets();
    } else {
      setSimilarSnippets([]);
    }
  }, [name]);

  const fetchSimilarSnippets = async () => {
    try {
      const response = await fetch(`/api/similarity?name=${encodeURIComponent(name)}`);
      if (!response.ok) return;
      
      const data = await response.json();
      setSimilarSnippets(data.similarSnippets);
      
      // Auto-select top 3 similar snippets
      const topSnippets = data.similarSnippets.slice(0, 3);
      setSelectedSnippets(new Set(topSnippets.map((s: SimilarityScore) => s.snippet.name)));
    } catch (err) {
      console.error('Error fetching similar snippets:', err);
    }
  };

  const handleGenerate = async () => {
    if (!name || !context) {
      setError('Please provide both a name and context');
      return;
    }

    setGenerating(true);
    setError(null);
    setProgress(0);
    setCurrentStep('Initializing generation...');

    try {
      // Get selected snippet objects
      const selectedSnippetObjects = similarSnippets
        .filter(s => selectedSnippets.has(s.snippet.name))
        .map(s => s.snippet);

      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 1000);

      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          snippetName: name,
          context,
          similarSnippets: selectedSnippetObjects
        })
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Generation failed');
      }

      const data = await response.json();
      setGeneratedContent(data.finalContent);
      setLlmResponses(data.responses);
      setProgress(100);
      setCurrentStep('Generation complete!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed');
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!name || !generatedContent) {
      setError('Name and content are required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/snippets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          content: generatedContent,
          description: description || context
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save snippet');
      }

      router.push(`/snippets/${encodeURIComponent(name)}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save snippet');
    } finally {
      setLoading(false);
    }
  };

  const hierarchyPath = name ? parseHierarchy(name).join(' > ') : '';

  return (
    <div className="container py-12 max-w-6xl">
      <h1 className="mb-8">Create New Snippet</h1>

      <div className="grid lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <Card>
            <h2 className="mb-4">Snippet Details</h2>
            
            <div className="space-y-4">
              <Input
                label="Snippet Name"
                placeholder="e.g., geo_asia_japan"
                value={name}
                onChange={(e) => setName(e.target.value)}
                fullWidth
              />
              {hierarchyPath && (
                <p className="text-sm text-gray-600">
                  Hierarchy: <span className="font-mono">{hierarchyPath}</span>
                </p>
              )}

              <Textarea
                label="Context / Requirements"
                placeholder="Describe what this snippet should contain..."
                value={context}
                onChange={(e) => setContext(e.target.value)}
                rows={6}
                fullWidth
              />

              <Input
                label="Description (optional)"
                placeholder="Brief description for library display"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                fullWidth
              />
            </div>
          </Card>

          {similarSnippets.length > 0 && (
            <Card>
              <h2 className="mb-4">Similar Snippets</h2>
              <p className="text-sm text-gray-600 mb-4">
                Select snippets to use as reference during generation:
              </p>
              
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {similarSnippets.map(({ snippet, score }) => (
                  <div
                    key={snippet.id}
                    className="cursor-pointer"
                    onClick={() => {
                      const newSelected = new Set(selectedSnippets);
                      if (newSelected.has(snippet.name)) {
                        newSelected.delete(snippet.name);
                      } else {
                        newSelected.add(snippet.name);
                      }
                      setSelectedSnippets(newSelected);
                    }}
                  >
                    <Card
                      variant={selectedSnippets.has(snippet.name) ? 'selected' : 'hover'}
                      padding="sm"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium">{snippet.name}</h4>
                          <p className="text-sm text-gray-600 mt-1">
                            Similarity: {score}%
                          </p>
                        </div>
                        <div className="ml-3">
                          {selectedSnippets.has(snippet.name) && (
                            <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                      </div>
                    </Card>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          {!generating && !generatedContent && (
            <Card>
              <h2 className="mb-4">Generate Content</h2>
              <p className="text-gray-600 mb-6">
                Click generate to create content using multiple LLMs based on your context and similar snippets.
              </p>
              
              <Button
                onClick={handleGenerate}
                disabled={!name || !context || generating}
                fullWidth
                size="lg"
              >
                Generate with Multi-LLM
              </Button>
            </Card>
          )}

          {generating && (
            <Card>
              <h2 className="mb-4">Generating Content</h2>
              <GenerationProgress
                currentStep={currentStep}
                progress={progress}
                responses={llmResponses}
              />
            </Card>
          )}

          {generatedContent && (
            <Card>
              <h2 className="mb-4">Generated Content</h2>
              
              <Textarea
                value={generatedContent}
                onChange={(e) => setGeneratedContent(e.target.value)}
                rows={15}
                fullWidth
                className="font-mono text-sm"
              />
              
              <div className="mt-6 flex gap-3">
                <Button
                  onClick={handleSave}
                  disabled={loading}
                  isLoading={loading}
                >
                  Save Snippet
                </Button>
                <Button
                  variant="secondary"
                  onClick={handleGenerate}
                  disabled={generating}
                >
                  Regenerate
                </Button>
              </div>
            </Card>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-red-600">{error}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
