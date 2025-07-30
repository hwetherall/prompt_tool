import { createClient } from '@supabase/supabase-js';
import type { Snippet, GenerationSession, ComposedPrompt, Client } from './types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Export createClient for any components that need to create their own client instance
export { createClient };

// Snippet operations
export async function getSnippets(search?: string, clientId?: string) {
  let query = supabase
    .from('snippets')
    .select('*, clients(name)')
    .order('created_at', { ascending: false });

  if (search) {
    query = query.ilike('name', `%${search}%`);
  }
  
  if (clientId) {
    query = query.or(`client_id.eq.${clientId},is_general.eq.true`);
  }

  const { data, error } = await query;
  if (error) throw error;
  
  // Map the joined data
  return (data as any[]).map(item => ({
    ...item,
    client_name: item.clients?.name
  })) as Snippet[];
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

// Client operations
export async function getClients() {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .order('name', { ascending: true });
  
  if (error) throw error;
  return data as Client[];
}

export async function getClient(id: string) {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) throw error;
  return data as Client;
}

export async function createClientRecord(client: Omit<Client, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('clients')
    .insert(client)
    .select()
    .single();
  
  if (error) throw error;
  return data as Client;
}

export async function updateClient(id: string, updates: Partial<Client>) {
  const { data, error } = await supabase
    .from('clients')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data as Client;
}

export async function deleteClient(id: string) {
  const { error } = await supabase
    .from('clients')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
}

// Get snippets with client priority
export async function getSnippetsWithClientPriority(search?: string, clientId?: string) {
  let query = supabase
    .from('client_snippets_view')
    .select('*');

  // Apply search filter
  if (search) {
    query = query.ilike('name', `%${search}%`);
  }

  const { data, error } = await query;
  if (error) throw error;

  // Sort by client priority
  const sorted = (data as any[]).sort((a, b) => {
    // Priority 1: Same client
    if (clientId) {
      if (a.client_id === clientId && b.client_id !== clientId) return -1;
      if (a.client_id !== clientId && b.client_id === clientId) return 1;
    }
    
    // Priority 2: General snippets
    if (a.is_general && !b.is_general) return -1;
    if (!a.is_general && b.is_general) return 1;
    
    // Priority 3: Sort by created_at
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  return sorted as Snippet[];
}

// Get client-specific snippets
export async function getClientSnippets(clientId: string) {
  const { data, error } = await supabase
    .from('snippets')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data as Snippet[];
}
