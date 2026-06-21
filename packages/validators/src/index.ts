import { z } from 'zod';

export const PixDonationSchema = z.object({
  donor_name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres').optional(),
  donor_email: z.string().email('E-mail inválido').optional(),
  donor_phone: z.string().optional(),
  amount: z.number().positive('O valor deve ser maior que zero'),
  wants_public_mural: z.boolean().default(false),
  wants_anonymous: z.boolean().default(true),
  donor_message: z.string().max(255).optional(),
  campaign_id: z.string().uuid('Campanha inválida').optional(),
});

export type PixDonationInput = z.infer<typeof PixDonationSchema>;
