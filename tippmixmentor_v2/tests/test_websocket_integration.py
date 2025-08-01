#!/usr/bin/env python3
"""
WebSocket Integration Test for TippMixMentor Football Data
Tests real-time data streaming via WebSocket connections
"""

import asyncio
import json
import time
import websockets
import requests
from datetime import datetime
from typing import Dict, Any, List

class WebSocketTester:
    def __init__(self, base_url: str = "http://localhost:3001"):
        self.base_url = base_url
        self.ws_url = "ws://localhost:3001/football-data"
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
        
    async def test_websocket_connection(self):
        """Test basic WebSocket connection"""
        try:
            async with websockets.connect(self.ws_url) as websocket:
                # Wait for connection
                await asyncio.sleep(1)
                
                # Test connection by sending a ping
                await websocket.ping()
                pong = await websocket.pong()
                
                self.log_test("WebSocket Connection", True, "Successfully connected to WebSocket")
                return True
                
        except Exception as e:
            self.log_test("WebSocket Connection", False, f"Connection failed: {str(e)}")
            return False
    
    async def test_live_matches_subscription(self):
        """Test live matches subscription"""
        try:
            async with websockets.connect(self.ws_url) as websocket:
                # Subscribe to live matches
                subscribe_message = {
                    "event": "subscribe_live_matches"
                }
                await websocket.send(json.dumps(subscribe_message))
                
                # Wait for subscription confirmation
                response = await asyncio.wait_for(websocket.recv(), timeout=5.0)
                data = json.loads(response)
                
                if data.get("event") == "subscribed" and data.get("channel") == "live_matches":
                    self.log_test("Live Matches Subscription", True, "Successfully subscribed to live matches")
                    return True
                else:
                    self.log_test("Live Matches Subscription", False, f"Unexpected response: {data}")
                    return False
                    
        except Exception as e:
            self.log_test("Live Matches Subscription", False, f"Subscription failed: {str(e)}")
            return False
    
    async def test_standings_subscription(self):
        """Test standings subscription"""
        try:
            async with websockets.connect(self.ws_url) as websocket:
                # Subscribe to Premier League standings
                subscribe_message = {
                    "event": "subscribe_standings",
                    "data": "PL"
                }
                await websocket.send(json.dumps(subscribe_message))
                
                # Wait for subscription confirmation
                response = await asyncio.wait_for(websocket.recv(), timeout=5.0)
                data = json.loads(response)
                
                if data.get("event") == "subscribed" and data.get("channel") == "standings":
                    self.log_test("Standings Subscription", True, "Successfully subscribed to standings")
                    return True
                else:
                    self.log_test("Standings Subscription", False, f"Unexpected response: {data}")
                    return False
                    
        except Exception as e:
            self.log_test("Standings Subscription", False, f"Subscription failed: {str(e)}")
            return False
    
    async def test_live_matches_data(self):
        """Test live matches data retrieval"""
        try:
            async with websockets.connect(self.ws_url) as websocket:
                # Request live matches
                request_message = {
                    "event": "get_live_matches"
                }
                await websocket.send(json.dumps(request_message))
                
                # Wait for response
                response = await asyncio.wait_for(websocket.recv(), timeout=10.0)
                data = json.loads(response)
                
                if data.get("event") == "live_matches_update":
                    matches = data.get("matches", [])
                    count = data.get("count", 0)
                    
                    self.log_test("Live Matches Data", True, 
                                f"Received {count} live matches", 
                                {"match_count": count, "sample_match": matches[0] if matches else None})
                    return True
                else:
                    self.log_test("Live Matches Data", False, f"Unexpected response: {data}")
                    return False
                    
        except Exception as e:
            self.log_test("Live Matches Data", False, f"Data retrieval failed: {str(e)}")
            return False
    
    async def test_standings_data(self):
        """Test standings data retrieval"""
        try:
            async with websockets.connect(self.ws_url) as websocket:
                # Request Premier League standings
                request_message = {
                    "event": "get_standings",
                    "data": "PL"
                }
                await websocket.send(json.dumps(request_message))
                
                # Wait for response
                response = await asyncio.wait_for(websocket.recv(), timeout=10.0)
                data = json.loads(response)
                
                if data.get("event") == "standings_update":
                    standings = data.get("standings", [])
                    league = data.get("league", "")
                    
                    self.log_test("Standings Data", True, 
                                f"Received standings for {league} ({len(standings)} teams)", 
                                {"league": league, "team_count": len(standings)})
                    return True
                else:
                    self.log_test("Standings Data", False, f"Unexpected response: {data}")
                    return False
                    
        except Exception as e:
            self.log_test("Standings Data", False, f"Data retrieval failed: {str(e)}")
            return False
    
    def test_rest_endpoints(self):
        """Test REST API endpoints for WebSocket-related data"""
        try:
            # Test WebSocket health endpoint
            response = requests.get(f"{self.base_url}/api/v1/espn-football/health", timeout=10)
            if response.status_code == 200:
                health_data = response.json()
                self.log_test("REST Health Check", True, "ESPN API health check passed", health_data)
            else:
                self.log_test("REST Health Check", False, f"Health check failed: {response.status_code}")
                return False
                
            # Test sync status endpoint
            response = requests.get(f"{self.base_url}/api/v1/football-data-sync/status", timeout=10)
            if response.status_code == 200:
                sync_data = response.json()
                self.log_test("REST Sync Status", True, "Sync status retrieved", sync_data)
            else:
                self.log_test("REST Sync Status", False, f"Sync status failed: {response.status_code}")
                return False
                
            # Test data quality report
            response = requests.get(f"{self.base_url}/api/v1/football-data-sync/quality-report", timeout=10)
            if response.status_code == 200:
                quality_data = response.json()
                self.log_test("REST Data Quality", True, "Data quality report retrieved", quality_data)
            else:
                self.log_test("REST Data Quality", False, f"Data quality failed: {response.status_code}")
                return False
                
            return True
            
        except Exception as e:
            self.log_test("REST Endpoints", False, f"REST API test failed: {str(e)}")
            return False
    
    async def test_real_time_updates(self):
        """Test real-time data updates"""
        try:
            async with websockets.connect(self.ws_url) as websocket:
                # Subscribe to live matches
                await websocket.send(json.dumps({"event": "subscribe_live_matches"}))
                
                # Wait for subscription confirmation
                await websocket.recv()
                
                # Wait for potential live updates (30 seconds max)
                start_time = time.time()
                updates_received = 0
                
                while time.time() - start_time < 30:
                    try:
                        response = await asyncio.wait_for(websocket.recv(), timeout=5.0)
                        data = json.loads(response)
                        
                        if data.get("event") == "live_matches_update":
                            updates_received += 1
                            matches = data.get("matches", [])
                            self.log_test("Real-time Updates", True, 
                                        f"Received update #{updates_received} with {len(matches)} matches")
                            
                            if updates_received >= 2:  # We want at least 2 updates
                                break
                                
                    except asyncio.TimeoutError:
                        continue
                
                if updates_received >= 1:
                    self.log_test("Real-time Updates", True, f"Received {updates_received} real-time updates")
                    return True
                else:
                    self.log_test("Real-time Updates", False, "No real-time updates received within 30 seconds")
                    return False
                    
        except Exception as e:
            self.log_test("Real-time Updates", False, f"Real-time test failed: {str(e)}")
            return False
    
    def print_summary(self):
        """Print test summary"""
        print("\n" + "="*60)
        print("WEBSOCKET INTEGRATION TEST SUMMARY")
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

