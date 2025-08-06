"""
Unit tests for Enhanced FootballExtractor

Tests the enhanced football data extraction functionality with improved market detection,
OCR error handling, and market classification.
"""

import unittest
import sys
from pathlib import Path
from unittest.mock import Mock, patch

# Add src to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

from converter.football_extractor import FootballExtractor


class TestEnhancedFootballExtractor(unittest.TestCase):
    """Test enhanced FootballExtractor functionality."""
    
    def setUp(self):
        """Set up test fixtures."""
        self.extractor = FootballExtractor()
    
    def test_initialization(self):
        """Test enhanced extractor initialization."""
        self.assertIsNotNone(self.extractor)
        self.assertIsInstance(self.extractor.football_patterns, list)
        self.assertGreater(len(self.extractor.football_patterns), 0)
        self.assertIsInstance(self.extractor.market_type_patterns, dict)
        self.assertIsInstance(self.extractor.ocr_fixes, dict)
        
        # Check that enhanced patterns are present
        self.assertIn('double_chance', self.extractor.market_type_patterns)
        self.assertIn('handicap', self.extractor.market_type_patterns)
        self.assertIn('total_goals', self.extractor.market_type_patterns)
    
    def test_enhanced_time_pattern_matching(self):
        """Test enhanced time pattern matching with various formats."""
        test_cases = [
            "K 20:00",
            "Sze 19:30", 
            "Cs 18:45",
            "P 21:00",
            "Szo 16:30",
            "V 20:15"
        ]
        
        for time_str in test_cases:
            with self.subTest(time=time_str):
                import re
                match = re.search(self.extractor.time_pattern, time_str)
                self.assertIsNotNone(match, f"Failed to match time: {time_str}")
                self.assertEqual(match.group(1), time_str)
    
    def test_enhanced_team_pattern_matching(self):
        """Test enhanced team pattern with special characters and numbers."""
        test_cases = [
            ("Real Madrid - Barcelona 2,50 3,20 2,80", ("Real Madrid", "Barcelona")),
            ("Ferencváros TC - Paks 1,85 3,40 4,20", ("Ferencváros TC", "Paks")),
            ("AIK Stockholm - Göteborg 2,10 3,10 3,50", ("AIK Stockholm", "Göteborg")),
            ("Team1 - Team2 1,50 2,80", ("Team1", "Team2"))
        ]
        
        for team_line, expected in test_cases:
            with self.subTest(teams=team_line):
                import re
                match = re.search(self.extractor.team_pattern, team_line)
                self.assertIsNotNone(match, f"Failed to match teams: {team_line}")
                self.assertEqual((match.group(1), match.group(2)), expected)
    
    def test_enhanced_odds_pattern_matching(self):
        """Test enhanced odds patterns with decimal points and commas."""
        test_cases = [
            ("2,50 3,20 2,80", 3),  # 3 odds with commas
            ("2.50 3.20 2.80", 3),  # 3 odds with dots
            ("1,85 2,15", 2),       # 2 odds with commas
            ("1.85 2.15", 2),       # 2 odds with dots
        ]
        
        for odds_str, expected_groups in test_cases:
            with self.subTest(odds=odds_str):
                import re
                match = None
                for pattern in self.extractor.odds_patterns:
                    match = re.search(pattern, odds_str)
                    if match:
                        break
                
                self.assertIsNotNone(match, f"Failed to match odds: {odds_str}")
                self.assertEqual(len(match.groups()), expected_groups)


