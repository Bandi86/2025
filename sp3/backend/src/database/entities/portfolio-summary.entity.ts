import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('portfolio_summary')
export class PortfolioSummary {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'integer' })
  month: number;

  @Column({ type: 'integer' })
  year: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  startingBalance: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  endingBalance: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0.00 })
  totalStaked: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0.00 })
  totalProfitLoss: number;

  @Column({ type: 'decimal', precision: 10, scale: 4, nullable: true })
  roi: number;

  @Column({ type: 'decimal', precision: 5, scale: 4, nullable: true })
  winRate: number;

  @Column({ type: 'integer', default: 0 })
  totalBets: number;

  @Column({ type: 'integer', default: 0 })
  wonBets: number;

  @Column({ type: 'integer', default: 0 })
  lostBets: number;

  @CreateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updatedAt: Date;
}
