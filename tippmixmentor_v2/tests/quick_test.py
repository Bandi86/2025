#!/usr/bin/env python3
"""
Quick Test Runner for TippMixMentor
Fast verification that all services are working correctly.
"""

import asyncio
import httpx
import json
import time
from datetime import datetime
from typing import Dict, Any, List

# Configuration
SERVICES = {
    "backend": "http://localhost:3001",
    "frontend": "http://localhost:3000",
    "ml_service": "http://localhost:8000",
    "agent_os": "http://localhost:8001"
}

class QuickTestResult:
    def __init__(self, service: str, endpoint: str):
        self.service = service
        self.endpoint = endpoint
        self.success = False
        self.response_time = 0
        self.status_code = 0
        self.error = None

    def __str__(self):
        status = "✅" if self.success else "❌"
        return f"{status} {self.service} - {self.endpoint} ({self.response_time:.2f}s)"

class QuickTestRunner:
    def __init__(self):
        self.results: List[QuickTestResult] = []
        
    async def run_quick_tests(self):
        """Run quick health checks for all services"""
        print("🚀 TippMixMentor Quick Test")
        print("=" * 50)
        print(f"Started at: {datetime.now().isoformat()}")
        print()
        
        async with httpx.AsyncClient(timeout=10.0) as client:
            # Test Backend
            await self.test_backend(client)
            
            # Test ML Service
            await self.test_ml_service(client)
            
            # Test Agent OS
            await self.test_agent_os(client)
            
            # Test Frontend
            await self.test_frontend(client)
            
            # Test Database Connection
            await self.test_database_connection(client)
            
            # Test WebSocket
            await self.test_websocket()
        
        # Generate report
        self.generate_quick_report()

    async def test_backend(self, client: httpx.AsyncClient):
        """Test backend service"""
        print("🔧 Testing Backend Service")
        print("-" * 30)
        
        # Health check
        result = QuickTestResult("Backend", "/health")
        start_time = time.time()
        
        try:
            response = await client.get(f"{SERVICES['backend']}/health")
            result.response_time = time.time() - start_time
            result.status_code = response.status_code
            result.success = response.status_code == 200
            
            if result.success:
                health_data = response.json()
                print(f"  {result}")
                print(f"    Status: {health_data.get('status', 'unknown')}")
                print(f"    Uptime: {health_data.get('uptime', 'unknown')}")
            else:
                result.error = f"Status code: {response.status_code}"
                print(f"  {result}")
                print(f"    Error: {result.error}")
                
        except Exception as e:
            result.error = str(e)
            result.response_time = time.time() - start_time
            print(f"  {result}")
            print(f"    Error: {result.error}")
        
        self.results.append(result)
        
        # Test API endpoints
        endpoints = [
            ("/matches", "GET"),
            ("/predictions", "GET"),
            ("/users", "GET"),
            ("/agents", "GET")
        ]
        
        for endpoint, method in endpoints:
            result = QuickTestResult("Backend", f"{method} {endpoint}")
            start_time = time.time()
            
            try:
                if method == "GET":
                    response = await client.get(f"{SERVICES['backend']}{endpoint}")
                else:
                    response = await client.post(f"{SERVICES['backend']}{endpoint}")
                
                result.response_time = time.time() - start_time
                result.status_code = response.status_code
                result.success = response.status_code in [200, 201, 401, 403]  # 401/403 are expected for unauthenticated requests
                
                print(f"  {result}")
                
            except Exception as e:
                result.error = str(e)
                result.response_time = time.time() - start_time
                print(f"  {result}")
                print(f"    Error: {result.error}")
            
            self.results.append(result)

    async def test_ml_service(self, client: httpx.AsyncClient):
        """Test ML service"""
        print("\n🤖 Testing ML Service")
        print("-" * 25)
        
        # Health check
        result = QuickTestResult("ML Service", "/health")
        start_time = time.time()
        
        try:
            response = await client.get(f"{SERVICES['ml_service']}/health")
            result.response_time = time.time() - start_time
            result.status_code = response.status_code
            result.success = response.status_code == 200
            
            if result.success:
                health_data = response.json()
                print(f"  {result}")
                print(f"    Status: {health_data.get('status', 'unknown')}")
            else:
                result.error = f"Status code: {response.status_code}"
                print(f"  {result}")
                print(f"    Error: {result.error}")
                
        except Exception as e:
            result.error = str(e)
            result.response_time = time.time() - start_time
            print(f"  {result}")
            print(f"    Error: {result.error}")
        
        self.results.append(result)
        
        # Test prediction endpoint
        result = QuickTestResult("ML Service", "/predict")
        start_time = time.time()
        
        try:
            prediction_data = {
                "match_id": "test_match",
                "home_team": "Test Home",
                "away_team": "Test Away",
                "features": {
                    "home_form": 0.7,
                    "away_form": 0.6,
                    "home_goals_scored": 1.5,
                    "away_goals_scored": 1.2
                }
            }
            
            response = await client.post(f"{SERVICES['ml_service']}/predict", json=prediction_data)
            result.response_time = time.time() - start_time
            result.status_code = response.status_code
            result.success = response.status_code in [200, 201]
            
            print(f"  {result}")
            
        except Exception as e:
            result.error = str(e)
            result.response_time = time.time() - start_time
            print(f"  {result}")
            print(f"    Error: {result.error}")
        
        self.results.append(result)

    async def test_agent_os(self, client: httpx.AsyncClient):
        """Test Agent OS service"""
        print("\n🤖 Testing Agent OS")
        print("-" * 20)
        
        # Health check
        result = QuickTestResult("Agent OS", "/health")
        start_time = time.time()
        
        try:
            response = await client.get(f"{SERVICES['agent_os']}/health")
            result.response_time = time.time() - start_time
            result.status_code = response.status_code
            result.success = response.status_code == 200
            
            if result.success:
                health_data = response.json()
                print(f"  {result}")
                print(f"    Status: {health_data.get('status', 'unknown')}")
            else:
                result.error = f"Status code: {response.status_code}"
                print(f"  {result}")
                print(f"    Error: {result.error}")
                
        except Exception as e:
            result.error = str(e)
            result.response_time = time.time() - start_time
            print(f"  {result}")
            print(f"    Error: {result.error}")
        
        self.results.append(result)
        
        # Test agents endpoint
        result = QuickTestResult("Agent OS", "/agents")
        start_time = time.time()
        
        try:
            response = await client.get(f"{SERVICES['agent_os']}/agents")
            result.response_time = time.time() - start_time
            result.status_code = response.status_code
            result.success = response.status_code in [200, 201]
            
            print(f"  {result}")
            
        except Exception as e:
            result.error = str(e)
            result.response_time = time.time() - start_time
            print(f"  {result}")
            print(f"    Error: {result.error}")
        
        self.results.append(result)

    async def test_frontend(self, client: httpx.AsyncClient):
        """Test frontend service"""
        print("\n🌐 Testing Frontend")
        print("-" * 20)
        
        # Health check
        result = QuickTestResult("Frontend", "/")
        start_time = time.time()
        
        try:
            response = await client.get(SERVICES['frontend'])
            result.response_time = time.time() - start_time
            result.status_code = response.status_code
            result.success = response.status_code == 200
            
            print(f"  {result}")
            
        except Exception as e:
            result.error = str(e)
            result.response_time = time.time() - start_time
            print(f"  {result}")
            print(f"    Error: {result.error}")
        
        self.results.append(result)

    async def test_database_connection(self, client: httpx.AsyncClient):
        """Test database connection through backend"""
        print("\n🗄️ Testing Database Connection")
        print("-" * 35)
        
        # Test database health through backend
        result = QuickTestResult("Database", "/health/database")
        start_time = time.time()
        
        try:
            response = await client.get(f"{SERVICES['backend']}/health/database")
            result.response_time = time.time() - start_time
            result.status_code = response.status_code
            result.success = response.status_code == 200
            
            if result.success:
                db_data = response.json()
                print(f"  {result}")
                print(f"    Status: {db_data.get('status', 'unknown')}")
            else:
                result.error = f"Status code: {response.status_code}"
                print(f"  {result}")
                print(f"    Error: {result.error}")
                
        except Exception as e:
            result.error = str(e)
            result.response_time = time.time() - start_time
            print(f"  {result}")
            print(f"    Error: {result.error}")
        
        self.results.append(result)

    async def test_websocket(self):
        """Test WebSocket connection"""
        print("\n🔌 Testing WebSocket")
        print("-" * 20)
        
        try:
            import websockets
            
            result = QuickTestResult("WebSocket", "/ws")
            start_time = time.time()
            
            try:
                ws_url = f"ws://localhost:3001/ws"
                websocket = await websockets.connect(ws_url, timeout=5)
                result.response_time = time.time() - start_time
                result.success = True
                
                print(f"  {result}")
                
                # Test sending a message
                test_message = {
                    "type": "ping",
                    "timestamp": datetime.now().isoformat()
                }
                
                await websocket.send(json.dumps(test_message))
                print(f"    Message sent successfully")
                
                await websocket.close()
                
            except Exception as e:
                result.error = str(e)
                result.response_time = time.time() - start_time
                print(f"  {result}")
                print(f"    Error: {result.error}")
            
            self.results.append(result)
            
        except ImportError:
            print("  ⚠️  WebSocket test skipped (websockets library not available)")
            result = QuickTestResult("WebSocket", "/ws")
            result.success = False
            result.error = "websockets library not available"
            self.results.append(result)

    def generate_quick_report(self):
        """Generate quick test report"""
        print("\n" + "=" * 50)
        print("📊 QUICK TEST REPORT")
        print("=" * 50)
        
        total_tests = len(self.results)
        passed_tests = sum(1 for r in self.results if r.success)
        failed_tests = total_tests - passed_tests
        
        print(f"Total Tests: {total_tests}")
        print(f"Passed: {passed_tests} ✅")
        print(f"Failed: {failed_tests} ❌")
        print(f"Success Rate: {(passed_tests/total_tests*100):.1f}%")
        print()
        
        # Group by service
        services = {}
        for result in self.results:
            if result.service not in services:
                services[result.service] = []
            services[result.service].append(result)
        
        for service, results in services.items():
            service_passed = sum(1 for r in results if r.success)
            service_total = len(results)
            service_rate = (service_passed / service_total * 100) if service_total > 0 else 0
            
            print(f"📁 {service.upper()}")
            print(f"  Tests: {service_passed}/{service_total} ({service_rate:.1f}%)")
            
            for result in results:
                print(f"    {result}")
                if not result.success and result.error:
                    print(f"      Error: {result.error}")
            print()
        
        # Performance summary
        avg_response_time = sum(r.response_time for r in self.results) / len(self.results) if self.results else 0
        print(f"⚡ Average Response Time: {avg_response_time:.3f}s")
        
        # Summary
        print("\n🎯 SUMMARY")
        print("-" * 20)
        
        if failed_tests == 0:
            print("🎉 All services are working correctly!")
            print("✅ The system is ready for use.")
        elif failed_tests <= 2:
            print("⚠️  Most services are working, but some issues detected.")
            print("🔧 Check the failed tests above.")
        else:
            print("❌ Multiple services have issues.")
            print("🔧 Please check the service logs and fix the problems.")
        
        print(f"\nReport generated at: {datetime.now().isoformat()}")

async def main():
    """Main function"""
    runner = QuickTestRunner()
    await runner.run_quick_tests()

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n⚠️  Test execution interrupted by user")
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}") 