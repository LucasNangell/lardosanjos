'use client';

import * as React from 'react';
import { Button } from '@lardosanjos/ui';
import { AnimalImageUploader, GalleryImage } from '@/components/AnimalImageUploader';
import { AnimalFormData } from '@/lib/api';

export const ANIMAL_STATUS_OPTIONS = [
  'Disponível para adoção',
  'Em tratamento',
  'Acolhido',
  'Adotado',
];

type AnimalFormProps = {
  initial?: AnimalFormData & {
    coverImageId?: string;
    coverImageUrl?: string | null;
    images?: Array<GalleryImage & { url?: string | null }>;
  };
  onSubmit: (data: AnimalFormData & {
    coverImageId?: string;
    images?: { uploadedFileId: string; displayOrder: number }[];
  }) => Promise<void>;
  onDelete?: () => Promise<void>;
  submitLabel?: string;
};

export function AnimalForm({
  initial,
  onSubmit,
  onDelete,
  submitLabel = 'Salvar animal',
}: AnimalFormProps) {
  const [form, setForm] = React.useState<AnimalFormData>({
    name: initial?.name ?? '',
    species: initial?.species ?? 'DOG',
    gender: initial?.gender ?? 'UNKNOWN',
    age: initial?.age ?? '',
    size: initial?.size,
    status: initial?.status ?? 'Disponível para adoção',
    story: initial?.story ?? '',
    needs: initial?.needs ?? '',
    internalNotes: initial?.internalNotes ?? '',
    isPublic: initial?.isPublic ?? true,
  });
  const [coverImageId, setCoverImageId] = React.useState(initial?.coverImageId);
  const [coverPreview, setCoverPreview] = React.useState<string | null>(
    initial?.coverImageUrl ?? null,
  );
  const [gallery, setGallery] = React.useState<GalleryImage[]>(
    initial?.images?.map((img, index) => ({
      uploadedFileId: img.uploadedFileId,
      displayOrder: img.displayOrder ?? index,
      url: (img as GalleryImage).url,
    })) ?? [],
  );
  const [error, setError] = React.useState('');
  const [saving, setSaving] = React.useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await onSubmit({
        ...form,
        coverImageId,
        images: gallery.map((img, index) => ({
          uploadedFileId: img.uploadedFileId,
          displayOrder: index,
        })),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  }

  const fieldStyle = {
    display: 'block' as const,
    width: '100%',
    padding: '0.5rem',
    marginTop: '0.25rem',
    boxSizing: 'border-box' as const,
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1rem', maxWidth: 720 }}>
      <label>
        Nome
        <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={fieldStyle} />
      </label>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
        <label>
          Espécie
          <select value={form.species} onChange={(e) => setForm({ ...form, species: e.target.value })} style={fieldStyle}>
            <option value="DOG">Cachorro</option>
            <option value="CAT">Gato</option>
            <option value="OTHER">Outro</option>
          </select>
        </label>
        <label>
          Gênero
          <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })} style={fieldStyle}>
            <option value="MALE">Macho</option>
            <option value="FEMALE">Fêmea</option>
            <option value="UNKNOWN">Não informado</option>
          </select>
        </label>
        <label>
          Porte
          <select
            value={form.size || ''}
            onChange={(e) => setForm({ ...form, size: e.target.value || undefined })}
            style={fieldStyle}
          >
            <option value="">—</option>
            <option value="SMALL">Pequeno</option>
            <option value="MEDIUM">Médio</option>
            <option value="LARGE">Grande</option>
          </select>
        </label>
      </div>

      <label>
        Idade aproximada
        <input value={form.age || ''} onChange={(e) => setForm({ ...form, age: e.target.value })} style={fieldStyle} />
      </label>

      <label>
        Status
        <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} style={fieldStyle}>
          {ANIMAL_STATUS_OPTIONS.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      </label>

      <label>
        História
        <textarea required rows={5} value={form.story} onChange={(e) => setForm({ ...form, story: e.target.value })} style={fieldStyle} />
      </label>

      <label>
        Necessidades (público)
        <textarea rows={3} value={form.needs || ''} onChange={(e) => setForm({ ...form, needs: e.target.value })} style={fieldStyle} />
      </label>

      <label>
        Observações internas (não aparece no site)
        <textarea
          rows={3}
          value={form.internalNotes || ''}
          onChange={(e) => setForm({ ...form, internalNotes: e.target.value })}
          style={{ ...fieldStyle, background: '#fff8e1' }}
        />
      </label>

      <AnimalImageUploader
        coverImageId={coverImageId}
        coverPreview={coverPreview}
        images={gallery}
        onCoverChange={(fileId, preview) => {
          setCoverImageId(fileId);
          setCoverPreview(preview ?? null);
        }}
        onGalleryChange={setGallery}
        disabled={saving}
      />

      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <input
          type="checkbox"
          checked={form.isPublic}
          onChange={(e) => setForm({ ...form, isPublic: e.target.checked })}
        />
        Visível no site público
      </label>

      {error && <p style={{ color: '#b71c1c', margin: 0 }}>{error}</p>}

      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <Button type="submit" disabled={saving}>
          {saving ? 'Salvando...' : submitLabel}
        </Button>
        {onDelete && (
          <Button type="button" onClick={onDelete} style={{ backgroundColor: '#c0392b' }}>
            Excluir
          </Button>
        )}
      </div>
    </form>
  );
}
