'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { GenerationProgress } from '@/components/GenerationProgress';
import { SnippetCard } from '@/components/SnippetCard';
import { NextStepSelector } from '@/components/NextStepSelector';
import { FileUpload } from '@/components/FileUpload';
import type { Snippet } from '@/lib/types';
import { parseHierarchy } from '@/lib/similarity';
import type { SimilarityScore } from '@/lib/similarity';
import { useClient } from '@/lib/client-context';

export default function NewSnippetPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { currentClient, isGeneralMode } = useClient();
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
  const [feedback, setFeedback] = useState<{likes: string[], improvements: string[]} | null>(null);
  const [loadingFeedback, setLoadingFeedback] = useState(false);
  const [showNextSteps, setShowNextSteps] = useState(false);
  const [savedSnippetName, setSavedSnippetName] = useState('');
  const [rubricFile, setRubricFile] = useState<File | null>(null);

  // Handle URL prefill parameters
  useEffect(() => {
    const prefillName = searchParams.get('prefill');
    const isAiRecommended = searchParams.get('ai_recommended') === 'true';
    
    if (prefillName) {
      setName(prefillName);
      
      // Generate context suggestion based on snippet name
      const contextSuggestion = generateContextSuggestion(prefillName, isAiRecommended);
      setContext(contextSuggestion);
    }
  }, [searchParams]);

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
      const params = new URLSearchParams({
        name: name,
        ...(currentClient && { client_id: currentClient.id })
      });
      const response = await fetch(`/api/similarity?${params.toString()}`);
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

  const generateContextSuggestion = (snippetName: string, isAiRecommended: boolean): string => {
    const parts = snippetName.split('_');
    
    if (isAiRecommended) {
      return `AI recommended this snippet to balance your library coverage. Create a comprehensive prompt snippet for ${snippetName} that complements your existing snippets and fills an important gap in your taxonomy.`;
    }
    
    // Generate context based on naming pattern
    if (parts[0] === 'geo') {
      const region = parts[1] || 'region';
      const country = parts[2] || 'location';
      return `Create a geographic context snippet for ${country} in the ${region} region. Include cultural considerations, market dynamics, business practices, and key characteristics relevant for this location.`;
    } else if (parts[0] === 'industry') {
      const sector = parts[1] || 'sector';
      const subsector = parts[2] || 'area';
      return `Create an industry-specific snippet for ${subsector} within the ${sector} sector. Include market trends, key players, regulatory considerations, and business model characteristics.`;
    } else if (parts[0] === 'stage') {
      const phase = parts[1] || 'phase';
      const specific = parts[2] || 'stage';
      return `Create a funding stage snippet for ${specific} in the ${phase} phase. Include typical valuation ranges, investor types, due diligence focus areas, and milestone expectations.`;
    } else if (parts[0] === 'core') {
      const type = parts[1] || 'element';
      const aspect = parts[2] || 'component';
      return `Create a core structural snippet for ${aspect} ${type}. This should be a foundational element that can be reused across different prompt compositions.`;
    } else {
      return `Create a prompt snippet for ${snippetName}. Define the context, requirements, and structure for this specific use case.`;
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

      // Create FormData for file upload
      const formData = new FormData();
      formData.append('snippetName', name);
      formData.append('context', context);
      formData.append('similarSnippets', JSON.stringify(selectedSnippetObjects));
      
      if (currentClient) {
        formData.append('clientId', currentClient.id);
      }
      
      if (rubricFile) {
        formData.append('rubric', rubricFile);
      }

      const response = await fetch('/api/generate', {
        method: 'POST',
        body: formData
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
          description: description || context,
          client_id: currentClient?.id || null,
          is_general: isGeneralMode
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save snippet');
      }

      // Show next steps instead of redirecting
      setSavedSnippetName(name);
      setShowNextSteps(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save snippet');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseNextSteps = () => {
    setShowNextSteps(false);
    // Reset form for new snippet
    setName('');
    setContext('');
    setDescription('');
    setGeneratedContent('');
    setFeedback(null);
    setSimilarSnippets([]);
    setSelectedSnippets(new Set());
    setRubricFile(null);
  };

  const handleGetFeedback = async () => {
    if (!generatedContent) {
      setError('No content to analyze');
      return;
    }

    setLoadingFeedback(true);
    setError(null);

    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          promptContent: generatedContent
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to get feedback');
      }

      const data = await response.json();
      setFeedback(data.feedback);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get feedback');
    } finally {
      setLoadingFeedback(false);
    }
  };

  const hierarchyPath = name ? parseHierarchy(name).join(' > ') : '';

  return (
    <div className="container py-12 max-w-6xl">
      <div className="mb-8">
        <h1 className="mb-2">Create New Snippet</h1>
        {!isGeneralMode && currentClient && (
          <div className="bg-purple-50 border border-purple-200 rounded-lg px-4 py-2 inline-flex items-center gap-2">
            <span className="text-purple-700 font-medium">Client:</span>
            <span className="text-purple-900">{currentClient.name}</span>
            {currentClient.focus_areas && currentClient.focus_areas.length > 0 && (
              <span className="text-purple-600 text-sm">
                ({currentClient.focus_areas.slice(0, 2).join(', ')}
                {currentClient.focus_areas.length > 2 && `, +${currentClient.focus_areas.length - 2} more`})
              </span>
            )}
          </div>
        )}
      </div>

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

              <FileUpload
                label="Upload Rubric (optional)"
                helpText="Upload a Word document (.doc, .docx) containing evaluation criteria or guidelines"
                selectedFile={rubricFile}
                onFileSelect={setRubricFile}
                onFileRemove={() => setRubricFile(null)}
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
                rows={25}
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
                <Button
                  variant="secondary"
                  onClick={handleGetFeedback}
                  disabled={loadingFeedback}
                  isLoading={loadingFeedback}
                >
                  Get Gemini Feedback
                </Button>
              </div>
            </Card>
          )}

          {feedback && (
            <Card>
              <h2 className="mb-4">🤖 Gemini 2.5 Pro Feedback</h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-3 text-green-700">👍 What Gemini Likes</h3>
                  <div className="space-y-2">
                    {feedback.likes.map((like, index) => (
                      <div key={index} className="bg-green-50 border border-green-200 rounded-md p-3">
                        <p className="text-green-800">{like}</p>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold mb-3 text-blue-700">💡 Suggested Improvements</h3>
                  <div className="space-y-2">
                    {feedback.improvements.map((improvement, index) => (
                      <div key={index} className="bg-blue-50 border border-blue-200 rounded-md p-3">
                        <p className="text-blue-800">{improvement}</p>
                      </div>
                    ))}
                  </div>
                </div>
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

      {/* Next Step Selector Modal */}
      {showNextSteps && (
        <NextStepSelector
          currentSnippet={savedSnippetName}
          onClose={handleCloseNextSteps}
        />
      )}
    </div>
  );
}
