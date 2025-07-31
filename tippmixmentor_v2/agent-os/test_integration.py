#!/usr/bin/env python3
"""
Comprehensive End-to-End Integration Test Suite for TippMixMentor
Tests the complete integration between Agent OS, ML Service, and Backend
"""

import asyncio
import httpx
import json
import time
from datetime import datetime, timedelta
from typing import Dict, Any, List
import sys
import os

# Configuration
AGENT_OS_URL = "http://localhost:8001"
BACKEND_URL = "http://localhost:3001"
ML_SERVICE_URL = "http://localhost:8000"

class TestResult:
    def __init__(self, test_name: str):
        self.test_name = test_name
        self.success = False
        self.error = None
        self.duration = 0
        self.data = None

    def __str__(self):
        status = "✅ PASS" if self.success else "❌ FAIL"
        return f"{status} {self.test_name} ({self.duration:.2f}s)"

class IntegrationTestSuite:
    def __init__(self):
        self.results: List[TestResult] = []
        self.test_data = {}
        
    async def run_all_tests(self):
        """Run all integration tests"""
        print("🚀 Starting Comprehensive End-to-End Integration Tests")
        print("=" * 60)
        
        # Test categories
        await self.test_health_checks()
        await self.test_agent_system()
        await self.test_ml_service()
        await self.test_backend_integration()
        await self.test_prediction_workflows()
        await self.test_enhanced_features()
        await self.test_error_handling()
        await self.test_performance()
        
        # Print summary
        self.print_summary()
        
    async def test_health_checks(self):
        """Test health endpoints of all services"""
        print("\n🔍 Testing Health Checks...")
        
        services = {
            "Agent OS": f"{AGENT_OS_URL}/health",
            "Backend": f"{BACKEND_URL}/health",
            "ML Service": f"{ML_SERVICE_URL}/health"
        }
        
        async with httpx.AsyncClient() as client:
            for service_name, url in services.items():
                result = TestResult(f"Health Check - {service_name}")
                start_time = time.time()
                
                try:
                    response = await client.get(url, timeout=10.0)
                    result.duration = time.time() - start_time
                    
                    if response.status_code == 200:
                        result.success = True
                        result.data = response.json()
                        print(f"✅ {service_name}: Healthy")
                    else:
                        result.error = f"Status: {response.status_code}"
                        print(f"❌ {service_name}: Unhealthy (Status: {response.status_code})")
                        
                except Exception as e:
                    result.duration = time.time() - start_time
                    result.error = str(e)
                    print(f"❌ {service_name}: Connection failed - {str(e)}")
                
                self.results.append(result)

    async def test_agent_system(self):
        """Test agent creation and management"""
        print("\n🤖 Testing Agent System...")
        
        async with httpx.AsyncClient() as client:
            # Test agent creation
            result = TestResult("Agent Creation")
            start_time = time.time()
            
            try:
                agent_data = {
                    "name": "Test Prediction Agent",
                    "agent_type": "prediction",
                    "config": {
                        "confidence_threshold": 0.7,
                        "max_predictions": 10,
                        "max_retries": 3
                    }
                }
                
                response = await client.post(
                    f"{AGENT_OS_URL}/agents/",
                    json=agent_data,
                    timeout=10.0
                )
                
                result.duration = time.time() - start_time
                
                if response.status_code == 200:
                    agent = response.json()
                    agent_id = agent["agent_id"]
                    self.test_data["agent_id"] = agent_id
                    result.success = True
                    result.data = agent
                    print(f"✅ Agent created: {agent_id}")
                    
                    # Test agent status
                    status_result = TestResult("Agent Status Check")
                    status_start = time.time()
                    
                    status_response = await client.get(f"{AGENT_OS_URL}/agents/{agent_id}/status")
                    status_result.duration = time.time() - status_start
                    
                    if status_response.status_code == 200:
                        status_result.success = True
                        status_result.data = status_response.json()
                        print(f"✅ Agent status: {status_result.data['status']}")
                    else:
                        status_result.error = f"Status: {status_response.status_code}"
                        print(f"❌ Agent status check failed")
                    
                    self.results.append(status_result)
                    
                else:
                    result.error = f"Status: {response.status_code}"
                    print(f"❌ Failed to create agent: {response.status_code}")
                    
            except Exception as e:
                result.duration = time.time() - start_time
                result.error = str(e)
                print(f"❌ Agent creation failed: {str(e)}")
            
            self.results.append(result)

    async def test_ml_service(self):
        """Test ML service functionality"""
        print("\n🧠 Testing ML Service...")
        
        async with httpx.AsyncClient() as client:
            # Test model status
            result = TestResult("ML Model Status")
            start_time = time.time()
            
            try:
                response = await client.get(f"{ML_SERVICE_URL}/models/status", timeout=10.0)
                result.duration = time.time() - start_time
                
                if response.status_code == 200:
                    result.success = True
                    result.data = response.json()
                    print(f"✅ ML models status: {result.data.get('status', 'unknown')}")
                else:
                    result.error = f"Status: {response.status_code}"
                    print(f"❌ ML model status check failed")
                    
            except Exception as e:
                result.duration = time.time() - start_time
                result.error = str(e)
                print(f"❌ ML service test failed: {str(e)}")
            
            self.results.append(result)
            
            # Test prediction endpoint
            pred_result = TestResult("ML Prediction")
            pred_start = time.time()
            
            try:
                prediction_data = {
                    "home_team_id": 1,
                    "away_team_id": 2,
                    "match_date": datetime.now().isoformat(),
                    "home_team_name": "Test Home Team",
                    "away_team_name": "Test Away Team"
                }
                
                response = await client.post(
                    f"{ML_SERVICE_URL}/predictions/predict",
                    json=prediction_data,
                    timeout=30.0
                )
                
                pred_result.duration = time.time() - pred_start
                
                if response.status_code == 200:
                    pred_result.success = True
                    pred_result.data = response.json()
                    print(f"✅ ML prediction successful")
                else:
                    pred_result.error = f"Status: {response.status_code}"
                    print(f"❌ ML prediction failed")
                    
            except Exception as e:
                pred_result.duration = time.time() - pred_start
                pred_result.error = str(e)
                print(f"❌ ML prediction test failed: {str(e)}")
            
            self.results.append(pred_result)

    async def test_backend_integration(self):
        """Test backend integration with agent and ML services"""
        print("\n🔗 Testing Backend Integration...")
        
        async with httpx.AsyncClient() as client:
            # Test ML service status through backend
            result = TestResult("Backend ML Status")
            start_time = time.time()
            
            try:
                response = await client.get(f"{BACKEND_URL}/predictions/ml/status", timeout=10.0)
                result.duration = time.time() - start_time
                
                if response.status_code == 200:
                    result.success = True
                    result.data = response.json()
                    print(f"✅ Backend ML status check successful")
                else:
                    result.error = f"Status: {response.status_code}"
                    print(f"❌ Backend ML status check failed")
                    
            except Exception as e:
                result.duration = time.time() - start_time
                result.error = str(e)
                print(f"❌ Backend integration test failed: {str(e)}")
            
            self.results.append(result)

    async def test_prediction_workflows(self):
        """Test prediction workflows"""
        print("\n⚙️ Testing Prediction Workflows...")
        
        async with httpx.AsyncClient() as client:
            # Test workflow templates
            result = TestResult("Workflow Templates")
            start_time = time.time()
            
            try:
                response = await client.get(f"{AGENT_OS_URL}/workflows/templates", timeout=10.0)
                result.duration = time.time() - start_time
                
                if response.status_code == 200:
                    result.success = True
                    result.data = response.json()
                    templates = result.data.get("templates", {})
                    print(f"✅ Workflow templates available: {len(templates)}")
                    
                    # Test workflow execution
                    if "standard_prediction" in templates:
                        await self.test_workflow_execution(client, "standard_prediction")
                    
                else:
                    result.error = f"Status: {response.status_code}"
                    print(f"❌ Workflow templates test failed")
                    
            except Exception as e:
                result.duration = time.time() - start_time
                result.error = str(e)
                print(f"❌ Workflow test failed: {str(e)}")
            
            self.results.append(result)

    async def test_workflow_execution(self, client: httpx.AsyncClient, workflow_type: str):
        """Test workflow execution"""
        result = TestResult(f"Workflow Execution - {workflow_type}")
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
            
            response = await client.post(
                f"{AGENT_OS_URL}/workflows/execute",
                json=workflow_data,
                timeout=30.0
            )
            
            result.duration = time.time() - start_time
            
            if response.status_code == 200:
                workflow = response.json()
                workflow_id = workflow["workflow_id"]
                result.success = True
                result.data = workflow
                print(f"✅ Workflow {workflow_type} started: {workflow_id}")
                
                # Wait for workflow completion
                await self.wait_for_workflow_completion(client, workflow_id)
                
            else:
                result.error = f"Status: {response.status_code}"
                print(f"❌ Workflow execution failed")
                
        except Exception as e:
            result.duration = time.time() - start_time
            result.error = str(e)
            print(f"❌ Workflow execution test failed: {str(e)}")
        
        self.results.append(result)

    async def wait_for_workflow_completion(self, client: httpx.AsyncClient, workflow_id: str, timeout: int = 60):
        """Wait for workflow completion"""
        start_time = time.time()
        
        while time.time() - start_time < timeout:
            try:
                response = await client.get(f"{AGENT_OS_URL}/workflows/{workflow_id}", timeout=5.0)
                
                if response.status_code == 200:
                    workflow = response.json()
                    status = workflow["status"]
                    
                    if status in ["completed", "failed", "cancelled"]:
                        if status == "completed":
                            print(f"✅ Workflow {workflow_id} completed successfully")
                        else:
                            print(f"⚠️ Workflow {workflow_id} ended with status: {status}")
                        return
                
                await asyncio.sleep(2)
                
            except Exception as e:
                print(f"⚠️ Error checking workflow status: {str(e)}")
                await asyncio.sleep(2)
        
        print(f"⚠️ Workflow {workflow_id} timed out")

    async def test_enhanced_features(self):
        """Test enhanced prediction features"""
        print("\n🚀 Testing Enhanced Features...")
        
        async with httpx.AsyncClient() as client:
            # Test enhanced insights
            result = TestResult("Enhanced Insights")
            start_time = time.time()
            
            try:
                # This would test the enhanced insights endpoint
                # For now, we'll test the agent task for enhanced insights
                if "agent_id" in self.test_data:
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
                    
                    response = await client.post(
                        f"{AGENT_OS_URL}/agents/{self.test_data['agent_id']}/tasks",
                        json=task_data,
                        timeout=60.0
                    )
                    
                    result.duration = time.time() - start_time
                    
                    if response.status_code == 200:
                        result.success = True
                        result.data = response.json()
                        print(f"✅ Enhanced prediction successful")
                    else:
                        result.error = f"Status: {response.status_code}"
                        print(f"❌ Enhanced prediction failed")
                else:
                    result.error = "No agent available for testing"
                    print(f"⚠️ Skipping enhanced features test - no agent available")
                    
            except Exception as e:
                result.duration = time.time() - start_time
                result.error = str(e)
                print(f"❌ Enhanced features test failed: {str(e)}")
            
            self.results.append(result)

    async def test_error_handling(self):
        """Test error handling and edge cases"""
        print("\n🛡️ Testing Error Handling...")
        
        async with httpx.AsyncClient() as client:
            # Test invalid agent ID
            result = TestResult("Invalid Agent ID")
            start_time = time.time()
            
            try:
                response = await client.get(f"{AGENT_OS_URL}/agents/invalid-id/status", timeout=10.0)
                result.duration = time.time() - start_time
                
                # Should return 404 for invalid agent
                if response.status_code == 404:
                    result.success = True
                    print(f"✅ Invalid agent ID handled correctly")
                else:
                    result.error = f"Expected 404, got {response.status_code}"
                    print(f"❌ Invalid agent ID not handled correctly")
                    
            except Exception as e:
                result.duration = time.time() - start_time
                result.error = str(e)
                print(f"❌ Error handling test failed: {str(e)}")
            
            self.results.append(result)
            
            # Test invalid workflow type
            wf_result = TestResult("Invalid Workflow Type")
            wf_start = time.time()
            
            try:
                workflow_data = {
                    "workflow_type": "invalid_workflow",
                    "input_data": {}
                }
                
                response = await client.post(
                    f"{AGENT_OS_URL}/workflows/execute",
                    json=workflow_data,
                    timeout=10.0
                )
                
                wf_result.duration = time.time() - wf_start
                
                # Should return 400 for invalid workflow type
                if response.status_code == 400:
                    wf_result.success = True
                    print(f"✅ Invalid workflow type handled correctly")
                else:
                    wf_result.error = f"Expected 400, got {response.status_code}"
                    print(f"❌ Invalid workflow type not handled correctly")
                    
            except Exception as e:
                wf_result.duration = time.time() - wf_start
                wf_result.error = str(e)
                print(f"❌ Workflow error handling test failed: {str(e)}")
            
            self.results.append(wf_result)

    async def test_performance(self):
        """Test performance and load handling"""
        print("\n⚡ Testing Performance...")
        
        async with httpx.AsyncClient() as client:
            # Test concurrent requests
            result = TestResult("Concurrent Requests")
            start_time = time.time()
            
            try:
                # Create multiple concurrent requests
                async def make_request():
                    try:
                        response = await client.get(f"{AGENT_OS_URL}/health", timeout=5.0)
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
                    print(f"✅ Concurrent requests: {successful_requests}/10 successful")
                else:
                    result.error = f"Only {successful_requests}/10 requests successful"
                    print(f"❌ Concurrent requests test failed: {successful_requests}/10")
                    
            except Exception as e:
                result.duration = time.time() - start_time
                result.error = str(e)
                print(f"❌ Performance test failed: {str(e)}")
            
            self.results.append(result)

    def print_summary(self):
        """Print test summary"""
        print("\n" + "=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        
        total_tests = len(self.results)
        passed_tests = sum(1 for r in self.results if r.success)
        failed_tests = total_tests - passed_tests
        
        print(f"Total Tests: {total_tests}")
        print(f"Passed: {passed_tests}")
        print(f"Failed: {failed_tests}")
        print(f"Success Rate: {(passed_tests/total_tests)*100:.1f}%")
        
        print("\n📋 Detailed Results:")
        for result in self.results:
            print(f"  {result}")
            if result.error:
                print(f"    Error: {result.error}")
        
        if failed_tests > 0:
            print(f"\n❌ {failed_tests} test(s) failed. Please check the errors above.")
            sys.exit(1)
        else:
            print(f"\n🎉 All {total_tests} tests passed! Integration is working correctly.")

async def main():
    """Main test runner"""
    test_suite = IntegrationTestSuite()
    await test_suite.run_all_tests()

if __name__ == "__main__":
    asyncio.run(main()) 