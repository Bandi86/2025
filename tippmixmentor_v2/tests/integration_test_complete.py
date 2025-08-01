#!/usr/bin/env python3
"""
Comprehensive Integration Test for TippMixMentor v2
Tests the complete data flow between Frontend, Backend, ML Service, and Agent OS
"""

import requests
import json
import time
import sys
from typing import Dict, Any

class IntegrationTester:
    def __init__(self):
        self.frontend_url = "http://localhost:3000"
        self.backend_url = "http://localhost:3001"
        self.ml_service_url = "http://localhost:8000"
        self.agent_os_url = "http://localhost:8001"
        
        self.test_results = []
        
    def log_test(self, test_name: str, success: bool, message: str = "", data: Any = None):
        """Log test results"""
        result = {
            "test": test_name,
            "success": success,
            "message": message,
            "data": data,
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S")
        }
        self.test_results.append(result)
        
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}: {message}")
        
    def test_service_health(self):
        """Test all services are running and healthy"""
        print("\n🔍 Testing Service Health...")
        
        # Test Frontend
        try:
            response = requests.get(f"{self.frontend_url}", timeout=5)
            self.log_test("Frontend Health", response.status_code == 200, 
                         f"Status: {response.status_code}")
        except Exception as e:
            self.log_test("Frontend Health", False, f"Error: {str(e)}")
            
        # Test Backend Health
        try:
            response = requests.get(f"{self.backend_url}/api/v1/gateway/health", timeout=5)
            data = response.json()
            self.log_test("Backend Health", response.status_code == 200, 
                         f"Status: {response.status_code}, Services: {data.get('services', {})}")
        except Exception as e:
            self.log_test("Backend Health", False, f"Error: {str(e)}")
            
        # Test ML Service Health
        try:
            response = requests.get(f"{self.ml_service_url}/health/", timeout=5)
            data = response.json()
            self.log_test("ML Service Health", response.status_code == 200, 
                         f"Status: {data.get('status', 'unknown')}")
        except Exception as e:
            self.log_test("ML Service Health", False, f"Error: {str(e)}")
            
        # Test Agent OS Health
        try:
            response = requests.get(f"{self.agent_os_url}/health", timeout=5)
            data = response.json()
            self.log_test("Agent OS Health", response.status_code == 200, 
                         f"Status: {data.get('status', 'unknown')}")
        except Exception as e:
            self.log_test("Agent OS Health", False, f"Error: {str(e)}")
    
    def test_api_endpoints(self):
        """Test key API endpoints"""
        print("\n🔍 Testing API Endpoints...")
        
        # Test Backend API endpoints
        endpoints = [
            ("Backend Gateway Health", f"{self.backend_url}/api/v1/gateway/health"),
            ("Backend Metrics", f"{self.backend_url}/api/v1/metrics"),
            ("Backend Health", f"{self.backend_url}/api/v1/health"),
        ]
        
        for name, url in endpoints:
            try:
                response = requests.get(url, timeout=5)
                self.log_test(name, response.status_code == 200, 
                             f"Status: {response.status_code}")
            except Exception as e:
                self.log_test(name, False, f"Error: {str(e)}")
        
        # Test ML Service endpoints
        ml_endpoints = [
            ("ML Football Data Status", f"{self.ml_service_url}/football-data/status"),
            ("ML Models Status", f"{self.ml_service_url}/models/"),
            ("ML Predictions Status", f"{self.ml_service_url}/predictions/"),
        ]
        
        for name, url in ml_endpoints:
            try:
                response = requests.get(url, timeout=5)
                self.log_test(name, response.status_code == 200, 
                             f"Status: {response.status_code}")
            except Exception as e:
                self.log_test(name, False, f"Error: {str(e)}")
        
        # Test Agent OS endpoints
        agent_endpoints = [
            ("Agent OS Health", f"{self.agent_os_url}/health"),
            ("Agent OS Tasks", f"{self.agent_os_url}/tasks/"),
            ("Agent OS Agents", f"{self.agent_os_url}/agents"),
        ]
        
        for name, url in agent_endpoints:
            try:
                response = requests.get(url, timeout=5)
                self.log_test(name, response.status_code == 200, 
                             f"Status: {response.status_code}")
            except Exception as e:
                self.log_test(name, False, f"Error: {str(e)}")
    
    def test_frontend_backend_communication(self):
        """Test frontend can communicate with backend"""
        print("\n🔍 Testing Frontend-Backend Communication...")
        
        # Test frontend API routes that proxy to backend
        frontend_endpoints = [
            ("Frontend Football Data Status", f"{self.frontend_url}/api/football-data/status"),
            ("Frontend API Football Status", f"{self.frontend_url}/api/api-football/status"),
        ]
        
        for name, url in frontend_endpoints:
            try:
                response = requests.get(url, timeout=10)
                self.log_test(name, response.status_code == 200, 
                             f"Status: {response.status_code}")
            except Exception as e:
                self.log_test(name, False, f"Error: {str(e)}")
    
    def test_data_flow(self):
        """Test data flow between services"""
        print("\n🔍 Testing Data Flow...")
        
        # Test ML Service can provide football data
        try:
            response = requests.get(f"{self.ml_service_url}/football-data/status", timeout=5)
            data = response.json()
            has_competitions = 'competitions' in data and len(data['competitions']) > 0
            self.log_test("ML Service Football Data", has_competitions, 
                         f"Available competitions: {len(data.get('competitions', {}))}")
        except Exception as e:
            self.log_test("ML Service Football Data", False, f"Error: {str(e)}")
        
        # Test Backend can access ML Service
        try:
            response = requests.get(f"{self.backend_url}/api/v1/football-data/status", timeout=10)
            self.log_test("Backend ML Service Access", response.status_code == 200, 
                         f"Status: {response.status_code}")
        except Exception as e:
            self.log_test("Backend ML Service Access", False, f"Error: {str(e)}")
    
    def test_authentication(self):
        """Test authentication endpoints"""
        print("\n🔍 Testing Authentication...")
        
        # Test registration endpoint (should be accessible)
        try:
            response = requests.post(f"{self.backend_url}/api/v1/auth/register", 
                                   json={"email":"test@test.com","password":"test123","username":"testuser"},
                                   timeout=5)
            # Should return 409 Conflict if user exists, or 201 if created
            self.log_test("Auth Registration Endpoint", response.status_code in [409, 201], 
                         f"Status: {response.status_code}")
        except Exception as e:
            self.log_test("Auth Registration Endpoint", False, f"Error: {str(e)}")
        
        # Test protected endpoint (should require auth)
        try:
            response = requests.get(f"{self.backend_url}/api/v1/agents", timeout=5)
            self.log_test("Protected Endpoint Auth", response.status_code == 401, 
                         f"Status: {response.status_code} (should be 401)")
        except Exception as e:
            self.log_test("Protected Endpoint Auth", False, f"Error: {str(e)}")
    
    def generate_report(self):
        """Generate comprehensive test report"""
        print("\n" + "="*60)
        print("📊 INTEGRATION TEST REPORT")
        print("="*60)
        
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results if result['success'])
        failed_tests = total_tests - passed_tests
        
        print(f"\n📈 SUMMARY:")
        print(f"   Total Tests: {total_tests}")
        print(f"   ✅ Passed: {passed_tests}")
        print(f"   ❌ Failed: {failed_tests}")
        print(f"   📊 Success Rate: {(passed_tests/total_tests)*100:.1f}%")
        
        if failed_tests > 0:
            print(f"\n❌ FAILED TESTS:")
            for result in self.test_results:
                if not result['success']:
                    print(f"   • {result['test']}: {result['message']}")
        
        print(f"\n✅ PASSED TESTS:")
        for result in self.test_results:
            if result['success']:
                print(f"   • {result['test']}: {result['message']}")
        
        # Save detailed report
        with open('integration_test_report.json', 'w') as f:
            json.dump(self.test_results, f, indent=2)
        
        print(f"\n📄 Detailed report saved to: integration_test_report.json")
        
        return passed_tests == total_tests

def main():
    print("🚀 Starting TippMixMentor v2 Integration Test")
    print("="*60)
    
    tester = IntegrationTester()
    
    # Run all tests
    tester.test_service_health()
    tester.test_api_endpoints()
    tester.test_frontend_backend_communication()
    tester.test_data_flow()
    tester.test_authentication()
    
    # Generate report
    success = tester.generate_report()
    
    if success:
        print("\n🎉 ALL TESTS PASSED! Integration is working correctly.")
        sys.exit(0)
    else:
        print("\n⚠️  SOME TESTS FAILED. Please check the report above.")
        sys.exit(1)

if __name__ == "__main__":
    main() 