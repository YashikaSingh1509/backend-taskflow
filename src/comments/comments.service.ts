import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Comment } from './entities/comment.entity';
import { Task } from '../tasks/entities/task.entity';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';
import { ActivityAction } from '../common/enums/activity-action.enum';

@Injectable()
export class CommentsService {
  constructor(
    @InjectRepository(Comment)
    private readonly commentsRepo: Repository<Comment>,
    @InjectRepository(Task)
    private readonly tasksRepo: Repository<Task>,
    private readonly activityLogs: ActivityLogsService,
  ) {}

  private async ensureTask(taskId: string): Promise<Task> {
    const task = await this.tasksRepo.findOne({ where: { id: taskId } });
    if (!task) {
      throw new NotFoundException('Task not found');
    }
    return task;
  }

  async create(
    taskId: string,
    dto: CreateCommentDto,
    authorId: string,
  ): Promise<Comment> {
    await this.ensureTask(taskId);
    const comment = this.commentsRepo.create({
      taskId,
      authorId,
      body: dto.body,
    });
    const saved = await this.commentsRepo.save(comment);
    await this.activityLogs.log({
      entityType: 'task',
      entityId: taskId,
      actorId: authorId,
      action: ActivityAction.COMMENT_ADDED,
      metadata: { commentId: saved.id, preview: dto.body.slice(0, 200) },
    });
    return this.commentsRepo.findOneOrFail({
      where: { id: saved.id },
      relations: { author: true },
    });
  }

  async findByTask(taskId: string): Promise<Comment[]> {
    await this.ensureTask(taskId);
    return this.commentsRepo.find({
      where: { taskId },
      relations: { author: true },
      order: { createdAt: 'ASC' },
    });
  }

  async update(
    id: string,
    dto: UpdateCommentDto,
    userId: string,
  ): Promise<Comment> {
    const comment = await this.commentsRepo.findOne({
      where: { id },
      relations: { author: true },
    });
    if (!comment) {
      throw new NotFoundException('Comment not found');
    }
    if (comment.authorId !== userId) {
      throw new ForbiddenException('You can only edit your own comments');
    }
    comment.body = dto.body;
    await this.commentsRepo.save(comment);
    await this.activityLogs.log({
      entityType: 'task',
      entityId: comment.taskId,
      actorId: userId,
      action: ActivityAction.COMMENT_UPDATED,
      metadata: { commentId: id },
    });
    return this.commentsRepo.findOneOrFail({
      where: { id },
      relations: { author: true },
    });
  }

  async remove(id: string, userId: string): Promise<void> {
    const comment = await this.commentsRepo.findOne({ where: { id } });
    if (!comment) {
      throw new NotFoundException('Comment not found');
    }
    if (comment.authorId !== userId) {
      throw new ForbiddenException('You can only delete your own comments');
    }
    await this.activityLogs.log({
      entityType: 'task',
      entityId: comment.taskId,
      actorId: userId,
      action: ActivityAction.COMMENT_DELETED,
      metadata: { commentId: id },
    });
    await this.commentsRepo.remove(comment);
  }
}
