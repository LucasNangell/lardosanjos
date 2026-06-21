import * as React from 'react';
import { cn } from '../lib/utils';

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-brand-primary-light/60', className)}
      aria-hidden
    />
  );
}

export function LoadingState({ message = 'Carregando...' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-12" role="status">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-primary border-t-transparent" />
      <p className="text-sm text-brand-text/70">{message}</p>
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-brand-secondary/40 bg-white/50 px-6 py-12 text-center">
      <h3 className="font-heading text-lg font-semibold text-brand-brown">{title}</h3>
      {description && <p className="mt-2 max-w-md text-sm text-brand-text/70">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ErrorState({
  title = 'Algo deu errado',
  description,
  onRetry,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center" role="alert">
      <h3 className="font-heading text-lg font-semibold text-red-800">{title}</h3>
      {description && <p className="mt-2 text-sm text-red-700">{description}</p>}
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 text-sm font-medium text-red-800 underline focus-ring"
        >
          Tentar novamente
        </button>
      )}
    </div>
  );
}
