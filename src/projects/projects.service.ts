import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project } from './entities/project.entity';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';
import { ActivityAction } from '../common/enums/activity-action.enum';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private readonly repo: Repository<Project>,
    private readonly activityLogs: ActivityLogsService,
  ) {}

  async create(dto: CreateProjectDto, ownerId: string): Promise<Project> {
    const project = this.repo.create({
      name: dto.name,
      description: dto.description ?? null,
      key: dto.key ?? null,
      ownerId,
    });
    const saved = await this.repo.save(project);
    await this.activityLogs.log({
      entityType: 'project',
      entityId: saved.id,
      actorId: ownerId,
      action: ActivityAction.PROJECT_CREATED,
      metadata: { name: saved.name },
    });
    return saved;
  }

  findAll(): Promise<Project[]> {
    return this.repo.find({
      order: { updatedAt: 'DESC' },
      relations: { owner: true },
    });
  }

  async findOne(id: string): Promise<Project> {
    const project = await this.repo.findOne({
      where: { id },
      relations: { owner: true },
    });
    if (!project) {
      throw new NotFoundException('Project not found');
    }
    return project;
  }

  async update(
    id: string,
    dto: UpdateProjectDto,
    userId: string,
  ): Promise<Project> {
    const project = await this.findOne(id);
    if (project.ownerId !== userId) {
      throw new ForbiddenException('Only the project owner can update');
    }
    Object.assign(project, dto);
    const saved = await this.repo.save(project);
    await this.activityLogs.log({
      entityType: 'project',
      entityId: id,
      actorId: userId,
      action: ActivityAction.PROJECT_UPDATED,
      metadata: { changes: dto },
    });
    return saved;
  }

  async remove(id: string, userId: string): Promise<void> {
    const project = await this.findOne(id);
    if (project.ownerId !== userId) {
      throw new ForbiddenException('Only the project owner can delete');
    }
    await this.activityLogs.log({
      entityType: 'project',
      entityId: id,
      actorId: userId,
      action: ActivityAction.PROJECT_DELETED,
      metadata: { name: project.name },
    });
    await this.repo.remove(project);
  }
}
