'use client';

import React, { useState, useEffect } from 'react';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { extractSnippetReferences, validateTemplate } from '@/lib/snippet-utils';
import type { Snippet } from '@/lib/types';

interface PromptComposerProps {
  initialTemplate?: string;
  onSave?: (template: string, rendered: string, usedSnippets: string[]) => void;
}

export const PromptComposer: React.FC<PromptComposerProps> = ({
  initialTemplate = '',
  onSave
}) => {
  const [template, setTemplate] = useState(initialTemplate);
  const [rendered, setRendered] = useState('');
  const [usedSnippets, setUsedSnippets] = useState<string[]>([]);
  const [snippetPreviews, setSnippetPreviews] = useState<Record<string, Snippet>>({});
  const [rendering, setRendering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  useEffect(() => {
    const validation = validateTemplate(template);
    setValidationErrors(validation.errors);
    
    if (validation.valid) {
      const refs = extractSnippetReferences(template);
      fetchSnippetPreviews(refs);
    }
  }, [template]);

  const fetchSnippetPreviews = async (names: string[]) => {
    const previews: Record<string, Snippet> = {};
    
    for (const name of names) {
      try {
        const response = await fetch(`/api/snippets/${encodeURIComponent(name)}`);
        if (response.ok) {
          const data = await response.json();
          previews[name] = data.snippet;
        }
      } catch (err) {
        console.error(`Failed to fetch snippet ${name}:`, err);
      }
    }
    
    setSnippetPreviews(previews);
  };

  const handleRender = async () => {
    if (validationErrors.length > 0) {
      setError('Please fix template syntax errors before rendering');
      return;
    }

    setRendering(true);
    setError(null);

    try {
      const response = await fetch('/api/render', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ template })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to render template');
      }

      const data = await response.json();
      setRendered(data.rendered);
      setUsedSnippets(data.usedSnippets);
      
      if (data.errors.length > 0) {
        setError(`Rendering completed with warnings: ${data.errors.join(', ')}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to render template');
    } finally {
      setRendering(false);
    }
  };

  const handleSave = () => {
    if (!rendered) {
      setError('Please render the template before saving');
      return;
    }
    
    onSave?.(template, rendered, usedSnippets);
  };

  const snippetRefs = extractSnippetReferences(template);

  return (
    <div className="space-y-6">
      <Card>
        <h2 className="mb-4">Template Editor</h2>
        
        <Textarea
          label="Prompt Template"
          placeholder="Enter your prompt template. Use {{snippet_name}} to reference snippets..."
          value={template}
          onChange={(e) => setTemplate(e.target.value)}
          rows={10}
          fullWidth
          className="font-mono text-sm"
        />

        {validationErrors.length > 0 && (
          <div className="mt-2 text-sm text-red-600">
            {validationErrors.map((err, i) => (
              <p key={i}>• {err}</p>
            ))}
          </div>
        )}

        {snippetRefs.length > 0 && (
          <div className="mt-4">
            <p className="text-sm font-medium mb-2">Referenced Snippets:</p>
            <div className="flex flex-wrap gap-2">
              {snippetRefs.map(ref => {
                const preview = snippetPreviews[ref];
                return (
                  <div
                    key={ref}
                    className={`px-3 py-1 rounded-full text-sm ${
                      preview
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {ref} {preview ? '✓' : '✗'}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="mt-6">
          <Button
            onClick={handleRender}
            disabled={rendering || validationErrors.length > 0}
            isLoading={rendering}
          >
            Render Template
          </Button>
        </div>
      </Card>

      {rendered && (
        <Card>
          <h2 className="mb-4">Rendered Output</h2>
          
          <div className="bg-gray-50 p-4 rounded-md">
            <pre className="whitespace-pre-wrap font-mono text-sm">{rendered}</pre>
          </div>

          {usedSnippets.length > 0 && (
            <div className="mt-4">
              <p className="text-sm font-medium mb-2">Used Snippets:</p>
              <div className="flex flex-wrap gap-2">
                {usedSnippets.map(name => (
                  <span
                    key={name}
                    className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                  >
                    {name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {onSave && (
            <div className="mt-6">
              <Button onClick={handleSave}>
                Save Composed Prompt
              </Button>
            </div>
          )}
        </Card>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-600">{error}</p>
        </div>
      )}
    </div>
  );
};
