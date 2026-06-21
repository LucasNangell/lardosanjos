import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const ROLES = [
  { name: 'SUPER_ADMIN', description: 'Acesso total ao sistema' },
  { name: 'FINANCEIRO', description: 'Gestão financeira e conciliação' },
  { name: 'CONTEUDO', description: 'Gestão de conteúdo e animais' },
  { name: 'VOLUNTARIO', description: 'Acesso limitado operacional' },
  { name: 'TRANSPARENCIA', description: 'Gestão de transparência pública' },
];

const PERMISSIONS = [
  { name: 'PIX_SETTINGS_READ', description: 'Visualizar configurações Pix' },
  { name: 'PIX_SETTINGS_WRITE', description: 'Editar configurações Pix' },
  { name: 'PIX_CONFIRM_MANUAL', description: 'Confirmar doações Pix manualmente' },
  { name: 'FINANCE_READ', description: 'Visualizar dados financeiros' },
  { name: 'FINANCE_WRITE', description: 'Editar dados financeiros' },
  { name: 'DONOR_READ', description: 'Visualizar doadores' },
  { name: 'DONOR_WRITE', description: 'Editar doadores' },
  { name: 'ANIMAL_READ', description: 'Visualizar animais' },
  { name: 'ANIMAL_WRITE', description: 'Editar animais' },
  { name: 'CAMPAIGN_READ', description: 'Visualizar campanhas' },
  { name: 'CAMPAIGN_WRITE', description: 'Editar campanhas' },
  { name: 'MURAL_READ', description: 'Visualizar mural dos anjos' },
  { name: 'MURAL_WRITE', description: 'Moderar mural dos anjos' },
  { name: 'BADGE_READ', description: 'Visualizar selos' },
  { name: 'BADGE_WRITE', description: 'Gerenciar selos' },
  { name: 'TRANSPARENCY_READ', description: 'Visualizar transparência' },
  { name: 'TRANSPARENCY_WRITE', description: 'Editar transparência' },
  { name: 'ADMIN_USERS_MANAGE', description: 'Gerenciar usuários admin' },
  { name: 'AUDIT_READ', description: 'Visualizar logs de auditoria' },
];

const ROLE_PERMISSIONS: Record<string, string[]> = {
  SUPER_ADMIN: PERMISSIONS.map((p) => p.name),
  FINANCEIRO: [
    'PIX_SETTINGS_READ',
    'PIX_SETTINGS_WRITE',
    'PIX_CONFIRM_MANUAL',
    'FINANCE_READ',
    'FINANCE_WRITE',
    'DONOR_READ',
    'TRANSPARENCY_READ',
    'TRANSPARENCY_WRITE',
    'AUDIT_READ',
  ],
  CONTEUDO: [
    'ANIMAL_READ',
    'ANIMAL_WRITE',
    'CAMPAIGN_READ',
    'CAMPAIGN_WRITE',
    'MURAL_READ',
    'MURAL_WRITE',
    'BADGE_READ',
    'BADGE_WRITE',
    'DONOR_READ',
  ],
  VOLUNTARIO: ['ANIMAL_READ', 'DONOR_READ'],
  TRANSPARENCIA: [
    'TRANSPARENCY_READ',
    'TRANSPARENCY_WRITE',
    'FINANCE_READ',
  ],
};

const EXPENSE_CATEGORIES = [
  { name: 'Ração', icon: 'utensils', color: '#B9895D' },
  { name: 'Veterinário', icon: 'stethoscope', color: '#2AA98C' },
  { name: 'Medicamentos', icon: 'pill', color: '#7BBAA9' },
  { name: 'Castração', icon: 'heart', color: '#6A4F36' },
  { name: 'Transporte', icon: 'truck', color: '#DEB88F' },
  { name: 'Limpeza', icon: 'sparkles', color: '#263238' },
  { name: 'Estrutura', icon: 'building', color: '#2AA98C' },
  { name: 'Emergências', icon: 'alert-triangle', color: '#B9895D' },
  { name: 'Outros', icon: 'more-horizontal', color: '#7BBAA9' },
];

