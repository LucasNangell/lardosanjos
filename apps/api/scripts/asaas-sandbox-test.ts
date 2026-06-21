/**
 * Script interno de smoke test no sandbox Asaas.
 * Não expõe rota pública. Uso: pnpm --filter api asaas:sandbox-test
 */
import * as dotenv from 'dotenv';
import { join } from 'path';
import { AsaasService } from '../src/integrations/asaas/asaas.service';

dotenv.config({ path: join(__dirname, '../../../.env') });
dotenv.config({ path: join(__dirname, '../.env') });

async function main() {
  if (!process.env.ASAAS_API_KEY) {
    console.error('Defina ASAAS_API_KEY no .env para rodar este teste.');
    process.exit(1);
  }

  const service = new AsaasService();
  const stamp = Date.now();
  const email = `sandbox-test+${stamp}@lardosanjos.online`;

  console.log(`Ambiente: ${service.environment}`);
  console.log(`Criando cliente sandbox: ${email}`);

  const customer = await service.createCustomer({
    name: 'Teste Sandbox Lar dos Anjos',
    email,
    cpfCnpj: '24971563792',
    mobilePhone: '61999999999',
  });

  console.log('Cliente criado:', { id: customer.id, email: customer.email });
  console.log('Sandbox test OK.');
}

main().catch((error) => {
  console.error('Sandbox test falhou:', error?.message || error);
  process.exit(1);
});
