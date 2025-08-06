"""
Unit tests for DataProcessor class.

Tests cover:
- Deduplication logic for exact duplicate markets
- Priority-based market capping system
- Processing statistics tracking
- Edge cases and error conditions
"""

import pytest
from unittest.mock import patch, MagicMock
from src.converter.data_processor import DataProcessor


class TestDataProcessor:
    """Test suite for DataProcessor class"""
    
    def setup_method(self):
        """Set up test fixtures before each test method"""
        self.processor = DataProcessor(max_markets=3)  # Use small limit for testing
        
        # Sample game data for testing
        self.sample_game = {
            'league': 'Premier League',
            'date': '2025. augusztus 5.',
            'time': 'K 20:00',
            'home_team': 'Arsenal',
            'away_team': 'Chelsea',
            'main_market': {
                'market_type': '1x2',
                'home_odds': 2.50,
                'draw_odds': 3.20,
                'away_odds': 2.80
            },
            'additional_markets': [],
            'total_markets': 1,
            'processing_info': {
                'team_normalized': False,
                'markets_capped': False,
                'duplicates_removed': 0
            },
            'raw_lines': ['K 20:00 Arsenal - Chelsea 2,50 3,20 2,80']
        }
        
        # Sample markets with different priorities
        self.sample_markets = [
            {
                'market_type': 'double_chance',
                'description': 'Kétesély (1X/12/X2)',
                'priority': 2,
                'odds': {'home_odds': 1.25, 'draw_odds': None, 'away_odds': 1.85}
            },
            {
                'market_type': 'handicap',
                'description': 'Hendikep +1.5',
                'priority': 3,
                'odds': {'home_odds': 1.90, 'draw_odds': None, 'away_odds': 1.90}
            },
            {
                'market_type': 'total_goals',
                'description': 'Gólszám Over 2.5',
                'priority': 4,
                'odds': {'home_odds': 1.75, 'draw_odds': None, 'away_odds': 2.05}
            },
            {
                'market_type': 'both_teams_score',
                'description': 'Mindkét csapat gólzik (Igen/Nem)',
                'priority': 5,
                'odds': {'home_odds': 1.60, 'draw_odds': None, 'away_odds': 2.30}
            },
            {
                'market_type': 'unknown',
                'description': 'Egyéb piac',
                'priority': 10,
                'odds': {'home_odds': 2.00, 'draw_odds': None, 'away_odds': 1.80}
            }
        ]
    
    def test_initialization(self):
        """Test DataProcessor initialization with default and custom parameters"""
        # Test default initialization
        default_processor = DataProcessor()
        assert default_processor.max_markets == 10
        assert default_processor.processing_stats['games_processed'] == 0
        
        # Test custom initialization
        custom_processor = DataProcessor(max_markets=5)
        assert custom_processor.max_markets == 5
        
        # Test market priorities are set correctly
        expected_priorities = {
            '1x2': 1,
            'double_chance': 2,
            'handicap': 3,
            'total_goals': 4,
            'both_teams_score': 5,
            'half_time': 6,
            'first_last_goal': 7,
            'draw_no_bet': 8,
            'unknown': 10
        }
        assert default_processor.market_priorities == expected_priorities
    
    def test_deduplicate_markets_no_duplicates(self):
        """Test deduplication when there are no duplicate markets"""
        game = self.sample_game.copy()
        game['additional_markets'] = self.sample_markets[:3]  # No duplicates
        
        result = self.processor.deduplicate_markets([game])
        
        assert len(result) == 1
        assert len(result[0]['additional_markets']) == 3
        assert result[0]['processing_info']['duplicates_removed'] == 0
        assert self.processor.processing_stats['total_duplicates_removed'] == 0
        assert self.processor.processing_stats['games_with_duplicates'] == 0
    
    def test_deduplicate_markets_with_duplicates(self):
        """Test deduplication when there are exact duplicate markets"""
        game = self.sample_game.copy()
        
        # Create duplicate markets
        duplicate_market = self.sample_markets[0].copy()
        game['additional_markets'] = [
            self.sample_markets[0],
            duplicate_market,  # Exact duplicate
            self.sample_markets[1],
            self.sample_markets[0].copy()  # Another duplicate
        ]
        
        result = self.processor.deduplicate_markets([game])
        
        assert len(result) == 1
        assert len(result[0]['additional_markets']) == 2  # 4 -> 2 (removed 2 duplicates)
        assert result[0]['processing_info']['duplicates_removed'] == 2
        assert self.processor.processing_stats['total_duplicates_removed'] == 2
        assert self.processor.processing_stats['games_with_duplicates'] == 1
        
        # Check duplicate details are tracked
        assert len(self.processor.processing_stats['duplicate_details']) == 1
        detail = self.processor.processing_stats['duplicate_details'][0]
        assert detail['duplicates_removed'] == 2
        assert detail['original_count'] == 4
        assert detail['final_count'] == 2
    
    def test_deduplicate_markets_empty_list(self):
        """Test deduplication with empty additional markets"""
        game = self.sample_game.copy()
        game['additional_markets'] = []
        
        result = self.processor.deduplicate_markets([game])
        
        assert len(result) == 1
        assert len(result[0]['additional_markets']) == 0
        assert result[0]['processing_info']['duplicates_removed'] == 0
    
    def test_cap_additional_markets_no_capping_needed(self):
        """Test market capping when no capping is needed"""
        game = self.sample_game.copy()
        game['additional_markets'] = self.sample_markets[:2]  # Only 2 markets, limit is 3
        
        result = self.processor.cap_additional_markets([game])
        
        assert len(result) == 1
        assert len(result[0]['additional_markets']) == 2
        assert result[0]['processing_info']['markets_capped'] == False
        assert self.processor.processing_stats['total_markets_capped'] == 0
        assert self.processor.processing_stats['games_with_capping'] == 0
    
    def test_cap_additional_markets_with_capping(self):
        """Test market capping when capping is needed"""
        game = self.sample_game.copy()
        game['additional_markets'] = self.sample_markets  # 5 markets, limit is 3
        
        result = self.processor.cap_additional_markets([game])
        
        assert len(result) == 1
        assert len(result[0]['additional_markets']) == 3  # Capped to 3
        assert result[0]['processing_info']['markets_capped'] == True
        assert self.processor.processing_stats['total_markets_capped'] == 2  # 5 - 3 = 2
        assert self.processor.processing_stats['games_with_capping'] == 1
        
        # Check that highest priority markets are kept
        kept_markets = result[0]['additional_markets']
        market_types = [m['market_type'] for m in kept_markets]
        assert 'double_chance' in market_types  # Priority 2
        assert 'handicap' in market_types       # Priority 3
        assert 'total_goals' in market_types    # Priority 4
        assert 'unknown' not in market_types    # Priority 10 (should be removed)
        
        # Check capping details are tracked
        assert len(self.processor.processing_stats['capping_details']) == 1
        detail = self.processor.processing_stats['capping_details'][0]
        assert detail['markets_removed'] == 2
        assert detail['original_count'] == 5
        assert detail['capped_count'] == 3
    
    def test_cap_additional_markets_custom_limit(self):
        """Test market capping with custom limit override"""
        game = self.sample_game.copy()
        game['additional_markets'] = self.sample_markets  # 5 markets
        
        result = self.processor.cap_additional_markets([game], max_markets=2)
        
        assert len(result) == 1
        assert len(result[0]['additional_markets']) == 2  # Capped to 2
        assert self.processor.processing_stats['total_markets_capped'] == 3  # 5 - 2 = 3
    
    def test_sort_markets_by_priority(self):
        """Test that markets are sorted correctly by priority"""
        # Mix up the order
        mixed_markets = [
            self.sample_markets[4],  # unknown (priority 10)
            self.sample_markets[1],  # handicap (priority 3)
            self.sample_markets[0],  # double_chance (priority 2)
            self.sample_markets[3],  # both_teams_score (priority 5)
            self.sample_markets[2]   # total_goals (priority 4)
        ]
        
        sorted_markets = self.processor._sort_markets_by_priority(mixed_markets)
        
        # Check that they are sorted by priority (ascending)
        priorities = [self.processor._calculate_market_priority(m) for m in sorted_markets]
        assert priorities == [2, 3, 4, 5, 10]
        
        # Check market types are in correct order
        market_types = [m['market_type'] for m in sorted_markets]
        expected_order = ['double_chance', 'handicap', 'total_goals', 'both_teams_score', 'unknown']
        assert market_types == expected_order
    
    def test_calculate_market_priority(self):
        """Test market priority calculation"""
        # Test known market types
        double_chance_market = {'market_type': 'double_chance'}
        assert self.processor._calculate_market_priority(double_chance_market) == 2
        
        handicap_market = {'market_type': 'handicap'}
        assert self.processor._calculate_market_priority(handicap_market) == 3
        
        unknown_market = {'market_type': 'unknown'}
        assert self.processor._calculate_market_priority(unknown_market) == 10
        
        # Test market with explicit priority
        custom_market = {'market_type': 'custom', 'priority': 7}
        assert self.processor._calculate_market_priority(custom_market) == 7
        
        # Test completely unknown market type
        mystery_market = {'market_type': 'mystery'}
        assert self.processor._calculate_market_priority(mystery_market) == 10
    
    def test_calculate_market_hash(self):
        """Test market hash calculation for duplicate detection"""
        market1 = {
            'market_type': 'handicap',
            'description': 'Hendikep +1.5',
            'priority': 3,
            'odds': {'home_odds': 1.90, 'away_odds': 1.90}
        }
        
        market2 = {
            'market_type': 'handicap',
            'description': 'Hendikep +1.5',
            'priority': 5,  # Different priority
            'odds': {'home_odds': 1.90, 'away_odds': 1.90}
        }
        
        market3 = {
            'market_type': 'handicap',
            'description': 'Hendikep +2.5',  # Different description
            'priority': 3,
            'odds': {'home_odds': 1.90, 'away_odds': 1.90}
        }
        
        hash1 = self.processor._calculate_market_hash(market1)
        hash2 = self.processor._calculate_market_hash(market2)
        hash3 = self.processor._calculate_market_hash(market3)
        
        # Same content (ignoring priority) should have same hash
        assert hash1 == hash2
        
        # Different content should have different hash
        assert hash1 != hash3
        assert hash2 != hash3
    
    def test_process_games_complete_pipeline(self):
        """Test the complete processing pipeline with deduplication and capping"""
        # Create a game with duplicates and too many markets
        game = self.sample_game.copy()
        duplicate_market = self.sample_markets[0].copy()
        game['additional_markets'] = [
            self.sample_markets[0],
            duplicate_market,  # Duplicate
            self.sample_markets[1],
            self.sample_markets[2],
            self.sample_markets[3],
            self.sample_markets[4]  # This will be capped (6 total, 1 duplicate -> 5 unique -> cap to 3)
        ]
        
        result = self.processor.process_games([game])
        
        assert len(result) == 1
        processed_game = result[0]
        
        # Should have removed 1 duplicate and capped to 3 markets
        assert len(processed_game['additional_markets']) == 3
        assert processed_game['processing_info']['duplicates_removed'] == 1
        assert processed_game['processing_info']['markets_capped'] == True
        
        # Check statistics
        stats = self.processor.get_processing_stats()
        assert stats['summary']['games_processed'] == 1
        assert stats['summary']['total_duplicates_removed'] == 1
        assert stats['summary']['total_markets_capped'] == 2  # 5 unique -> 3 kept = 2 removed
        assert stats['summary']['games_with_duplicates'] == 1
        assert stats['summary']['games_with_capping'] == 1
    
    def test_get_processing_stats(self):
        """Test processing statistics retrieval"""
        # Process some games to generate stats
        game1 = self.sample_game.copy()
        game1['additional_markets'] = [self.sample_markets[0], self.sample_markets[0].copy()]  # 1 duplicate
        
        game2 = self.sample_game.copy()
        game2['additional_markets'] = self.sample_markets  # 5 markets, will be capped to 3
        
        self.processor.process_games([game1, game2])
        
        stats = self.processor.get_processing_stats()
        
        # Check summary
        assert stats['summary']['games_processed'] == 2
        assert stats['summary']['total_duplicates_removed'] == 1
        assert stats['summary']['total_markets_capped'] == 2
        assert stats['summary']['games_with_duplicates'] == 1
        assert stats['summary']['games_with_capping'] == 1
        
        # Check deduplication details
        assert stats['deduplication']['games_affected'] == 1
        assert stats['deduplication']['total_duplicates'] == 1
        assert len(stats['deduplication']['details']) == 1
        
        # Check capping details
        assert stats['capping']['games_affected'] == 1
        assert stats['capping']['total_markets_removed'] == 2
        assert stats['capping']['max_markets_limit'] == 3
        assert len(stats['capping']['details']) == 1
        
        # Check market priorities are included
        assert 'market_priorities' in stats
        assert stats['market_priorities']['1x2'] == 1
        assert stats['market_priorities']['unknown'] == 10
    
    def test_reset_stats(self):
        """Test statistics reset functionality"""
        # Generate some stats first
        game = self.sample_game.copy()
        game['additional_markets'] = [self.sample_markets[0], self.sample_markets[0].copy()]
        self.processor.process_games([game])
        
        # Verify stats exist
        assert self.processor.processing_stats['total_duplicates_removed'] > 0
        
        # Reset and verify
        self.processor._reset_stats()
        assert self.processor.processing_stats['games_processed'] == 0
        assert self.processor.processing_stats['total_duplicates_removed'] == 0
        assert self.processor.processing_stats['total_markets_capped'] == 0
        assert len(self.processor.processing_stats['duplicate_details']) == 0
        assert len(self.processor.processing_stats['capping_details']) == 0
    
    def test_edge_case_empty_games_list(self):
        """Test processing with empty games list"""
        result = self.processor.process_games([])
        
        assert result == []
        assert self.processor.processing_stats['games_processed'] == 0
    
    def test_edge_case_game_without_additional_markets(self):
        """Test processing game without additional_markets key"""
        game = self.sample_game.copy()
        del game['additional_markets']  # Remove the key entirely
        
        result = self.processor.process_games([game])
        
        assert len(result) == 1
        assert result[0]['additional_markets'] == []
        assert result[0]['processing_info']['duplicates_removed'] == 0
    
    def test_edge_case_market_without_priority(self):
        """Test handling markets without explicit priority"""
        market_without_priority = {
            'market_type': 'handicap',
            'description': 'Hendikep +1.5',
            'odds': {'home_odds': 1.90, 'away_odds': 1.90}
        }
        
        priority = self.processor._calculate_market_priority(market_without_priority)
        assert priority == 3  # Should use default priority for handicap
    
    def test_multiple_games_processing(self):
        """Test processing multiple games with various scenarios"""
        import copy
        
        # Game 1: Has duplicates
        game1 = copy.deepcopy(self.sample_game)
        game1['home_team'] = 'Team A'
        game1['away_team'] = 'Team B'
        # Create a proper deep copy for duplicate testing
        duplicate_market = copy.deepcopy(self.sample_markets[0])
        game1['additional_markets'] = [self.sample_markets[0], duplicate_market]
        
        # Game 2: Needs capping
        game2 = copy.deepcopy(self.sample_game)
        game2['home_team'] = 'Team C'
        game2['away_team'] = 'Team D'
        game2['additional_markets'] = copy.deepcopy(self.sample_markets)  # 5 markets
        
        # Game 3: No processing needed
        game3 = copy.deepcopy(self.sample_game)
        game3['home_team'] = 'Team E'
        game3['away_team'] = 'Team F'
        game3['additional_markets'] = [copy.deepcopy(self.sample_markets[0])]  # Just 1 market
        
        result = self.processor.process_games([game1, game2, game3])
        
        assert len(result) == 3
        
        # Game 1: Should have 1 market (duplicate removed)
        assert len(result[0]['additional_markets']) == 1
        assert result[0]['processing_info']['duplicates_removed'] == 1
        
        # Game 2: Should have 3 markets (capped from 5)
        assert len(result[1]['additional_markets']) == 3
        assert result[1]['processing_info']['markets_capped'] == True
        
        # Game 3: Should remain unchanged
        assert len(result[2]['additional_markets']) == 1
        assert result[2]['processing_info']['duplicates_removed'] == 0
        assert result[2]['processing_info']['markets_capped'] == False
        
        # Check overall statistics
        stats = self.processor.get_processing_stats()
        assert stats['summary']['games_processed'] == 3
        assert stats['summary']['games_with_duplicates'] == 1
        assert stats['summary']['games_with_capping'] == 1


if __name__ == '__main__':
    pytest.main([__file__])