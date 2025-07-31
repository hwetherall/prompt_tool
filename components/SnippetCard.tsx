'use client';

import React from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { getHierarchyDisplay } from '@/lib/similarity';
import type { Snippet } from '@/lib/types';

interface SnippetCardProps {
  snippet: Snippet;
  onClick?: () => void;
}

export const SnippetCard: React.FC<SnippetCardProps> = ({ snippet, onClick }) => {
  const hierarchyPath = getHierarchyDisplay(snippet.name);
  const truncatedContent = snippet.content.length > 150
    ? snippet.content.substring(0, 150) + '...'
    : snippet.content;

  const CardContent = (
    <>
      <div className="mb-2">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-lg">{snippet.name}</h3>
            <p className="hierarchy-path">{hierarchyPath}</p>
          </div>
          {snippet.client_name && (
            <span className="ml-2 px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
              {snippet.client_name}
            </span>
          )}
        </div>
      </div>
      
      {snippet.description && (
        <p className="text-sm text-gray-600 mb-2">{snippet.description}</p>
      )}
      
      <p className="text-sm text-gray-700 font-mono bg-gray-50 p-2 rounded">
        {truncatedContent}
      </p>
      
      <div className="mt-3 text-xs text-gray-500">
        Created: {new Date(snippet.created_at).toLocaleDateString()}
      </div>
    </>
  );

  if (onClick) {
    return (
      <Card
        variant="hover"
        onClick={onClick}
        className="h-full"
      >
        {CardContent}
      </Card>
    );
  }

  return (
    <Link href={`/snippets/${encodeURIComponent(snippet.name)}`}>
      <Card variant="hover" className="h-full">
        {CardContent}
      </Card>
    </Link>
  );
};
