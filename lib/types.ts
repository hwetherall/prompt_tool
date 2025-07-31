export interface Client {
  id: string;
  name: string;
  description?: string;
  focus_areas?: string[];
  created_at: string;
  updated_at: string;
}

export interface Snippet {
  id: string;
  name: string;
  content: string;
  description?: string;
  client_id?: string;
  is_general?: boolean;
  client_name?: string;
  created_at: string;
  updated_at: string;
}

export interface GenerationSession {
  id: string;
  snippet_name: string;
  user_context: string;
  similar_snippets: string[];
  client_id?: string;
  llm_responses?: {
    claude?: string;
    gpt?: string;
    grok?: string;
  };
  final_combined?: string;
  status: 'in_progress' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
}

export interface ComposedPrompt {
  id: string;
  name: string;
  template: string;
  rendered_content?: string;
  used_snippets: string[];
  client_id?: string;
  created_at: string;
  updated_at: string;
}

export interface LLMModel {
  id: string;
  name: string;
  provider: string;
}

export const SUPPORTED_MODELS: LLMModel[] = [
  { id: "anthropic/claude-4-opus", name: "Claude 4 Opus", provider: "anthropic" },
  { id: "openai/o3", name: "OpenAI o3", provider: "openai" },
  { id: "x-ai/grok-4", name: "Grok 4", provider: "x-ai" },
  { id: "google/gemini-2.5-pro", name: "Gemini 2.5 Pro", provider: "google" },
  { id: "moonshotai/moonshot-v1-8k", name: "Kimi K2", provider: "moonshot" },
  { id: "anthropic/claude-4-opus", name: "Claude 4 Opus (Combiner)", provider: "anthropic" }
];
