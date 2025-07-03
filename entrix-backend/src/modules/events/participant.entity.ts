import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('participants')
export class Participant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  code: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  shortName: string;

  @Column()
  type: string; // TEAM, ARTIST, SPEAKER, ORGANIZATION, INDIVIDUAL, REFEREE

  @Column({ nullable: true })
  category: string;

  @Column({ nullable: true })
  nationality: string;

  @Column({ nullable: true })
  city: string;

  @Column({ type: 'date', nullable: true })
  foundedDate: Date;

  @Column({ type: 'date', nullable: true })
  disbandedDate: Date;

  @Column({ nullable: true })
  logoUrl: string;

  @Column({ nullable: true })
  bannerUrl: string;

  @Column({ nullable: true })
  website: string;

  @Column({ nullable: true })
  contactEmail: string;

  @Column({ nullable: true })
  contactPhone: string;

  @Column({ nullable: true })
  contactAddress: string;

  @Column({ type: 'jsonb', nullable: true })
  socialMedia: any;

  @Column({ nullable: true })
  description: string;

  @Column('text', { array: true, nullable: true })
  achievements: string[];

  @Column({ type: 'jsonb', nullable: true })
  statistics: any;

  @Column({ type: 'jsonb', nullable: true })
  metadata: any;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: false })
  isVerified: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
