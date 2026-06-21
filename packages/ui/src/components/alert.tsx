import * as React from 'react';
import { cn } from '../lib/utils';

export function Alert({
  className,
  variant = 'default',
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  variant?: 'default' | 'destructive' | 'success';
}) {
  const styles = {
    default: 'border-brand-secondary/40 bg-brand-primary-light/50 text-brand-brown',
    destructive: 'border-red-200 bg-red-50 text-red-800',
    success: 'border-green-200 bg-green-50 text-green-800',
  };
  return (
    <div
      role="alert"
      className={cn('rounded-lg border p-4 text-sm', styles[variant], className)}
      {...props}
    >
      {children}
    </div>
  );
}
