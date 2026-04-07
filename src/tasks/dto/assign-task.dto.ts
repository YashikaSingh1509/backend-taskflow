import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, ValidateIf } from 'class-validator';

export class AssignTaskDto {
  @ApiProperty({
    nullable: true,
    description: 'User id to assign, or JSON null to unassign',
  })
  @ValidateIf((_, v) => v !== null)
  @IsUUID()
  assigneeId: string | null;
}
