import { IsEnum, IsString, IsOptional, IsBoolean } from 'class-validator';
import {
  TemplateType,
  TemplateFormat,
  OrientationType,
} from '../ticket-templates.entity';

export class CreateTicketTemplateDto {
  @IsEnum(TemplateType)
  templateType: TemplateType;

  @IsEnum(TemplateFormat)
  templateFormat: TemplateFormat;

  @IsEnum(OrientationType)
  orientation: OrientationType;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  templateContent: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  metadata?: Record<string, any>;
}
