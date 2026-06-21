import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Donor } from '@lardosanjos/database';
import { DONOR_REQUEST_KEY } from '../guards/donor.guard';

export const CurrentDonor = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): Donor => {
    const request = ctx.switchToHttp().getRequest();
    return request[DONOR_REQUEST_KEY];
  },
);
