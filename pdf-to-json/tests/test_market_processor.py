"""
Unit tests for MarketProcessor class.

Tests cover:
- Market classification functionality
- Game merging logic
- Market type detection algorithms
- Edge cases and error conditions
"""

import unittest
from unittest.mock import patch, MagicMock
from src.converter.market_processor import MarketProcessor


class TestMarketProcessor(unittest.TestCase):
    """Test cases for MarketProcessor class"""
    
    def setUp(self):
        """Set up test fixtures"""
        self.processor = MarketProcessor()
        
        # Sample match data for testing
        self.sample_main_match = {
            'league': 'Premier League',
            'date': '2025. augusztus 5.',
            'time': 'K 20:00',
            'home_team': 'Arsenal',
            'away_team': 'Chelsea',
            'home_odds': 2.50,
            'draw_odds': 3.20,
            'away_odds': 2.80,
            'raw_line': 'K 20:00 65110 Arsenal - Chelsea 2,50 3,20 2,80'
        }
        
        self.sample_handicap_match = {
            'league': 'Premier League',
            'date': '2025. augusztus 5.',
            'time': 'K 20:00',
            'home_team': 'Arsenal Hendikep (-1)',
            'away_team': 'Chelsea',
            'home_odds': 3.50,
            'draw_odds': None,
            'away_odds': 1.30,
            'raw_line': 'K 20:00 Arsenal Hendikep (-1) - Chelsea 3,50 1,30'
        }
        
        self.sample_total_goals_match = {
            'league': 'Premier League',
            'date': '2025. augusztus 5.',
            'time': 'K 20:00',
            'home_team': 'Arsenal Gólszám több mint 2.5',
            'away_team': 'Chelsea kevesebb mint 2.5',
            'home_odds': 1.85,
            'draw_odds': None,
            'away_odds': 1.95,
            'raw_line': 'K 20:00 Arsenal Gólszám több mint 2.5 - Chelsea kevesebb mint 2.5 1,85 1,95'
        }
        
        self.sample_double_chance_match = {
            'league': 'Premier League',
            'date': '2025. augusztus 5.',
            'time': 'K 20:00',
            'home_team': 'Arsenal Kétesély 1X',
            'away_team': 'Chelsea 12',
            'home_odds': 1.25,
            'draw_odds': None,
            'away_odds': 3.75,
            'raw_line': 'K 20:00 Arsenal Kétesély 1X - Chelsea 12 1,25 3,75'
        }
    
    def test_init(self):
        """Test MarketProcessor initialization"""
        processor = MarketProcessor()
        
        # Check that market type patterns are loaded
        self.assertIn('double_chance', processor.market_type_patterns)
        self.assertIn('handicap', processor.market_type_patterns)
        self.assertIn('total_goals', processor.market_type_patterns)
        self.assertIn('both_teams_score', processor.market_type_patterns)
        self.assertIn('half_time', processor.market_type_patterns)
        self.assertIn('first_last_goal', processor.market_type_patterns)
        self.assertIn('draw_no_bet', processor.market_type_patterns)
        
        # Check that special bet keywords are loaded
        self.assertIn('Kétesély', processor.special_bet_keywords)
        self.assertIn('Hendikep', processor.special_bet_keywords)
        self.assertIn('Gólszám', processor.special_bet_keywords)
    
    def test_classify_market_type_main(self):
        """Test classification of main 1X2 markets"""
        market_type = self.processor.classify_market_type(self.sample_main_match)
        self.assertEqual(market_type, 'main')
    
    def test_classify_market_type_handicap(self):
        """Test classification of handicap markets"""
        market_type = self.processor.classify_market_type(self.sample_handicap_match)
        self.assertEqual(market_type, 'handicap')
    
    def test_classify_market_type_total_goals(self):
        """Test classification of total goals markets"""
        market_type = self.processor.classify_market_type(self.sample_total_goals_match)
        self.assertEqual(market_type, 'total_goals')
    
    def test_classify_market_type_double_chance(self):
        """Test classification of double chance markets"""
        market_type = self.processor.classify_market_type(self.sample_double_chance_match)
        self.assertEqual(market_type, 'double_chance')
    
    def test_classify_market_type_unknown(self):
        """Test classification of unknown market types"""
        unknown_match = {
            'home_team': 'Some Unknown Market Type',
            'away_team': 'Another Team',
            'raw_line': 'Some unrecognizable market format'
        }
        market_type = self.processor.classify_market_type(unknown_match)
        self.assertEqual(market_type, 'unknown')
    
    def test_is_main_market_true(self):
        """Test _is_main_market returns True for main markets"""
        self.assertTrue(self.processor._is_main_market(self.sample_main_match))
    
    def test_is_main_market_false_handicap(self):
        """Test _is_main_market returns False for handicap markets"""
        self.assertFalse(self.processor._is_main_market(self.sample_handicap_match))
    
    def test_is_main_market_false_total_goals(self):
        """Test _is_main_market returns False for total goals markets"""
        self.assertFalse(self.processor._is_main_market(self.sample_total_goals_match))
    
    def test_is_main_market_false_double_chance(self):
        """Test _is_main_market returns False for double chance markets"""
        self.assertFalse(self.processor._is_main_market(self.sample_double_chance_match))
    
    def test_create_game_key(self):
        """Test game key creation"""
        game_key = self.processor._create_game_key(self.sample_main_match)
        expected_key = "2025. augusztus 5._K 20:00_Arsenal_Chelsea"
        self.assertEqual(game_key, expected_key)
    
    def test_create_game_key_with_special_characters(self):
        """Test game key creation with special characters in team names"""
        match_with_special_chars = {
            'date': '2025. augusztus 5.',
            'time': 'K 20:00',
            'home_team': 'Arsenal Kétesély 1X',
            'away_team': 'Chelsea Hendikep (+1)'
        }
        game_key = self.processor._create_game_key(match_with_special_chars)
        # Should clean the team names
        self.assertIn('Arsenal', game_key)
        self.assertIn('Chelsea', game_key)
        self.assertNotIn('Kétesély', game_key)
        self.assertNotIn('Hendikep', game_key)
    
    def test_clean_team_name_for_merge(self):
        """Test team name cleaning for merging"""
        # Test removing special bet keywords
        cleaned = self.processor._clean_team_name_for_merge('Arsenal Kétesély 1X')
        self.assertEqual(cleaned, 'Arsenal')
        
        cleaned = self.processor._clean_team_name_for_merge('Chelsea Hendikep (+1)')
        self.assertEqual(cleaned, 'Chelsea')
        
        cleaned = self.processor._clean_team_name_for_merge('Liverpool Gólszám több mint 2.5')
        self.assertEqual(cleaned, 'Liverpool')
        
        # Test that normal team names are preserved
        cleaned = self.processor._clean_team_name_for_merge('Manchester United')
        self.assertEqual(cleaned, 'Manchester United')
    
    def test_clean_team_name_for_merge_edge_cases(self):
        """Test edge cases in team name cleaning"""
        # Test empty result fallback
        cleaned = self.processor._clean_team_name_for_merge('Kétesély')
        self.assertEqual(cleaned, 'Kétesély')  # Should return original if too short
        
        # Test multiple keywords
        cleaned = self.processor._clean_team_name_for_merge('Arsenal Kétesély Hendikep Gólszám')
        self.assertEqual(cleaned, 'Arsenal')
        
        # Test whitespace handling
        cleaned = self.processor._clean_team_name_for_merge('  Arsenal   Kétesély  ')
        self.assertEqual(cleaned, 'Arsenal')
    
    def test_extract_market_info_handicap(self):
        """Test market info extraction for handicap markets"""
        market_info = self.processor._extract_market_info(self.sample_handicap_match)
        
        self.assertEqual(market_info['market_type'], 'handicap')
        self.assertEqual(market_info['priority'], 3)
        self.assertIn('Hendikep', market_info['description'])
        self.assertEqual(market_info['odds']['home_odds'], 3.50)
        self.assertIsNone(market_info['odds']['draw_odds'])
        self.assertEqual(market_info['odds']['away_odds'], 1.30)
    
    def test_extract_market_info_total_goals(self):
        """Test market info extraction for total goals markets"""
        market_info = self.processor._extract_market_info(self.sample_total_goals_match)
        
        self.assertEqual(market_info['market_type'], 'total_goals')
        self.assertEqual(market_info['priority'], 4)
        self.assertIn('Gólszám', market_info['description'])
        self.assertEqual(market_info['odds']['home_odds'], 1.85)
        self.assertEqual(market_info['odds']['away_odds'], 1.95)
    
    def test_extract_market_info_double_chance(self):
        """Test market info extraction for double chance markets"""
        market_info = self.processor._extract_market_info(self.sample_double_chance_match)
        
        self.assertEqual(market_info['market_type'], 'double_chance')
        self.assertEqual(market_info['priority'], 2)
        self.assertIn('Kétesély', market_info['description'])
        self.assertEqual(market_info['odds']['home_odds'], 1.25)
        self.assertEqual(market_info['odds']['away_odds'], 3.75)
    
    def test_extract_market_info_unknown(self):
        """Test market info extraction for unknown markets"""
        unknown_match = {
            'home_team': 'Some Team',
            'away_team': 'Another Team',
            'home_odds': 2.00,
            'away_odds': 1.80,
            'raw_line': 'Unknown market type'
        }
        market_info = self.processor._extract_market_info(unknown_match)
        
        self.assertEqual(market_info['market_type'], 'unknown')
        self.assertEqual(market_info['priority'], 10)
        self.assertIn('Egyéb piac', market_info['description'])
    
    def test_merge_matches_by_game_single_main_market(self):
        """Test merging with single main market"""
        matches = [self.sample_main_match]
        
        merged_games = self.processor.merge_matches_by_game(matches)
        
        self.assertEqual(len(merged_games), 1)
        game = merged_games[0]
        
        self.assertEqual(game['league'], 'Premier League')
        self.assertEqual(game['home_team'], 'Arsenal')
        self.assertEqual(game['away_team'], 'Chelsea')
        self.assertIsNotNone(game['main_market'])
        self.assertEqual(game['main_market']['market_type'], '1x2')
        self.assertEqual(len(game['additional_markets']), 0)
        self.assertEqual(game['total_markets'], 1)
    
    def test_merge_matches_by_game_main_and_additional(self):
        """Test merging with main market and additional markets"""
        matches = [
            self.sample_main_match,
            self.sample_handicap_match,
            self.sample_total_goals_match
        ]
        
        merged_games = self.processor.merge_matches_by_game(matches)
        
        self.assertEqual(len(merged_games), 1)  # Should merge into one game
        game = merged_games[0]
        
        self.assertIsNotNone(game['main_market'])
        self.assertEqual(len(game['additional_markets']), 2)
        self.assertEqual(game['total_markets'], 3)
        
        # Check that additional markets have correct types
        market_types = [market['market_type'] for market in game['additional_markets']]
        self.assertIn('handicap', market_types)
        self.assertIn('total_goals', market_types)
    
    def test_merge_matches_by_game_multiple_games(self):
        """Test merging with multiple different games"""
        different_game_match = {
            'league': 'Premier League',
            'date': '2025. augusztus 5.',
            'time': 'K 22:00',  # Different time
            'home_team': 'Liverpool',
            'away_team': 'Manchester City',
            'home_odds': 3.00,
            'draw_odds': 3.50,
            'away_odds': 2.20,
            'raw_line': 'K 22:00 Liverpool - Manchester City 3,00 3,50 2,20'
        }
        
        matches = [self.sample_main_match, different_game_match]
        
        merged_games = self.processor.merge_matches_by_game(matches)
        
        self.assertEqual(len(merged_games), 2)  # Should remain as two separate games
        
        # Check that both games have main markets
        for game in merged_games:
            self.assertIsNotNone(game['main_market'])
            self.assertEqual(game['total_markets'], 1)
    
    def test_merge_matches_by_game_only_additional_markets(self):
        """Test merging with only additional markets (no main market)"""
        matches = [self.sample_handicap_match, self.sample_total_goals_match]
        
        merged_games = self.processor.merge_matches_by_game(matches)
        
        self.assertEqual(len(merged_games), 1)
        game = merged_games[0]
        
        self.assertIsNone(game['main_market'])  # No main market
        self.assertEqual(len(game['additional_markets']), 2)
        self.assertEqual(game['total_markets'], 2)
    
    def test_merge_matches_by_game_preserves_original_team_names(self):
        """Test that merging preserves original team names"""
        matches = [self.sample_handicap_match]
        
        merged_games = self.processor.merge_matches_by_game(matches)
        
        self.assertEqual(len(merged_games), 1)
        game = merged_games[0]
        
        # Should have cleaned team names for merging
        self.assertEqual(game['home_team'], 'Arsenal')
        self.assertEqual(game['away_team'], 'Chelsea')
        
        # Should preserve original team names
        self.assertEqual(game['original_home_team'], 'Arsenal Hendikep (-1)')
        self.assertEqual(game['original_away_team'], 'Chelsea')
    
    def test_merge_matches_by_game_processing_info(self):
        """Test that processing info is initialized correctly"""
        matches = [self.sample_main_match]
        
        merged_games = self.processor.merge_matches_by_game(matches)
        
        self.assertEqual(len(merged_games), 1)
        game = merged_games[0]
        
        self.assertIn('processing_info', game)
        self.assertFalse(game['processing_info']['team_normalized'])
        self.assertFalse(game['processing_info']['markets_capped'])
        self.assertEqual(game['processing_info']['duplicates_removed'], 0)
    
    def test_merge_matches_by_game_raw_lines(self):
        """Test that raw lines are preserved"""
        matches = [self.sample_main_match, self.sample_handicap_match]
        
        merged_games = self.processor.merge_matches_by_game(matches)
        
        self.assertEqual(len(merged_games), 1)
        game = merged_games[0]
        
        self.assertEqual(len(game['raw_lines']), 2)
        self.assertIn(self.sample_main_match['raw_line'], game['raw_lines'])
        self.assertIn(self.sample_handicap_match['raw_line'], game['raw_lines'])
    
    def test_merge_matches_by_game_sorting(self):
        """Test that merged games are sorted correctly"""
        # Create matches with different times and teams
        match1 = {**self.sample_main_match, 'time': 'K 22:00', 'home_team': 'Zebra FC'}
        match2 = {**self.sample_main_match, 'time': 'K 20:00', 'home_team': 'Arsenal'}
        match3 = {**self.sample_main_match, 'time': 'K 21:00', 'home_team': 'Barcelona'}
        
        matches = [match1, match2, match3]
        
        merged_games = self.processor.merge_matches_by_game(matches)
        
        self.assertEqual(len(merged_games), 3)
        
        # Should be sorted by time, then by home team
        self.assertEqual(merged_games[0]['time'], 'K 20:00')
        self.assertEqual(merged_games[1]['time'], 'K 21:00')
        self.assertEqual(merged_games[2]['time'], 'K 22:00')
    
    @patch('src.converter.market_processor.logger')
    def test_merge_matches_by_game_logging(self, mock_logger):
        """Test that merging logs appropriate information"""
        matches = [self.sample_main_match, self.sample_handicap_match]
        
        self.processor.merge_matches_by_game(matches)
        
        # Should log the merging result
        mock_logger.info.assert_called_once()
        call_args = mock_logger.info.call_args[0][0]
        self.assertIn('Merged', call_args)
        self.assertIn('match entries', call_args)
        self.assertIn('unique games', call_args)


if __name__ == '__main__':
    unittest.main()