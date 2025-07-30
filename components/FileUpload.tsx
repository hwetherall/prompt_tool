'use client';

import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

interface FileUploadProps {
  accept?: string;
  maxSizeMB?: number;
  onFileSelect: (file: File) => void;
  onFileRemove?: () => void;
  selectedFile?: File | null;
  label?: string;
  helpText?: string;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  accept = '.doc,.docx',
  maxSizeMB = 10,
  onFileSelect,
  onFileRemove,
  selectedFile,
  label = 'Upload File',
  helpText
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const validateFile = (file: File): boolean => {
    setError(null);
    
    // Check file size
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      setError(`File size must be less than ${maxSizeMB}MB`);
      return false;
    }

    // Check file type
    const validTypes = accept.split(',').map(t => t.trim());
    const fileExtension = `.${file.name.split('.').pop()?.toLowerCase()}`;
    
    if (!validTypes.some(type => fileExtension === type)) {
      setError(`File type must be one of: ${validTypes.join(', ')}`);
      return false;
    }

    return true;
  };

  const handleFileSelect = (file: File) => {
    if (validateFile(file)) {
      onFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleRemove = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setError(null);
    onFileRemove?.();
  };

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium mb-2">
          {label}
        </label>
      )}
      
      {!selectedFile ? (
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            isDragging 
              ? 'border-blue-400 bg-blue-50' 
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="space-y-4">
            <div className="text-gray-600">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                stroke="currentColor"
                fill="none"
                viewBox="0 0 48 48"
              >
                <path
                  d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            
            <div>
              <Button
                onClick={triggerFileInput}
                variant="outline"
                size="sm"
              >
                Choose File
              </Button>
              <p className="mt-2 text-sm text-gray-600">
                or drag and drop
              </p>
            </div>
            
            {helpText && (
              <p className="text-xs text-gray-500">
                {helpText}
              </p>
            )}
          </div>
        </div>
      ) : (
        <Card padding="sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <svg
                className="h-8 w-8 text-blue-600"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-5L9 2H4z"
                  clipRule="evenodd"
                />
              </svg>
              <div>
                <p className="text-sm font-medium">{selectedFile.name}</p>
                <p className="text-xs text-gray-500">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
            
            <Button
              onClick={handleRemove}
              variant="secondary"
              size="sm"
            >
              Remove
            </Button>
          </div>
        </Card>
      )}
      
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleInputChange}
        className="hidden"
      />
      
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};