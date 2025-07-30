'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import type { ComposedPrompt } from '@/lib/types';

export default function PromptsPage() {
  const [prompts, setPrompts] = useState<ComposedPrompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPrompts();
  }, []);

  const fetchPrompts = async () => {
    try {
      const response = await fetch('/api/prompts');
      if (!response.ok) throw new Error('Failed to fetch prompts');
      
      const data = await response.json();
      setPrompts(data.prompts);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-12">
        <div className="text-center">
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-12">
      <div className="mb-8">
        <h1 className="mb-4">Composed Prompts</h1>
        <p className="text-gray-600">
          View and manage your composed prompts that use multiple snippets
        </p>
      </div>

      {prompts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-6">No prompts created yet.</p>
          <Link href="/prompts/new">
            <Button>Create Your First Prompt</Button>
          </Link>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {prompts.map(prompt => (
            <Link key={prompt.id} href={`/prompts/${prompt.id}`}>
              <Card variant="hover" className="h-full">
                <h3 className="font-semibold text-lg mb-2">{prompt.name}</h3>
                
                <div className="mb-3">
                  <p className="text-sm text-gray-600 mb-1">Template Preview:</p>
                  <p className="text-sm font-mono bg-gray-50 p-2 rounded">
                    {prompt.template.length > 100
                      ? prompt.template.substring(0, 100) + '...'
                      : prompt.template}
                  </p>
                </div>

                {prompt.used_snippets.length > 0 && (
                  <div className="mb-3">
                    <p className="text-sm text-gray-600 mb-1">Used Snippets:</p>
                    <div className="flex flex-wrap gap-1">
                      {prompt.used_snippets.slice(0, 3).map(snippet => (
                        <span
                          key={snippet}
                          className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs"
                        >
                          {snippet}
                        </span>
                      ))}
                      {prompt.used_snippets.length > 3 && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                          +{prompt.used_snippets.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                )}

                <p className="text-xs text-gray-500">
                  Created: {new Date(prompt.created_at).toLocaleDateString()}
                </p>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
