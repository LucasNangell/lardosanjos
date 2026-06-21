import { Controller, Get, Query } from '@nestjs/common';
import { Public } from '../auth/decorators/auth.decorators';
import { MuralService } from './mural.service';

@Controller('public/mural')
export class MuralPublicController {
  constructor(private readonly muralService: MuralService) {}

  @Public()
  @Get()
  findAll(
    @Query('limit') limit?: string,
    @Query('sort') sort?: 'recent' | 'impact',
  ) {
    const parsed = limit ? parseInt(limit, 10) : 50;
    return this.muralService.findPublicEntries(parsed, sort ?? 'recent');
  }
}