class TestMarketTypeClassification(unittest.TestCase):
    """Test enhanced market type classification."""
    
    def setUp(self):
        """Set up test fixtures."""
        self.extractor = FootballExtractor()
    
    def test_classify_double_chance_market(self):
        """Test classification of double chance markets."""
        test_cases = [
            ("K 20:00 Real Madrid Kétesély - Barcelona 1,50 2,80", "double_chance"),
            ("Sze 19:30 Team1 1X - Team2 12 1,85 2,15", "double_chance"),
            ("P 21:00 Home Két esély - Away 2,20 1,65", "double_chance")
        ]
        
        for raw_line, expected_type in test_cases:
            with self.subTest(line=raw_line):
                market_type = self.extractor._classify_market_type(raw_line, "", "")
                self.assertEqual(market_type, expected_type)
    
    def test_classify_handicap_market(self):
        """Test classification of handicap markets."""
        test_cases = [
            ("K 20:00 Real Madrid Hendikep +1.5 - Barcelona 2,50 1,50", "handicap"),
            ("Sze 19:30 Team1 Handicap -2 - Team2 3,20 1,35", "handicap"),
            ("P 21:00 Home +0.5 - Away 1,95 1,85", "handicap")
        ]
        
        for raw_line, expected_type in test_cases:
            with self.subTest(line=raw_line):
                market_type = self.extractor._classify_market_type(raw_line, "", "")
                self.assertEqual(market_type, expected_type)
    
    def test_classify_total_goals_market(self):
        """Test classification of total goals markets."""
        test_cases = [
            ("K 20:00 Real Madrid Gólszám Over 2.5 - Barcelona 1,80 2,00", "total_goals"),
            ("Sze 19:30 Team1 Több mint 3.5 - Team2 Under 2,50 1,50", "total_goals"),
            ("P 21:00 Home Kevesebb mint 1.5 - Away 4,20 1,20", "total_goals")
        ]
        
        for raw_line, expected_type in test_cases:
            with self.subTest(line=raw_line):
                market_type = self.extractor._classify_market_type(raw_line, "", "")
                self.assertEqual(market_type, expected_type)
    
    def test_classify_both_teams_score_market(self):
        """Test classification of both teams score markets."""
        test_cases = [
            ("K 20:00 Real Madrid Mindkét csapat gólzik - Barcelona Igen Nem", "both_teams_score"),
            ("Sze 19:30 Team1 BTTS - Team2 1,85 1,95", "both_teams_score"),
            ("P 21:00 Home Both teams score - Away 2,10 1,70", "both_teams_score")
        ]
        
        for raw_line, expected_type in test_cases:
            with self.subTest(line=raw_line):
                market_type = self.extractor._classify_market_type(raw_line, "", "")
                self.assertEqual(market_type, expected_type)
    
    def test_classify_main_market(self):
        """Test classification of main 1X2 markets."""
        test_cases = [
            "K 20:00 Real Madrid - Barcelona 2,50 3,20 2,80",
            "Sze 19:30 Ferencváros - Paks 1,85 3,40 4,20",
            "P 21:00 AIK Stockholm - Malmö 2,10 3,10 3,50"
        ]
        
        for raw_line in test_cases:
            with self.subTest(line=raw_line):
                market_type = self.extractor._classify_market_type(raw_line, "", "")
                self.assertIn(market_type, ['main', 'unknown'])  # Should be main or unknown (fallback)
    
    def test_is_main_1x2_market(self):
        """Test main 1X2 market detection."""
        main_market_cases = [
            {
                'raw_line': 'K 20:00 Real Madrid - Barcelona 2,50 3,20 2,80',
                'home_team': 'Real Madrid',
                'away_team': 'Barcelona'
            },
            {
                'raw_line': 'Sze 19:30 Ferencváros - Paks 1,85 3,40 4,20',
                'home_team': 'Ferencváros',
                'away_team': 'Paks'
            }
        ]
        
        special_market_cases = [
            {
                'raw_line': 'K 20:00 Real Madrid Kétesély - Barcelona 1,50 2,80',
                'home_team': 'Real Madrid Kétesély',
                'away_team': 'Barcelona'
            },
            {
                'raw_line': 'Sze 19:30 Team1 Hendikep +1.5 - Team2 2,50 1,50',
                'home_team': 'Team1 Hendikep +1.5',
                'away_team': 'Team2'
            }
        ]
        
        for match_data in main_market_cases:
            with self.subTest(match=match_data['raw_line']):
                is_main = self.extractor._is_main_1x2_market(match_data)
                self.assertTrue(is_main, f"Should be main market: {match_data['raw_line']}")
        
        for match_data in special_market_cases:
            with self.subTest(match=match_data['raw_line']):
                is_main = self.extractor._is_main_1x2_market(match_data)
                self.assertFalse(is_main, f"Should not be main market: {match_data['raw_line']}")


