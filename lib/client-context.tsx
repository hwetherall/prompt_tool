'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { Client } from '@/lib/types';

interface ClientContextType {
  currentClient: Client | null;
  setCurrentClient: (client: Client | null) => void;
  isGeneralMode: boolean;
}

const ClientContext = createContext<ClientContextType | undefined>(undefined);

export function ClientProvider({ children }: { children: ReactNode }) {
  const [currentClient, setCurrentClient] = useState<Client | null>(null);

  // Load client from localStorage on mount
  useEffect(() => {
    const savedClientId = localStorage.getItem('currentClientId');
    const savedClientData = localStorage.getItem('currentClientData');
    
    if (savedClientId && savedClientData) {
      try {
        const client = JSON.parse(savedClientData);
        setCurrentClient(client);
      } catch (err) {
        console.error('Failed to parse saved client data');
        localStorage.removeItem('currentClientId');
        localStorage.removeItem('currentClientData');
      }
    }
  }, []);

  // Save client to localStorage when it changes
  const handleSetCurrentClient = (client: Client | null) => {
    setCurrentClient(client);
    
    if (client) {
      localStorage.setItem('currentClientId', client.id);
      localStorage.setItem('currentClientData', JSON.stringify(client));
    } else {
      localStorage.removeItem('currentClientId');
      localStorage.removeItem('currentClientData');
    }
  };

  const value: ClientContextType = {
    currentClient,
    setCurrentClient: handleSetCurrentClient,
    isGeneralMode: currentClient === null
  };

  return (
    <ClientContext.Provider value={value}>
      {children}
    </ClientContext.Provider>
  );
}

export function useClient() {
  const context = useContext(ClientContext);
  if (context === undefined) {
    throw new Error('useClient must be used within a ClientProvider');
  }
  return context;
}