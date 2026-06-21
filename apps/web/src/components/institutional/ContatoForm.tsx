'use client';

import * as React from 'react';
import { Button, Input, Textarea } from '@lardosanjos/ui';

export function ContatoForm() {
  const [sent, setSent] = React.useState(false);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const name = String(data.get('name') ?? '');
    const email = String(data.get('email') ?? '');
    const message = String(data.get('message') ?? '');
    const subject = encodeURIComponent(`Contato — ${name}`);
    const body = encodeURIComponent(`Nome: ${name}\nE-mail: ${email}\n\n${message}`);
    window.location.href = `mailto:contato@lardosanjos.online?subject=${subject}&body=${body}`;
    setSent(true);
  }

  if (sent) {
    return (
      <p className="rounded-xl bg-brand-primary-light/40 px-4 py-3 text-sm text-brand-brown">
        Seu cliente de e-mail foi aberto. Se não abriu automaticamente, escreva para
        contato@lardosanjos.online.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <label className="block text-sm font-medium text-brand-brown">
        Nome
        <Input name="name" required className="mt-1" />
      </label>
      <label className="block text-sm font-medium text-brand-brown">
        E-mail
        <Input name="email" type="email" required className="mt-1" />
      </label>
      <label className="block text-sm font-medium text-brand-brown">
        Mensagem
        <Textarea name="message" required rows={5} className="mt-1" />
      </label>
      <Button type="submit">Enviar por e-mail</Button>
    </form>
  );
}