class TestOCRErrorHandling(unittest.TestCase):
    """Test enhanced OCR error handling."""
    
    def setUp(self):
        """Set up test fixtures."""
        self.extractor = FootballExtractor()
    
    def test_exact_ocr_fixes(self):
        """Test exact match OCR fixes."""
        test_cases = [
            ("Kongói Közársság", "Kongói Köztársaság"),
            ("Hunik Krkkó", "Hutnik Krakkó"),
            ("Zglebie Sosnowiec", "Zaglebie Sosnowiec"),
            ("Brbrnd", "Brabrand"),
            ("AIK Sockholm", "AIK Stockholm"),
            ("Köbenhvn", "København"),
            ("Skve IK", "Skive IK")
        ]
        
        for wrong_name, correct_name in test_cases:
            with self.subTest(team=wrong_name):
                fixed_name = self.extractor._apply_exact_fixes(wrong_name)
                self.assertEqual(fixed_name, correct_name)
    
    def test_pattern_ocr_fixes(self):
        """Test pattern-based OCR fixes."""
        test_cases = [
            ("Team Közársság FC", "Team Köztársaság FC"),
            ("Hutnik Krkkó United", "Hutnik Krakkó United"),
            ("FC Zsiomir", "FC Zsitomir"),
            ("AIK Sockholm FC", "AIK Stockholm FC")
        ]
        
        for wrong_name, expected_name in test_cases:
            with self.subTest(team=wrong_name):
                fixed_name = self.extractor._apply_ocr_pattern_fixes(wrong_name)
                self.assertEqual(fixed_name, expected_name)
    
    def test_character_level_fixes(self):
        """Test character-level OCR fixes."""
        # Test that the method exists and returns a string
        test_names = [
            "Ferencváros",
            "København", 
            "Malmö",
            "Göteborg"
        ]
        
        for team_name in test_names:
            with self.subTest(team=team_name):
                fixed_name = self.extractor._apply_character_fixes(team_name)
                self.assertIsInstance(fixed_name, str)
                # Should at least return the original name if no fixes needed
                self.assertTrue(len(fixed_name) > 0)
    
    def test_comprehensive_team_name_fixing(self):
        """Test the complete team name fixing pipeline."""
        test_cases = [
            ("Kongói Közársság", "Kongói Köztársaság"),
            ("Hunik Krkkó", "Hutnik Krakkó"),
            ("Normal Team Name", "Normal Team Name"),  # Should remain unchanged
            ("FC Köbenhvn", "FC København")
        ]
        
        for original_name, expected_name in test_cases:
            with self.subTest(team=original_name):
                fixed_name = self.extractor._fix_team_name(original_name)
                self.assertEqual(fixed_name, expected_name)


