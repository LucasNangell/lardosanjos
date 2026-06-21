'use client';

import * as React from 'react';
import { Button } from '@lardosanjos/ui';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

type Props = {
  animalId: string;
  animalName: string;
};

export function AdoptionInterestForm({ animalId, animalName }: Props) {
  const [form, setForm] = React.useState({
    name: '',
    email: '',
    phone: '',
    message: '',
    website: '',
  });
  const [status, setStatus] = React.useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [feedback, setFeedback] = React.useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('loading');
    setFeedback('');
    try {
      const res = await fetch(`${API_URL}/public/animals/${animalId}/adoption-interest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone || undefined,
          message: form.message || undefined,
          website: form.website,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          typeof data.message === 'string' ? data.message : 'Não foi possível enviar',
        );
      }
      setStatus('success');
      setFeedback(
        typeof data.message === 'string'
          ? data.message
          : 'Mensagem enviada! Entraremos em contato em breve.',
      );
      setForm({ name: '', email: '', phone: '', message: '', website: '' });
    } catch (err) {
      setStatus('error');
      setFeedback(err instanceof Error ? err.message : 'Erro ao enviar');
    }
  }

  return (
    <section
      style={{
        background: '#fff',
        borderRadius: 12,
        padding: '1.25rem',
        border: '1px solid #e8dfd4',
      }}
    >
      <h2 style={{ color: '#6A4F36', fontSize: '1.2rem', marginTop: 0 }}>
        Tenho interesse em adotar {animalName}
      </h2>
      <p style={{ color: '#666', fontSize: '0.95rem' }}>
        Preencha o formulário e nossa equipe entrará em contato para conversar sobre adoção
        responsável.
      </p>

      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '0.75rem' }}>
        {/* Honeypot oculto */}
        <input
          type="text"
          name="website"
          value={form.website}
          onChange={(e) => setForm({ ...form, website: e.target.value })}
          tabIndex={-1}
          autoComplete="off"
          aria-hidden
          style={{ position: 'absolute', left: '-9999px', opacity: 0, height: 0 }}
        />

        <label style={{ display: 'grid', gap: 4 }}>
          Seu nome
          <input
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            style={{ padding: '0.6rem', borderRadius: 6, border: '1px solid #ddd' }}
          />
        </label>
        <label style={{ display: 'grid', gap: 4 }}>
          E-mail
          <input
            required
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            style={{ padding: '0.6rem', borderRadius: 6, border: '1px solid #ddd' }}
          />
        </label>
        <label style={{ display: 'grid', gap: 4 }}>
          Telefone (opcional)
          <input
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            style={{ padding: '0.6rem', borderRadius: 6, border: '1px solid #ddd' }}
          />
        </label>
        <label style={{ display: 'grid', gap: 4 }}>
          Mensagem (opcional)
          <textarea
            rows={4}
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
            placeholder="Conte um pouco sobre você e sua família..."
            style={{ padding: '0.6rem', borderRadius: 6, border: '1px solid #ddd' }}
          />
        </label>

        <Button type="submit" disabled={status === 'loading'}>
          {status === 'loading' ? 'Enviando...' : 'Enviar interesse em adoção'}
        </Button>

        {feedback && (
          <p style={{ color: status === 'error' ? '#b71c1c' : '#2AA98C', margin: 0 }}>
            {feedback}
          </p>
        )}
      </form>
    </section>
  );
}
