import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Prediction } from './prediction.entity';
import { Match } from './match.entity';

@Entity('bets')
export class Bet {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Prediction)
  @JoinColumn({ name: 'prediction_id' })
  prediction: Prediction;

  @ManyToOne(() => Match)
  @JoinColumn({ name: 'match_id' })
  match: Match;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  stakeAmount: number;

  @Column({ type: 'decimal', precision: 10, scale: 4 })
  oddsPlaced: number;

  @Column({ type: 'varchar', length: 100 })
  betType: string;

  @Column({ type: 'varchar', length: 50, default: 'PENDING' })
  status: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  potentialWinnings: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  actualProfitLoss: number;

  @CreateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  placedAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  settledAt: Date;

  @CreateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updatedAt: Date;
}
