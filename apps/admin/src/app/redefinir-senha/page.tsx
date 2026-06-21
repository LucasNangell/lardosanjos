import { Suspense } from 'react';
import RedefinirSenhaClient from './RedefinirSenhaClient';

export default function RedefinirSenhaPage() {
  return (
    <Suspense fallback={<div style={{ padding: '2rem' }}>Carregando...</div>}>
      <RedefinirSenhaClient />
    </Suspense>
  );
}
