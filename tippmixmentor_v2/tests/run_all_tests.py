#!/usr/bin/env python3
"""
Master Test Runner for TippMixMentor
Orchestrates all test suites and provides a comprehensive testing dashboard.
"""

import asyncio
import sys
import os
import time
import json
from datetime import datetime
from typing import Dict, Any, List, Optional
import subprocess
import signal

# Add the tests directory to the path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Import test modules
try:
    from e2e_user_workflow_test import UserWorkflowTestRunner
    from websocket_realtime_test import WebSocketTestRunner
    from data_persistence_test import DataPersistenceTestRunner
    from performance_test import PerformanceTestRunner
    from test_integration_complete import IntegrationTestRunner
except ImportError as e:
    print(f"Error importing test modules: {e}")
    print("Make sure all test files are in the tests directory")
    sys.exit(1)

class MasterTestResult:
    def __init__(self, test_suite: str, category: str = "master"):
        self.test_suite = test_suite
        self.category = category
        self.success = False
        self.error = None
        self.duration = 0
        self.timestamp = datetime.now()
        self.total_tests = 0
        self.passed_tests = 0
        self.failed_tests = 0
        self.success_rate = 0.0
        self.details = {}

    def __str__(self):
        status = "✅ PASS" if self.success else "❌ FAIL"
        return f"{status} {self.test_suite} ({self.duration:.2f}s, {self.passed_tests}/{self.total_tests} passed)"

