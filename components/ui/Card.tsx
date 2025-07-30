import React from 'react';
import { clsx } from 'clsx';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'hover' | 'selected';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const Card: React.FC<CardProps> = ({
  children,
  className,
  variant = 'default',
  padding = 'md',
  ...props
}) => {
  const baseStyles = 'bg-white rounded-lg shadow';
  
  const variants = {
    default: 'border border-gray-200',
    hover: 'border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all cursor-pointer',
    selected: 'border-2 border-primary shadow-md'
  };
  
  const paddings = {
    none: '',
    sm: 'p-3',
    md: 'p-5',
    lg: 'p-8'
  };
  
  return (
    <div
      className={clsx(
        baseStyles,
        variants[variant],
        paddings[padding],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
