import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { FastifyRequest } from 'fastify';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/auth.decorators';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthUser } from '../auth/interfaces/auth-user.interface';
import { AnimalsService } from './animals.service';
import {
  CreateAnimalDto,
  ReorderAnimalImagesDto,
  UpdateAnimalDto,
} from './animals.dto';

@Controller('admin/animals')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AnimalsAdminController {
  constructor(private readonly animalsService: AnimalsService) {}

  @Get()
  @RequirePermissions('ANIMAL_READ')
  findAll() {
    return this.animalsService.findAllAdmin();
  }

  @Post('images/upload')
  @RequirePermissions('ANIMAL_WRITE')
  async uploadImage(@Req() req: FastifyRequest, @CurrentUser() user: AuthUser) {
    const file = await req.file();
    if (!file) {
      throw new BadRequestException('Nenhum arquivo enviado');
    }

    const buffer = await file.toBuffer();
    return this.animalsService.uploadImage(buffer, file.mimetype, user.id);
  }

  @Get(':id')
  @RequirePermissions('ANIMAL_READ')
  findOne(@Param('id') id: string) {
    return this.animalsService.findOneAdmin(id);
  }

  @Post()
  @RequirePermissions('ANIMAL_WRITE')
  create(@Body() dto: CreateAnimalDto, @CurrentUser() user: AuthUser) {
    return this.animalsService.create(dto, user.id);
  }

  @Patch(':id/images/order')
  @RequirePermissions('ANIMAL_WRITE')
  reorderImages(
    @Param('id') id: string,
    @Body() dto: ReorderAnimalImagesDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.animalsService.reorderImages(id, dto, user.id);
  }

  @Patch(':id')
  @RequirePermissions('ANIMAL_WRITE')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateAnimalDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.animalsService.update(id, dto, user.id);
  }

  @Delete(':id')
  @RequirePermissions('ANIMAL_WRITE')
  remove(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.animalsService.remove(id, user.id);
  }
}
