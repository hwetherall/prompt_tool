'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { getClients, createClientRecord, updateClient, deleteClient } from '@/lib/supabase';
import type { Client } from '@/lib/types';

interface ClientSelectorProps {
  selectedClient: Client | null;
  onSelectClient: (client: Client | null) => void;
  showGeneralOption?: boolean;
}

export const ClientSelector: React.FC<ClientSelectorProps> = ({
  selectedClient,
  onSelectClient,
  showGeneralOption = true
}) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewClientForm, setShowNewClientForm] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [error, setError] = useState<string | null>(null);

  // New client form state
  const [newClientName, setNewClientName] = useState('');
  const [newClientDescription, setNewClientDescription] = useState('');
  const [newClientFocusAreas, setNewClientFocusAreas] = useState('');

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const data = await getClients();
      setClients(data);
    } catch (err) {
      setError('Failed to load clients');
      console.error('Error fetching clients:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClient = async () => {
    if (!newClientName.trim()) {
      setError('Client name is required');
      return;
    }

    try {
      setLoading(true);
      const focusAreasArray = newClientFocusAreas
        .split(',')
        .map(area => area.trim())
        .filter(area => area.length > 0);

      const newClient = await createClientRecord({
        name: newClientName,
        description: newClientDescription || undefined,
        focus_areas: focusAreasArray.length > 0 ? focusAreasArray : undefined
      });

      setClients([...clients, newClient]);
      onSelectClient(newClient);
      
      // Reset form
      setNewClientName('');
      setNewClientDescription('');
      setNewClientFocusAreas('');
      setShowNewClientForm(false);
    } catch (err: any) {
      if (err.message?.includes('duplicate')) {
        setError('A client with this name already exists');
      } else {
        setError('Failed to create client');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateClient = async () => {
    if (!editingClient) return;

    try {
      setLoading(true);
      const focusAreasArray = newClientFocusAreas
        .split(',')
        .map(area => area.trim())
        .filter(area => area.length > 0);

      const updatedClient = await updateClient(editingClient.id, {
        name: newClientName,
        description: newClientDescription || undefined,
        focus_areas: focusAreasArray.length > 0 ? focusAreasArray : undefined
      });

      setClients(clients.map(c => c.id === updatedClient.id ? updatedClient : c));
      if (selectedClient?.id === updatedClient.id) {
        onSelectClient(updatedClient);
      }
      
      setEditingClient(null);
      setNewClientName('');
      setNewClientDescription('');
      setNewClientFocusAreas('');
    } catch (err) {
      setError('Failed to update client');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClient = async (client: Client) => {
    if (!confirm(`Are you sure you want to delete "${client.name}"? All associated snippets will be deleted.`)) {
      return;
    }

    try {
      setLoading(true);
      await deleteClient(client.id);
      setClients(clients.filter(c => c.id !== client.id));
      
      if (selectedClient?.id === client.id) {
        onSelectClient(null);
      }
    } catch (err) {
      setError('Failed to delete client');
    } finally {
      setLoading(false);
    }
  };

  const startEditingClient = (client: Client) => {
    setEditingClient(client);
    setNewClientName(client.name);
    setNewClientDescription(client.description || '');
    setNewClientFocusAreas(client.focus_areas?.join(', ') || '');
    setShowNewClientForm(false);
  };

  if (loading && clients.length === 0) {
    return <div className="text-center py-4">Loading clients...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Client Context</h3>
        <Button
          onClick={() => {
            setShowNewClientForm(!showNewClientForm);
            setEditingClient(null);
          }}
          size="sm"
          variant="outline"
        >
          {showNewClientForm ? 'Cancel' : 'New Client'}
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {(showNewClientForm || editingClient) && (
        <Card padding="sm">
          <div className="space-y-3">
            <Input
              label={editingClient ? "Edit Client Name" : "Client Name"}
              value={newClientName}
              onChange={(e) => setNewClientName(e.target.value)}
              placeholder="e.g., Texas Medical Centre"
              fullWidth
            />
            
            <Textarea
              label="Description"
              value={newClientDescription}
              onChange={(e) => setNewClientDescription(e.target.value)}
              placeholder="Brief description of the client and their needs..."
              rows={3}
              fullWidth
            />
            
            <Input
              label="Focus Areas (comma-separated)"
              value={newClientFocusAreas}
              onChange={(e) => setNewClientFocusAreas(e.target.value)}
              placeholder="e.g., Regulatory Environments, FDA Approval, Manufacturing Partners"
              fullWidth
            />
            
            <div className="flex gap-2">
              <Button
                onClick={editingClient ? handleUpdateClient : handleCreateClient}
                disabled={!newClientName.trim() || loading}
                size="sm"
              >
                {editingClient ? 'Update' : 'Create'} Client
              </Button>
              <Button
                onClick={() => {
                  setEditingClient(null);
                  setShowNewClientForm(false);
                  setNewClientName('');
                  setNewClientDescription('');
                  setNewClientFocusAreas('');
                }}
                variant="secondary"
                size="sm"
              >
                Cancel
              </Button>
            </div>
          </div>
        </Card>
      )}

      <div className="space-y-2">
        {showGeneralOption && (
          <Card
            variant={selectedClient === null ? 'selected' : 'hover'}
            padding="sm"
            className="cursor-pointer"
            onClick={() => onSelectClient(null)}
          >
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">General Snippets</h4>
                <p className="text-sm text-gray-600">
                  Reusable snippets for geography, industry, etc.
                </p>
              </div>
              {selectedClient === null && (
                <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
          </Card>
        )}

        {clients.map(client => (
          <Card
            key={client.id}
            variant={selectedClient?.id === client.id ? 'selected' : 'hover'}
            padding="sm"
            className="cursor-pointer"
            onClick={() => onSelectClient(client)}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h4 className="font-medium">{client.name}</h4>
                {client.description && (
                  <p className="text-sm text-gray-600 mt-1">
                    {client.description}
                  </p>
                )}
                {client.focus_areas && client.focus_areas.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
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
              </div>
              
              <div className="flex items-center gap-2 ml-4">
                {selectedClient?.id === client.id && (
                  <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
                
                <div className="flex gap-1">
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      startEditingClient(client);
                    }}
                    size="sm"
                    variant="outline"
                    className="px-2 py-1"
                  >
                    Edit
                  </Button>
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteClient(client);
                    }}
                    size="sm"
                    variant="secondary"
                    className="px-2 py-1"
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {clients.length === 0 && !showNewClientForm && (
        <div className="text-center py-8 text-gray-500">
          <p>No clients yet.</p>
          <Button
            onClick={() => setShowNewClientForm(true)}
            variant="outline"
            size="sm"
            className="mt-2"
          >
            Create First Client
          </Button>
        </div>
      )}
    </div>
  );
};