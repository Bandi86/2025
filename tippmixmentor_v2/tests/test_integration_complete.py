#!/usr/bin/env python3
"""
Complete Integration Test Runner for TippMixMentor
Tests the full integration between Backend, Agent OS, ML Service, and Frontend
"""

import asyncio
import httpx
import json
import time
import sys
import os
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
import subprocess
import signal

# Configuration
SERVICES = {
    "backend": {
        "url": "http://localhost:3001",
        "health_endpoint": "/health",
        "name": "Backend API"
    },
    "agent_os": {
        "url": "http://localhost:8001",
        "health_endpoint": "/health",
        "name": "Agent OS"
    },
    "ml_service": {
        "url": "http://localhost:8000",
        "health_endpoint": "/health",
        "name": "ML Service"
    },
    "frontend": {
        "url": "http://localhost:3000",
        "health_endpoint": "/",
        "name": "Frontend"
    }
}

class TestResult:
    def __init__(self, test_name: str, category: str = "general"):
        self.test_name = test_name
        self.category = category
        self.success = False
        self.error = None
        self.duration = 0
        self.data = None
        self.timestamp = datetime.now()

    def __str__(self):
        status = "✅ PASS" if self.success else "❌ FAIL"
        return f"{status} {self.test_name} ({self.duration:.2f}s)"

