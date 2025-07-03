import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
} from '@nestjs/common';
import { PricingRulesService } from './pricing-rules.service';
import { CreatePricingRuleDto } from './dto/create-pricing-rule.dto';

@Controller('pricing-rules')
export class PricingRulesController {
  constructor(private readonly pricingRulesService: PricingRulesService) {}

  @Post()
  create(@Body() dto: CreatePricingRuleDto) {
    return this.pricingRulesService.create(dto);
  }

  @Get()
  findAll() {
    return this.pricingRulesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.pricingRulesService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: Partial<CreatePricingRuleDto>) {
    return this.pricingRulesService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.pricingRulesService.remove(id);
  }

  @Post('preview')
  async previewPrice(
    @Body()
    body: {
      basePrice: number;
      eventId?: string;
      ticketTypeId?: string;
      userGroupId?: string;
      promoCode?: string;
      now?: Date;
      geo?: string;
      quantity?: number;
    },
  ) {
    return this.pricingRulesService.previewPrice(body);
  }
}
