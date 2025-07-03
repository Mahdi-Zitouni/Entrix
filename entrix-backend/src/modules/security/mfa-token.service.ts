import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MfaToken } from './mfa-token.entity';
import { CreateMfaTokenDto } from './dto/create-mfa-token.dto';
import { UpdateMfaTokenDto } from './dto/update-mfa-token.dto';

@Injectable()
export class MfaTokenService {
  constructor(
    @InjectRepository(MfaToken)
    private readonly mfaTokenRepository: Repository<MfaToken>,
  ) {}

  async findAll(): Promise<MfaToken[]> {
    return this.mfaTokenRepository.find();
  }

  async findOne(id: string): Promise<MfaToken> {
    const token = await this.mfaTokenRepository.findOne({ where: { id } });
    if (!token) throw new NotFoundException('MFA token not found');
    return token;
  }

  async create(createDto: CreateMfaTokenDto): Promise<MfaToken> {
    const token = this.mfaTokenRepository.create(createDto);
    return this.mfaTokenRepository.save(token);
  }

  async update(id: string, updateDto: UpdateMfaTokenDto): Promise<MfaToken> {
    const token = await this.findOne(id);
    Object.assign(token, updateDto);
    return this.mfaTokenRepository.save(token);
  }

  async remove(id: string): Promise<void> {
    const token = await this.findOne(id);
    await this.mfaTokenRepository.remove(token);
  }

  async findOneByUserAndSession(
    userId: string,
    sessionId: string,
  ): Promise<MfaToken | undefined> {
    const result = await this.mfaTokenRepository.findOne({
      where: {
        userId,
        isUsed: false,
        metadata: sessionId ? { sessionId } : undefined,
      },
      order: { createdAt: 'DESC' },
    });
    return result || undefined;
  }
}
