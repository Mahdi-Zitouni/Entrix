import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SecurityPolicy } from './security-policy.entity';
import { CreateSecurityPolicyDto } from './dto/create-security-policy.dto';
import { UpdateSecurityPolicyDto } from './dto/update-security-policy.dto';

@Injectable()
export class SecurityPolicyService {
  constructor(
    @InjectRepository(SecurityPolicy)
    private readonly securityPolicyRepository: Repository<SecurityPolicy>,
  ) {}

  async findAll(): Promise<SecurityPolicy[]> {
    return this.securityPolicyRepository.find();
  }

  async findOne(id: string): Promise<SecurityPolicy> {
    const policy = await this.securityPolicyRepository.findOne({
      where: { id },
    });
    if (!policy) throw new NotFoundException('Security policy not found');
    return policy;
  }

  async create(createDto: CreateSecurityPolicyDto): Promise<SecurityPolicy> {
    const policy = this.securityPolicyRepository.create(createDto);
    return this.securityPolicyRepository.save(policy);
  }

  async update(
    id: string,
    updateDto: UpdateSecurityPolicyDto,
  ): Promise<SecurityPolicy> {
    const policy = await this.findOne(id);
    Object.assign(policy, updateDto);
    return this.securityPolicyRepository.save(policy);
  }

  async remove(id: string): Promise<void> {
    const policy = await this.findOne(id);
    await this.securityPolicyRepository.remove(policy);
  }
}
