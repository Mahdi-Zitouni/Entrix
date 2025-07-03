import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
} from '@nestjs/common';
import { SubscriptionService } from './subscription.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';

@Controller('subscriptions')
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @Get()
  async findAll() {
    return this.subscriptionService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.subscriptionService.findOne(id);
  }

  @Post()
  async create(@Body() createDto: CreateSubscriptionDto) {
    return this.subscriptionService.create(createDto);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateSubscriptionDto,
  ) {
    return this.subscriptionService.update(id, updateDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.subscriptionService.remove(id);
    return { message: 'Subscription deleted successfully' };
  }
}