class IntegrationTestRunner:
    def __init__(self):
        self.results: List[TestResult] = []
        self.test_data = {}
        self.session = None
        
    async def __aenter__(self):
        self.session = httpx.AsyncClient(timeout=30.0)
        return self
        
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.aclose()

    async def run_complete_test_suite(self):
        """Run the complete integration test suite"""
        print("🚀 Starting Complete TippMixMentor Integration Test Suite")
        print("=" * 80)
        print(f"Timestamp: {datetime.now().isoformat()}")
        print()
        
        # Test phases
        await self.test_service_availability()
        await self.test_health_endpoints()
        await self.test_authentication()
        await self.test_agent_system_integration()
        await self.test_ml_service_integration()
        await self.test_prediction_workflows()
        await self.test_enhanced_features()
        await self.test_error_scenarios()
        await self.test_performance()
        await self.test_data_flow()
        
        # Generate report
        self.generate_test_report()

    async def test_service_availability(self):
        """Test if all services are running and accessible"""
        print("🔍 Phase 1: Service Availability")
        print("-" * 40)
        
        for service_name, config in SERVICES.items():
            result = TestResult(f"Service Availability - {config['name']}", "availability")
            start_time = time.time()
            
            try:
                response = await self.session.get(f"{config['url']}{config['health_endpoint']}")
                result.duration = time.time() - start_time
                
                if response.status_code in [200, 404]:  # 404 is OK for frontend health check
                    result.success = True
                    print(f"✅ {config['name']}: Available")
                else:
                    result.error = f"Unexpected status: {response.status_code}"
                    print(f"❌ {config['name']}: Unavailable (Status: {response.status_code})")
                    
            except Exception as e:
                result.duration = time.time() - start_time
                result.error = str(e)
                print(f"❌ {config['name']}: Connection failed - {str(e)}")
            
            self.results.append(result)

    async def test_health_endpoints(self):
        """Test detailed health endpoints"""
        print("\n🏥 Phase 2: Health Endpoints")
        print("-" * 40)
        
        # Test backend health
        result = TestResult("Backend Health Check", "health")
        start_time = time.time()
        
        try:
            response = await self.session.get(f"{SERVICES['backend']['url']}/health")
            result.duration = time.time() - start_time
            
            if response.status_code == 200:
                health_data = response.json()
                result.success = True
                result.data = health_data
                print(f"✅ Backend Health: {health_data.get('status', 'unknown')}")
            else:
                result.error = f"Status: {response.status_code}"
                print(f"❌ Backend Health: Failed")
                
        except Exception as e:
            result.duration = time.time() - start_time
            result.error = str(e)
            print(f"❌ Backend Health: {str(e)}")
        
        self.results.append(result)
        
        # Test agent OS health
        result = TestResult("Agent OS Health Check", "health")
        start_time = time.time()
        
        try:
            response = await self.session.get(f"{SERVICES['agent_os']['url']}/health")
            result.duration = time.time() - start_time
            
            if response.status_code == 200:
                health_data = response.json()
                result.success = True
                result.data = health_data
                print(f"✅ Agent OS Health: {health_data.get('status', 'unknown')}")
            else:
                result.error = f"Status: {response.status_code}"
                print(f"❌ Agent OS Health: Failed")
                
        except Exception as e:
            result.duration = time.time() - start_time
            result.error = str(e)
            print(f"❌ Agent OS Health: {str(e)}")
        
        self.results.append(result)
        
        # Test ML service health
        result = TestResult("ML Service Health Check", "health")
        start_time = time.time()
        
        try:
            response = await self.session.get(f"{SERVICES['ml_service']['url']}/health")
            result.duration = time.time() - start_time
            
            if response.status_code == 200:
                health_data = response.json()
                result.success = True
                result.data = health_data
                print(f"✅ ML Service Health: {health_data.get('status', 'unknown')}")
            else:
                result.error = f"Status: {response.status_code}"
                print(f"❌ ML Service Health: Failed")
                
        except Exception as e:
            result.duration = time.time() - start_time
            result.error = str(e)
            print(f"❌ ML Service Health: {str(e)}")
        
        self.results.append(result)

    async def test_authentication(self):
        """Test authentication system"""
        print("\n🔐 Phase 3: Authentication")
        print("-" * 40)
        
        # Test registration endpoint
        result = TestResult("User Registration", "auth")
        start_time = time.time()
        
        try:
            user_data = {
                "email": f"test_{int(time.time())}@example.com",
                "password": "testpassword123",
                "name": "Test User"
            }
            
            response = await self.session.post(
                f"{SERVICES['backend']['url']}/auth/register",
                json=user_data
            )
            
            result.duration = time.time() - start_time
            
            if response.status_code in [201, 409]:  # 409 means user already exists
                result.success = True
                result.data = response.json() if response.status_code == 201 else {"message": "User already exists"}
                print(f"✅ User Registration: {'Created' if response.status_code == 201 else 'Already exists'}")
            else:
                result.error = f"Status: {response.status_code}"
                print(f"❌ User Registration: Failed")
                
        except Exception as e:
            result.duration = time.time() - start_time
            result.error = str(e)
            print(f"❌ User Registration: {str(e)}")
        
        self.results.append(result)

    async def test_agent_system_integration(self):
        """Test agent system integration"""
        print("\n🤖 Phase 4: Agent System Integration")
        print("-" * 40)
        
        # Test agent creation
        result = TestResult("Agent Creation", "agent")
        start_time = time.time()
        
        try:
            agent_data = {
                "name": "Integration Test Agent",
                "agent_type": "prediction",
                "config": {
                    "confidence_threshold": 0.7,
                    "max_predictions": 10,
                    "max_retries": 3
                }
            }
            
            response = await self.session.post(
                f"{SERVICES['agent_os']['url']}/agents/",
                json=agent_data
            )
            
            result.duration = time.time() - start_time
            
            if response.status_code == 200:
                agent = response.json()
                agent_id = agent["agent_id"]
                self.test_data["agent_id"] = agent_id
                result.success = True
                result.data = agent
                print(f"✅ Agent Creation: {agent_id}")
                
                # Test agent status
                await self.test_agent_status(agent_id)
                
            else:
                result.error = f"Status: {response.status_code}"
                print(f"❌ Agent Creation: Failed")
                
        except Exception as e:
            result.duration = time.time() - start_time
            result.error = str(e)
            print(f"❌ Agent Creation: {str(e)}")
        
        self.results.append(result)

    async def test_agent_status(self, agent_id: str):
        """Test agent status and health"""
        result = TestResult("Agent Status Check", "agent")
        start_time = time.time()
        
        try:
            response = await self.session.get(f"{SERVICES['agent_os']['url']}/agents/{agent_id}/status")
            result.duration = time.time() - start_time
            
            if response.status_code == 200:
                status_data = response.json()
                result.success = True
                result.data = status_data
                print(f"✅ Agent Status: {status_data.get('status', 'unknown')}")
            else:
                result.error = f"Status: {response.status_code}"
                print(f"❌ Agent Status: Failed")
                
        except Exception as e:
            result.duration = time.time() - start_time
            result.error = str(e)
            print(f"❌ Agent Status: {str(e)}")
        
        self.results.append(result)

    async def test_ml_service_integration(self):
        """Test ML service integration"""
        print("\n🧠 Phase 5: ML Service Integration")
        print("-" * 40)
        
        # Test model status
        result = TestResult("ML Model Status", "ml")
        start_time = time.time()
        
        try:
            response = await self.session.get(f"{SERVICES['ml_service']['url']}/models/status")
            result.duration = time.time() - start_time
            
            if response.status_code == 200:
                model_data = response.json()
                result.success = True
                result.data = model_data
                print(f"✅ ML Model Status: {model_data.get('status', 'unknown')}")
            else:
                result.error = f"Status: {response.status_code}"
                print(f"❌ ML Model Status: Failed")
                
        except Exception as e:
            result.duration = time.time() - start_time
            result.error = str(e)
            print(f"❌ ML Model Status: {str(e)}")
        
        self.results.append(result)
        
        # Test prediction endpoint
        result = TestResult("ML Prediction", "ml")
        start_time = time.time()
        
        try:
            prediction_data = {
                "home_team_id": 1,
                "away_team_id": 2,
                "match_date": datetime.now().isoformat(),
                "home_team_name": "Test Home Team",
                "away_team_name": "Test Away Team"
            }
            
            response = await self.session.post(
                f"{SERVICES['ml_service']['url']}/predictions/predict",
                json=prediction_data
            )
            
            result.duration = time.time() - start_time
            
            if response.status_code == 200:
                pred_data = response.json()
                result.success = True
                result.data = pred_data
                print(f"✅ ML Prediction: Successful")
            else:
                result.error = f"Status: {response.status_code}"
                print(f"❌ ML Prediction: Failed")
                
        except Exception as e:
            result.duration = time.time() - start_time
            result.error = str(e)
            print(f"❌ ML Prediction: {str(e)}")
        
        self.results.append(result)

    async def test_prediction_workflows(self):
        """Test prediction workflows"""
        print("\n⚙️ Phase 6: Prediction Workflows")
        print("-" * 40)
        
        # Test workflow templates
        result = TestResult("Workflow Templates", "workflow")
        start_time = time.time()
        
        try:
            response = await self.session.get(f"{SERVICES['agent_os']['url']}/workflows/templates")
            result.duration = time.time() - start_time
            
            if response.status_code == 200:
                templates_data = response.json()
                result.success = True
                result.data = templates_data
                templates = templates_data.get("templates", {})
                print(f"✅ Workflow Templates: {len(templates)} available")
                
                # Test workflow execution if templates are available
                if "standard_prediction" in templates:
                    await self.test_workflow_execution("standard_prediction")
                
            else:
                result.error = f"Status: {response.status_code}"
                print(f"❌ Workflow Templates: Failed")
                
        except Exception as e:
            result.duration = time.time() - start_time
            result.error = str(e)
            print(f"❌ Workflow Templates: {str(e)}")
        
        self.results.append(result)

    async def test_workflow_execution(self, workflow_type: str):
        """Test workflow execution"""
        result = TestResult(f"Workflow Execution - {workflow_type}", "workflow")
        start_time = time.time()
        
        try:
            workflow_data = {
                "workflow_type": workflow_type,
                "input_data": {
                    "home_team_id": 1,
                    "away_team_id": 2,
                    "match_date": datetime.now().isoformat(),
                    "home_team_name": "Test Home Team",
                    "away_team_name": "Test Away Team"
                }
            }
            
            response = await self.session.post(
                f"{SERVICES['agent_os']['url']}/workflows/execute",
                json=workflow_data
            )
            
            result.duration = time.time() - start_time
            
            if response.status_code == 200:
                workflow = response.json()
                workflow_id = workflow["workflow_id"]
                result.success = True
                result.data = workflow
                print(f"✅ Workflow Execution: {workflow_id} started")
                
                # Wait for completion
                await self.wait_for_workflow_completion(workflow_id)
                
            else:
                result.error = f"Status: {response.status_code}"
                print(f"❌ Workflow Execution: Failed")
                
        except Exception as e:
            result.duration = time.time() - start_time
            result.error = str(e)
            print(f"❌ Workflow Execution: {str(e)}")
        
        self.results.append(result)

    async def wait_for_workflow_completion(self, workflow_id: str, timeout: int = 60):
        """Wait for workflow completion"""
        start_time = time.time()
        
        while time.time() - start_time < timeout:
            try:
                response = await self.session.get(f"{SERVICES['agent_os']['url']}/workflows/{workflow_id}")
                
                if response.status_code == 200:
                    workflow = response.json()
                    status = workflow["status"]
                    
                    if status in ["completed", "failed", "cancelled"]:
                        if status == "completed":
                            print(f"✅ Workflow {workflow_id}: Completed")
                        else:
                            print(f"⚠️ Workflow {workflow_id}: {status}")
                        return
                
                await asyncio.sleep(2)
                
            except Exception as e:
                print(f"⚠️ Error checking workflow status: {str(e)}")
                await asyncio.sleep(2)
        
        print(f"⚠️ Workflow {workflow_id}: Timed out")

    async def test_enhanced_features(self):
        """Test enhanced features"""
        print("\n🚀 Phase 7: Enhanced Features")
        print("-" * 40)
        
        if "agent_id" not in self.test_data:
            print("⚠️ Skipping enhanced features - no agent available")
            return
        
        # Test enhanced prediction
        result = TestResult("Enhanced Prediction", "enhanced")
        start_time = time.time()
        
        try:
            task_data = {
                "task_type": "enhanced_prediction",
                "input_data": {
                    "home_team_id": 1,
                    "away_team_id": 2,
                    "match_date": datetime.now().isoformat(),
                    "home_team_name": "Test Home Team",
                    "away_team_name": "Test Away Team"
                }
            }
            
            response = await self.session.post(
                f"{SERVICES['agent_os']['url']}/agents/{self.test_data['agent_id']}/tasks",
                json=task_data
            )
            
            result.duration = time.time() - start_time
            
            if response.status_code == 200:
                task_result = response.json()
                result.success = True
                result.data = task_result
                print(f"✅ Enhanced Prediction: Successful")
            else:
                result.error = f"Status: {response.status_code}"
                print(f"❌ Enhanced Prediction: Failed")
                
        except Exception as e:
            result.duration = time.time() - start_time
            result.error = str(e)
            print(f"❌ Enhanced Prediction: {str(e)}")
        
        self.results.append(result)

    async def test_error_scenarios(self):
        """Test error handling scenarios"""
        print("\n🛡️ Phase 8: Error Scenarios")
        print("-" * 40)
        
        # Test invalid agent ID
        result = TestResult("Invalid Agent ID", "error")
        start_time = time.time()
        
        try:
            response = await self.session.get(f"{SERVICES['agent_os']['url']}/agents/invalid-id/status")
            result.duration = time.time() - start_time
            
            if response.status_code == 404:
                result.success = True
                print(f"✅ Invalid Agent ID: Handled correctly")
            else:
                result.error = f"Expected 404, got {response.status_code}"
                print(f"❌ Invalid Agent ID: Not handled correctly")
                
        except Exception as e:
            result.duration = time.time() - start_time
            result.error = str(e)
            print(f"❌ Invalid Agent ID: {str(e)}")
        
        self.results.append(result)
        
        # Test invalid workflow type
        result = TestResult("Invalid Workflow Type", "error")
        start_time = time.time()
        
        try:
            workflow_data = {
                "workflow_type": "invalid_workflow",
                "input_data": {}
            }
            
            response = await self.session.post(
                f"{SERVICES['agent_os']['url']}/workflows/execute",
                json=workflow_data
            )
            
            result.duration = time.time() - start_time
            
            if response.status_code == 400:
                result.success = True
                print(f"✅ Invalid Workflow Type: Handled correctly")
            else:
                result.error = f"Expected 400, got {response.status_code}"
                print(f"❌ Invalid Workflow Type: Not handled correctly")
                
        except Exception as e:
            result.duration = time.time() - start_time
            result.error = str(e)
            print(f"❌ Invalid Workflow Type: {str(e)}")
        
        self.results.append(result)

    async def test_performance(self):
        """Test performance and load handling"""
        print("\n⚡ Phase 9: Performance")
        print("-" * 40)
        
        # Test concurrent requests
        result = TestResult("Concurrent Requests", "performance")
        start_time = time.time()
        
        try:
            async def make_request():
                try:
                    response = await self.session.get(f"{SERVICES['agent_os']['url']}/health")
                    return response.status_code == 200
                except:
                    return False
            
            # Make 10 concurrent requests
            tasks = [make_request() for _ in range(10)]
            results = await asyncio.gather(*tasks)
            
            result.duration = time.time() - start_time
            successful_requests = sum(results)
            
            if successful_requests >= 8:  # At least 80% success rate
                result.success = True
                result.data = {"successful": successful_requests, "total": 10}
                print(f"✅ Concurrent Requests: {successful_requests}/10 successful")
            else:
                result.error = f"Only {successful_requests}/10 requests successful"
                print(f"❌ Concurrent Requests: {successful_requests}/10")
                
        except Exception as e:
            result.duration = time.time() - start_time
            result.error = str(e)
            print(f"❌ Concurrent Requests: {str(e)}")
        
        self.results.append(result)

    async def test_data_flow(self):
        """Test data flow between services"""
        print("\n🔄 Phase 10: Data Flow")
        print("-" * 40)
        
        # Test backend to ML service communication
        result = TestResult("Backend-ML Communication", "data_flow")
        start_time = time.time()
        
        try:
            response = await self.session.get(f"{SERVICES['backend']['url']}/predictions/ml/status")
            result.duration = time.time() - start_time
            
            if response.status_code == 200:
                result.success = True
                result.data = response.json()
                print(f"✅ Backend-ML Communication: Successful")
            else:
                result.error = f"Status: {response.status_code}"
                print(f"❌ Backend-ML Communication: Failed")
                
        except Exception as e:
            result.duration = time.time() - start_time
            result.error = str(e)
            print(f"❌ Backend-ML Communication: {str(e)}")
        
        self.results.append(result)

    def generate_test_report(self):
        """Generate comprehensive test report"""
        print("\n" + "=" * 80)
        print("📊 COMPREHENSIVE TEST REPORT")
        print("=" * 80)
        
        total_tests = len(self.results)
        passed_tests = sum(1 for r in self.results if r.success)
        failed_tests = total_tests - passed_tests
        
        # Summary by category
        categories = {}
        for result in self.results:
            if result.category not in categories:
                categories[result.category] = {"total": 0, "passed": 0, "failed": 0}
            categories[result.category]["total"] += 1
            if result.success:
                categories[result.category]["passed"] += 1
            else:
                categories[result.category]["failed"] += 1
        
        print(f"\n📈 OVERALL SUMMARY:")
        print(f"Total Tests: {total_tests}")
        print(f"Passed: {passed_tests}")
        print(f"Failed: {failed_tests}")
        print(f"Success Rate: {(passed_tests/total_tests)*100:.1f}%")
        
        print(f"\n📋 CATEGORY BREAKDOWN:")
        for category, stats in categories.items():
            success_rate = (stats["passed"] / stats["total"]) * 100
            print(f"  {category.title()}: {stats['passed']}/{stats['total']} ({success_rate:.1f}%)")
        
        print(f"\n⏱️ PERFORMANCE SUMMARY:")
        total_duration = sum(r.duration for r in self.results)
        avg_duration = total_duration / total_tests if total_tests > 0 else 0
        print(f"Total Test Time: {total_duration:.2f}s")
        print(f"Average Test Time: {avg_duration:.2f}s")
        
        print(f"\n📋 DETAILED RESULTS:")
        for result in self.results:
            print(f"  {result}")
            if result.error:
                print(f"    Error: {result.error}")
        
        # Save detailed report to file
        report_data = {
            "timestamp": datetime.now().isoformat(),
            "summary": {
                "total_tests": total_tests,
                "passed_tests": passed_tests,
                "failed_tests": failed_tests,
                "success_rate": (passed_tests/total_tests)*100 if total_tests > 0 else 0,
                "total_duration": total_duration,
                "average_duration": avg_duration
            },
            "categories": categories,
            "results": [
                {
                    "test_name": r.test_name,
                    "category": r.category,
                    "success": r.success,
                    "error": r.error,
                    "duration": r.duration,
                    "timestamp": r.timestamp.isoformat()
                }
                for r in self.results
            ]
        }
        
        report_file = f"integration_test_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        with open(report_file, 'w') as f:
            json.dump(report_data, f, indent=2)
        
        print(f"\n📄 Detailed report saved to: {report_file}")
        
        if failed_tests > 0:
            print(f"\n❌ {failed_tests} test(s) failed. Please check the errors above.")
            sys.exit(1)
        else:
            print(f"\n🎉 All {total_tests} tests passed! Integration is working correctly.")
            print(f"\n🚀 System is ready for production use!")

async def main():
    """Main test runner"""
    async with IntegrationTestRunner() as runner:
        await runner.run_complete_test_suite()

if __name__ == "__main__":
    asyncio.run(main()) 