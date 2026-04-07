import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task } from './entities/task.entity';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TaskStatus } from '../common/enums/task-status.enum';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';
import { ActivityAction } from '../common/enums/activity-action.enum';
import { ProjectsService } from '../projects/projects.service';
import { UsersService } from '../users/users.service';

const ALLOWED_TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
  [TaskStatus.TODO]: [TaskStatus.IN_PROGRESS],
  [TaskStatus.IN_PROGRESS]: [TaskStatus.TODO, TaskStatus.DONE],
  [TaskStatus.DONE]: [TaskStatus.IN_PROGRESS],
};

function assertStatusTransition(from: TaskStatus, to: TaskStatus): void {
  if (from === to) {
    return;
  }
  const allowed = ALLOWED_TRANSITIONS[from];
  if (!allowed?.includes(to)) {
    throw new BadRequestException(
      `Invalid status change from "${from}" to "${to}". Allowed next states: ${allowed?.join(', ') ?? 'none'}`,
    );
  }
}

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private readonly repo: Repository<Task>,
    private readonly projectsService: ProjectsService,
    private readonly usersService: UsersService,
    private readonly activityLogs: ActivityLogsService,
  ) {}

  async create(dto: CreateTaskDto, reporterId: string): Promise<Task> {
    await this.projectsService.findOne(dto.projectId);
    if (dto.assigneeId) {
      await this.usersService.findById(dto.assigneeId);
    }
    const task = this.repo.create({
      title: dto.title,
      description: dto.description ?? null,
      projectId: dto.projectId,
      reporterId,
      assigneeId: dto.assigneeId ?? null,
      status: TaskStatus.TODO,
    });
    const saved = await this.repo.save(task);
    await this.activityLogs.log({
      entityType: 'task',
      entityId: saved.id,
      actorId: reporterId,
      action: ActivityAction.TASK_CREATED,
      metadata: {
        title: saved.title,
        projectId: saved.projectId,
        assigneeId: saved.assigneeId,
      },
    });
    return this.findOne(saved.id);
  }

  async findByProject(projectId: string): Promise<Task[]> {
    await this.projectsService.findOne(projectId);
    return this.repo.find({
      where: { projectId },
      relations: { assignee: true, reporter: true },
      order: { updatedAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Task> {
    const task = await this.repo.findOne({
      where: { id },
      relations: { assignee: true, reporter: true, project: true },
    });
    if (!task) {
      throw new NotFoundException('Task not found');
    }
    return task;
  }

  async update(id: string, dto: UpdateTaskDto, actorId: string): Promise<Task> {
    const task = await this.findOne(id);
    Object.assign(task, dto);
    const saved = await this.repo.save(task);
    await this.activityLogs.log({
      entityType: 'task',
      entityId: id,
      actorId,
      action: ActivityAction.TASK_UPDATED,
      metadata: { changes: dto },
    });
    return this.findOne(saved.id);
  }

  async changeStatus(
    id: string,
    status: TaskStatus,
    actorId: string,
  ): Promise<Task> {
    const task = await this.findOne(id);
    assertStatusTransition(task.status, status);
    const previous = task.status;
    task.status = status;
    await this.repo.save(task);
    await this.activityLogs.log({
      entityType: 'task',
      entityId: id,
      actorId,
      action: ActivityAction.TASK_STATUS_CHANGED,
      metadata: { from: previous, to: status },
    });
    return this.findOne(id);
  }

  async assign(
    id: string,
    assigneeId: string | null,
    actorId: string,
  ): Promise<Task> {
    const task = await this.findOne(id);
    if (assigneeId) {
      await this.usersService.findById(assigneeId);
    }
    const previous = task.assigneeId;
    task.assigneeId = assigneeId;
    await this.repo.save(task);
    await this.activityLogs.log({
      entityType: 'task',
      entityId: id,
      actorId,
      action:
        task.assigneeId == null
          ? ActivityAction.TASK_UNASSIGNED
          : ActivityAction.TASK_ASSIGNED,
      metadata: {
        previousAssigneeId: previous,
        assigneeId: task.assigneeId,
      },
    });
    return this.findOne(id);
  }

  async remove(id: string, actorId: string): Promise<void> {
    const task = await this.findOne(id);
    await this.activityLogs.log({
      entityType: 'task',
      entityId: id,
      actorId,
      action: ActivityAction.TASK_DELETED,
      metadata: { title: task.title },
    });
    await this.repo.remove(task);
  }
}
