import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Matches, IsOptional } from 'class-validator';

@Entity('user_profiles')
export class UserProfile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => User, (user) => user.profile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'date', nullable: true })
  dateOfBirth: Date;

  @Column({ nullable: true })
  gender: string;

  @Column({ nullable: true })
  address: string;

  @Column({ nullable: true })
  city: string;

  @Column({ default: 'TN' })
  country: string;

  @Column({ default: 'fr' })
  language: string;

  @Column({ default: true })
  notifications: boolean;

  @Column({ default: false })
  newsletter: boolean;

  @Column({ type: 'date', nullable: true })
  supporterSince: Date;

  @Column({ nullable: true })
  favoritePlayer: string;

  @IsOptional()
  @Matches(/^\d{8}$/, { message: 'CIN must be exactly 8 digits' })
  @Column({
    nullable: true,
    unique: true,
    length: 8,
    comment: "Numéro de Carte d'Identité Nationale (CIN), 8 chiffres Tunisie",
  })
  cin: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