const DONATION_PLANS = [
  {
    name: 'Anjo Semente',
    slug: 'anjo-semente',
    value: 9.9,
    description: 'Semente de esperança para nossos pets',
    impactText: 'Alimenta 1 pet por 2 dias',
    badgeName: 'Semente',
    badgeColor: '#DEB88F',
    displayOrder: 1,
  },
  {
    name: 'Anjo Ração',
    slug: 'anjo-racao',
    value: 19.9,
    description: 'Garante alimentação básica mensal',
    impactText: 'Alimenta 1 pet por 1 semana',
    badgeName: 'Ração',
    badgeColor: '#B9895D',
    displayOrder: 2,
  },
  {
    name: 'Anjo Cuidado',
    slug: 'anjo-cuidado',
    value: 39.9,
    description: 'Cuidados veterinários preventivos',
    impactText: 'Vacina 1 pet',
    badgeName: 'Cuidado',
    badgeColor: '#7BBAA9',
    displayOrder: 3,
    isFeatured: true,
  },
  {
    name: 'Anjo Saúde',
    slug: 'anjo-saude',
    value: 79.9,
    description: 'Tratamentos e consultas veterinárias',
    impactText: 'Consulta veterinária completa',
    badgeName: 'Saúde',
    badgeColor: '#2AA98C',
    displayOrder: 4,
  },
  {
    name: 'Anjo Guardião',
    slug: 'anjo-guardiao',
    value: 149.9,
    description: 'Proteção e cuidado integral',
    impactText: 'Cuida de 2 pets por 1 mês',
    badgeName: 'Guardião',
    badgeColor: '#6A4F36',
    displayOrder: 5,
  },
  {
    name: 'Anjo Protetor Master',
    slug: 'anjo-protetor-master',
    value: 299.9,
    description: 'Apoio máximo ao abrigo',
    impactText: 'Impacto transformador mensal',
    badgeName: 'Protetor Master',
    badgeColor: '#2AA98C',
    displayOrder: 6,
    isFeatured: true,
  },
  {
    name: 'Valor Personalizado',
    slug: 'valor-personalizado',
    value: 10,
    description: 'Escolha quanto deseja contribuir por mês',
    impactText: 'Seu impacto, no valor que fizer sentido para você',
    displayOrder: 7,
  },
];

const BADGES = [
  {
    name: 'Primeiro Passo',
    description: 'Primeira doação realizada',
    icon: 'footprints',
    ruleType: 'FIRST_DONATION' as const,
    ruleValue: 1,
  },
  {
    name: 'Anjo Mensal',
    description: '3 meses de assinatura ativa',
    icon: 'calendar',
    ruleType: 'MONTHS_ACTIVE' as const,
    ruleValue: 3,
  },
  {
    name: 'Anjo Fiel',
    description: '6 meses de assinatura ativa',
    icon: 'heart',
    ruleType: 'MONTHS_ACTIVE' as const,
    ruleValue: 6,
  },
  {
    name: 'Anjo Guardião',
    description: '12 meses de assinatura ativa',
    icon: 'shield',
    ruleType: 'MONTHS_ACTIVE' as const,
    ruleValue: 12,
  },
  {
    name: 'Anjo Protetor',
    description: '24 meses de assinatura ativa',
    icon: 'star',
    ruleType: 'MONTHS_ACTIVE' as const,
    ruleValue: 24,
  },
  {
    name: 'Anjo Silencioso',
    description: 'Doação anônima recorrente',
    icon: 'eye-off',
    ruleType: 'MANUAL' as const,
    ruleValue: null,
  },
  {
    name: 'Apoiador de Campanha',
    description: 'Contribuiu em campanha específica confirmada',
    icon: 'target',
    ruleType: 'MANUAL' as const,
    ruleValue: null,
  },
];

