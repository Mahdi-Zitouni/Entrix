import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PricingRules, PricingRuleType } from './pricing-rules.entity';
import { CreatePricingRuleDto } from './dto/create-pricing-rule.dto';

@Injectable()
export class PricingRulesService {
  constructor(
    @InjectRepository(PricingRules)
    private readonly pricingRulesRepository: Repository<PricingRules>,
  ) {}

  create(dto: CreatePricingRuleDto) {
    const entity = this.pricingRulesRepository.create(dto);
    return this.pricingRulesRepository.save(entity);
  }

  findAll() {
    return this.pricingRulesRepository.find();
  }

  findOne(id: string) {
    return this.pricingRulesRepository.findOne({ where: { id } });
  }

  update(id: string, dto: Partial<CreatePricingRuleDto>) {
    return this.pricingRulesRepository.update(id, dto);
  }

  remove(id: string) {
    return this.pricingRulesRepository.delete(id);
  }

  // Fetch all applicable rules for a ticket/user/context
  async getApplicableRules(params: {
    eventId?: string;
    ticketTypeId?: string;
    userGroupId?: string;
    promoCode?: string;
    now?: Date;
    geo?: string;
  }): Promise<PricingRules[]> {
    const qb = this.pricingRulesRepository
      .createQueryBuilder('rule')
      .where('rule.isActive = true');
    if (params.eventId)
      qb.andWhere('rule.event = :eventId', { eventId: params.eventId });
    if (params.ticketTypeId)
      qb.andWhere('rule.ticketType = :ticketTypeId', {
        ticketTypeId: params.ticketTypeId,
      });
    if (params.userGroupId)
      qb.andWhere('rule.userGroupId = :userGroupId', {
        userGroupId: params.userGroupId,
      });
    if (params.promoCode)
      qb.andWhere('rule.promoCode = :promoCode', {
        promoCode: params.promoCode,
      });
    if (params.now)
      qb.andWhere(
        '(rule.validFrom IS NULL OR rule.validFrom <= :now) AND (rule.validUntil IS NULL OR rule.validUntil >= :now)',
        { now: params.now },
      );
    // Add geo-based filtering if needed
    return qb.orderBy('rule.priority', 'DESC').getMany();
  }

  // Calculate final price based on rules
  calculatePrice(
    basePrice: number,
    rules: PricingRules[],
    context: Record<string, unknown>,
  ): number {
    let price = basePrice;
    for (const rule of rules) {
      switch (rule.ruleType) {
        case PricingRuleType.PERCENTAGE:
          price = price - price * (rule.value / 100);
          break;
        case PricingRuleType.FIXED_AMOUNT:
          price = price - rule.value;
          break;
        case PricingRuleType.BULK_DISCOUNT:
          if (
            typeof context.quantity === 'number' &&
            context.quantity >= (typeof rule.metadata?.minQuantity === 'number' ? rule.metadata.minQuantity : 10)
          ) {
            price = price - rule.value * context.quantity;
          }
          break;
        case PricingRuleType.EARLY_BIRD:
        case PricingRuleType.LAST_MINUTE:
        case PricingRuleType.TIME_WINDOW:
          // Assume value is percentage discount
          price = price - price * (rule.value / 100);
          break;
        case PricingRuleType.GEO_BASED:
          if (
            typeof context.geo === 'string' &&
            rule.metadata?.geo === context.geo
          ) {
            price = price - price * (rule.value / 100);
          }
          break;
        case PricingRuleType.PROMO_CODE:
          if (
            typeof context.promoCode === 'string' &&
            rule.promoCode === context.promoCode
          ) {
            price = price - price * (rule.value / 100);
          }
          break;
        // Add more rule types as needed
      }
    }
    return Math.max(price, 0);
  }

  // Preview price for a ticket/user
  async previewPrice(params: {
    basePrice: number;
    eventId?: string;
    ticketTypeId?: string;
    userGroupId?: string;
    promoCode?: string;
    now?: Date;
    geo?: string;
    quantity?: number;
  }): Promise<{ finalPrice: number; appliedRules: PricingRules[] }> {
    const rules = await this.getApplicableRules(params);
    const finalPrice = this.calculatePrice(params.basePrice, rules, params);
    return { finalPrice, appliedRules: rules };
  }
}
