import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaymentAttempt } from './payment-attempt.entity';
import { CreatePaymentAttemptDto } from './dto/create-payment-attempt.dto';

@Injectable()
export class PaymentAttemptService {
  constructor(
    @InjectRepository(PaymentAttempt)
    private readonly paymentAttemptRepository: Repository<PaymentAttempt>,
  ) {}

  create(dto: CreatePaymentAttemptDto) {
    const entity = this.paymentAttemptRepository.create(dto);
    return this.paymentAttemptRepository.save(entity);
  }

  findAll() {
    return this.paymentAttemptRepository.find();
  }

  findOne(id: string) {
    return this.paymentAttemptRepository.findOne({ where: { id } });
  }

  update(id: string, dto: Partial<CreatePaymentAttemptDto>) {
    return this.paymentAttemptRepository.update(id, dto);
  }

  remove(id: string) {
    return this.paymentAttemptRepository.delete(id);
  }
}
