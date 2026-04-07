import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ActivityLog } from './entities/activity-log.entity';
import { ActivityAction } from '../common/enums/activity-action.enum';

@Injectable()
export class ActivityLogsService {
  constructor(
    @InjectRepository(ActivityLog)
    private readonly repo: Repository<ActivityLog>,
  ) {}

  async log(params: {
    entityType: 'project' | 'task';
    entityId: string;
    actorId: string;
    action: ActivityAction;
    metadata?: Record<string, unknown>;
  }): Promise<void> {
    await this.repo.save(
      this.repo.create({
        entityType: params.entityType,
        entityId: params.entityId,
        actorId: params.actorId,
        action: params.action,
        metadata: params.metadata ?? null,
      }),
    );
  }

  findForTask(taskId: string) {
    return this.repo.find({
      where: { entityType: 'task', entityId: taskId },
      relations: { actor: true },
      order: { createdAt: 'DESC' },
    });
  }

  findForProject(projectId: string) {
    return this.repo.find({
      where: { entityType: 'project', entityId: projectId },
      relations: { actor: true },
      order: { createdAt: 'DESC' },
    });
  }
}
