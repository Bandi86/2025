import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Match } from './match.entity';

@Entity('predictions')
export class Prediction {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Match, match => match.predictions)
  @JoinColumn({ name: 'match_id' })
  match: Match;

  @Column({ type: 'varchar', length: 100 })
  modelVersion: string;

  @Column({ type: 'varchar', length: 100 })
  predictedOutcome: string;

  @Column({ type: 'decimal', precision: 5, scale: 4 })
  confidence: number;

  @Column({ type: 'decimal', precision: 10, scale: 4, nullable: true })
  valueScore: number;

  @Column({ type: 'decimal', precision: 10, scale: 4, nullable: true })
  calculatedOdds: number;

  @Column({ type: 'decimal', precision: 10, scale: 4, nullable: true })
  marketOdds: number;

  @CreateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  predictionDate: Date;

  @CreateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updatedAt: Date;
}
