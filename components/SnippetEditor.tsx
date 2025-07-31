'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { getHierarchyDisplay } from '@/lib/similarity';
import type { Snippet } from '@/lib/types';

interface SnippetEditorProps {
  snippet: Snippet;
  onUpdate?: (updatedSnippet: Snippet) => void;
  onDelete?: () => void;
}

export const SnippetEditor: React.FC<SnippetEditorProps> = ({
  snippet,
  onUpdate,
  onDelete
}) => {
  const router = useRouter();
  const [content, setContent] = useState(snippet.content);
  const [description, setDescription] = useState(snippet.description || '');
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const hierarchyPath = getHierarchyDisplay(snippet.name);
  const hasChanges = content !== snippet.content || description !== (snippet.description || '');

  const handleSave = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/snippets/${encodeURIComponent(snippet.name)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, description })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update snippet');
      }

      const data = await response.json();
      onUpdate?.(data.snippet);
      
      // Reset to new values
      setContent(data.snippet.content);
      setDescription(data.snippet.description || '');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update snippet');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    setError(null);

    try {
      const response = await fetch(`/api/snippets/${encodeURIComponent(snippet.name)}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to delete snippet');
      }

      onDelete?.();
      router.push('/snippets');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete snippet');
      setShowDeleteConfirm(false);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <div className="mb-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold">{snippet.name}</h2>
              <p className="hierarchy-path mt-1">{hierarchyPath}</p>
              <p className="text-sm text-gray-500 mt-2">
                Created: {new Date(snippet.created_at).toLocaleDateString()} | 
                Updated: {new Date(snippet.updated_at).toLocaleDateString()}
              </p>
            </div>
            {snippet.client_name && (
              <div className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full">
                <span className="font-medium">Client:</span> {snippet.client_name}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <Textarea
            label="Content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={25}
            fullWidth
            className="font-mono text-sm"
          />

          <Input
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief description for library display"
            fullWidth
          />
        </div>

        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        <div className="mt-6 flex justify-between">
          <Button
            variant="danger"
            onClick={() => setShowDeleteConfirm(true)}
            disabled={deleting}
          >
            Delete Snippet
          </Button>
          
          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={() => {
                setContent(snippet.content);
                setDescription(snippet.description || '');
              }}
              disabled={!hasChanges || loading}
            >
              Reset Changes
            </Button>
            <Button
              onClick={handleSave}
              disabled={!hasChanges || loading}
              isLoading={loading}
            >
              Save Changes
            </Button>
          </div>
        </div>
      </Card>

      {showDeleteConfirm && (
        <Card className="border-red-200 bg-red-50">
          <h3 className="font-semibold text-red-900 mb-2">Confirm Deletion</h3>
          <p className="text-red-700 mb-4">
            Are you sure you want to delete "{snippet.name}"? This action cannot be undone.
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
    </div>
  );
};
