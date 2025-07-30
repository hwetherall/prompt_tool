'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { PromptComposer } from '@/components/PromptComposer';

export default function NewPromptPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async (template: string, rendered: string, usedSnippets: string[]) => {
    if (!name) {
      setError('Please provide a name for the prompt');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const response = await fetch('/api/prompts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          template,
          rendered_content: rendered,
          used_snippets: usedSnippets
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save prompt');
      }

      const data = await response.json();
      router.push(`/prompts/${data.prompt.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save prompt');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container py-12 max-w-6xl">
      <h1 className="mb-8">Create New Prompt</h1>

      <div className="space-y-6">
        <Card>
          <h2 className="mb-4">Prompt Details</h2>
          
          <Input
            label="Prompt Name"
            placeholder="Enter a descriptive name for this prompt"
            value={name}
            onChange={(e) => setName(e.target.value)}
            fullWidth
          />
        </Card>

        <PromptComposer onSave={handleSave} />

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-red-600">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
}
