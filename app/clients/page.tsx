'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { getClients, getClientSnippets } from '@/lib/supabase';
import { useClient } from '@/lib/client-context';
import type { Client, Snippet } from '@/lib/types';

export default function ClientsPage() {
  const router = useRouter();
  const { setCurrentClient } = useClient();
  const [clients, setClients] = useState<Client[]>([]);
  const [clientSnippetCounts, setClientSnippetCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchClientsWithCounts();
  }, []);

  const fetchClientsWithCounts = async () => {
    try {
      const clientData = await getClients();
      setClients(clientData);

      // Fetch snippet counts for each client
      const counts: Record<string, number> = {};
      for (const client of clientData) {
        try {
          const snippets = await getClientSnippets(client.id);
          counts[client.id] = snippets.length;
        } catch (err) {
          console.error(`Error fetching snippets for client ${client.name}:`, err);
          counts[client.id] = 0;
        }
      }
      setClientSnippetCounts(counts);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load clients');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectClient = (client: Client) => {
    setCurrentClient(client);
    router.push('/snippets');
  };

  if (loading) {
    return (
      <div className="container py-12">
        <div className="flex justify-center">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-12">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-12 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Client Folders</h1>
        <p className="text-gray-600">
          Manage client-specific snippet collections. Each client folder contains custom snippets tailored to their needs.
        </p>
      </div>

      {/* General Snippets Section */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">General Library</h2>
        <Card
          variant="hover"
          className="cursor-pointer"
          onClick={() => {
            setCurrentClient(null);
            router.push('/snippets');
          }}
        >
          <div className="flex items-center justify-between p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">🌐</span>
              </div>
              <div>
                <h3 className="font-semibold text-lg">General Snippets</h3>
                <p className="text-gray-600">
                  Reusable snippets for geography, industry, business models, and more
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Universal library</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Client Folders */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Client Folders</h2>
          <Link href="/snippets/new">
            <Button size="sm">
              New Client
            </Button>
          </Link>
        </div>

        {clients.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📁</span>
              </div>
              <p className="text-gray-600 mb-4">No client folders yet</p>
              <p className="text-sm text-gray-500 mb-6">
                Create client-specific folders to organize custom snippets
              </p>
              <Link href="/snippets/new">
                <Button>Create First Client</Button>
              </Link>
            </div>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {clients.map(client => {
              const snippetCount = clientSnippetCounts[client.id] || 0;
              
              return (
                <Card
                  key={client.id}
                  variant="hover"
                  className="cursor-pointer"
                  onClick={() => handleSelectClient(client)}
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                        <span className="text-2xl">🏢</span>
                      </div>
                      <span className="text-sm text-gray-500">
                        {snippetCount} snippet{snippetCount !== 1 ? 's' : ''}
                      </span>
                    </div>
                    
                    <h3 className="font-semibold text-lg mb-2">{client.name}</h3>
                    
                    {client.description && (
                      <p className="text-sm text-gray-600 mb-3">
                        {client.description}
                      </p>
                    )}
                    
                    {client.focus_areas && client.focus_areas.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {client.focus_areas.map((area, index) => (
                          <span
                            key={index}
                            className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded"
                          >
                            {area}
                          </span>
                        ))}
                      </div>
                    )}
                    
                    <div className="mt-4 pt-4 border-t flex justify-between items-center">
                      <Link
                        href="/snippets/new"
                        onClick={(e) => {
                          e.stopPropagation();
                          setCurrentClient(client);
                        }}
                      >
                        <Button size="sm" variant="outline">
                          Add Snippet
                        </Button>
                      </Link>
                      
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectClient(client);
                        }}
                      >
                        Open Folder
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Statistics */}
      <div className="mt-12 grid md:grid-cols-3 gap-6">
        <Card>
          <div className="p-6 text-center">
            <p className="text-3xl font-bold text-primary">{clients.length}</p>
            <p className="text-gray-600 mt-1">Client Folders</p>
          </div>
        </Card>
        
        <Card>
          <div className="p-6 text-center">
            <p className="text-3xl font-bold text-primary">
              {Object.values(clientSnippetCounts).reduce((sum, count) => sum + count, 0)}
            </p>
            <p className="text-gray-600 mt-1">Client Snippets</p>
          </div>
        </Card>
        
        <Card>
          <div className="p-6 text-center">
            <p className="text-3xl font-bold text-primary">
              {clients.filter(c => clientSnippetCounts[c.id] > 0).length}
            </p>
            <p className="text-gray-600 mt-1">Active Clients</p>
          </div>
        </Card>
      </div>
    </div>
  );
}