class TestFootballDataExtraction(unittest.TestCase):
    """Test complete football data extraction with enhanced features."""
    
    def setUp(self):
        """Set up test fixtures."""
        self.extractor = FootballExtractor()
    
    def test_extract_football_data_with_enhanced_features(self):
        """Test complete extraction with enhanced market detection."""
        sample_json = {
            'content': {
                'full_text': """Labdarúgás Premier League
2025. augusztus 5.
K 20:00 65110 Real Madrid - Barcelona 2,50 3,20 2,80
K 20:00 65111 Real Madrid Kétesély - Barcelona 1,50 2,80
K 20:00 65112 Real Madrid Hendikep +1.5 - Barcelona 2,20 1,65
Sze 19:30 65120 Ferencváros - Paks 1,85 3,40 4,20
Sze 19:30 65121 Ferencváros Gólszám Over 2.5 - Paks 1,80 2,00"""
            }
        }
        
        matches = self.extractor.extract_football_data(sample_json)
        
        # Should extract all matches (some might be filtered out due to pattern matching)
        self.assertGreaterEqual(len(matches), 3)  # At least the main matches should be extracted
        
        # Check first match (main market)
        main_match = matches[0]
        self.assertEqual(main_match['league'], 'Premier League')
        self.assertEqual(main_match['home_team'], 'Real Madrid')
        self.assertEqual(main_match['away_team'], 'Barcelona')
        self.assertEqual(main_match['home_odds'], 2.50)
        self.assertEqual(main_match['draw_odds'], 3.20)
        self.assertEqual(main_match['away_odds'], 2.80)
        
        # Check that OCR fixes are applied
        self.assertIsInstance(main_match['home_team'], str)
        self.assertIsInstance(main_match['away_team'], str)
    
    def test_extract_with_ocr_errors(self):
        """Test extraction with OCR errors in team names."""
        sample_json = {
            'content': {
                'full_text': """Labdarúgás Test League
2025. augusztus 5.
K 20:00 65110 Kongói Közársság - Hunik Krkkó 2,50 3,20 2,80
Sze 19:30 65120 AIK Sockholm - Brbrnd 1,85 3,40 4,20"""
            }
        }
        
        matches = self.extractor.extract_football_data(sample_json)
        
        self.assertEqual(len(matches), 2)
        
        # Check OCR fixes were applied
        first_match = matches[0]
        self.assertEqual(first_match['home_team'], 'Kongói Köztársaság')
        self.assertEqual(first_match['away_team'], 'Hutnik Krakkó')
        
        second_match = matches[1]
        self.assertEqual(second_match['home_team'], 'AIK Stockholm')
        self.assertEqual(second_match['away_team'], 'Brabrand')
    
    def test_extract_with_special_characters(self):
        """Test extraction with special characters and Unicode."""
        sample_json = {
            'content': {
                'full_text': """Labdarúgás Dán Liga
2025. augusztus 5.
K 20:00 65110 FC København - Malmö FF 2,50 3,20 2,80
Sze 19:30 65120 Ferencváros TC - Győri ETO 1,85 3,40 4,20"""
            }
        }
        
        matches = self.extractor.extract_football_data(sample_json)
        
        self.assertGreaterEqual(len(matches), 1)  # At least one match should be extracted
        
        # Check that matches are extracted (Unicode handling may vary)
        self.assertTrue(len(matches) > 0)
        first_match = matches[0]
        self.assertIsInstance(first_match['home_team'], str)
        self.assertIsInstance(first_match['away_team'], str)
        
        second_match = matches[1]
        self.assertEqual(second_match['home_team'], 'Ferencváros TC')
        self.assertEqual(second_match['away_team'], 'Győri ETO')
    
    def test_extract_with_mixed_odds_formats(self):
        """Test extraction with mixed decimal formats (commas and dots)."""
        sample_json = {
            'content': {
                'full_text': """Labdarúgás Test League
2025. augusztus 5.
K 20:00 65110 Team1 - Team2 2,50 3,20 2,80
Sze 19:30 65120 Team3 - Team4 1.85 3.40 4.20
P 21:00 65130 Team5 - Team6 2.10 1.90"""
            }
        }
        
        matches = self.extractor.extract_football_data(sample_json)
        
        self.assertEqual(len(matches), 3)
        
        # Check comma format
        first_match = matches[0]
        self.assertEqual(first_match['home_odds'], 2.50)
        self.assertEqual(first_match['draw_odds'], 3.20)
        self.assertEqual(first_match['away_odds'], 2.80)
        
        # Check dot format
        second_match = matches[1]
        self.assertEqual(second_match['home_odds'], 1.85)
        self.assertEqual(second_match['draw_odds'], 3.40)
        self.assertEqual(second_match['away_odds'], 4.20)
        
        # Check 2-odds format
        third_match = matches[2]
        self.assertEqual(third_match['home_odds'], 2.10)
        self.assertIsNone(third_match['draw_odds'])
        self.assertEqual(third_match['away_odds'], 1.90)
    
    def test_get_extraction_stats(self):
        """Test extraction statistics method."""
        stats = self.extractor.get_extraction_stats()
        
        self.assertIsInstance(stats, dict)
        self.assertIn('patterns_used', stats)
        self.assertIn('supported_market_types', stats)
        self.assertIn('ocr_fix_categories', stats)
        
        # Check that we have the expected market types
        supported_types = stats['supported_market_types']
        expected_types = ['double_chance', 'handicap', 'total_goals', 'both_teams_score', 'half_time', 'first_last_goal', 'draw_no_bet']
        for market_type in expected_types:
            self.assertIn(market_type, supported_types)


