import React from 'react';
import { clsx } from 'clsx';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  fullWidth?: boolean;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  className,
  fullWidth = false,
  id,
  ...props
}) => {
  const generatedId = React.useId();
  const inputId = id || generatedId;
  
  return (
    <div className={clsx('', fullWidth && 'w-full')}>
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={clsx(
          'block rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm',
          'px-3 py-2 border',
          error && 'border-red-500 focus:border-red-500 focus:ring-red-500',
          fullWidth && 'w-full',
          className
        )}
        {...props}
      />
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};
