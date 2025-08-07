"""
Integration tests for AdvancedReporter with real data

Tests the AdvancedReporter with actual game data to verify
end-to-end functionality and data accuracy.
"""

import pytest
import json
import tempfile
from pathlib import Path
from datetime import datetime, timedelta

from src.converter.advanced_reporter import AdvancedReporter


class TestAdvancedReporterIntegration:
    """Integration tests for AdvancedReporter"""
    
    @pytest.fixture
    def real_games_data(self):
        """Create realistic games data for integration testing"""
        base_date = datetime.now() - timedelta(days=7)
        games = []
        
        # Create realistic football games data
        leagues = ['Premier League', 'La Liga', 'Bundesliga', 'Serie A']
        teams = {
            'Premier League': ['Arsenal', 'Chelsea', 'Liverpool', 'Manchester City', 'Manchester United', 'Tottenham'],
            'La Liga': ['Real Madrid', 'Barcelona', 'Atletico Madrid', 'Valencia', 'Sevilla', 'Real Sociedad'],
            'Bundesliga': ['Bayern Munich', 'Borussia Dortmund', 'RB Leipzig', 'Bayer Leverkusen', 'Eintracht Frankfurt', 'Wolfsburg'],
            'Serie A': ['Juventus', 'AC Milan', 'Inter Milan', 'Napoli', 'AS Roma', 'Lazio']
        }
        
        game_id = 0
        for day in range(7):  # 7 days of games
            game_date = base_date + timedelta(days=day)
            
            for league in leagues:
                league_teams = teams[league]
                # 2-3 games per league per day
                for game_num in range(2 + day % 2):
                    home_team = league_teams[game_id % len(league_teams)]
                    away_team = league_teams[(game_id + 1) % len(league_teams)]
                    
                    if home_team == away_team:
                        away_team = league_teams[(game_id + 2) % len(league_teams)]
                    
                    # Realistic odds
                    home_odds = 1.5 + (game_id % 20) * 0.1
                    draw_odds = 3.0 + (game_id % 10) * 0.2
                    away_odds = 2.0 + (game_id % 15) * 0.15
                    
                    # Additional markets
                    additional_markets = []
                    if game_id % 3 == 0:  # Some games have additional markets
                        additional_markets.extend([
                            {
                                'market_type': 'total_goals',
                                'description': 'Over/Under 2.5 Goals',
                                'odds': {'over': 1.8, 'under': 2.0}
                            },
                            {
                                'market_type': 'both_teams_score',
                                'description': 'Both Teams to Score',
                                'odds': {'yes': 1.7, 'no': 2.1}
                            }
                        ])
                    
                    game = {
                        'home_team': home_team,
                        'away_team': away_team,
                        'league': league,
                        'date': game_date.strftime('%Y-%m-%d'),
                        'iso_date': game_date.isoformat(),
                        'time': f'{15 + game_num}:00',
                        'total_markets': 1 + len(additional_markets),
                        'main_market': {
                            'market_type': '1X2',
                            'description': 'Match Result',
                            'odds': {
                                'home_odds': home_odds,
                                'draw_odds': draw_odds,
                                'away_odds': away_odds
                            }
                        },
                        'additional_markets': additional_markets,
                        'processing_info': {
                            'processing_time': 0.3 + (game_id % 10) * 0.05,
                            'team_normalized': True,
                            'markets_capped': False,
                            'duplicates_removed': 0,
                            'cache_hits': game_id % 5,
                            'cache_misses': (game_id + 1) % 3,
                            'optimizations_applied': ['team_normalization', 'caching'] if game_id % 2 == 0 else ['team_normalization']
                        }
                    }
                    
                    games.append(game)
                    game_id += 1
        
        return games
    
    @pytest.mark.asyncio
    async def test_full_workflow_integration(self, real_games_data):
        """Test complete workflow from games data to exported reports"""
        reporter = AdvancedReporter()
        
        # Generate trend analysis
        trends = await reporter.generate_trend_analysis(real_games_data, days=7)
        
        assert isinstance(trends, dict)
        assert len(trends) > 0
        
        # Verify trend data structure
        for metric_name, trend_data in trends.items():
            assert hasattr(trend_data, 'metric_name')
            assert hasattr(trend_data, 'trend_direction')
            assert hasattr(trend_data, 'trend_strength')
            assert trend_data.trend_direction in ['increasing', 'decreasing', 'stable']
            assert 0.0 <= trend_data.trend_strength <= 1.0
        
        # Generate anomaly report
        anomaly_report = await reporter.generate_anomaly_report(real_games_data)
        
        assert isinstance(anomaly_report, dict)
        assert 'total_anomalies' in anomaly_report
        assert 'detailed_anomalies' in anomaly_report
        assert 'recommendations' in anomaly_report
        
        # Generate dashboard data
        dashboard_data = await reporter.generate_dashboard_data(real_games_data)
        
        assert hasattr(dashboard_data, 'summary_stats')
        assert hasattr(dashboard_data, 'time_series_data')
        assert hasattr(dashboard_data, 'anomaly_summary')
        assert hasattr(dashboard_data, 'trend_analysis')
        assert hasattr(dashboard_data, 'performance_metrics')
        
        # Verify summary stats
        summary = dashboard_data.summary_stats
        assert summary['total_games'] == len(real_games_data)
        assert summary['leagues_count'] == 4  # Premier League, La Liga, Bundesliga, Serie A
        assert 'data_quality' in summary
        assert 'processing_performance' in summary
        
        # Export to multiple formats
        with tempfile.TemporaryDirectory() as temp_dir:
            exported_files = await reporter.export_to_formats(
                dashboard_data, ['json', 'csv', 'excel'], temp_dir
            )
            
            assert 'json' in exported_files
            assert 'csv' in exported_files
            assert 'excel' in exported_files
            
            # Verify files exist and have content
            for format_name, file_path in exported_files.items():
                file_obj = Path(file_path)
                assert file_obj.exists()
                assert file_obj.stat().st_size > 0
            
            # Verify JSON content structure
            with open(exported_files['json'], 'r', encoding='utf-8') as f:
                json_data = json.load(f)
            
            assert 'summary_stats' in json_data
            assert 'time_series_data' in json_data
            assert 'anomaly_summary' in json_data
            assert 'trend_analysis' in json_data
    
    @pytest.mark.asyncio
    async def test_performance_with_large_dataset(self, real_games_data):
        """Test performance with larger dataset"""
        # Multiply the dataset to simulate larger data
        large_dataset = real_games_data * 5  # 5x the original data
        
        reporter = AdvancedReporter()
        
        start_time = datetime.now()
        
        # Test trend analysis performance
        trends = await reporter.generate_trend_analysis(large_dataset, days=7)
        
        # Test anomaly detection performance
        anomaly_report = await reporter.generate_anomaly_report(large_dataset)
        
        # Test dashboard data generation performance
        dashboard_data = await reporter.generate_dashboard_data(large_dataset)
        
        end_time = datetime.now()
        processing_time = (end_time - start_time).total_seconds()
        
        # Should complete within reasonable time (adjust threshold as needed)
        assert processing_time < 30.0  # 30 seconds max
        
        # Verify results are still accurate
        assert len(trends) > 0
        assert anomaly_report['total_anomalies'] >= 0
        assert dashboard_data.summary_stats['total_games'] == len(large_dataset)
    
    @pytest.mark.asyncio
    async def test_data_accuracy_verification(self, real_games_data):
        """Test data accuracy and consistency"""
        reporter = AdvancedReporter()
        
        # Generate dashboard data
        dashboard_data = await reporter.generate_dashboard_data(real_games_data)
        
        # Verify data consistency
        summary = dashboard_data.summary_stats
        
        # Count verification
        assert summary['total_games'] == len(real_games_data)
        
        # League verification
        expected_leagues = {'Premier League', 'La Liga', 'Bundesliga', 'Serie A'}
        actual_leagues = set(summary['leagues'])
        assert expected_leagues == actual_leagues
        
        # Date range verification
        dates = [game['iso_date'] for game in real_games_data if game.get('iso_date')]
        expected_earliest = min(dates)
        expected_latest = max(dates)
        
        date_range = summary['date_range']
        # Extract date part from ISO datetime strings
        earliest_date = date_range['earliest'][:10] if 'T' in date_range['earliest'] else date_range['earliest']
        latest_date = date_range['latest'][:10] if 'T' in date_range['latest'] else date_range['latest']
        
        assert earliest_date == expected_earliest[:10]  # Date part only
        assert latest_date == expected_latest[:10]  # Date part only
        
        # Market count verification
        expected_total_markets = sum(game.get('total_markets', 0) for game in real_games_data)
        assert summary['total_markets'] == expected_total_markets
        
        # Quality score verification
        data_quality = summary['data_quality']
        assert 0.0 <= data_quality['average_score'] <= 1.0
        assert data_quality['min_score'] <= data_quality['average_score'] <= data_quality['max_score']
    
    @pytest.mark.asyncio
    async def test_anomaly_detection_accuracy(self, real_games_data):
        """Test anomaly detection accuracy with known data"""
        reporter = AdvancedReporter()
        
        # Add some known anomalies to the data
        anomalous_games = real_games_data.copy()
        
        # Add game with missing data
        anomalous_games.append({
            'home_team': '',  # Missing home team
            'away_team': 'Test Team',
            'league': 'Test League',
            'date': '2024-01-01',
            'time': '15:00',
            'total_markets': 0
            # Missing main_market
        })
        
        # Add game with unusual odds
        anomalous_games.append({
            'home_team': 'Team A',
            'away_team': 'Team B',
            'league': 'Test League',
            'date': '2024-01-01',
            'iso_date': '2024-01-01T15:00:00',
            'time': '15:00',
            'total_markets': 100,  # Unusually high
            'main_market': {
                'market_type': '1X2',
                'odds': {
                    'home_odds': 0.1,  # Unusually low
                    'draw_odds': 3.0,
                    'away_odds': 200.0  # Unusually high
                }
            },
            'processing_info': {
                'processing_time': 50.0,  # Unusually high
                'team_normalized': False
            }
        })
        
        # Generate anomaly report
        anomaly_report = await reporter.generate_anomaly_report(anomalous_games)
        
        # Should detect the anomalies we added
        assert anomaly_report['total_anomalies'] > 0
        
        # Check for specific anomaly types
        anomaly_types = [anomaly.get('anomaly_type', anomaly.get('type', 'unknown')) for anomaly in anomaly_report['detailed_anomalies']]
        
        # Should detect data quality issues
        assert any('data_quality' in atype for atype in anomaly_types)
        
        # Should detect statistical outliers
        assert any('statistical_outlier' in atype or 'outlier' in atype for atype in anomaly_types)


if __name__ == '__main__':
    pytest.main([__file__])