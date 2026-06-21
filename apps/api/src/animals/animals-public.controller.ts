import { Body, Controller, Get, HttpCode, Param, Post, Query } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Public } from '../auth/decorators/auth.decorators';
import { AnimalsService } from './animals.service';
import { AdoptionInterestDto, ListAnimalsQueryDto } from './animals.dto';

@Controller('public/animals')
export class AnimalsPublicController {
  constructor(private readonly animalsService: AnimalsService) {}

  @Public()
  @Get()
  findAll(@Query() query: ListAnimalsQueryDto) {
    return this.animalsService.findAllPublic(query);
  }

  @Public()
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.animalsService.findOnePublic(id);
  }

  @Public()
  @Post(':id/adoption-interest')
  @HttpCode(200)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  submitAdoptionInterest(
    @Param('id') id: string,
    @Body() dto: AdoptionInterestDto,
  ) {
    return this.animalsService.submitAdoptionInterest(id, dto);
  }
}
