import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  Unique,
} from 'typeorm';

export enum TemplateType {
  TICKET = 'TICKET',
  SUBSCRIPTION = 'SUBSCRIPTION',
  INVITATION = 'INVITATION',
  PASS = 'PASS',
  RECEIPT = 'RECEIPT',
}

export enum TemplateFormat {
  PDF = 'PDF',
  HTML = 'HTML',
  PNG = 'PNG',
  THERMAL = 'THERMAL',
}

export enum OrientationType {
  PORTRAIT = 'PORTRAIT',
  LANDSCAPE = 'LANDSCAPE',
}

@Entity('ticket_templates')
@Index(['templateType'])
@Index(['templateFormat'])
@Index(['isActive'])
@Unique(['templateType', 'name'])
@Index(['templateContent'])
export class TicketTemplates {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: TemplateType,
  })
  templateType: TemplateType;

  @Column({
    type: 'enum',
    enum: TemplateFormat,
  })
  templateFormat: TemplateFormat;

  @Column({
    type: 'enum',
    enum: OrientationType,
  })
  orientation: OrientationType;

  @Column({ nullable: false })
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({ type: 'text', nullable: false })
  templateContent: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt: Date;
}
