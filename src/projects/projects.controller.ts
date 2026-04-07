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
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import {
  CurrentUser,
  JwtUser,
} from '../common/decorators/current-user.decorator';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';

@ApiTags('projects')
@ApiBearerAuth('access-token')
@UseGuards(AuthGuard('jwt'))
@Controller('projects')
export class ProjectsController {
  constructor(
    private readonly projectsService: ProjectsService,
    private readonly activityLogsService: ActivityLogsService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a project (you become owner)' })
  create(@Body() dto: CreateProjectDto, @CurrentUser() user: JwtUser) {
    return this.projectsService.create(dto, user.userId);
  }

  @Get()
  @ApiOperation({ summary: 'List all projects' })
  findAll() {
    return this.projectsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get project by id' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.projectsService.findOne(id);
  }

  @Get(':id/activity')
  @ApiOperation({ summary: 'Activity log for this project' })
  activity(@Param('id', ParseUUIDPipe) id: string) {
    return this.activityLogsService.findForProject(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update project (owner only)' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProjectDto,
    @CurrentUser() user: JwtUser,
  ) {
    return this.projectsService.update(id, dto, user.userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete project (owner only)' })
  remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: JwtUser) {
    return this.projectsService.remove(id, user.userId);
  }
}