async function main() {
  const adminName = process.env.SEED_ADMIN_NAME;
  const adminEmail = process.env.SEED_ADMIN_EMAIL;
  const adminPassword = process.env.SEED_ADMIN_PASSWORD;

  if (!adminName || !adminEmail || !adminPassword) {
    throw new Error(
      'Seed abortada: defina SEED_ADMIN_NAME, SEED_ADMIN_EMAIL e SEED_ADMIN_PASSWORD no ambiente.',
    );
  }

  console.log('Seeding roles...');
  for (const role of ROLES) {
    await prisma.role.upsert({
      where: { name: role.name },
      update: { description: role.description },
      create: role,
    });
  }

  console.log('Seeding permissions...');
  for (const permission of PERMISSIONS) {
    await prisma.permission.upsert({
      where: { name: permission.name },
      update: { description: permission.description },
      create: permission,
    });
  }

  console.log('Seeding role permissions...');
  for (const [roleName, permissionNames] of Object.entries(ROLE_PERMISSIONS)) {
    const role = await prisma.role.findUnique({ where: { name: roleName } });
    if (!role) continue;

    for (const permName of permissionNames) {
      const permission = await prisma.permission.findUnique({
        where: { name: permName },
      });
      if (!permission) continue;

      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: role.id,
            permissionId: permission.id,
          },
        },
        update: {},
        create: { roleId: role.id, permissionId: permission.id },
      });
    }
  }

  console.log('Seeding expense categories...');
  for (const category of EXPENSE_CATEGORIES) {
    const existing = await prisma.expenseCategory.findFirst({
      where: { name: category.name },
    });
    if (existing) {
      await prisma.expenseCategory.update({
        where: { id: existing.id },
        data: category,
      });
    } else {
      await prisma.expenseCategory.create({ data: category });
    }
  }

  console.log('Seeding donation plans...');
  for (const plan of DONATION_PLANS) {
    await prisma.donationPlan.upsert({
      where: { slug: plan.slug },
      update: plan,
      create: { ...plan, isActive: true },
    });
  }

  console.log('Seeding badges...');
  for (const badge of BADGES) {
    const existing = await prisma.badge.findFirst({
      where: { name: badge.name },
    });
    if (existing) {
      await prisma.badge.update({ where: { id: existing.id }, data: badge });
    } else {
      await prisma.badge.create({ data: badge });
    }
  }

  console.log('Seeding admin user...');
  const passwordHash = await bcrypt.hash(adminPassword, 12);
  const superAdminRole = await prisma.role.findUnique({
    where: { name: 'SUPER_ADMIN' },
  });

  const adminUser = await prisma.user.upsert({
    where: { email: adminEmail },
    update: { name: adminName, passwordHash },
    create: {
      name: adminName,
      email: adminEmail,
      passwordHash,
      status: 'ACTIVE',
    },
  });

  if (superAdminRole) {
    await prisma.userRole.upsert({
      where: {
        userId_roleId: { userId: adminUser.id, roleId: superAdminRole.id },
      },
      update: {},
      create: { userId: adminUser.id, roleId: superAdminRole.id },
    });
  }

  console.log('Seeding default pix settings...');
  const existingPix = await prisma.pixSetting.findFirst();
  if (!existingPix) {
    await prisma.pixSetting.create({
      data: {
        receiverName: 'Lar dos Anjos Pet',
        receiverCity: 'BRASILIA',
        pixKey: '00000000000',
        pixKeyType: 'CPF',
        defaultDescription: 'Doacao Lar dos Anjos',
        minAmount: 1,
        allowCustomAmount: true,
        quickAmounts: [10, 25, 50, 100],
        instructions:
          'Após o Pix, envie o comprovante. A confirmação é manual pela administração.',
        requireDonorData: false,
        requireReceiptUpload: true,
        isActive: true,
        environment: 'SANDBOX',
      },
    });
  }

  console.log('Seeding transparency settings...');
  await prisma.systemSetting.upsert({
    where: { key: 'transparency.monthly_goal' },
    update: { value: '15000' },
    create: {
      key: 'transparency.monthly_goal',
      value: '15000',
      description: 'Meta mensal de arrecadação exibida no portal público',
    },
  });

  console.log('Seeding sample public expenses...');
  const existingExpense = await prisma.expense.findFirst();
  if (!existingExpense) {
    const category = await prisma.expenseCategory.findFirst({
      where: { name: 'Ração' },
    });
    if (category) {
      await prisma.expense.create({
        data: {
          categoryId: category.id,
          title: 'Ração premium — junho',
          description: 'Compra interna',
          publicDescription: 'Alimentação dos animais resgatados',
          amount: 850,
          date: new Date(),
          isPublic: true,
          createdById: adminUser.id,
        },
      });
    }
  }

  console.log('Seed concluída com sucesso.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
