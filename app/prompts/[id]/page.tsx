'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import type { ComposedPrompt } from '@/lib/types';

export default function PromptDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [prompt, setPrompt] = useState<ComposedPrompt | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (id) {
      fetchPrompt();
    }
  }, [id]);

  const fetchPrompt = async () => {
    try {
      const response = await fetch(`/api/prompts/${id}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Prompt not found');
        }
        throw new Error('Failed to fetch prompt');
      }
      
      const data = await response.json();
      setPrompt(data.prompt);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    setError(null);

    try {
      const response = await fetch(`/api/prompts/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to delete prompt');
      }

      router.push('/prompts');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete prompt');
      setShowDeleteConfirm(false);
    } finally {
      setDeleting(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // You could add a toast notification here
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  if (loading) {
    return (
      <div className="container py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !prompt) {
    return (
      <div className="container py-12">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Prompt Not Found</h1>
          <p className="text-gray-600 mb-6">{error || 'The requested prompt could not be found.'}</p>
          <Link href="/prompts">
            <Button>Back to Prompts</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-12 max-w-6xl">
      <div className="mb-6 flex items-center justify-between">
        <Link href="/prompts">
          <Button variant="ghost" size="sm">
            ← Back to Prompts
          </Button>
        </Link>
        <Button
          variant="danger"
          size="sm"
          onClick={() => setShowDeleteConfirm(true)}
        >
          Delete Prompt
        </Button>
      </div>

      <div className="space-y-6">
        <Card>
          <h1 className="text-2xl font-bold mb-2">{prompt.name}</h1>
          <p className="text-sm text-gray-500">
            Created: {new Date(prompt.created_at).toLocaleDateString()} | 
            Updated: {new Date(prompt.updated_at).toLocaleDateString()}
          </p>
        </Card>

        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold">Template</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => copyToClipboard(prompt.template)}
            >
              Copy Template
            </Button>
          </div>
          <div className="bg-gray-50 p-4 rounded-md">
            <pre className="whitespace-pre-wrap font-mono text-sm">{prompt.template}</pre>
          </div>
        </Card>

        {prompt.rendered_content && (
          <Card>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold">Rendered Output</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(prompt.rendered_content!)}
              >
                Copy Output
              </Button>
            </div>
            <div className="bg-gray-50 p-4 rounded-md">
              <pre className="whitespace-pre-wrap font-mono text-sm">{prompt.rendered_content}</pre>
            </div>
          </Card>
        )}

        {prompt.used_snippets.length > 0 && (
          <Card>
            <h2 className="text-xl font-semibold mb-4">Used Snippets</h2>
            <div className="grid md:grid-cols-2 gap-3">
              {prompt.used_snippets.map(snippetName => (
                <Link
                  key={snippetName}
                  href={`/snippets/${encodeURIComponent(snippetName)}`}
                >
                  <div className="p-3 border rounded-md hover:border-primary transition-colors cursor-pointer">
                    <span className="font-mono text-sm">{snippetName}</span>
                  </div>
                </Link>
              ))}
            </div>
          </Card>
        )}
      </div>

      {showDeleteConfirm && (
        <Card className="mt-6 border-red-200 bg-red-50">
          <h3 className="font-semibold text-red-900 mb-2">Confirm Deletion</h3>
          <p className="text-red-700 mb-4">
            Are you sure you want to delete "{prompt.name}"? This action cannot be undone.
          </p>
          <div className="flex gap-3">
            <Button
              variant="danger"
              onClick={handleDelete}
              disabled={deleting}
              isLoading={deleting}
            >
              Yes, Delete
            </Button>
            <Button
              variant="secondary"
              onClick={() => setShowDeleteConfirm(false)}
              disabled={deleting}
            >
              Cancel
            </Button>
          </div>
        </Card>
      )}

      {error && (
        <div className="mt-6 bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-600">{error}</p>
        </div>
      )}
    </div>
  );
}
