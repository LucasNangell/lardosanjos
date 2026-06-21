'use client';

import * as React from 'react';
import { Button } from '@lardosanjos/ui';
import { apiUpload } from '@/lib/api';
import { optimizeImageForUpload } from '@/lib/image-utils';

export type GalleryImage = {
  uploadedFileId: string;
  displayOrder: number;
  url?: string | null;
  preview?: string;
};

type Props = {
  coverImageId?: string;
  coverPreview?: string | null;
  images: GalleryImage[];
  onCoverChange: (fileId: string | undefined, preview?: string) => void;
  onGalleryChange: (images: GalleryImage[]) => void;
  disabled?: boolean;
};

export function AnimalImageUploader({
  coverImageId,
  coverPreview,
  images,
  onCoverChange,
  onGalleryChange,
  disabled,
}: Props) {
  const [uploading, setUploading] = React.useState(false);
  const [error, setError] = React.useState('');

  async function uploadFile(file: File, asCover: boolean) {
    setUploading(true);
    setError('');
    try {
      const optimized = await optimizeImageForUpload(file);
      const result = await apiUpload<{
        fileId: string;
        url: string | null;
      }>('/admin/animals/images/upload', optimized);

      const preview = URL.createObjectURL(optimized);

      if (asCover) {
        onCoverChange(result.fileId, preview);
      } else {
        onGalleryChange([
          ...images,
          {
            uploadedFileId: result.fileId,
            displayOrder: images.length,
            url: result.url,
            preview,
          },
        ]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro no upload');
    } finally {
      setUploading(false);
    }
  }

  function moveImage(index: number, direction: -1 | 1) {
    const next = [...images];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    onGalleryChange(
      next.map((img, i) => ({ ...img, displayOrder: i })),
    );
  }

  function removeGalleryImage(index: number) {
    onGalleryChange(
      images.filter((_, i) => i !== index).map((img, i) => ({ ...img, displayOrder: i })),
    );
  }

  return (
    <div style={{ display: 'grid', gap: '1rem' }}>
      <div>
        <strong>Foto principal</strong>
        <div style={{ marginTop: 8, display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          {(coverPreview || coverImageId) && (
            <div
              style={{
                width: 120,
                height: 120,
                borderRadius: 8,
                background: coverPreview
                  ? `url(${coverPreview}) center/cover`
                  : '#DEB88F',
              }}
            />
          )}
          <label style={{ cursor: disabled ? 'not-allowed' : 'pointer' }}>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              disabled={disabled || uploading}
              hidden
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) uploadFile(file, true);
                e.target.value = '';
              }}
            />
            <span
              style={{
                display: 'inline-block',
                padding: '0.5rem 1rem',
                background: '#2AA98C',
                color: '#fff',
                borderRadius: 6,
                fontSize: '0.9rem',
              }}
            >
              {uploading ? 'Enviando...' : 'Enviar capa'}
            </span>
          </label>
          {coverImageId && (
            <Button
              type="button"
              onClick={() => onCoverChange(undefined)}
              style={{ backgroundColor: '#263238' }}
            >
              Remover capa
            </Button>
          )}
        </div>
      </div>

      <div>
        <strong>Galeria</strong>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
          {images.map((img, index) => (
            <div key={img.uploadedFileId} style={{ position: 'relative' }}>
              <div
                style={{
                  width: 88,
                  height: 88,
                  borderRadius: 6,
                  background: img.preview || img.url
                    ? `url(${img.preview || img.url}) center/cover`
                    : '#eee',
                }}
              />
              <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
                <button type="button" onClick={() => moveImage(index, -1)} disabled={index === 0}>
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => moveImage(index, 1)}
                  disabled={index === images.length - 1}
                >
                  ↓
                </button>
                <button type="button" onClick={() => removeGalleryImage(index)}>
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
        <label style={{ display: 'inline-block', marginTop: 8, cursor: 'pointer' }}>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            disabled={disabled || uploading}
            hidden
            multiple
            onChange={async (e) => {
              const files = Array.from(e.target.files ?? []);
              for (const file of files) {
                await uploadFile(file, false);
              }
              e.target.value = '';
            }}
          />
          <span style={{ color: '#2AA98C', fontWeight: 600 }}>+ Adicionar fotos</span>
        </label>
      </div>

      {error && <p style={{ color: '#b71c1c', margin: 0 }}>{error}</p>}
    </div>
  );
}