async def main():
    """Main test function"""
    print("🏈 TippMixMentor WebSocket Integration Test")
    print("="*50)
    
    tester = WebSocketTester()
    
    # Test REST endpoints first
    print("\n📡 Testing REST API Endpoints...")
    tester.test_rest_endpoints()
    
    # Test WebSocket functionality
    print("\n🔌 Testing WebSocket Functionality...")
    
    # Basic connection test
    await tester.test_websocket_connection()
    
    # Subscription tests
    await tester.test_live_matches_subscription()
    await tester.test_standings_subscription()
    
    # Data retrieval tests
    await tester.test_live_matches_data()
    await tester.test_standings_data()
    
    # Real-time updates test
    print("\n⏰ Testing Real-time Updates...")
    await tester.test_real_time_updates()
    
    # Print summary
    success = tester.print_summary()
    
    if success:
        print("\n🎉 All WebSocket integration tests passed!")
        print("✅ Phase 2 implementation is working correctly")
        print("✅ Real-time data streaming is functional")
        print("✅ Frontend can now receive live updates")
    else:
        print("\n⚠️  Some tests failed. Please check the implementation.")
        print("🔧 Common issues:")
        print("   - Backend service not running")
        print("   - WebSocket gateway not properly configured")
        print("   - CORS settings not configured")
        print("   - Network connectivity issues")
    
    return success

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n\n⏹️  Test interrupted by user")
    except Exception as e:
        print(f"\n💥 Test failed with error: {str(e)}") 