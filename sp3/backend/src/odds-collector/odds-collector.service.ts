import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { League } from '../database/entities/league.entity';
import { Team } from '../database/entities/team.entity';
import { Match } from '../database/entities/match.entity';
import { Odd } from '../database/entities/odd.entity';
import { exec } from 'child_process';

@Injectable()
export class OddsCollectorService {
  private readonly logger = new Logger(OddsCollectorService.name);

  constructor(
    @InjectRepository(League) private leagueRepository: Repository<League>,
    @InjectRepository(Team) private teamRepository: Repository<Team>,
    @InjectRepository(Match) private matchRepository: Repository<Match>,
    @InjectRepository(Odd) private oddRepository: Repository<Odd>,
  ) {}

  async processPdfOdds(ocrContent: string): Promise<string> {
    this.logger.log('Starting PDF odds processing...');
    const pythonScriptPath = 'parse_tippmix_pdf.py';
    const pythonExecutable = '/home/bandi/Documents/code/2025/sp3/ml_pipeline/venv/bin/python';

    return new Promise((resolve, reject) => {
      // Pass OCR content via stdin to avoid command line argument length limits
      const child = exec(`${pythonExecutable} ${pythonScriptPath}`, (error, stdout, stderr) => {
        if (error) {
          this.logger.error(`exec error: ${error}`);
          this.logger.error(`stderr: ${stderr}`);
          return reject(`PDF processing failed: ${stderr || error.message}`);
        }
        if (stderr) {
          this.logger.warn(`Python script stderr: ${stderr}`);
        }
        this.logger.log(`Python script stdout: ${stdout}`);

        try {
          const parsedData = JSON.parse(stdout);
          this.saveParsedOddsToDb(parsedData);
          resolve('PDF odds processing completed. Check logs for details.');
        } catch (parseError) {
          this.logger.error(`Error parsing Python script output: ${parseError}`);
          reject(`Failed to parse Python script output: ${parseError.message}`);
        }
      });
      child.stdin.write(ocrContent);
      child.stdin.end();
    });
  }

  private async saveParsedOddsToDb(parsedData: any[]): Promise<void> {
    for (const matchData of parsedData) {
      const { date, time, sorszam, home_team, away_team, markets } = matchData;

      // Assuming a default league for now, or you can try to infer it
      let league = await this.leagueRepository.findOne({ where: { name: 'Premier League' } });
      if (!league) {
        league = this.leagueRepository.create({ name: 'Premier League', country: 'England' });
        await this.leagueRepository.save(league);
      }

      let homeTeam = await this.teamRepository.findOne({ where: { name: home_team } });
      if (!homeTeam) {
        homeTeam = this.teamRepository.create({ name: home_team, league: league });
        await this.teamRepository.save(homeTeam);
      }

      let awayTeam = await this.teamRepository.findOne({ where: { name: away_team } });
      if (!awayTeam) {
        awayTeam = this.teamRepository.create({ name: away_team, league: league });
        await this.teamRepository.save(awayTeam);
      }

      const matchDate = new Date(`${date.replace(' ', 'T')} ${time}:00`); // Adjust format as needed

      let match = await this.matchRepository.findOne({
        where: {
          homeTeam: { id: homeTeam.id },
          awayTeam: { id: awayTeam.id },
          matchDate: matchDate,
        },
        relations: ['homeTeam', 'awayTeam'],
      });

      if (!match) {
        match = this.matchRepository.create({
          homeTeam: homeTeam,
          awayTeam: awayTeam,
          league: league,
          matchDate: matchDate,
          season: '2024/2025', // This should be dynamically determined
          status: 'SCHEDULED',
        });
        await this.matchRepository.save(match);
        this.logger.log(`Created new match: ${homeTeam.name} vs ${awayTeam.name}`);
      }

      // Save/Update Odds
      const bookmakerName = 'Tippmix'; // Assuming all odds are from Tippmix
      let existingOdd = await this.oddRepository.findOne({
        where: {
          match: { id: match.id },
          bookmaker: bookmakerName,
        },
      });

      const oddsToSave: Partial<Odd> = {
        match: match,
        bookmaker: bookmakerName,
        lastUpdated: new Date(),
      };

      if (markets['1X2']) {
        oddsToSave.homeWinOdds = markets['1X2'].home_win;
        oddsToSave.drawOdds = markets['1X2'].draw;
        oddsToSave.awayWinOdds = markets['1X2'].away_win;
      }
      if (markets['Gólszám 2.5']) {
        oddsToSave.overUnder_2_5_over_odds = markets['Gólszám 2.5'].over;
        oddsToSave.overUnder_2_5_under_odds = markets['Gólszám 2.5'].under;
      }
      if (markets['Mindkét csapat szerez gólt']) {
        oddsToSave.btts_yes_odds = markets['Mindkét csapat szerez gólt'].yes;
        oddsToSave.btts_no_odds = markets['Mindkét csapat szerez gólt'].no;
      }

      if (existingOdd) {
        await this.oddRepository.update(existingOdd.id, oddsToSave);
        this.logger.debug(`Updated odds for ${bookmakerName} for match ${match.id}`);
      } else {
        const newOdd = this.oddRepository.create(oddsToSave);
        await this.oddRepository.save(newOdd);
        this.logger.debug(`Created new odds for ${bookmakerName} for match ${match.id}`);
      }
    }
  }
}
