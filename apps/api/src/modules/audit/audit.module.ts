import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditLog } from './entities/audit-log.entity';
import { AuditService } from './services/audit.service';
import { AuditCommandRepository } from './repositories/audit.command.repository';

@Module({
  imports: [TypeOrmModule.forFeature([AuditLog])],
  providers: [AuditService, AuditCommandRepository],
  exports: [AuditService],
})
export class AuditModule {}
