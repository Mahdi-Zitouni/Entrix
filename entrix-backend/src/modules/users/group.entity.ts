import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { UserGroup } from './user-group.entity';
// Placeholder: import { UserGroup } from './user-group.entity';

export enum GroupType {
  ACCESS = 'ACCESS',
  MARKETING = 'MARKETING',
  MIXED = 'MIXED',
}

@Entity('groups')
export class Group {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  code: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: GroupType,
  })
  type: GroupType;

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  validFrom: Date;

  @Column({ type: 'timestamptz', nullable: true })
  validUntil: Date;

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  maxMembers: number;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown>;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  @OneToMany(() => UserGroup, (userGroup) => userGroup.group)
  userGroups: UserGroup[];

  // Placeholder: Add OneToMany(() => UserGroup, (userGroup) => userGroup.group)
}
