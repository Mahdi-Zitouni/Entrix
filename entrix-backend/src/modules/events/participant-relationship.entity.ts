import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('participant_relationships')
export class ParticipantRelationship {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  participantAId: string;

  @Column()
  participantBId: string;

  @Column()
  relationshipType: string; // RIVALRY, PARTNERSHIP, SUBSIDIARY, ALLIANCE, COMPETITION, COLLABORATION, FEUD, FRIENDSHIP

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'jsonb', nullable: true })
  metadata: any;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
