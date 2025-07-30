'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';
import { SUPPORTED_MODELS } from '@/lib/types';

interface GenerationProgressProps {
  currentStep: string;
  progress: number;
  responses?: Record<string, string>;
}

export const GenerationProgress: React.FC<GenerationProgressProps> = ({
  currentStep,
  progress,
  responses = {}
}) => {
  const models = SUPPORTED_MODELS.slice(0, 3);
  const combinerModel = SUPPORTED_MODELS[3];

  return (
    <div className="space-y-4">
      <div className="mb-6">
        <div className="flex justify-between mb-2">
          <span className="text-sm font-medium">{currentStep}</span>
          <span className="text-sm text-gray-600">{Math.round(progress)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-primary h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="font-semibold">Generation Progress:</h3>
        
        {models.map((model, index) => {
          const modelProgress = (index + 1) / 4 * 100;
          const isActive = progress >= modelProgress - 25 && progress < modelProgress;
          const isComplete = progress >= modelProgress;
          const hasResponse = responses[model.name];

          return (
            <Card
              key={model.id}
              variant={isActive ? 'selected' : 'default'}
              padding="sm"
              className={isComplete && !isActive ? 'bg-green-50 border-green-200' : ''}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {isComplete ? (
                    <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : isActive ? (
                    <div className="w-5 h-5">
                      <svg className="animate-spin text-primary" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                    </div>
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-gray-300" />
                  )}
                  <span className={`font-medium ${isActive ? 'text-primary' : ''}`}>
                    {model.name}
                  </span>
                </div>
                <span className="text-sm text-gray-500">{model.provider}</span>
              </div>
              
              {hasResponse && (
                <div className="mt-2 text-sm text-gray-600 font-mono bg-gray-50 p-2 rounded">
                  {hasResponse.substring(0, 100)}...
                </div>
              )}
            </Card>
          );
        })}

        <Card
          variant={progress >= 75 ? 'selected' : 'default'}
          padding="sm"
          className={progress === 100 ? 'bg-blue-50 border-blue-200' : ''}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {progress === 100 ? (
                <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : progress >= 75 ? (
                <div className="w-5 h-5">
                  <svg className="animate-spin text-primary" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                </div>
              ) : (
                <div className="w-5 h-5 rounded-full bg-gray-300" />
              )}
              <span className={`font-medium ${progress >= 75 && progress < 100 ? 'text-primary' : ''}`}>
                {combinerModel.name} (Combiner)
              </span>
            </div>
            <span className="text-sm text-gray-500">{combinerModel.provider}</span>
          </div>
        </Card>
      </div>
    </div>
  );
};
