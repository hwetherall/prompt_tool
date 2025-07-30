/**
 * Utility functions for parsing and working with the master taxonomy structure
 */

export interface TaxonomyItem {
  name: string;
  level: number;
  parent?: string;
  children: string[];
}

export interface TaxonomyStructure {
  categories: Record<string, TaxonomyItem>;
  allItems: string[];
}

/**
 * Parse the prompts.md file content to extract taxonomy structure
 */
export function parseTaxonomy(content: string): TaxonomyStructure {
  const lines = content.split('\n');
  const categories: Record<string, TaxonomyItem> = {};
  const allItems: string[] = [];
  
  let currentSection = '';
  let currentParent = '';
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    // Skip empty lines and headers
    if (!trimmed || trimmed.includes('Master Taxonomy Structure') || /^\d+\./.test(trimmed)) {
      continue;
    }
    
    // Main category (e.g., "core_", "geo_")
    if (!line.startsWith(' ') && !line.startsWith('\t') && trimmed.endsWith('_')) {
      currentSection = trimmed.replace('_', '');
      currentParent = trimmed;
      
      if (!categories[trimmed]) {
        categories[trimmed] = {
          name: trimmed,
          level: 0,
          children: []
        };
        allItems.push(trimmed);
      }
      continue;
    }
    
    // Extract item names from tree structure
    const match = trimmed.match(/├──|└──|│\s+├──|│\s+└──/);
    if (match || trimmed.includes('├──') || trimmed.includes('└──')) {
      let itemName = trimmed
        .replace(/[├└─│\s]+/, '')
        .trim();
      
      if (itemName && !itemName.includes('Master Taxonomy') && !itemName.includes('Categories')) {
        // Determine the level based on indentation
        const indentLevel = (line.length - line.trimLeft().length) / 4;
        
        // Find the appropriate parent based on the structure
        let parent = currentParent;
        if (indentLevel > 1) {
          // This is a sub-item, find its immediate parent
          const previousItems = Object.keys(categories).reverse();
          for (const prevItem of previousItems) {
            if (categories[prevItem].level === indentLevel - 1) {
              parent = prevItem;
              break;
            }
          }
        }
        
        if (!categories[itemName]) {
          categories[itemName] = {
            name: itemName,
            level: indentLevel,
            parent: parent !== itemName ? parent : undefined,
            children: []
          };
          allItems.push(itemName);
        }
        
        // Add to parent's children if it exists
        if (parent && parent !== itemName && categories[parent]) {
          if (!categories[parent].children.includes(itemName)) {
            categories[parent].children.push(itemName);
          }
        }
      }
    }
  }
  
  return {
    categories,
    allItems
  };
}

/**
 * Get missing items from taxonomy that don't exist in current snippets
 */
export function getMissingTaxonomyItems(
  taxonomy: TaxonomyStructure,
  existingSnippets: string[]
): string[] {
  const existingNames = new Set(existingSnippets.map(name => name.toLowerCase()));
  
  return taxonomy.allItems.filter(item => {
    // Only include leaf items (items that can actually be snippets)
    const isLeaf = !item.endsWith('_') || taxonomy.categories[item].children.length === 0;
    const notExists = !existingNames.has(item.toLowerCase());
    
    return isLeaf && notExists;
  });
}

/**
 * Analyze coverage gaps in the taxonomy
 */
export function analyzeCoverageGaps(
  taxonomy: TaxonomyStructure,
  existingSnippets: string[]
): {
  categoryGaps: Record<string, { total: number; covered: number; missing: string[] }>;
  overallCoverage: number;
} {
  const categoryGaps: Record<string, { total: number; covered: number; missing: string[] }> = {};
  const existingNames = new Set(existingSnippets.map(name => name.toLowerCase()));
  
  // Analyze each main category
  const mainCategories = Object.keys(taxonomy.categories).filter(cat => 
    cat.endsWith('_') && taxonomy.categories[cat].level === 0
  );
  
  let totalLeafItems = 0;
  let totalCovered = 0;
  
  for (const category of mainCategories) {
    const categoryItems = taxonomy.allItems.filter(item => 
      item.startsWith(category.replace('_', '')) && 
      (!item.endsWith('_') || taxonomy.categories[item]?.children.length === 0)
    );
    
    const covered = categoryItems.filter(item => 
      existingNames.has(item.toLowerCase())
    );
    
    const missing = categoryItems.filter(item => 
      !existingNames.has(item.toLowerCase())
    );
    
    categoryGaps[category] = {
      total: categoryItems.length,
      covered: covered.length,
      missing
    };
    
    totalLeafItems += categoryItems.length;
    totalCovered += covered.length;
  }
  
  return {
    categoryGaps,
    overallCoverage: totalLeafItems > 0 ? totalCovered / totalLeafItems : 0
  };
}

/**
 * Get taxonomy suggestions for balanced coverage
 */
export function getBalancedSuggestions(
  taxonomy: TaxonomyStructure,
  existingSnippets: string[],
  limit: number = 5
): string[] {
  const analysis = analyzeCoverageGaps(taxonomy, existingSnippets);
  const suggestions: { item: string; priority: number }[] = [];
  
  // Sort categories by coverage percentage (ascending) to prioritize under-represented areas
  const sortedCategories = Object.entries(analysis.categoryGaps)
    .sort(([,a], [,b]) => (a.covered / a.total) - (b.covered / b.total));
  
  // Get suggestions from each category, prioritizing less covered ones
  for (const [category, gap] of sortedCategories) {
    if (gap.missing.length > 0) {
      const coverageRatio = gap.covered / gap.total;
      const categoryPriority = 1 - coverageRatio; // Higher priority for less covered
      
      // Add a few suggestions from this category
      const categoryLimit = Math.max(1, Math.ceil(limit / sortedCategories.length));
      const categorySuggestions = gap.missing.slice(0, categoryLimit);
      
      for (const item of categorySuggestions) {
        suggestions.push({
          item,
          priority: categoryPriority + Math.random() * 0.1 // Small random factor for variety
        });
      }
    }
  }
  
  // Sort by priority and return top suggestions
  return suggestions
    .sort((a, b) => b.priority - a.priority)
    .slice(0, limit)
    .map(s => s.item);
}