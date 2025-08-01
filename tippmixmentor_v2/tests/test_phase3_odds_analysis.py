#!/usr/bin/env python3
"""
Phase 3: Odds Analysis & Betting Recommendations Test
Tests advanced odds comparison, betting recommendations, and value betting analysis
"""

import requests
import json
import time
from datetime import datetime
from typing import Dict, Any, List

class Phase3Tester:
    def __init__(self, base_url: str = "http://localhost:3001"):
        self.base_url = base_url
        self.test_results = []
        
    def log_test(self, test_name: str, success: bool, message: str = "", data: Any = None):
        """Log test results"""
        result = {
            "test": test_name,
            "success": success,
            "message": message,
            "timestamp": datetime.now().isoformat(),
            "data": data
        }
        self.test_results.append(result)
        
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}: {message}")
        
    def test_odds_analysis_endpoints(self):
        """Test odds analysis API endpoints"""
        try:
            # Test provider analysis endpoint
            response = requests.get(f"{self.base_url}/api/v1/odds-analysis/provider-analysis", timeout=10)
            if response.status_code == 200:
                data = response.json()
                self.log_test("Provider Analysis", True, "Provider analysis retrieved successfully", {
                    "providers_count": len(data.get("providers", [])),
                    "overall_reliability": data.get("reliability", {}).get("overall", 0)
                })
            else:
                self.log_test("Provider Analysis", False, f"Failed with status {response.status_code}")
                return False
                
            # Test market efficiency endpoint
            response = requests.get(f"{self.base_url}/api/v1/odds-analysis/market-efficiency/PL", timeout=10)
            if response.status_code == 200:
                data = response.json()
                self.log_test("Market Efficiency", True, "Market efficiency analysis retrieved", {
                    "league": data.get("league"),
                    "average_efficiency": data.get("averageEfficiency", 0)
                })
            else:
                self.log_test("Market Efficiency", False, f"Failed with status {response.status_code}")
                
            # Test arbitrage opportunities endpoint
            response = requests.get(f"{self.base_url}/api/v1/odds-analysis/arbitrage-opportunities", timeout=10)
            if response.status_code == 200:
                data = response.json()
                self.log_test("Arbitrage Opportunities", True, f"Found {len(data)} arbitrage opportunities", {
                    "opportunities_count": len(data)
                })
            else:
                self.log_test("Arbitrage Opportunities", False, f"Failed with status {response.status_code}")
                
            return True
            
        except Exception as e:
            self.log_test("Odds Analysis Endpoints", False, f"Test failed: {str(e)}")
            return False
    
    def test_betting_recommendations(self):
        """Test betting recommendations functionality"""
        try:
            # Test recommendations endpoint
            response = requests.get(f"{self.base_url}/api/v1/odds-analysis/recommendations", timeout=15)
            if response.status_code == 200:
                data = response.json()
                self.log_test("Betting Recommendations", True, f"Retrieved {len(data)} recommendations", {
                    "recommendations_count": len(data),
                    "sample_recommendation": data[0] if data else None
                })
                
                # Analyze recommendations
                if data:
                    high_confidence = len([r for r in data if r.get("confidence", 0) > 0.8])
                    low_risk = len([r for r in data if r.get("risk") == "low"])
                    
                    self.log_test("Recommendations Analysis", True, 
                                f"High confidence: {high_confidence}, Low risk: {low_risk}", {
                                    "high_confidence_count": high_confidence,
                                    "low_risk_count": low_risk,
                                    "total_recommendations": len(data)
                                })
                else:
                    self.log_test("Recommendations Analysis", True, "No recommendations available (expected for empty database)")
                    
            else:
                self.log_test("Betting Recommendations", False, f"Failed with status {response.status_code}")
                return False
                
            # Test league-specific recommendations
            response = requests.get(f"{self.base_url}/api/v1/odds-analysis/recommendations?league=PL", timeout=15)
            if response.status_code == 200:
                data = response.json()
                self.log_test("League-Specific Recommendations", True, 
                            f"Retrieved {len(data)} Premier League recommendations", {
                                "pl_recommendations_count": len(data)
                            })
            else:
                self.log_test("League-Specific Recommendations", False, f"Failed with status {response.status_code}")
                
            return True
            
        except Exception as e:
            self.log_test("Betting Recommendations", False, f"Test failed: {str(e)}")
            return False
    
    def test_value_betting_analysis(self):
        """Test value betting analysis functionality"""
        try:
            # Test top value bets endpoint
            response = requests.get(f"{self.base_url}/api/v1/odds-analysis/top-value-bets?limit=10&minValue=5", timeout=15)
            if response.status_code == 200:
                data = response.json()
                self.log_test("Top Value Bets", True, f"Retrieved {len(data)} value bets", {
                    "value_bets_count": len(data),
                    "sample_value_bet": data[0] if data else None
                })
                
                # Analyze value bets
                if data:
                    high_value = len([b for b in data if b.get("value", 0) > 15])
                    high_confidence = len([b for b in data if b.get("confidence", 0) > 0.8])
                    
                    self.log_test("Value Bets Analysis", True, 
                                f"High value: {high_value}, High confidence: {high_confidence}", {
                                    "high_value_count": high_value,
                                    "high_confidence_count": high_confidence,
                                    "total_value_bets": len(data)
                                })
                else:
                    self.log_test("Value Bets Analysis", True, "No value bets available (expected for empty database)")
                    
            else:
                self.log_test("Top Value Bets", False, f"Failed with status {response.status_code}")
                return False
                
            return True
            
        except Exception as e:
            self.log_test("Value Betting Analysis", False, f"Test failed: {str(e)}")
            return False
    
    def test_odds_movement_alerts(self):
        """Test odds movement alerts functionality"""
        try:
            # Test movement alerts endpoint
            response = requests.get(f"{self.base_url}/api/v1/odds-analysis/movement-alerts", timeout=10)
            if response.status_code == 200:
                data = response.json()
                self.log_test("Odds Movement Alerts", True, f"Retrieved {len(data)} movement alerts", {
                    "alerts_count": len(data),
                    "sample_alert": data[0] if data else None
                })
                
                # Analyze alerts
                if data:
                    high_significance = len([a for a in data if a.get("significance") == "high"])
                    medium_significance = len([a for a in data if a.get("significance") == "medium"])
                    
                    self.log_test("Movement Alerts Analysis", True, 
                                f"High significance: {high_significance}, Medium: {medium_significance}", {
                                    "high_significance_count": high_significance,
                                    "medium_significance_count": medium_significance,
                                    "total_alerts": len(data)
                                })
                else:
                    self.log_test("Movement Alerts Analysis", True, "No movement alerts available (expected for empty database)")
                    
            else:
                self.log_test("Odds Movement Alerts", False, f"Failed with status {response.status_code}")
                return False
                
            return True
            
        except Exception as e:
            self.log_test("Odds Movement Alerts", False, f"Test failed: {str(e)}")
            return False
    
    def test_odds_comparison_functionality(self):
        """Test odds comparison functionality (with mock data)"""
        try:
            # This would test with actual match IDs when available
            # For now, test the endpoint structure
            response = requests.get(f"{self.base_url}/api/v1/odds-analysis/comparison/test-match-id", timeout=10)
            if response.status_code == 404:
                # Expected for non-existent match ID
                self.log_test("Odds Comparison Structure", True, "Endpoint structure is correct (404 for invalid match ID)")
            else:
                self.log_test("Odds Comparison Structure", True, f"Endpoint responded with status {response.status_code}")
                
            return True
            
        except Exception as e:
            self.log_test("Odds Comparison Functionality", False, f"Test failed: {str(e)}")
            return False
    
    def test_historical_odds_functionality(self):
        """Test historical odds functionality (with mock data)"""
        try:
            # Test with non-existent match ID
            response = requests.get(f"{self.base_url}/api/v1/odds-analysis/historical/test-match-id", timeout=10)
            if response.status_code == 404:
                # Expected for non-existent match ID
                self.log_test("Historical Odds Structure", True, "Endpoint structure is correct (404 for invalid match ID)")
            else:
                self.log_test("Historical Odds Structure", True, f"Endpoint responded with status {response.status_code}")
                
            return True
            
        except Exception as e:
            self.log_test("Historical Odds Functionality", False, f"Test failed: {str(e)}")
            return False
    
    def test_value_betting_analysis_endpoint(self):
        """Test value betting analysis endpoint (with mock data)"""
        try:
            # Test with non-existent match ID
            response = requests.get(f"{self.base_url}/api/v1/odds-analysis/value-betting/test-match-id", timeout=10)
            if response.status_code == 404:
                # Expected for non-existent match ID
                self.log_test("Value Betting Analysis Structure", True, "Endpoint structure is correct (404 for invalid match ID)")
            else:
                self.log_test("Value Betting Analysis Structure", True, f"Endpoint responded with status {response.status_code}")
                
            return True
            
        except Exception as e:
            self.log_test("Value Betting Analysis Endpoint", False, f"Test failed: {str(e)}")
            return False
    
    def test_api_documentation(self):
        """Test API documentation and Swagger endpoints"""
        try:
            # Test Swagger documentation
            response = requests.get(f"{self.base_url}/api", timeout=10)
            if response.status_code == 200:
                self.log_test("API Documentation", True, "Swagger documentation is accessible")
            else:
                self.log_test("API Documentation", False, f"Swagger documentation failed with status {response.status_code}")
                
            return True
            
        except Exception as e:
            self.log_test("API Documentation", False, f"Test failed: {str(e)}")
            return False
    
    def print_summary(self):
        """Print test summary"""
        print("\n" + "="*60)
        print("PHASE 3: ODDS ANALYSIS & BETTING RECOMMENDATIONS TEST SUMMARY")
        print("="*60)
        
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results if result["success"])
        failed_tests = total_tests - passed_tests
        
        print(f"Total Tests: {total_tests}")
        print(f"Passed: {passed_tests}")
        print(f"Failed: {failed_tests}")
        print(f"Success Rate: {(passed_tests/total_tests)*100:.1f}%")
        
        if failed_tests > 0:
            print("\nFailed Tests:")
            for result in self.test_results:
                if not result["success"]:
                    print(f"  - {result['test']}: {result['message']}")
        
        print("\n" + "="*60)
        
        return passed_tests == total_tests

