import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AsaasService } from '../../integrations/asaas/asaas.service';
import { AsaasCustomerInput } from '../../integrations/asaas/asaas.types';

export interface DonorInput {
  fullName: string;
  email: string;
  cpfCnpj?: string;
  phone?: string;
  postalCode?: string;
  address?: string;
  addressNumber?: string;
  addressComplement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
}

@Injectable()
export class DonorsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly asaasService: AsaasService,
  ) {}

  async findOrCreate(input: DonorInput) {
    const email = input.email.toLowerCase();

    let donor = await this.prisma.donor.findFirst({
      where: { email },
    });

    if (!donor) {
      donor = await this.prisma.donor.create({
        data: {
          fullName: input.fullName,
          email,
          cpfCnpj: input.cpfCnpj,
          phone: input.phone,
          zipCode: input.postalCode,
          address: input.address,
          addressNumber: input.addressNumber,
          addressComplement: input.addressComplement,
          neighborhood: input.neighborhood,
          city: input.city,
          state: input.state,
        },
      });
    }

    if (!donor.asaasCustomerId) {
      const asaasCustomer = await this.syncAsaasCustomer(donor.id, {
        name: input.fullName,
        email,
        cpfCnpj: input.cpfCnpj,
        phone: input.phone,
        mobilePhone: input.phone,
        postalCode: input.postalCode,
        address: input.address,
        addressNumber: input.addressNumber,
        complement: input.addressComplement,
        province: input.neighborhood,
        city: input.city,
        state: input.state,
      });

      donor = await this.prisma.donor.update({
        where: { id: donor.id },
        data: { asaasCustomerId: asaasCustomer.id },
      });
    }

    return donor;
  }

  private async syncAsaasCustomer(
    donorId: string,
    input: AsaasCustomerInput,
  ) {
    const donor = await this.prisma.donor.findUnique({ where: { id: donorId } });
    if (donor?.asaasCustomerId) {
      return this.asaasService.updateCustomer(donor.asaasCustomerId, input);
    }
    return this.asaasService.createCustomer(input);
  }
}
