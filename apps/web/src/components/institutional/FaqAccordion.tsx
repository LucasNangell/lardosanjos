'use client';

import * as React from 'react';
import { cn } from '@lardosanjos/ui';

export function FaqAccordion({
  items,
}: {
  items: Array<{ id: string; question: string; answer: string }>;
}) {
  const [openId, setOpenId] = React.useState<string | null>(items[0]?.id ?? null);

  return (
    <div className="space-y-3">
      {items.map((item) => {
        const open = openId === item.id;
        return (
          <div
            key={item.id}
            className="overflow-hidden rounded-2xl border border-brand-primary-light bg-white"
          >
            <button
              type="button"
              className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left focus-ring"
              aria-expanded={open}
              onClick={() => setOpenId(open ? null : item.id)}
            >
              <span className="font-heading font-semibold text-brand-brown">{item.question}</span>
              <span
                className={cn(
                  'text-brand-primary transition-transform',
                  open && 'rotate-180',
                )}
                aria-hidden
              >
                ▾
              </span>
            </button>
            {open && (
              <div className="border-t border-brand-primary-light/60 px-5 py-4 text-sm text-brand-text/80">
                {item.answer}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
