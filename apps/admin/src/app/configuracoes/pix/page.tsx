'use client';

import * as React from 'react';
import { Button } from '@lardosanjos/ui';
import { AdminLayout } from '@/components/AdminLayout';
import { hasPermission, useAuthGuard } from '@/lib/auth';
import { apiFetch, ApiError } from '@/lib/api';

type PixSettings = {
  receiver_name: string;
  receiver_city: string;
  pix_key: string;
  pix_key_masked?: boolean;
  pix_key_type: string;
  default_description: string;
  default_txid: string;
  min_amount: number;
  allow_custom_amount: boolean;
  quick_amounts: number[];
  instructions: string;
  require_donor_data: boolean;
  require_receipt_upload: boolean;
  hide_sensitive_details: boolean;
  is_active: boolean;
  environment: string;
};

type TestResult = {
  txid: string;
  pix_payload: string;
  pix_qr_code_base64: string;
  amount: number;
  message?: string;
};

const emptySettings: PixSettings = {
  receiver_name: '',
  receiver_city: '',
  pix_key: '',
  pix_key_type: 'EMAIL',
  default_description: '',
  default_txid: 'LD',
  min_amount: 1,
  allow_custom_amount: true,
  quick_amounts: [10, 25, 50, 100],
  instructions: '',
  require_donor_data: false,
  require_receipt_upload: true,
  hide_sensitive_details: false,
  is_active: true,
  environment: 'PRODUCTION',
};

