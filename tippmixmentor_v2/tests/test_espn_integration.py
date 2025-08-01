#!/usr/bin/env python3
"""
ESPN API Integration Test Script

This script tests the ESPN API integration with the TippMixMentor backend.
It verifies that the API endpoints are working and data is being fetched correctly.
"""

import requests
import json
import time
from datetime import datetime

class ESPNIntegrationTester:
    def __init__(self, base_url="http://localhost:3001"):
        self.base_url = base_url
        self.api_prefix = "/api/v1"
        
    def test_health_check(self):
        """Test ESPN API health check"""
        print("🔍 Testing ESPN API Health Check...")
        
        try:
            response = requests.get(f"{self.base_url}{self.api_prefix}/espn-football/health", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success') and data.get('data', {}).get('healthy'):
                    print("✅ ESPN API Health Check: PASSED")
                    return True
                else:
                    print("❌ ESPN API Health Check: FAILED - API not healthy")
                    return False
            else:
                print(f"❌ ESPN API Health Check: FAILED - Status {response.status_code}")
                return False
                
        except requests.exceptions.RequestException as e:
            print(f"❌ ESPN API Health Check: FAILED - Connection error: {e}")
            return False
    
    def test_supported_leagues(self):
        """Test getting supported leagues"""
        print("\n🏆 Testing Supported Leagues...")
        
        try:
            response = requests.get(f"{self.base_url}{self.api_prefix}/espn-football/leagues", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                leagues = data.get('data', [])
                
                if len(leagues) >= 8:  # Should have at least 8 leagues
                    print(f"✅ Supported Leagues: PASSED - Found {len(leagues)} leagues")
                    for league in leagues:
                        print(f"   📊 {league.get('name')} ({league.get('code')})")
                    return True
                else:
                    print(f"❌ Supported Leagues: FAILED - Expected 8+, got {len(leagues)}")
                    return False
            else:
                print(f"❌ Supported Leagues: FAILED - Status {response.status_code}")
                return False
                
        except requests.exceptions.RequestException as e:
            print(f"❌ Supported Leagues: FAILED - Connection error: {e}")
            return False
    
    def test_premier_league_scoreboard(self):
        """Test Premier League scoreboard"""
        print("\n⚽ Testing Premier League Scoreboard...")
        
        try:
            response = requests.get(f"{self.base_url}{self.api_prefix}/espn-football/scoreboard/eng.1", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                events = data.get('data', {}).get('events', [])
                
                print(f"✅ Premier League Scoreboard: PASSED - Found {len(events)} events")
                
                if events:
                    # Show sample event
                    event = events[0]
                    print(f"   📅 Sample Event: {event.get('name', 'N/A')}")
                    print(f"   🕐 Date: {event.get('date', 'N/A')}")
                    print(f"   📊 Status: {event.get('status', {}).get('type', {}).get('description', 'N/A')}")
                
                return True
            else:
                print(f"❌ Premier League Scoreboard: FAILED - Status {response.status_code}")
                return False
                
        except requests.exceptions.RequestException as e:
            print(f"❌ Premier League Scoreboard: FAILED - Connection error: {e}")
            return False
    
    def test_premier_league_standings(self):
        """Test Premier League standings"""
        print("\n📈 Testing Premier League Standings...")
        
        try:
            response = requests.get(f"{self.base_url}{self.api_prefix}/espn-football/standings/eng.1", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                groups = data.get('data', {}).get('groups', [])
                
                if groups:
                    standings = groups[0].get('standings', [])
                    print(f"✅ Premier League Standings: PASSED - Found {len(standings)} teams")
                    
                    if standings:
                        # Show top 3 teams
                        for i, standing in enumerate(standings[:3]):
                            team = standing.get('team', {})
                            print(f"   {standing.get('rank', 'N/A')}. {team.get('displayName', 'N/A')} - {standing.get('wins', 0)}W {standing.get('losses', 0)}L {standing.get('ties', 0)}D")
                    
                    return True
                else:
                    print("❌ Premier League Standings: FAILED - No standings data")
                    return False
            else:
                print(f"❌ Premier League Standings: FAILED - Status {response.status_code}")
                return False
                
        except requests.exceptions.RequestException as e:
            print(f"❌ Premier League Standings: FAILED - Connection error: {e}")
            return False
    
    def test_live_matches(self):
        """Test live matches endpoint"""
        print("\n🟢 Testing Live Matches...")
        
        try:
            response = requests.get(f"{self.base_url}{self.api_prefix}/espn-football/live-matches", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                matches = data.get('data', {}).get('matches', [])
                
                print(f"✅ Live Matches: PASSED - Found {len(matches)} live matches")
                
                if matches:
                    for match in matches[:3]:  # Show first 3 live matches
                        print(f"   🔴 {match.get('name', 'N/A')}")
                
                return True
            else:
                print(f"❌ Live Matches: FAILED - Status {response.status_code}")
                return False
                
        except requests.exceptions.RequestException as e:
            print(f"❌ Live Matches: FAILED - Connection error: {e}")
            return False
    
    def test_sync_status(self):
        """Test sync status endpoint"""
        print("\n🔄 Testing Sync Status...")
        
        try:
            response = requests.get(f"{self.base_url}{self.api_prefix}/football-data-sync/status", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                status = data.get('data', {})
                
                print("✅ Sync Status: PASSED")
                print(f"   📊 ESPN: {status.get('espn', {}).get('status', 'unknown')}")
                print(f"   📊 API-Football: {status.get('apiFootball', {}).get('status', 'unknown')}")
                print(f"   📊 Football-Data: {status.get('footballData', {}).get('status', 'unknown')}")
                
                return True
            else:
                print(f"❌ Sync Status: FAILED - Status {response.status_code}")
                return False
                
        except requests.exceptions.RequestException as e:
            print(f"❌ Sync Status: FAILED - Connection error: {e}")
            return False
    
    def test_data_quality_report(self):
        """Test data quality report"""
        print("\n📊 Testing Data Quality Report...")
        
        try:
            response = requests.get(f"{self.base_url}{self.api_prefix}/football-data-sync/quality-report", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                report = data.get('data', {})
                
                print("✅ Data Quality Report: PASSED")
                print(f"   📈 Overall Quality: {report.get('mergedDataQuality', 0):.2f}")
                print(f"   📊 ESPN Status: {report.get('espnStatus', 'unknown')}")
                print(f"   📊 API-Football Status: {report.get('apiFootballStatus', 'unknown')}")
                print(f"   📊 Football-Data Status: {report.get('footballDataStatus', 'unknown')}")
                
                recommendations = report.get('recommendations', [])
                if recommendations:
                    print("   💡 Recommendations:")
                    for rec in recommendations:
                        print(f"      - {rec}")
                
                return True
            else:
                print(f"❌ Data Quality Report: FAILED - Status {response.status_code}")
                return False
                
        except requests.exceptions.RequestException as e:
            print(f"❌ Data Quality Report: FAILED - Connection error: {e}")
            return False
    
    def test_unified_data(self):
        """Test unified data endpoints"""
        print("\n🔗 Testing Unified Data...")
        
        try:
            # Test unified matches
            response = requests.get(f"{self.base_url}{self.api_prefix}/unified-football/matches/PL?limit=5", timeout=15)
            
            if response.status_code == 200:
                data = response.json()
                matches = data.get('data', [])
                
                print(f"✅ Unified Matches: PASSED - Found {len(matches)} matches")
                
                if matches:
                    for match in matches[:3]:
                        print(f"   ⚽ {match.get('homeTeam', 'N/A')} vs {match.get('awayTeam', 'N/A')} ({match.get('source', 'N/A')})")
                
                return True
            else:
                print(f"❌ Unified Matches: FAILED - Status {response.status_code}")
                return False
                
        except requests.exceptions.RequestException as e:
            print(f"❌ Unified Matches: FAILED - Connection error: {e}")
            return False
    
    def run_all_tests(self):
        """Run all integration tests"""
        print("🚀 Starting ESPN API Integration Tests")
        print("=" * 50)
        print(f"📅 Test Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"🌐 Base URL: {self.base_url}")
        print("=" * 50)
        
        tests = [
            ("Health Check", self.test_health_check),
            ("Supported Leagues", self.test_supported_leagues),
            ("Premier League Scoreboard", self.test_premier_league_scoreboard),
            ("Premier League Standings", self.test_premier_league_standings),
            ("Live Matches", self.test_live_matches),
            ("Sync Status", self.test_sync_status),
            ("Data Quality Report", self.test_data_quality_report),
            ("Unified Data", self.test_unified_data),
        ]
        
        results = []
        
        for test_name, test_func in tests:
            try:
                result = test_func()
                results.append((test_name, result))
            except Exception as e:
                print(f"❌ {test_name}: FAILED - Exception: {e}")
                results.append((test_name, False))
            
            time.sleep(1)  # Small delay between tests
        
        # Summary
        print("\n" + "=" * 50)
        print("📋 TEST SUMMARY")
        print("=" * 50)
        
        passed = sum(1 for _, result in results if result)
        total = len(results)
        
        for test_name, result in results:
            status = "✅ PASSED" if result else "❌ FAILED"
            print(f"{status} {test_name}")
        
        print(f"\n📊 Overall: {passed}/{total} tests passed ({passed/total*100:.1f}%)")
        
        if passed == total:
            print("🎉 All tests passed! ESPN API integration is working correctly.")
        else:
            print("⚠️  Some tests failed. Check the backend logs for more details.")
        
        return passed == total

def main():
    """Main function"""
    import sys
    
    # Parse command line arguments
    base_url = "http://localhost:3001"
    if len(sys.argv) > 1:
        base_url = sys.argv[1]
    
    # Run tests
    tester = ESPNIntegrationTester(base_url)
    success = tester.run_all_tests()
    
    # Exit with appropriate code
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main() 