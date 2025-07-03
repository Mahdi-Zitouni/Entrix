import {
  IsEnum,
  IsString,
  IsOptional,
  IsBoolean,
  IsDate,
  IsUUID,
  IsNumber,
} from 'class-validator';
import { PricingRuleType } from '../pricing-rules.entity';

export class CreatePricingRuleDto {
  @IsString()
  code: string;

  @IsEnum(PricingRuleType)
  ruleType: PricingRuleType;

  @IsOptional()
  @IsUUID()
  eventId?: string;

  @IsOptional()
  @IsUUID()
  ticketTypeId?: string;

  @IsOptional()
  @IsNumber()
  value?: number;

  @IsOptional()
  @IsString()
  promoCode?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsDate()
  validFrom?: Date;

  @IsOptional()
  @IsDate()
  validUntil?: Date;

  @IsOptional()
  metadata?: Record<string, any>;
}
