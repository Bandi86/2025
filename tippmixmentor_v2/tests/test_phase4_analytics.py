#!/usr/bin/env python3
"""
Phase 4: ML Model Integration & Advanced Analytics Test
Tests the comprehensive analytics system, ML model integration, and advanced features
"""

import requests
import json
import time
from datetime import datetime
import sys

class Phase4Tester:
    def __init__(self):
        self.base_url = "http://localhost:3001/api/v1"
        self.frontend_url = "http://localhost:3000/api"
        self.test_results = []
        self.start_time = time.time()

    def log_test(self, test_name, success, details=""):
        """Log test results"""
        result = {
            "test": test_name,
            "success": success,
            "details": details,
            "timestamp": datetime.now().isoformat()
        }
        self.test_results.append(result)
        
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}")
        if details:
            print(f"   Details: {details}")

    def test_analytics_endpoints(self):
        """Test all analytics endpoints"""
        print("\n📊 Testing Analytics Endpoints...")
        
        # Test performance metrics
        try:
            response = requests.get(f"{self.base_url}/analytics/performance?period=30d")
            if response.status_code == 200:
                data = response.json()
                self.log_test("Performance Metrics Endpoint", True, f"Retrieved {len(data)} metrics")
            else:
                self.log_test("Performance Metrics Endpoint", False, f"Status: {response.status_code}")
        except Exception as e:
            self.log_test("Performance Metrics Endpoint", False, str(e))

        # Test ROI analysis
        try:
            response = requests.get(f"{self.base_url}/analytics/roi?period=90d")
            if response.status_code == 200:
                data = response.json()
                self.log_test("ROI Analysis Endpoint", True, f"ROI: {data.get('roi', 0):.2f}%")
            else:
                self.log_test("ROI Analysis Endpoint", False, f"Status: {response.status_code}")
        except Exception as e:
            self.log_test("ROI Analysis Endpoint", False, str(e))

        # Test advanced insights
        try:
            response = requests.get(f"{self.base_url}/analytics/insights?period=90d")
            if response.status_code == 200:
                data = response.json()
                self.log_test("Advanced Insights Endpoint", True, f"Retrieved insights data")
            else:
                self.log_test("Advanced Insights Endpoint", False, f"Status: {response.status_code}")
        except Exception as e:
            self.log_test("Advanced Insights Endpoint", False, str(e))

        # Test real-time analytics
        try:
            response = requests.get(f"{self.base_url}/analytics/realtime")
            if response.status_code == 200:
                data = response.json()
                self.log_test("Real-time Analytics Endpoint", True, f"Active predictions: {data.get('activePredictions', 0)}")
            else:
                self.log_test("Real-time Analytics Endpoint", False, f"Status: {response.status_code}")
        except Exception as e:
            self.log_test("Real-time Analytics Endpoint", False, str(e))

        # Test analytics summary
        try:
            response = requests.get(f"{self.base_url}/analytics/summary?period=30d")
            if response.status_code == 200:
                data = response.json()
                self.log_test("Analytics Summary Endpoint", True, f"Summary data retrieved")
            else:
                self.log_test("Analytics Summary Endpoint", False, f"Status: {response.status_code}")
        except Exception as e:
            self.log_test("Analytics Summary Endpoint", False, str(e))

    def test_ml_model_integration(self):
        """Test ML model integration endpoints"""
        print("\n🤖 Testing ML Model Integration...")
        
        # Test advanced prediction
        try:
            response = requests.get(f"{self.base_url}/predictions/advanced/test-match-id?modelType=ensemble")
            if response.status_code == 200:
                data = response.json()
                self.log_test("Advanced Prediction Endpoint", True, "Advanced prediction retrieved")
            else:
                self.log_test("Advanced Prediction Endpoint", False, f"Status: {response.status_code}")
        except Exception as e:
            self.log_test("Advanced Prediction Endpoint", False, str(e))

        # Test ensemble prediction
        try:
            response = requests.get(f"{self.base_url}/predictions/ensemble/test-match-id")
            if response.status_code == 200:
                data = response.json()
                self.log_test("Ensemble Prediction Endpoint", True, "Ensemble prediction retrieved")
            else:
                self.log_test("Ensemble Prediction Endpoint", False, f"Status: {response.status_code}")
        except Exception as e:
            self.log_test("Ensemble Prediction Endpoint", False, str(e))

        # Test model comparison
        try:
            response = requests.get(f"{self.base_url}/predictions/compare-models/test-match-id")
            if response.status_code == 200:
                data = response.json()
                self.log_test("Model Comparison Endpoint", True, "Model comparison retrieved")
            else:
                self.log_test("Model Comparison Endpoint", False, f"Status: {response.status_code}")
        except Exception as e:
            self.log_test("Model Comparison Endpoint", False, str(e))

        # Test feature importance
        try:
            response = requests.get(f"{self.base_url}/predictions/feature-importance/test-match-id")
            if response.status_code == 200:
                data = response.json()
                self.log_test("Feature Importance Endpoint", True, "Feature importance retrieved")
            else:
                self.log_test("Feature Importance Endpoint", False, f"Status: {response.status_code}")
        except Exception as e:
            self.log_test("Feature Importance Endpoint", False, str(e))

        # Test confidence intervals
        try:
            response = requests.get(f"{self.base_url}/predictions/confidence-intervals/test-match-id")
            if response.status_code == 200:
                data = response.json()
                self.log_test("Confidence Intervals Endpoint", True, "Confidence intervals retrieved")
            else:
                self.log_test("Confidence Intervals Endpoint", False, f"Status: {response.status_code}")
        except Exception as e:
            self.log_test("Confidence Intervals Endpoint", False, str(e))

        # Test model performance metrics
        try:
            response = requests.get(f"{self.base_url}/predictions/models/performance")
            if response.status_code == 200:
                data = response.json()
                self.log_test("Model Performance Metrics Endpoint", True, "Model performance retrieved")
            else:
                self.log_test("Model Performance Metrics Endpoint", False, f"Status: {response.status_code}")
        except Exception as e:
            self.log_test("Model Performance Metrics Endpoint", False, str(e))

        # Test model drift analysis
        try:
            response = requests.get(f"{self.base_url}/predictions/models/drift/test-model-id")
            if response.status_code == 200:
                data = response.json()
                self.log_test("Model Drift Analysis Endpoint", True, "Drift analysis retrieved")
            else:
                self.log_test("Model Drift Analysis Endpoint", False, f"Status: {response.status_code}")
        except Exception as e:
            self.log_test("Model Drift Analysis Endpoint", False, str(e))

        # Test prediction explanation
        try:
            response = requests.get(f"{self.base_url}/predictions/explain/test-match-id")
            if response.status_code == 200:
                data = response.json()
                self.log_test("Prediction Explanation Endpoint", True, "Prediction explanation retrieved")
            else:
                self.log_test("Prediction Explanation Endpoint", False, f"Status: {response.status_code}")
        except Exception as e:
            self.log_test("Prediction Explanation Endpoint", False, str(e))

        # Test historical accuracy
        try:
            response = requests.get(f"{self.base_url}/predictions/historical-accuracy?timePeriod=30d")
            if response.status_code == 200:
                data = response.json()
                self.log_test("Historical Accuracy Endpoint", True, "Historical accuracy retrieved")
            else:
                self.log_test("Historical Accuracy Endpoint", False, f"Status: {response.status_code}")
        except Exception as e:
            self.log_test("Historical Accuracy Endpoint", False, str(e))

        # Test model recommendations
        try:
            response = requests.get(f"{self.base_url}/predictions/recommendations/test-match-id")
            if response.status_code == 200:
                data = response.json()
                self.log_test("Model Recommendations Endpoint", True, "Model recommendations retrieved")
            else:
                self.log_test("Model Recommendations Endpoint", False, f"Status: {response.status_code}")
        except Exception as e:
            self.log_test("Model Recommendations Endpoint", False, str(e))

    def test_frontend_analytics_api(self):
        """Test frontend analytics API routes"""
        print("\n🌐 Testing Frontend Analytics API...")
        
        # Test frontend performance metrics
        try:
            response = requests.get(f"{self.frontend_url}/analytics/performance?period=30d")
            if response.status_code == 200:
                data = response.json()
                self.log_test("Frontend Performance API", True, "Frontend performance data retrieved")
            else:
                self.log_test("Frontend Performance API", False, f"Status: {response.status_code}")
        except Exception as e:
            self.log_test("Frontend Performance API", False, str(e))

        # Test frontend ROI analysis
        try:
            response = requests.get(f"{self.frontend_url}/analytics/roi?period=90d")
            if response.status_code == 200:
                data = response.json()
                self.log_test("Frontend ROI API", True, "Frontend ROI data retrieved")
            else:
                self.log_test("Frontend ROI API", False, f"Status: {response.status_code}")
        except Exception as e:
            self.log_test("Frontend ROI API", False, str(e))

        # Test frontend insights
        try:
            response = requests.get(f"{self.frontend_url}/analytics/insights?period=90d")
            if response.status_code == 200:
                data = response.json()
                self.log_test("Frontend Insights API", True, "Frontend insights data retrieved")
            else:
                self.log_test("Frontend Insights API", False, f"Status: {response.status_code}")
        except Exception as e:
            self.log_test("Frontend Insights API", False, str(e))

        # Test frontend real-time analytics
        try:
            response = requests.get(f"{self.frontend_url}/analytics/realtime")
            if response.status_code == 200:
                data = response.json()
                self.log_test("Frontend Real-time API", True, "Frontend real-time data retrieved")
            else:
                self.log_test("Frontend Real-time API", False, f"Status: {response.status_code}")
        except Exception as e:
            self.log_test("Frontend Real-time API", False, str(e))

    def test_analytics_data_quality(self):
        """Test analytics data quality and calculations"""
        print("\n📈 Testing Analytics Data Quality...")
        
        try:
            # Test performance metrics structure
            response = requests.get(f"{self.base_url}/analytics/performance?period=30d")
            if response.status_code == 200:
                data = response.json()
                
                # Check required fields
                required_fields = ['totalPredictions', 'correctPredictions', 'accuracy', 'profit', 'roi']
                missing_fields = [field for field in required_fields if field not in data]
                
                if not missing_fields:
                    # Validate calculations
                    if data['totalPredictions'] > 0:
                        calculated_accuracy = (data['correctPredictions'] / data['totalPredictions']) * 100
                        accuracy_diff = abs(calculated_accuracy - data['accuracy'])
                        
                        if accuracy_diff < 0.1:  # Allow small rounding differences
                            self.log_test("Performance Metrics Calculations", True, "Calculations validated")
                        else:
                            self.log_test("Performance Metrics Calculations", False, f"Accuracy mismatch: {accuracy_diff}")
                    else:
                        self.log_test("Performance Metrics Calculations", True, "No predictions to validate")
                else:
                    self.log_test("Performance Metrics Structure", False, f"Missing fields: {missing_fields}")
            else:
                self.log_test("Performance Metrics Structure", False, f"Status: {response.status_code}")
        except Exception as e:
            self.log_test("Performance Metrics Structure", False, str(e))

        try:
            # Test ROI analysis structure
            response = requests.get(f"{self.base_url}/analytics/roi?period=90d")
            if response.status_code == 200:
                data = response.json()
                
                # Check required fields
                required_fields = ['totalBets', 'totalStake', 'totalReturn', 'profit', 'roi', 'sharpeRatio']
                missing_fields = [field for field in required_fields if field not in data]
                
                if not missing_fields:
                    # Validate ROI calculation
                    if data['totalStake'] > 0:
                        calculated_roi = (data['profit'] / data['totalStake']) * 100
                        roi_diff = abs(calculated_roi - data['roi'])
                        
                        if roi_diff < 0.1:  # Allow small rounding differences
                            self.log_test("ROI Analysis Calculations", True, "ROI calculations validated")
                        else:
                            self.log_test("ROI Analysis Calculations", False, f"ROI mismatch: {roi_diff}")
                    else:
                        self.log_test("ROI Analysis Calculations", True, "No stakes to validate")
                else:
                    self.log_test("ROI Analysis Structure", False, f"Missing fields: {missing_fields}")
            else:
                self.log_test("ROI Analysis Structure", False, f"Status: {response.status_code}")
        except Exception as e:
            self.log_test("ROI Analysis Structure", False, str(e))

    def test_analytics_caching(self):
        """Test analytics caching functionality"""
        print("\n💾 Testing Analytics Caching...")
        
        try:
            # Test first request
            start_time = time.time()
            response1 = requests.get(f"{self.base_url}/analytics/performance?period=30d")
            first_request_time = time.time() - start_time
            
            # Test second request (should be cached)
            start_time = time.time()
            response2 = requests.get(f"{self.base_url}/analytics/performance?period=30d")
            second_request_time = time.time() - start_time
            
            if response1.status_code == 200 and response2.status_code == 200:
                if second_request_time < first_request_time * 0.8:  # Second request should be faster
                    self.log_test("Analytics Caching", True, f"Cache working: {second_request_time:.3f}s vs {first_request_time:.3f}s")
                else:
                    self.log_test("Analytics Caching", False, "No significant speed improvement")
            else:
                self.log_test("Analytics Caching", False, "Failed to get responses")
        except Exception as e:
            self.log_test("Analytics Caching", False, str(e))

    def test_analytics_performance(self):
        """Test analytics performance under load"""
        print("\n⚡ Testing Analytics Performance...")
        
        try:
            start_time = time.time()
            
            # Make multiple concurrent requests
            import concurrent.futures
            
            def make_request():
                return requests.get(f"{self.base_url}/analytics/performance?period=30d")
            
            with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
                futures = [executor.submit(make_request) for _ in range(10)]
                responses = [future.result() for future in concurrent.futures.as_completed(futures)]
            
            end_time = time.time()
            total_time = end_time - start_time
            
            successful_responses = [r for r in responses if r.status_code == 200]
            
            if len(successful_responses) == 10:
                avg_time = total_time / 10
                self.log_test("Analytics Performance", True, f"10 requests in {total_time:.2f}s (avg: {avg_time:.2f}s)")
            else:
                self.log_test("Analytics Performance", False, f"Only {len(successful_responses)}/10 successful")
        except Exception as e:
            self.log_test("Analytics Performance", False, str(e))

    def test_api_documentation(self):
        """Test API documentation accessibility"""
        print("\n📚 Testing API Documentation...")
        
        try:
            # Test Swagger documentation
            response = requests.get(f"{self.base_url.replace('/api/v1', '')}/api-docs")
            if response.status_code == 200:
                self.log_test("Swagger Documentation", True, "API documentation accessible")
            else:
                self.log_test("Swagger Documentation", False, f"Status: {response.status_code}")
        except Exception as e:
            self.log_test("Swagger Documentation", False, str(e))

    def print_summary(self):
        """Print test summary"""
        print("\n" + "="*60)
        print("🎯 Phase 4: ML Model Integration & Advanced Analytics Test Summary")
        print("="*60)
        
        total_tests = len(self.test_results)
        passed_tests = len([r for r in self.test_results if r['success']])
        failed_tests = total_tests - passed_tests
        
        print(f"\n📊 Test Results:")
        print(f"   Total Tests: {total_tests}")
        print(f"   ✅ Passed: {passed_tests}")
        print(f"   ❌ Failed: {failed_tests}")
        print(f"   📈 Success Rate: {(passed_tests/total_tests)*100:.1f}%")
        
        if failed_tests > 0:
            print(f"\n❌ Failed Tests:")
            for result in self.test_results:
                if not result['success']:
                    print(f"   - {result['test']}: {result['details']}")
        
        print(f"\n⏱️  Total Test Time: {time.time() - self.start_time:.2f} seconds")
        
        return failed_tests == 0

def main():
    print("🎯 Phase 4: ML Model Integration & Advanced Analytics Test")
    print("="*60)
    
    tester = Phase4Tester()
    
    print("\n📊 Testing Analytics Endpoints...")
    tester.test_analytics_endpoints()
    
    print("\n🤖 Testing ML Model Integration...")
    tester.test_ml_model_integration()
    
    print("\n🌐 Testing Frontend Analytics API...")
    tester.test_frontend_analytics_api()
    
    print("\n📈 Testing Analytics Data Quality...")
    tester.test_analytics_data_quality()
    
    print("\n💾 Testing Analytics Caching...")
    tester.test_analytics_caching()
    
    print("\n⚡ Testing Analytics Performance...")
    tester.test_analytics_performance()
    
    print("\n📚 Testing API Documentation...")
    tester.test_api_documentation()
    
    success = tester.print_summary()
    
    if success:
        print("\n🎉 Phase 4 Test Completed Successfully!")
        print("✅ All analytics and ML integration features are working correctly.")
        print("🚀 Ready for production deployment!")
    else:
        print("\n⚠️  Phase 4 Test Completed with Issues")
        print("🔧 Please review failed tests and fix issues before deployment.")
    
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main()) 