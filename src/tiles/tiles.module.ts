import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TalhaoEntity } from '../talhoes/talhao.entity';
import { TilesController } from './tiles.controller';
import { TilesService } from './tiles.service';

@Module({
  imports: [TypeOrmModule.forFeature([TalhaoEntity])],
  controllers: [TilesController],
  providers: [TilesService],
})
export class TilesModule {}