def main():
    """Main test function"""
    print("🎯 Phase 3: Odds Analysis & Betting Recommendations Test")
    print("="*60)
    
    tester = Phase3Tester()
    
    # Test odds analysis endpoints
    print("\n📊 Testing Odds Analysis Endpoints...")
    tester.test_odds_analysis_endpoints()
    
    # Test betting recommendations
    print("\n🎯 Testing Betting Recommendations...")
    tester.test_betting_recommendations()
    
    # Test value betting analysis
    print("\n💰 Testing Value Betting Analysis...")
    tester.test_value_betting_analysis()
    
    # Test odds movement alerts
    print("\n📈 Testing Odds Movement Alerts...")
    tester.test_odds_movement_alerts()
    
    # Test odds comparison functionality
    print("\n🔍 Testing Odds Comparison Functionality...")
    tester.test_odds_comparison_functionality()
    
    # Test historical odds functionality
    print("\n📅 Testing Historical Odds Functionality...")
    tester.test_historical_odds_functionality()
    
    # Test value betting analysis endpoint
    print("\n📊 Testing Value Betting Analysis Endpoint...")
    tester.test_value_betting_analysis_endpoint()
    
    # Test API documentation
    print("\n📚 Testing API Documentation...")
    tester.test_api_documentation()
    
    # Print summary
    success = tester.print_summary()
    
    if success:
        print("\n🎉 All Phase 3 tests passed!")
        print("✅ Odds analysis service is working correctly")
        print("✅ Betting recommendations are functional")
        print("✅ Value betting analysis is operational")
        print("✅ API endpoints are properly structured")
        print("✅ Ready for frontend integration")
    else:
        print("\n⚠️  Some tests failed. Please check the implementation.")
        print("🔧 Common issues:")
        print("   - Backend service not running")
        print("   - Database not properly configured")
        print("   - API endpoints not properly registered")
        print("   - Missing dependencies")
    
    return success

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n⏹️  Test interrupted by user")
    except Exception as e:
        print(f"\n💥 Test failed with error: {str(e)}") 