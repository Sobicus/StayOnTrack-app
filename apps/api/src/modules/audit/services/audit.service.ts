import { Injectable } from '@nestjs/common';
import { AuditCommandRepository } from '../repositories/audit.command.repository';

@Injectable()
export class AuditService {
  constructor(
    private readonly commandRepo: AuditCommandRepository,
  ) {}

  async log(
    userId: string,
    action: string,
    metadata?: Record<string, any>,
    ipAddress?: string,
  ): Promise<void> {
    await this.commandRepo.createLog(
      userId,
      action,
      metadata || null,
      ipAddress || null,
    ).catch(() => {});
  }
}
