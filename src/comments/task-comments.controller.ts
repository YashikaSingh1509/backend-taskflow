import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import {
  CurrentUser,
  JwtUser,
} from '../common/decorators/current-user.decorator';

@ApiTags('comments')
@ApiBearerAuth('access-token')
@UseGuards(AuthGuard('jwt'))
@Controller('tasks')
export class TaskCommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post(':taskId/comments')
  @ApiOperation({ summary: 'Add a comment on a task' })
  create(
    @Param('taskId', ParseUUIDPipe) taskId: string,
    @Body() dto: CreateCommentDto,
    @CurrentUser() user: JwtUser,
  ) {
    return this.commentsService.create(taskId, dto, user.userId);
  }

  @Get(':taskId/comments')
  @ApiOperation({ summary: 'List comments for a task' })
  findByTask(@Param('taskId', ParseUUIDPipe) taskId: string) {
    return this.commentsService.findByTask(taskId);
  }
}