export default function PixSettingsPage() {
  const { loading, user } = useAuthGuard();
  const [settings, setSettings] = React.useState<PixSettings>(emptySettings);
  const [quickAmountsText, setQuickAmountsText] = React.useState('10, 25, 50, 100');
  const [message, setMessage] = React.useState('');
  const [error, setError] = React.useState('');
  const [saving, setSaving] = React.useState(false);
  const [testing, setTesting] = React.useState(false);
  const [testResult, setTestResult] = React.useState<TestResult | null>(null);

  const canRead = hasPermission(user, 'PIX_SETTINGS_READ');
  const canWrite = hasPermission(user, 'PIX_SETTINGS_WRITE');

  React.useEffect(() => {
    if (!user || !canRead) return;
    apiFetch<PixSettings>('/admin/pix/settings')
      .then((data) => {
        setSettings(data);
        setQuickAmountsText(data.quick_amounts.join(', '));
      })
      .catch((err) =>
        setError(err instanceof ApiError ? err.message : 'Erro ao carregar'),
      );
  }, [user, canRead]);

  function parseQuickAmounts(value: string) {
    return value
      .split(',')
      .map((part) => Number(part.trim()))
      .filter((amount) => Number.isFinite(amount) && amount > 0);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!canWrite) return;

    const quickAmounts = parseQuickAmounts(quickAmountsText);
    const payload = { ...settings, quick_amounts: quickAmounts };

    setSaving(true);
    setError('');
    setMessage('');
    try {
      const updated = await apiFetch<PixSettings>('/admin/pix/settings', {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
      setSettings(updated);
      setQuickAmountsText(updated.quick_amounts.join(', '));
      setMessage('Configurações salvas. O checkout público passará a usar estes dados imediatamente.');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  }

  async function handleTest() {
    if (!canWrite) return;
    setTesting(true);
    setTestResult(null);
    setError('');
    try {
      const result = await apiFetch<TestResult>('/admin/pix/settings/test', {
        method: 'POST',
        body: JSON.stringify({
          amount: settings.min_amount,
          receiver_name: settings.receiver_name,
          receiver_city: settings.receiver_city,
          pix_key: settings.pix_key,
          pix_key_type: settings.pix_key_type,
          default_description: settings.default_description,
          default_txid: settings.default_txid,
        }),
      });
      setTestResult(result);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erro ao gerar QR Code de teste');
    } finally {
      setTesting(false);
    }
  }

  async function copyPayload() {
    if (!testResult?.pix_payload) return;
    await navigator.clipboard.writeText(testResult.pix_payload);
    setMessage('Pix Copia e Cola copiado.');
  }

  function updateField<K extends keyof PixSettings>(key: K, value: PixSettings[K]) {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }

  if (loading || !user) return <div style={{ padding: '2rem' }}>Carregando...</div>;

  if (!canRead) {
    return (
      <AdminLayout user={user}>
        <p>Sem permissão para visualizar configurações Pix.</p>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout user={user}>
      <h1 style={{ color: '#6A4F36', marginTop: 0 }}>Configurações Pix avulso</h1>
      <p style={{ color: '#666', maxWidth: 720 }}>
        Dados usados para gerar BR Code/EMV internamente, sem Asaas. Alterações entram em vigor
        imediatamente no checkout `/doar-unica`.
      </p>

      {message && <p style={{ color: '#2AA98C' }}>{message}</p>}
      {error && <p style={{ color: '#b71c1c' }}>{error}</p>}

      {!canWrite && (
        <p style={{ color: '#6A4F36', background: '#f5efe8', padding: '0.75rem', borderRadius: 8 }}>
          Você possui acesso somente leitura. A chave Pix pode aparecer mascarada.
        </p>
      )}

      <form onSubmit={handleSave} style={{ maxWidth: 720 }}>
        <div style={{ display: 'grid', gap: '1rem' }}>
          {[
            ['receiver_name', 'Nome do recebedor'],
            ['receiver_city', 'Cidade do recebedor'],
            ['pix_key', 'Chave Pix'],
            ['default_description', 'Descrição padrão'],
            ['default_txid', 'Prefixo TXID'],
            ['instructions', 'Instruções públicas'],
          ].map(([key, label]) => (
            <label key={key}>
              <span>{label}</span>
              <input
                value={String(settings[key as keyof PixSettings] ?? '')}
                onChange={(e) =>
                  updateField(key as keyof PixSettings, e.target.value as never)
                }
                disabled={!canWrite}
                style={{ width: '100%', padding: '0.5rem', marginTop: 4 }}
              />
            </label>
          ))}

          <label>
            Tipo de chave
            <select
              value={settings.pix_key_type}
              onChange={(e) => updateField('pix_key_type', e.target.value)}
              disabled={!canWrite}
              style={{ width: '100%', padding: '0.5rem', marginTop: 4 }}
            >
              {['CPF', 'CNPJ', 'EMAIL', 'PHONE', 'RANDOM_KEY'].map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>

          <label>
            Ambiente
            <select
              value={settings.environment}
              onChange={(e) => updateField('environment', e.target.value)}
              disabled={!canWrite}
              style={{ width: '100%', padding: '0.5rem', marginTop: 4 }}
            >
              <option value="SANDBOX">SANDBOX</option>
              <option value="PRODUCTION">PRODUCTION</option>
            </select>
          </label>

          <label>
            Valor mínimo (R$)
            <input
              type="number"
              step="0.01"
              value={settings.min_amount}
              onChange={(e) => updateField('min_amount', Number(e.target.value))}
              disabled={!canWrite}
              style={{ width: '100%', padding: '0.5rem', marginTop: 4 }}
            />
          </label>

          <label>
            Valores rápidos (separados por vírgula)
            <input
              value={quickAmountsText}
              onChange={(e) => setQuickAmountsText(e.target.value)}
              disabled={!canWrite}
              placeholder="10, 25, 50, 100"
              style={{ width: '100%', padding: '0.5rem', marginTop: 4 }}
            />
          </label>

          {[
            ['allow_custom_amount', 'Permitir valor personalizado'],
            ['require_donor_data', 'Exigir dados do doador'],
            ['require_receipt_upload', 'Exigir comprovante'],
            ['hide_sensitive_details', 'Ocultar dados sensíveis no checkout público'],
            ['is_active', 'Configuração ativa'],
          ].map(([key, label]) => (
            <label key={key} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input
                type="checkbox"
                checked={Boolean(settings[key as keyof PixSettings])}
                onChange={(e) =>
                  updateField(key as keyof PixSettings, e.target.checked as never)
                }
                disabled={!canWrite}
              />
              {label}
            </label>
          ))}
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginTop: '1.5rem' }}>
          {canWrite && (
            <>
              <Button type="submit" disabled={saving}>
                {saving ? 'Salvando...' : 'Salvar configuração'}
              </Button>
              <Button
                type="button"
                onClick={handleTest}
                disabled={testing}
                style={{ backgroundColor: '#6A4F36' }}
              >
                {testing ? 'Gerando...' : 'Gerar QR Code de teste'}
              </Button>
            </>
          )}
        </div>
      </form>

      {testResult && (
        <section style={{ marginTop: '2rem', maxWidth: 720 }}>
          <h2 style={{ color: '#6A4F36', fontSize: '1.1rem' }}>Resultado do teste</h2>
          <p style={{ color: '#666' }}>{testResult.message}</p>
          <p>
            <strong>Valor:</strong> R$ {testResult.amount.toFixed(2)} · <strong>TXID:</strong>{' '}
            {testResult.txid}
          </p>
          <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'start' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={testResult.pix_qr_code_base64}
              alt="QR Code Pix de teste"
              style={{
                width: 220,
                height: 220,
                border: '1px solid #ddd',
                borderRadius: 8,
                background: '#fff',
              }}
            />
            <div style={{ flex: 1, minWidth: 260 }}>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>
                Pix Copia e Cola
              </label>
              <textarea
                readOnly
                value={testResult.pix_payload}
                rows={6}
                style={{ width: '100%', padding: '0.75rem', fontSize: '0.8rem' }}
              />
              <Button type="button" onClick={copyPayload} style={{ marginTop: 8 }}>
                Copiar Pix Copia e Cola
              </Button>
            </div>
          </div>
        </section>
      )}
    </AdminLayout>
  );
}
