import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Match } from './match.entity';

@Entity('odds')
export class Odd {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Match, match => match.odds)
  @JoinColumn({ name: 'match_id' })
  match: Match;

  @Column({ type: 'varchar', length: 255 })
  bookmaker: string;

  @Column({ type: 'decimal', precision: 10, scale: 4, nullable: true })
  homeWinOdds: number;

  @Column({ type: 'decimal', precision: 10, scale: 4, nullable: true })
  drawOdds: number;

  @Column({ type: 'decimal', precision: 10, scale: 4, nullable: true })
  awayWinOdds: number;

  @Column({ type: 'decimal', precision: 10, scale: 4, nullable: true })
  overUnder_2_5_over_odds: number;

  @Column({ type: 'decimal', precision: 10, scale: 4, nullable: true })
  overUnder_2_5_under_odds: number;

  @Column({ type: 'decimal', precision: 10, scale: 4, nullable: true })
  btts_yes_odds: number;

  @Column({ type: 'decimal', precision: 10, scale: 4, nullable: true })
  btts_no_odds: number;

  @Column({ type: 'timestamptz' })
  lastUpdated: Date;

  @CreateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updatedAt: Date;
}
