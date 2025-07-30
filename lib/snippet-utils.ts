import { getSnippet } from './supabase';
import type { Snippet } from './types';

/**
 * Extract all snippet references from a template
 * e.g., "Hello {{world}} and {{universe}}" -> ["world", "universe"]
 */
export function extractSnippetReferences(template: string): string[] {
  const regex = /\{\{([^}]+)\}\}/g;
  const matches = [...template.matchAll(regex)];
  return [...new Set(matches.map(match => match[1].trim()))];
}

/**
 * Render a template by replacing all snippet references with their content
 * Handles nested snippets recursively
 */
export async function renderTemplate(
  template: string, 
  maxDepth: number = 5,
  currentDepth: number = 0
): Promise<{ rendered: string; usedSnippets: string[]; errors: string[] }> {
  if (currentDepth >= maxDepth) {
    return {
      rendered: template,
      usedSnippets: [],
      errors: ['Maximum nesting depth reached']
    };
  }

  const snippetNames = extractSnippetReferences(template);
  const usedSnippets: string[] = [];
  const errors: string[] = [];
  let rendered = template;

  for (const snippetName of snippetNames) {
    try {
      const snippet = await getSnippet(snippetName);
      
      if (snippet) {
        // Check if the snippet content has nested references
        const nestedRefs = extractSnippetReferences(snippet.content);
        let snippetContent = snippet.content;
        
        if (nestedRefs.length > 0) {
          // Recursively render nested snippets
          const nestedResult = await renderTemplate(
            snippet.content,
            maxDepth,
            currentDepth + 1
          );
          snippetContent = nestedResult.rendered;
          usedSnippets.push(...nestedResult.usedSnippets);
          errors.push(...nestedResult.errors);
        }
        
        // Replace all occurrences of this snippet
        const regex = new RegExp(`\\{\\{\\s*${escapeRegExp(snippetName)}\\s*\\}\\}`, 'g');
        rendered = rendered.replace(regex, snippetContent);
        usedSnippets.push(snippetName);
      } else {
        errors.push(`Snippet not found: ${snippetName}`);
      }
    } catch (error) {
      errors.push(`Error loading snippet ${snippetName}: ${error}`);
    }
  }

  return {
    rendered,
    usedSnippets: [...new Set(usedSnippets)], // Remove duplicates
    errors
  };
}

/**
 * Validate a template for syntax errors
 */
export function validateTemplate(template: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Check for unclosed brackets
  const openCount = (template.match(/\{\{/g) || []).length;
  const closeCount = (template.match(/\}\}/g) || []).length;
  
  if (openCount !== closeCount) {
    errors.push('Mismatched brackets: ensure all {{ are closed with }}');
  }
  
  // Check for empty references
  const emptyRefs = template.match(/\{\{\s*\}\}/g);
  if (emptyRefs) {
    errors.push('Empty snippet references found');
  }
  
  // Check for nested brackets (not supported)
  const nestedPattern = /\{\{[^}]*\{\{/;
  if (nestedPattern.test(template)) {
    errors.push('Nested brackets are not supported');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Escape special regex characters
 */
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Get a preview of the template with snippets partially expanded
 * Useful for showing a preview without loading all snippets
 */
export function getTemplatePreview(template: string, snippets: Snippet[]): string {
  let preview = template;
  
  snippets.forEach(snippet => {
    const regex = new RegExp(`\\{\\{\\s*${escapeRegExp(snippet.name)}\\s*\\}\\}`, 'g');
    const truncatedContent = snippet.content.length > 50 
      ? snippet.content.substring(0, 50) + '...'
      : snippet.content;
    preview = preview.replace(regex, `[${truncatedContent}]`);
  });
  
  return preview;
}

/**
 * Create a dependency graph of snippets
 */
export async function getSnippetDependencies(
  snippetName: string,
  visited: Set<string> = new Set()
): Promise<{ dependencies: string[]; errors: string[] }> {
  if (visited.has(snippetName)) {
    return { dependencies: [], errors: [`Circular dependency detected: ${snippetName}`] };
  }
  
  visited.add(snippetName);
  const dependencies: string[] = [];
  const errors: string[] = [];
  
  try {
    const snippet = await getSnippet(snippetName);
    
    if (snippet) {
      const refs = extractSnippetReferences(snippet.content);
      
      for (const ref of refs) {
        dependencies.push(ref);
        const nested = await getSnippetDependencies(ref, new Set(visited));
        dependencies.push(...nested.dependencies);
        errors.push(...nested.errors);
      }
    } else {
      errors.push(`Snippet not found: ${snippetName}`);
    }
  } catch (error) {
    errors.push(`Error loading snippet ${snippetName}: ${error}`);
  }
  
  return {
    dependencies: [...new Set(dependencies)],
    errors
  };
}