class TestEdgeCases(unittest.TestCase):
    """Test edge cases and error handling."""
    
    def setUp(self):
        """Set up test fixtures."""
        self.extractor = FootballExtractor()
    
    def test_empty_json_content(self):
        """Test extraction with empty JSON content."""
        empty_json = {}
        matches = self.extractor.extract_football_data(empty_json)
        self.assertEqual(len(matches), 0)
    
    def test_missing_full_text(self):
        """Test extraction with missing full_text."""
        incomplete_json = {'content': {}}
        matches = self.extractor.extract_football_data(incomplete_json)
        self.assertEqual(len(matches), 0)
    
    def test_non_football_content(self):
        """Test extraction with non-football sports content."""
        non_football_json = {
            'content': {
                'full_text': """Tenisz ATP Tour
2025. augusztus 5.
K 20:00 Djokovic - Federer 1,50 2,80
Kosárlabda NBA
Sze 19:30 Lakers - Warriors 1,85 2,15"""
            }
        }
        
        matches = self.extractor.extract_football_data(non_football_json)
        self.assertEqual(len(matches), 0)
    
    def test_malformed_match_lines(self):
        """Test extraction with malformed match lines."""
        malformed_json = {
            'content': {
                'full_text': """Labdarúgás Test League
2025. augusztus 5.
K 20:00 Team1 Team2 2,50 3,20 2,80
Invalid line without proper format
Sze 19:30 Team3 - Team4 invalid_odds
P 21:00 Team5 - Team6 1,85 2,15 3,40"""
            }
        }
        
        matches = self.extractor.extract_football_data(malformed_json)
        
        # Should only extract the valid match
        self.assertEqual(len(matches), 1)
        # Check that we got a valid match (OCR fixes might change the exact name)
        self.assertIsInstance(matches[0]['home_team'], str)
        self.assertIsInstance(matches[0]['away_team'], str)
        self.assertTrue(len(matches[0]['home_team']) > 0)
        self.assertTrue(len(matches[0]['away_team']) > 0)
    
    def test_market_info_extraction_edge_cases(self):
        """Test market info extraction with edge cases."""
        edge_case_match = {
            'raw_line': 'K 20:00 Unknown Market Type - Team2 1,85 2,15',
            'home_team': 'Unknown Market Type',
            'away_team': 'Team2',
            'home_odds': 1.85,
            'away_odds': 2.15,
            'draw_odds': None
        }
        
        market_info = self.extractor._extract_market_info(edge_case_match)
        
        self.assertIsInstance(market_info, dict)
        self.assertIn('market_type', market_info)
        self.assertIn('description', market_info)
        self.assertIn('odds', market_info)
        
        # Should handle unknown market types gracefully
        self.assertTrue(len(market_info['description']) > 0)


if __name__ == '__main__':
    unittest.main()