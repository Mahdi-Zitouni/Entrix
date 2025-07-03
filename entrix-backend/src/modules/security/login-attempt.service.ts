import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LoginAttempt } from './login-attempt.entity';
import { CreateLoginAttemptDto } from './dto/create-login-attempt.dto';
import { UpdateLoginAttemptDto } from './dto/update-login-attempt.dto';

@Injectable()
export class LoginAttemptService {
  constructor(
    @InjectRepository(LoginAttempt)
    private readonly loginAttemptRepository: Repository<LoginAttempt>,
  ) {}

  async findAll(): Promise<LoginAttempt[]> {
    return this.loginAttemptRepository.find();
  }

  async findOne(id: string): Promise<LoginAttempt> {
    const attempt = await this.loginAttemptRepository.findOne({
      where: { id },
    });
    if (!attempt) throw new NotFoundException('Login attempt not found');
    return attempt;
  }

  async create(createDto: CreateLoginAttemptDto): Promise<LoginAttempt> {
    const attempt = this.loginAttemptRepository.create(createDto);
    return this.loginAttemptRepository.save(attempt);
  }

  async update(
    id: string,
    updateDto: UpdateLoginAttemptDto,
  ): Promise<LoginAttempt> {
    const attempt = await this.findOne(id);
    Object.assign(attempt, updateDto);
    return this.loginAttemptRepository.save(attempt);
  }

  async remove(id: string): Promise<void> {
    const attempt = await this.findOne(id);
    await this.loginAttemptRepository.remove(attempt);
  }

  // Get login history for a user
  async getUserLoginHistory(userId: string) {
    return this.loginAttemptRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }
}