class MasterTestRunner:
    def __init__(self):
        self.results: List[MasterTestResult] = []
        self.start_time = None
        self.end_time = None
        
    async def run_all_tests(self, test_suites: Optional[List[str]] = None):
        """Run all test suites or specified ones"""
        self.start_time = datetime.now()
        
        print("🚀 TippMixMentor Master Test Runner")
        print("=" * 80)
        print(f"Started at: {self.start_time.isoformat()}")
        print(f"Test suites to run: {test_suites or 'ALL'}")
        print()
        
        # Define available test suites
        available_suites = {
            "integration": self.run_integration_tests,
            "user_workflow": self.run_user_workflow_tests,
            "websocket": self.run_websocket_tests,
            "persistence": self.run_persistence_tests,
            "performance": self.run_performance_tests
        }
        
        # Determine which suites to run
        suites_to_run = test_suites if test_suites else list(available_suites.keys())
        
        # Run each test suite
        for suite_name in suites_to_run:
            if suite_name in available_suites:
                print(f"🎯 Running {suite_name.upper()} test suite...")
                print("-" * 50)
                
                result = await available_suites[suite_name]()
                self.results.append(result)
                
                print(f"  {result}")
                print()
            else:
                print(f"⚠️  Unknown test suite: {suite_name}")
        
        self.end_time = datetime.now()
        
        # Generate comprehensive report
        self.generate_master_report()

    async def run_integration_tests(self) -> MasterTestResult:
        """Run integration tests"""
        result = MasterTestResult("Integration Tests", "integration")
        start_time = time.time()
        
        try:
            runner = IntegrationTestRunner()
            await runner.run_complete_test_suite()
            
            # Extract results from the integration test runner
            result.total_tests = len(runner.results)
            result.passed_tests = sum(1 for r in runner.results if r.success)
            result.failed_tests = result.total_tests - result.passed_tests
            result.success_rate = (result.passed_tests / result.total_tests * 100) if result.total_tests > 0 else 0
            result.success = result.failed_tests == 0
            
            # Store detailed results
            result.details = {
                "test_results": [
                    {
                        "name": r.test_name,
                        "success": r.success,
                        "duration": r.duration,
                        "error": r.error
                    }
                    for r in runner.results
                ]
            }
            
        except Exception as e:
            result.error = str(e)
            result.success = False
            
        result.duration = time.time() - start_time
        return result

    async def run_user_workflow_tests(self) -> MasterTestResult:
        """Run user workflow tests"""
        result = MasterTestResult("User Workflow Tests", "user_workflow")
        start_time = time.time()
        
        try:
            async with UserWorkflowTestRunner() as runner:
                await runner.run_user_workflow_tests()
                
                # Extract results
                result.total_tests = len(runner.results)
                result.passed_tests = sum(1 for r in runner.results if r.success)
                result.failed_tests = result.total_tests - result.passed_tests
                result.success_rate = (result.passed_tests / result.total_tests * 100) if result.total_tests > 0 else 0
                result.success = result.failed_tests == 0
                
                # Store detailed results
                result.details = {
                    "test_results": [
                        {
                            "name": r.test_name,
                            "category": r.category,
                            "success": r.success,
                            "duration": r.duration,
                            "error": r.error,
                            "steps": r.steps
                        }
                        for r in runner.results
                    ]
                }
                
        except Exception as e:
            result.error = str(e)
            result.success = False
            
        result.duration = time.time() - start_time
        return result

    async def run_websocket_tests(self) -> MasterTestResult:
        """Run WebSocket tests"""
        result = MasterTestResult("WebSocket Tests", "websocket")
        start_time = time.time()
        
        try:
            async with WebSocketTestRunner() as runner:
                await runner.run_websocket_tests()
                
                # Extract results
                result.total_tests = len(runner.results)
                result.passed_tests = sum(1 for r in runner.results if r.success)
                result.failed_tests = result.total_tests - result.passed_tests
                result.success_rate = (result.passed_tests / result.total_tests * 100) if result.total_tests > 0 else 0
                result.success = result.failed_tests == 0
                
                # Store detailed results
                result.details = {
                    "test_results": [
                        {
                            "name": r.test_name,
                            "category": r.category,
                            "success": r.success,
                            "duration": r.duration,
                            "error": r.error,
                            "messages_received": len(r.messages_received),
                            "connection_events": len(r.connection_events)
                        }
                        for r in runner.results
                    ]
                }
                
        except Exception as e:
            result.error = str(e)
            result.success = False
            
        result.duration = time.time() - start_time
        return result

    async def run_persistence_tests(self) -> MasterTestResult:
        """Run persistence tests"""
        result = MasterTestResult("Persistence Tests", "persistence")
        start_time = time.time()
        
        try:
            async with DataPersistenceTestRunner() as runner:
                await runner.run_persistence_tests()
                
                # Extract results
                result.total_tests = len(runner.results)
                result.passed_tests = sum(1 for r in runner.results if r.success)
                result.failed_tests = result.total_tests - result.passed_tests
                result.success_rate = (result.passed_tests / result.total_tests * 100) if result.total_tests > 0 else 0
                result.success = result.failed_tests == 0
                
                # Store detailed results
                result.details = {
                    "test_results": [
                        {
                            "name": r.test_name,
                            "category": r.category,
                            "success": r.success,
                            "duration": r.duration,
                            "error": r.error,
                            "operations": len(r.operations),
                            "verifications": len(r.verifications)
                        }
                        for r in runner.results
                    ]
                }
                
        except Exception as e:
            result.error = str(e)
            result.success = False
            
        result.duration = time.time() - start_time
        return result

    async def run_performance_tests(self) -> MasterTestResult:
        """Run performance tests"""
        result = MasterTestResult("Performance Tests", "performance")
        start_time = time.time()
        
        try:
            async with PerformanceTestRunner() as runner:
                await runner.run_performance_tests()
                
                # Extract results
                result.total_tests = len(runner.results)
                result.passed_tests = sum(1 for r in runner.results if r.success)
                result.failed_tests = result.total_tests - result.passed_tests
                result.success_rate = (result.passed_tests / result.total_tests * 100) if result.total_tests > 0 else 0
                result.success = result.failed_tests == 0
                
                # Store detailed results
                result.details = {
                    "test_results": [
                        {
                            "name": r.test_name,
                            "category": r.category,
                            "success": r.success,
                            "duration": r.duration,
                            "error": r.error,
                            "requests": len(r.requests),
                            "metrics": len(r.metrics)
                        }
                        for r in runner.results
                    ]
                }
                
        except Exception as e:
            result.error = str(e)
            result.success = False
            
        result.duration = time.time() - start_time
        return result

    def generate_master_report(self):
        """Generate comprehensive master test report"""
        print("\n" + "=" * 80)
        print("📊 MASTER TEST REPORT")
        print("=" * 80)
        
        total_duration = (self.end_time - self.start_time).total_seconds()
        
        print(f"Test Run Duration: {total_duration:.2f} seconds")
        print(f"Started: {self.start_time.isoformat()}")
        print(f"Completed: {self.end_time.isoformat()}")
        print()
        
        # Overall statistics
        total_suites = len(self.results)
        passed_suites = sum(1 for r in self.results if r.success)
        failed_suites = total_suites - passed_suites
        
        total_tests = sum(r.total_tests for r in self.results)
        total_passed = sum(r.passed_tests for r in self.results)
        total_failed = sum(r.failed_tests for r in self.results)
        
        overall_success_rate = (total_passed / total_tests * 100) if total_tests > 0 else 0
        
        print("📈 OVERALL STATISTICS")
        print("-" * 25)
        print(f"Test Suites: {total_suites}")
        print(f"Passed Suites: {passed_suites} ✅")
        print(f"Failed Suites: {failed_suites} ❌")
        print(f"Suite Success Rate: {(passed_suites/total_suites*100):.1f}%" if total_suites > 0 else "N/A")
        print()
        print(f"Total Tests: {total_tests}")
        print(f"Passed Tests: {total_passed} ✅")
        print(f"Failed Tests: {total_failed} ❌")
        print(f"Overall Success Rate: {overall_success_rate:.1f}%")
        print()
        
        # Individual suite results
        print("📋 TEST SUITE RESULTS")
        print("-" * 25)
        
        for result in self.results:
            print(f"  {result}")
            if not result.success and result.error:
                print(f"    Error: {result.error}")
            
            # Show category breakdown if available
            if result.details and "test_results" in result.details:
                categories = {}
                for test in result.details["test_results"]:
                    cat = test.get("category", "unknown")
                    if cat not in categories:
                        categories[cat] = {"passed": 0, "failed": 0}
                    
                    if test["success"]:
                        categories[cat]["passed"] += 1
                    else:
                        categories[cat]["failed"] += 1
                
                if categories:
                    print("    Categories:")
                    for cat, stats in categories.items():
                        total = stats["passed"] + stats["failed"]
                        success_rate = (stats["passed"] / total * 100) if total > 0 else 0
                        print(f"      {cat}: {stats['passed']}/{total} ({success_rate:.1f}%)")
            print()
        
        # Performance summary
        print("⚡ PERFORMANCE SUMMARY")
        print("-" * 25)
        
        avg_suite_duration = sum(r.duration for r in self.results) / len(self.results) if self.results else 0
        print(f"Average Suite Duration: {avg_suite_duration:.2f}s")
        print(f"Total Test Time: {total_duration:.2f}s")
        
        # Find fastest and slowest suites
        if self.results:
            fastest_suite = min(self.results, key=lambda r: r.duration)
            slowest_suite = max(self.results, key=lambda r: r.duration)
            print(f"Fastest Suite: {fastest_suite.test_suite} ({fastest_suite.duration:.2f}s)")
            print(f"Slowest Suite: {slowest_suite.test_suite} ({slowest_suite.duration:.2f}s)")
        print()
        
        # Quality metrics
        print("🎯 QUALITY METRICS")
        print("-" * 20)
        
        if total_tests > 0:
            if overall_success_rate >= 95:
                print("🏆 Excellent: Success rate >= 95%")
            elif overall_success_rate >= 90:
                print("🥇 Good: Success rate >= 90%")
            elif overall_success_rate >= 80:
                print("🥈 Fair: Success rate >= 80%")
            else:
                print("⚠️  Needs Improvement: Success rate < 80%")
        
        if total_duration < 300:  # 5 minutes
            print("⚡ Fast: Test execution < 5 minutes")
        elif total_duration < 600:  # 10 minutes
            print("🐌 Moderate: Test execution < 10 minutes")
        else:
            print("🐌 Slow: Test execution >= 10 minutes")
        print()
        
        # Recommendations
        print("💡 RECOMMENDATIONS")
        print("-" * 20)
        
        if failed_suites > 0:
            print(f"🔧 Fix {failed_suites} failed test suite(s) before deployment")
        
        if total_failed > 0:
            print(f"🔧 Address {total_failed} failed test(s) for better reliability")
        
        if total_duration > 600:
            print("⚡ Consider optimizing test execution time")
        
        if overall_success_rate < 90:
            print("📈 Focus on improving test success rate")
        
        if overall_success_rate >= 95 and total_duration < 300:
            print("🎉 Excellent test coverage and performance!")
        print()
        
        # Final summary
        print("🎯 FINAL SUMMARY")
        print("-" * 20)
        
        if failed_suites == 0 and overall_success_rate >= 95:
            print("🎉 All test suites passed with excellent success rate!")
            print("✅ The system is ready for production deployment.")
        elif failed_suites == 0:
            print("✅ All test suites passed!")
            print("⚠️  Consider improving individual test success rates.")
        else:
            print(f"⚠️  {failed_suites} test suite(s) failed.")
            print("🔧 Please fix the issues before deployment.")
        
        print(f"\nReport generated at: {datetime.now().isoformat()}")
        
        # Save detailed report to file
        self.save_detailed_report()

    def save_detailed_report(self):
        """Save detailed report to JSON file"""
        report_data = {
            "timestamp": datetime.now().isoformat(),
            "start_time": self.start_time.isoformat(),
            "end_time": self.end_time.isoformat(),
            "total_duration": (self.end_time - self.start_time).total_seconds(),
            "results": [
                {
                    "test_suite": r.test_suite,
                    "category": r.category,
                    "success": r.success,
                    "error": r.error,
                    "duration": r.duration,
                    "timestamp": r.timestamp.isoformat(),
                    "total_tests": r.total_tests,
                    "passed_tests": r.passed_tests,
                    "failed_tests": r.failed_tests,
                    "success_rate": r.success_rate,
                    "details": r.details
                }
                for r in self.results
            ]
        }
        
        # Create reports directory if it doesn't exist
        reports_dir = "reports"
        if not os.path.exists(reports_dir):
            os.makedirs(reports_dir)
        
        # Save report with timestamp
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        report_file = f"{reports_dir}/test_report_{timestamp}.json"
        
        with open(report_file, 'w') as f:
            json.dump(report_data, f, indent=2)
        
        print(f"📄 Detailed report saved to: {report_file}")

