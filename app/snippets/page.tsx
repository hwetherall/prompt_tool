'use client';

import React, { useEffect, useState } from 'react';
import { SearchBar } from '@/components/SearchBar';
import { SnippetCard } from '@/components/SnippetCard';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { groupByTopLevel } from '@/lib/similarity';
import type { Snippet } from '@/lib/types';
import { useClient } from '@/lib/client-context';

export default function SnippetsPage() {
  const { currentClient, isGeneralMode } = useClient();
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [filteredSnippets, setFilteredSnippets] = useState<Snippet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchSnippets();
  }, [currentClient]);

  useEffect(() => {
    if (searchQuery) {
      const filtered = snippets.filter(snippet =>
        snippet.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        snippet.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        snippet.content.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredSnippets(filtered);
    } else {
      setFilteredSnippets(snippets);
    }
  }, [searchQuery, snippets]);

  const fetchSnippets = async () => {
    try {
      const response = await fetch('/api/snippets');
      if (!response.ok) throw new Error('Failed to fetch snippets');
      
      const data = await response.json();
      
      // Filter snippets based on client context
      let relevantSnippets = data.snippets;
      if (!isGeneralMode && currentClient) {
        // Show client-specific snippets and general snippets
        relevantSnippets = data.snippets.filter((s: Snippet) => 
          s.client_id === currentClient.id || s.is_general === true
        );
      } else {
        // Show only general snippets
        relevantSnippets = data.snippets.filter((s: Snippet) => s.is_general === true);
      }
      
      setSnippets(relevantSnippets);
      setFilteredSnippets(relevantSnippets);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const groupedSnippets = groupByTopLevel(filteredSnippets);

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
        <h1 className="mb-4">Snippet Library</h1>
        <p className="text-gray-600 mb-6">
          Browse and search through all available prompt snippets
        </p>
        
        <SearchBar
          placeholder="Search snippets by name, description, or content..."
          value={searchQuery}
          onChange={setSearchQuery}
        />
      </div>

      {filteredSnippets.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">
            {searchQuery ? 'No snippets found matching your search.' : 'No snippets created yet.'}
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedSnippets).map(([category, categorySnippets]) => (
            <div key={category}>
              <h2 className="mb-4 text-xl font-semibold capitalize">
                {category}
              </h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categorySnippets.map(snippet => (
                  <SnippetCard key={snippet.id} snippet={snippet} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
