import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from '../entities/audit-log.entity';

@Injectable()
export class AuditCommandRepository {
  constructor(
    @InjectRepository(AuditLog)
    private readonly repo: Repository<AuditLog>,
  ) {}

  async createLog(
    userId: string,
    action: string,
    metadata: Record<string, any> | null,
    ipAddress: string | null,
  ): Promise<void> {
    const entry = this.repo.create({
      userId,
      action,
      metadata,
      ipAddress,
    });
    await this.repo.save(entry);
  }
}
