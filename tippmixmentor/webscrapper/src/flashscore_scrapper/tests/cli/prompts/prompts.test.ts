import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import inquirer from 'inquirer';
import { selectCountry } from '../../../src/cli/prompts/countries';
import { selectLeague } from '../../../src/cli/prompts/leagues';
import { selectSeason } from '../../../src/cli/prompts/season';
import { selectFileType } from '../../../src/cli/prompts/fileType';
import { getListOfCountries } from '../../../src/scraper/services/countries';
import { getListOfLeagues } from '../../../src/scraper/services/leagues';
import { getListOfSeasons } from '../../../src/scraper/services/seasons';
import { Country, League, Season } from '../../../src/types';

// Mock inquirer to control prompt responses
jest.mock('inquirer');
jest.mock('../../../src/scraper/services/countries');
jest.mock('../../../src/scraper/services/leagues');
jest.mock('../../../src/scraper/services/seasons');
jest.mock('../../../src/cli/loader'); // Mock the loader to prevent side effects

const mockedInquirerPrompt = jest.mocked(inquirer.prompt);
const mockedGetListOfCountries = jest.mocked(getListOfCountries);
const mockedGetListOfLeagues = jest.mocked(getListOfLeagues);
const mockedGetListOfSeasons = jest.mocked(getListOfSeasons);

describe('CLI Prompts', () => {
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
  });

  describe('selectCountry', () => {
    it('should return the selected country', async () => {
      const mockCountries: Country[] = [
        { name: 'England', url: 'url1', id: 'g_1' },
        { name: 'Spain', url: 'url2', id: 'g_2' },
      ];
      mockedGetListOfCountries.mockResolvedValue(mockCountries);
      mockedInquirerPrompt.mockResolvedValue({ choice: 'England' });

      const country = await selectCountry();
      expect(country).toEqual(mockCountries[0]);
      expect(mockedGetListOfCountries).toHaveBeenCalled();
      expect(mockedInquirerPrompt).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            type: 'list',
            name: 'choice',
            message: 'Select a country:',
            choices: ['England', 'Spain', 'Cancel', inquirer.Separator],
          }),
        ])
      );
    });

    it('should exit if "Cancel" is selected', async () => {
      mockedGetListOfCountries.mockResolvedValue([]);
      mockedInquirerPrompt.mockResolvedValue({ choice: 'Cancel' });
      const exitSpy = jest.spyOn(process, 'exit').mockImplementation((() => {}) as any);

      await selectCountry();
      expect(exitSpy).toHaveBeenCalledWith(1);
      exitSpy.mockRestore();
    });
  });

  describe('selectLeague', () => {
    it('should return the selected league', async () => {
      const mockLeagues: League[] = [
        { name: 'Premier League', url: 'url1', id: 'l_1' },
        { name: 'La Liga', url: 'url2', id: 'l_2' },
      ];
      mockedGetListOfLeagues.mockResolvedValue(mockLeagues);
      mockedInquirerPrompt.mockResolvedValue({ choice: 'Premier League' });

      const league = await selectLeague('g_1');
      expect(league).toEqual(mockLeagues[0]);
      expect(mockedGetListOfLeagues).toHaveBeenCalledWith(undefined, 'g_1'); // Browser is optional here
    });
  });

  describe('selectSeason', () => {
    it('should return the selected season', async () => {
      const mockSeasons: Season[] = [
        { name: '2023/2024', url: 'url1', id: 's_1' },
        { name: '2022/2023', url: 'url2', id: 's_2' },
      ];
      mockedGetListOfSeasons.mockResolvedValue(mockSeasons);
      mockedInquirerPrompt.mockResolvedValue({ choice: '2023/2024' });

      const season = await selectSeason('g_1', 'l_1');
      expect(season).toEqual(mockSeasons[0]);
      expect(mockedGetListOfSeasons).toHaveBeenCalledWith(undefined, 'g_1', 'l_1');
    });
  });

  describe('selectFileType', () => {
    it('should return the selected file type', async () => {
      mockedInquirerPrompt.mockResolvedValue({ choice: 'json' });

      const fileType = await selectFileType();
      expect(fileType).toBe('json');
      expect(mockedInquirerPrompt).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            type: 'list',
            name: 'choice',
            message: 'Select a file type:',
            choices: ['json', 'csv', 'Cancel', inquirer.Separator],
          }),
        ])
      );
    });
  });
});