def print_usage():
    """Print usage information"""
    print("Usage: python run_all_tests.py [test_suite1] [test_suite2] ...")
    print()
    print("Available test suites:")
    print("  integration    - Complete integration tests")
    print("  user_workflow  - End-to-end user workflow tests")
    print("  websocket      - WebSocket real-time tests")
    print("  persistence    - Data persistence tests")
    print("  performance    - Performance and load tests")
    print()
    print("Examples:")
    print("  python run_all_tests.py                    # Run all tests")
    print("  python run_all_tests.py integration        # Run only integration tests")
    print("  python run_all_tests.py performance user_workflow  # Run specific suites")

async def main():
    """Main function"""
    # Parse command line arguments
    test_suites = sys.argv[1:] if len(sys.argv) > 1 else None
    
    # Show usage if help is requested
    if test_suites and any(arg in ['-h', '--help', 'help'] for arg in test_suites):
        print_usage()
        return
    
    # Validate test suite names
    valid_suites = ['integration', 'user_workflow', 'websocket', 'persistence', 'performance']
    if test_suites:
        invalid_suites = [suite for suite in test_suites if suite not in valid_suites]
        if invalid_suites:
            print(f"❌ Invalid test suite(s): {', '.join(invalid_suites)}")
            print("Valid suites:", ', '.join(valid_suites))
            return
    
    # Run tests
    runner = MasterTestRunner()
    await runner.run_all_tests(test_suites)

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n⚠️  Test execution interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
        sys.exit(1) 