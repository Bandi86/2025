import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Team } from './team.entity';
import { League } from './league.entity';
import { Odd } from './odd.entity';
import { Prediction } from './prediction.entity';

@Entity('matches')
export class Match {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Team)
  @JoinColumn({ name: 'home_team_id' })
  homeTeam: Team;

  @ManyToOne(() => Team)
  @JoinColumn({ name: 'away_team_id' })
  awayTeam: Team;

  @ManyToOne(() => League)
  @JoinColumn({ name: 'league_id' })
  league: League;

  @Column({ type: 'timestamptz' })
  matchDate: Date;

  @Column({ type: 'varchar', length: 50 })
  season: string;

  @Column({ type: 'varchar', length: 50, default: 'SCHEDULED' })
  status: string;

  @Column({ type: 'integer', nullable: true })
  homeGoals: number;

  @Column({ type: 'integer', nullable: true })
  awayGoals: number;

  @Column({ type: 'jsonb', nullable: true })
  metadata: any;

  @OneToMany(() => Odd, odd => odd.match)
  odds: Odd[];

  @OneToMany(() => Prediction, prediction => prediction.match)
  predictions: Prediction[];

  @CreateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updatedAt: Date;
}
