import { createClient } from '@supabase/supabase-js';
import type { Snippet, GenerationSession, ComposedPrompt } from './types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Snippet operations
export async function getSnippets(search?: string) {
  let query = supabase
    .from('snippets')
    .select('*')
    .order('created_at', { ascending: false });

  if (search) {
    query = query.ilike('name', `%${search}%`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as Snippet[];
}

export async function getSnippet(name: string) {
  const { data, error } = await supabase
    .from('snippets')
    .select('*')
    .eq('name', name)
    .single();
  
  if (error) throw error;
  return data as Snippet;
}

export async function createSnippet(snippet: Omit<Snippet, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('snippets')
    .insert(snippet)
    .select()
    .single();
  
  if (error) throw error;
  return data as Snippet;
}

export async function updateSnippet(name: string, updates: Partial<Snippet>) {
  const { data, error } = await supabase
    .from('snippets')
    .update(updates)
    .eq('name', name)
    .select()
    .single();
  
  if (error) throw error;
  return data as Snippet;
}

export async function deleteSnippet(name: string) {
  const { error } = await supabase
    .from('snippets')
    .delete()
    .eq('name', name);
  
  if (error) throw error;
}

// Generation session operations
export async function createGenerationSession(session: Omit<GenerationSession, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('generation_sessions')
    .insert(session)
    .select()
    .single();
  
  if (error) throw error;
  return data as GenerationSession;
}

export async function updateGenerationSession(id: string, updates: Partial<GenerationSession>) {
  const { data, error } = await supabase
    .from('generation_sessions')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data as GenerationSession;
}

export async function getGenerationSession(id: string) {
  const { data, error } = await supabase
    .from('generation_sessions')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) throw error;
  return data as GenerationSession;
}

// Composed prompt operations
export async function getComposedPrompts() {
  const { data, error } = await supabase
    .from('composed_prompts')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data as ComposedPrompt[];
}

export async function getComposedPrompt(id: string) {
  const { data, error } = await supabase
    .from('composed_prompts')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) throw error;
  return data as ComposedPrompt;
}

export async function createComposedPrompt(prompt: Omit<ComposedPrompt, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('composed_prompts')
    .insert(prompt)
    .select()
    .single();
  
  if (error) throw error;
  return data as ComposedPrompt;
}

export async function updateComposedPrompt(id: string, updates: Partial<ComposedPrompt>) {
  const { data, error } = await supabase
    .from('composed_prompts')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data as ComposedPrompt;
}

export async function deleteComposedPrompt(id: string) {
  const { error } = await supabase
    .from('composed_prompts')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
}
