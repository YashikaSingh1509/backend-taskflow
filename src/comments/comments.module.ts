import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Comment } from './entities/comment.entity';
import { Task } from '../tasks/entities/task.entity';
import { CommentsService } from './comments.service';
import { CommentsController } from './comments.controller';
import { TaskCommentsController } from './task-comments.controller';
import { ActivityLogsModule } from '../activity-logs/activity-logs.module';

@Module({
  imports: [TypeOrmModule.forFeature([Comment, Task]), ActivityLogsModule],
  controllers: [CommentsController, TaskCommentsController],
  providers: [CommentsService],
})
export class CommentsModule {}
