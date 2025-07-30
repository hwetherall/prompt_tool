import type { Snippet } from './types';

export interface SimilarityScore {
  snippet: Snippet;
  score: number;
  sharedPath: string[];
}

/**
 * Parse a snippet name into its hierarchical components
 * e.g., "geo_asia_japan" -> ["geo", "asia", "japan"]
 */
export function parseHierarchy(name: string): string[] {
  return name.split('_').filter(part => part.length > 0);
}

/**
 * Calculate similarity score between two snippet names based on hierarchy
 * Higher score means more similar
 */
export function calculateSimilarity(name1: string, name2: string): { score: number; sharedPath: string[] } {
  const parts1 = parseHierarchy(name1);
  const parts2 = parseHierarchy(name2);
  
  let sharedDepth = 0;
  const sharedPath: string[] = [];
  
  // Find how many levels they share from the beginning
  for (let i = 0; i < Math.min(parts1.length, parts2.length); i++) {
    if (parts1[i] === parts2[i]) {
      sharedDepth++;
      sharedPath.push(parts1[i]);
    } else {
      break;
    }
  }
  
  // Calculate score based on:
  // 1. Shared depth (most important)
  // 2. Total depth similarity
  // 3. Penalty for being the same snippet
  
  if (name1 === name2) {
    return { score: 0, sharedPath }; // Exclude identical snippets
  }
  
  const maxDepth = Math.max(parts1.length, parts2.length);
  const depthDifference = Math.abs(parts1.length - parts2.length);
  
  // Base score from shared depth (0-100)
  let score = (sharedDepth / maxDepth) * 100;
  
  // Bonus for similar depths (0-20)
  score += (1 - depthDifference / maxDepth) * 20;
  
  // Extra bonus for immediate siblings (same parent, different last part)
  if (sharedDepth === parts1.length - 1 && sharedDepth === parts2.length - 1) {
    score += 30;
  }
  
  return { score: Math.round(score), sharedPath };
}

/**
 * Find similar snippets based on hierarchical naming
 */
export function findSimilarSnippets(
  targetName: string,
  allSnippets: Snippet[],
  limit: number = 5
): SimilarityScore[] {
  const similarities = allSnippets
    .map(snippet => ({
      snippet,
      ...calculateSimilarity(targetName, snippet.name)
    }))
    .filter(item => item.score > 0) // Exclude identical and unrelated snippets
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
  
  return similarities;
}

/**
 * Get the hierarchical path display
 * e.g., "geo_asia_japan" -> "geo > asia > japan"
 */
export function getHierarchyDisplay(name: string): string {
  return parseHierarchy(name).join(' > ');
}

/**
 * Get parent path from a snippet name
 * e.g., "geo_asia_japan" -> "geo_asia"
 */
export function getParentPath(name: string): string | null {
  const parts = parseHierarchy(name);
  if (parts.length <= 1) return null;
  return parts.slice(0, -1).join('_');
}

/**
 * Get all ancestor paths
 * e.g., "geo_asia_japan" -> ["geo", "geo_asia"]
 */
export function getAncestorPaths(name: string): string[] {
  const parts = parseHierarchy(name);
  const ancestors: string[] = [];
  
  for (let i = 1; i < parts.length; i++) {
    ancestors.push(parts.slice(0, i).join('_'));
  }
  
  return ancestors;
}

/**
 * Check if one snippet is an ancestor of another
 */
export function isAncestor(ancestorName: string, descendantName: string): boolean {
  const ancestorParts = parseHierarchy(ancestorName);
  const descendantParts = parseHierarchy(descendantName);
  
  if (ancestorParts.length >= descendantParts.length) {
    return false;
  }
  
  for (let i = 0; i < ancestorParts.length; i++) {
    if (ancestorParts[i] !== descendantParts[i]) {
      return false;
    }
  }
  
  return true;
}

/**
 * Group snippets by their top-level category
 */
export function groupByTopLevel(snippets: Snippet[]): Record<string, Snippet[]> {
  const groups: Record<string, Snippet[]> = {};
  
  snippets.forEach(snippet => {
    const parts = parseHierarchy(snippet.name);
    const topLevel = parts[0] || 'uncategorized';
    
    if (!groups[topLevel]) {
      groups[topLevel] = [];
    }
    
    groups[topLevel].push(snippet);
  });
  
  return groups;
}
