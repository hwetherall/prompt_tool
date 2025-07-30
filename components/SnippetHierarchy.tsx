'use client';

import React from 'react';
import Link from 'next/link';
import { parseHierarchy } from '@/lib/similarity';
import type { Snippet } from '@/lib/types';

interface SnippetHierarchyProps {
  snippets: Snippet[];
  currentSnippet?: string;
}

interface HierarchyNode {
  name: string;
  children: Map<string, HierarchyNode>;
  snippet?: Snippet;
}

export const SnippetHierarchy: React.FC<SnippetHierarchyProps> = ({
  snippets,
  currentSnippet
}) => {
  // Build hierarchy tree
  const root: HierarchyNode = {
    name: 'root',
    children: new Map()
  };

  snippets.forEach(snippet => {
    const parts = parseHierarchy(snippet.name);
    let current = root;

    parts.forEach((part, index) => {
      if (!current.children.has(part)) {
        current.children.set(part, {
          name: part,
          children: new Map()
        });
      }
      
      current = current.children.get(part)!;
      
      // If this is the last part, attach the snippet
      if (index === parts.length - 1) {
        current.snippet = snippet;
      }
    });
  });

  const renderNode = (node: HierarchyNode, path: string[] = [], level: number = 0) => {
    const fullPath = [...path, node.name].filter(p => p !== 'root').join('_');
    const isCurrentSnippet = fullPath === currentSnippet;
    const hasChildren = node.children.size > 0;

    if (node.name === 'root') {
      return (
        <div className="space-y-1">
          {Array.from(node.children.values()).map(child =>
            renderNode(child, path, level)
          )}
        </div>
      );
    }

    return (
      <div key={fullPath} className="select-none">
        <div
          className={`
            flex items-center py-1.5 px-2 rounded-md transition-colors
            hover:bg-gray-100 cursor-pointer
            ${isCurrentSnippet ? 'bg-blue-50 text-blue-700' : ''}
          `}
          style={{ paddingLeft: `${level * 24 + 8}px` }}
        >
          <div className="flex items-center gap-2 flex-1">
            {hasChildren ? (
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            ) : (
              <div className="w-4" />
            )}
            
            {node.snippet ? (
              <Link
                href={`/snippets/${encodeURIComponent(node.snippet.name)}`}
                className="flex-1 hover:text-primary"
              >
                <span className="font-mono text-sm">{node.name}</span>
                {node.snippet.description && (
                  <span className="ml-2 text-xs text-gray-500">
                    {node.snippet.description.substring(0, 50)}...
                  </span>
                )}
              </Link>
            ) : (
              <span className="font-mono text-sm text-gray-600">{node.name}</span>
            )}
          </div>
        </div>

        {hasChildren && (
          <div className="ml-2">
            {Array.from(node.children.values()).map(child =>
              renderNode(child, [...path, node.name], level + 1)
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg border p-4">
      <h3 className="font-semibold mb-3">Snippet Hierarchy</h3>
      {snippets.length === 0 ? (
        <p className="text-gray-500 text-sm">No snippets available</p>
      ) : (
        renderNode(root)
      )}
    </div>
  );
};
