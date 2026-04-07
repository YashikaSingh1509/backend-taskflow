import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Length, MaxLength } from 'class-validator';

export class CreateProjectDto {
  @ApiProperty({ example: 'Platform' })
  @IsString()
  @MaxLength(200)
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'PLAT', description: 'Short key / prefix' })
  @IsOptional()
  @IsString()
  @Length(2, 16)
  key?: string;
}
