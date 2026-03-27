import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from './entities/audit-log.entity';

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditRepository: Repository<AuditLog>,
  ) {}

  async log(
    userId: string,
    action: string,
    metadata?: Record<string, any>,
    ipAddress?: string,
  ): Promise<void> {
    const entry = this.auditRepository.create({
      userId,
      action,
      metadata: metadata || null,
      ipAddress: ipAddress || null,
    });
    await this.auditRepository.save(entry).catch(() => {});
  }
}
