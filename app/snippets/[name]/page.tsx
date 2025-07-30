'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { SnippetEditor } from '@/components/SnippetEditor';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import type { Snippet } from '@/lib/types';

export default function SnippetDetailPage() {
  const params = useParams();
  const name = params.name as string;
  const [snippet, setSnippet] = useState<Snippet | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (name) {
      fetchSnippet();
    }
  }, [name]);

  const fetchSnippet = async () => {
    try {
      const response = await fetch(`/api/snippets/${encodeURIComponent(name)}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Snippet not found');
        }
        throw new Error('Failed to fetch snippet');
      }
      
      const data = await response.json();
      setSnippet(data.snippet);
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

  if (error || !snippet) {
    return (
      <div className="container py-12">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Snippet Not Found</h1>
          <p className="text-gray-600 mb-6">{error || 'The requested snippet could not be found.'}</p>
          <Link href="/snippets">
            <Button>Back to Snippets</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-12 max-w-5xl">
      <div className="mb-6 flex items-center gap-4">
        <Link href="/snippets">
          <Button variant="ghost" size="sm">
            ← Back to Library
          </Button>
        </Link>
      </div>
      
      <SnippetEditor
        snippet={snippet}
        onUpdate={(updatedSnippet) => setSnippet(updatedSnippet)}
      />
    </div>
  );
}
