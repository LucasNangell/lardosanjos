import { Controller, Get, Param, Query } from '@nestjs/common';
import { Public } from '../auth/decorators/auth.decorators';
import { CampaignsService } from './campaigns.service';
import { ListCampaignsQueryDto } from './campaigns.dto';

@Controller('public/campaigns')
export class CampaignsPublicController {
  constructor(private readonly campaignsService: CampaignsService) {}

  @Public()
  @Get()
  findAll(@Query() query: ListCampaignsQueryDto) {
    return this.campaignsService.findAllPublic(query);
  }

  @Public()
  @Get(':slug')
  findOne(@Param('slug') slug: string) {
    return this.campaignsService.findOnePublic(slug);
  }
}
