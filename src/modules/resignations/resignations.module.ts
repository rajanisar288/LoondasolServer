import { Module } from '@nestjs/common';
import { ResignationsController } from './resignations.controller';
import { ResignationsService } from './resignations.service';

@Module({
  controllers: [ResignationsController],
  providers: [ResignationsService],
  exports: [ResignationsService],
})
export class ResignationsModule {}
