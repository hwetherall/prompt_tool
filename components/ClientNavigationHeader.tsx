'use client';

import React, { useState } from 'react';
import { useClient } from '@/lib/client-context';
import { ClientSelector } from '@/components/ClientSelector';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

export const ClientNavigationHeader: React.FC = () => {
  const { currentClient, setCurrentClient, isGeneralMode } = useClient();
  const [showClientSelector, setShowClientSelector] = useState(false);

  return (
    <>
      <div className="bg-gray-50 border-b">
        <div className="container py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-gray-600">Context:</span>
              <div className="flex items-center gap-2">
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                  isGeneralMode 
                    ? 'bg-blue-100 text-blue-800' 
                    : 'bg-purple-100 text-purple-800'
                }`}>
                  {isGeneralMode ? (
                    <>🌐 General Snippets</>
                  ) : (
                    <>🏢 {currentClient?.name}</>
                  )}
                </div>
                
                {currentClient?.focus_areas && currentClient.focus_areas.length > 0 && (
                  <div className="flex gap-1">
                    {currentClient.focus_areas.slice(0, 3).map((area, index) => (
                      <span
                        key={index}
                        className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded"
                      >
                        {area}
                      </span>
                    ))}
                    {currentClient.focus_areas.length > 3 && (
                      <span className="text-xs text-gray-500">
                        +{currentClient.focus_areas.length - 3} more
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
            
            <Button
              onClick={() => setShowClientSelector(!showClientSelector)}
              variant="outline"
              size="sm"
            >
              {showClientSelector ? 'Close' : 'Switch Context'}
            </Button>
          </div>
        </div>
      </div>

      {showClientSelector && (
        <div className="bg-white border-b shadow-sm">
          <div className="container py-4">
            <Card>
              <ClientSelector
                selectedClient={currentClient}
                onSelectClient={(client) => {
                  setCurrentClient(client);
                  setShowClientSelector(false);
                }}
                showGeneralOption={true}
              />
            </Card>
          </div>
        </div>
      )}
    </>
  );
};