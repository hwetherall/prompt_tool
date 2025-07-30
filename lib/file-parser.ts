import mammoth from 'mammoth';

/**
 * Extract text content from a Word document buffer
 */
export async function extractTextFromWord(buffer: Buffer): Promise<string> {
  try {
    const result = await mammoth.extractRawText({ buffer });
    
    if (result.messages && result.messages.length > 0) {
      console.warn('Word document parsing warnings:', result.messages);
    }
    
    return result.value;
  } catch (error) {
    console.error('Error extracting text from Word document:', error);
    throw new Error('Failed to parse Word document');
  }
}

/**
 * Process and clean rubric content
 */
export function processRubricContent(rawText: string): string {
  // Clean up common Word formatting artifacts
  let cleaned = rawText
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  
  // Remove excessive whitespace
  cleaned = cleaned
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .join('\n');
  
  return cleaned;
}

/**
 * Extract structured rubric information
 */
export interface RubricStructure {
  title?: string;
  sections: {
    heading: string;
    content: string;
  }[];
  criteria: string[];
}

export function parseRubricStructure(content: string): RubricStructure {
  const lines = content.split('\n');
  const structure: RubricStructure = {
    sections: [],
    criteria: []
  };
  
  // Try to extract title (usually the first non-empty line)
  if (lines.length > 0) {
    structure.title = lines[0];
  }
  
  // Extract sections based on common patterns
  let currentSection: { heading: string; content: string } | null = null;
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    
    // Check if this looks like a heading (all caps, numbered, or ends with colon)
    const isHeading = /^[A-Z\s]+$/.test(line) || 
                     /^\d+\./.test(line) || 
                     /^[A-Za-z\s]+:$/.test(line);
    
    if (isHeading && line.length < 100) {
      if (currentSection) {
        structure.sections.push(currentSection);
      }
      currentSection = {
        heading: line,
        content: ''
      };
    } else if (currentSection) {
      currentSection.content += (currentSection.content ? '\n' : '') + line;
    }
    
    // Extract criteria (lines starting with bullets, numbers, or dashes)
    if (/^[\-\*\•]\s/.test(line) || /^\d+[\.\)]\s/.test(line)) {
      structure.criteria.push(line.replace(/^[\-\*\•\d\.\)]\s+/, ''));
    }
  }
  
  if (currentSection) {
    structure.sections.push(currentSection);
  }
  
  return structure;
}