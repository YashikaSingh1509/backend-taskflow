import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { ChangeTaskStatusDto } from './dto/change-task-status.dto';
import { AssignTaskDto } from './dto/assign-task.dto';
import {
  CurrentUser,
  JwtUser,
} from '../common/decorators/current-user.decorator';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';

@ApiTags('tasks')
@ApiBearerAuth('access-token')
@UseGuards(AuthGuard('jwt'))
@Controller('tasks')
export class TasksController {
  constructor(
    private readonly tasksService: TasksService,
    private readonly activityLogsService: ActivityLogsService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a task (starts in To Do)' })
  create(@Body() dto: CreateTaskDto, @CurrentUser() user: JwtUser) {
    return this.tasksService.create(dto, user.userId);
  }

  @Get('by-project/:projectId')
  @ApiOperation({ summary: 'List tasks in a project' })
  findByProject(@Param('projectId', ParseUUIDPipe) projectId: string) {
    return this.tasksService.findByProject(projectId);
  }

  @Get(':id/activity')
  @ApiOperation({ summary: 'Activity timeline for this task' })
  activity(@Param('id', ParseUUIDPipe) id: string) {
    return this.activityLogsService.findForTask(id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get task with relations' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.tasksService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update title / description' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTaskDto,
    @CurrentUser() user: JwtUser,
  ) {
    return this.tasksService.update(id, dto, user.userId);
  }

  @Patch(':id/status')
  @ApiOperation({
    summary: 'Move task through workflow',
    description:
      'Allowed: todo→in_progress; in_progress→todo|done; done→in_progress',
  })
  changeStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ChangeTaskStatusDto,
    @CurrentUser() user: JwtUser,
  ) {
    return this.tasksService.changeStatus(id, dto.status, user.userId);
  }

  @Patch(':id/assign')
  @ApiOperation({ summary: 'Assign or unassign a user' })
  assign(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AssignTaskDto,
    @CurrentUser() user: JwtUser,
  ) {
    return this.tasksService.assign(id, dto.assigneeId, user.userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete task' })
  remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: JwtUser) {
    return this.tasksService.remove(id, user.userId);
  }
}
