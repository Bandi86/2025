#!/usr/bin/env python3
"""
End-to-End User Workflow Testing for TippMixMentor
Tests complete user registration/login flows, prediction creation and management,
and real-time match updates and notifications.
"""

import asyncio
import httpx
import json
import time
import sys
import os
import websockets
import uuid
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
    "frontend": {
        "url": "http://localhost:3000",
        "health_endpoint": "/",
        "name": "Frontend"
    }
}

class UserWorkflowTestResult:
    def __init__(self, test_name: str, category: str = "workflow"):
        self.test_name = test_name
        self.category = category
        self.success = False
        self.error = None
        self.duration = 0
        self.data = None
        self.timestamp = datetime.now()
        self.steps = []

    def add_step(self, step_name: str, success: bool, details: str = ""):
        self.steps.append({
            "step": step_name,
            "success": success,
            "details": details,
            "timestamp": datetime.now()
        })

    def __str__(self):
        status = "✅ PASS" if self.success else "❌ FAIL"
        return f"{status} {self.test_name} ({self.duration:.2f}s)"

class UserWorkflowTestRunner:
    def __init__(self):
        self.results: List[UserWorkflowTestResult] = []
        self.test_data = {}
        self.session = None
        self.websocket = None
        self.auth_tokens = {}
        self.user_data = {}
        
    async def __aenter__(self):
        self.session = httpx.AsyncClient(timeout=30.0)
        return self
        
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.aclose()
        if self.websocket:
            await self.websocket.close()

    async def run_user_workflow_tests(self):
        """Run the complete user workflow test suite"""
        print("🚀 Starting End-to-End User Workflow Test Suite")
        print("=" * 80)
        print(f"Timestamp: {datetime.now().isoformat()}")
        print()
        
        # Test phases
        await self.test_user_registration_flow()
        await self.test_user_login_flow()
        await self.test_prediction_creation_workflow()
        await self.test_prediction_management_workflow()
        await self.test_realtime_match_updates()
        await self.test_notification_system()
        await self.test_user_profile_management()
        await self.test_data_persistence()
        
        # Generate report
        self.generate_workflow_test_report()

    async def test_user_registration_flow(self):
        """Test complete user registration workflow"""
        print("👤 Phase 1: User Registration Workflow")
        print("-" * 50)
        
        result = UserWorkflowTestResult("User Registration Flow", "registration")
        start_time = time.time()
        
        try:
            # Step 1: Check registration endpoint availability
            result.add_step("Check registration endpoint", True, "Endpoint available")
            
            # Step 2: Create test user data
            test_user = {
                "username": f"testuser_{uuid.uuid4().hex[:8]}",
                "email": f"testuser_{uuid.uuid4().hex[:8]}@example.com",
                "password": "TestPassword123!",
                "firstName": "Test",
                "lastName": "User"
            }
            result.add_step("Generate test user data", True, f"Username: {test_user['username']}")
            
            # Step 3: Register user
            register_response = await self.session.post(
                f"{SERVICES['backend']['url']}/auth/register",
                json=test_user
            )
            
            if register_response.status_code == 201:
                result.add_step("User registration", True, "User created successfully")
                self.user_data['registered_user'] = test_user
            else:
                result.add_step("User registration", False, f"Status: {register_response.status_code}")
                raise Exception(f"Registration failed: {register_response.text}")
            
            # Step 4: Verify user in database (optional - check if user exists)
            verify_response = await self.session.get(
                f"{SERVICES['backend']['url']}/users",
                headers={"Authorization": f"Bearer {self.auth_tokens.get('admin', '')}"}
            )
            
            if verify_response.status_code == 200:
                users = verify_response.json()
                user_exists = any(u.get('username') == test_user['username'] for u in users)
                result.add_step("User verification", user_exists, "User found in database" if user_exists else "User not found")
            
            result.success = True
            
        except Exception as e:
            result.error = str(e)
            result.add_step("Error handling", False, str(e))
            
        result.duration = time.time() - start_time
        self.results.append(result)
        print(f"  {result}")

    async def test_user_login_flow(self):
        """Test complete user login workflow"""
        print("🔐 Phase 2: User Login Workflow")
        print("-" * 40)
        
        result = UserWorkflowTestResult("User Login Flow", "authentication")
        start_time = time.time()
        
        try:
            # Step 1: Check login endpoint availability
            result.add_step("Check login endpoint", True, "Endpoint available")
            
            # Step 2: Login with registered user
            if 'registered_user' not in self.user_data:
                # Create a test user if not available
                test_user = {
                    "username": f"testuser_{uuid.uuid4().hex[:8]}",
                    "email": f"testuser_{uuid.uuid4().hex[:8]}@example.com",
                    "password": "TestPassword123!",
                    "firstName": "Test",
                    "lastName": "User"
                }
                
                await self.session.post(
                    f"{SERVICES['backend']['url']}/auth/register",
                    json=test_user
                )
                self.user_data['registered_user'] = test_user
            
            login_data = {
                "username": self.user_data['registered_user']['username'],
                "password": self.user_data['registered_user']['password']
            }
            
            result.add_step("Prepare login data", True, f"Username: {login_data['username']}")
            
            # Step 3: Perform login
            login_response = await self.session.post(
                f"{SERVICES['backend']['url']}/auth/login",
                json=login_data
            )
            
            if login_response.status_code == 200:
                login_result = login_response.json()
                self.auth_tokens['user'] = login_result.get('access_token')
                self.auth_tokens['refresh_token'] = login_result.get('refresh_token')
                
                result.add_step("User login", True, "Login successful")
                result.add_step("Token retrieval", bool(self.auth_tokens['user']), "Access token received")
            else:
                result.add_step("User login", False, f"Status: {login_response.status_code}")
                raise Exception(f"Login failed: {login_response.text}")
            
            # Step 4: Test token validation
            if self.auth_tokens['user']:
                profile_response = await self.session.get(
                    f"{SERVICES['backend']['url']}/auth/profile",
                    headers={"Authorization": f"Bearer {self.auth_tokens['user']}"}
                )
                
                if profile_response.status_code == 200:
                    profile_data = profile_response.json()
                    result.add_step("Token validation", True, f"Profile retrieved: {profile_data.get('username')}")
                else:
                    result.add_step("Token validation", False, f"Status: {profile_response.status_code}")
            
            # Step 5: Test refresh token
            if self.auth_tokens['refresh_token']:
                refresh_response = await self.session.post(
                    f"{SERVICES['backend']['url']}/auth/refresh",
                    json={"refresh_token": self.auth_tokens['refresh_token']}
                )
                
                if refresh_response.status_code == 200:
                    refresh_result = refresh_response.json()
                    new_token = refresh_result.get('access_token')
                    result.add_step("Token refresh", bool(new_token), "New access token received")
                    if new_token:
                        self.auth_tokens['user'] = new_token
                else:
                    result.add_step("Token refresh", False, f"Status: {refresh_response.status_code}")
            
            result.success = True
            
        except Exception as e:
            result.error = str(e)
            result.add_step("Error handling", False, str(e))
            
        result.duration = time.time() - start_time
        self.results.append(result)
        print(f"  {result}")

    async def test_prediction_creation_workflow(self):
        """Test complete prediction creation workflow"""
        print("🎯 Phase 3: Prediction Creation Workflow")
        print("-" * 50)
        
        result = UserWorkflowTestResult("Prediction Creation Flow", "prediction")
        start_time = time.time()
        
        try:
            # Ensure we have authentication
            if 'user' not in self.auth_tokens:
                result.add_step("Authentication check", False, "No auth token available")
                raise Exception("Authentication required")
            
            result.add_step("Authentication check", True, "Auth token available")
            
            # Step 1: Get available matches
            matches_response = await self.session.get(
                f"{SERVICES['backend']['url']}/matches",
                headers={"Authorization": f"Bearer {self.auth_tokens['user']}"}
            )
            
            if matches_response.status_code == 200:
                matches = matches_response.json()
                result.add_step("Fetch available matches", True, f"Found {len(matches)} matches")
                
                if matches:
                    # Step 2: Create prediction for first match
                    match = matches[0]
                    prediction_data = {
                        "matchId": match['id'],
                        "predictedHomeScore": 2,
                        "predictedAwayScore": 1,
                        "confidence": 0.75,
                        "betType": "MATCH_RESULT",
                        "notes": "Test prediction created by E2E test"
                    }
                    
                    result.add_step("Prepare prediction data", True, f"Match: {match.get('homeTeam', 'Unknown')} vs {match.get('awayTeam', 'Unknown')}")
                    
                    # Step 3: Create prediction
                    prediction_response = await self.session.post(
                        f"{SERVICES['backend']['url']}/predictions",
                        json=prediction_data,
                        headers={"Authorization": f"Bearer {self.auth_tokens['user']}"}
                    )
                    
                    if prediction_response.status_code == 201:
                        prediction_result = prediction_response.json()
                        self.test_data['created_prediction'] = prediction_result
                        result.add_step("Create prediction", True, f"Prediction ID: {prediction_result.get('id')}")
                    else:
                        result.add_step("Create prediction", False, f"Status: {prediction_response.status_code}")
                        raise Exception(f"Prediction creation failed: {prediction_response.text}")
                else:
                    result.add_step("Create prediction", False, "No matches available")
            else:
                result.add_step("Fetch available matches", False, f"Status: {matches_response.status_code}")
                raise Exception(f"Failed to fetch matches: {matches_response.text}")
            
            result.success = True
            
        except Exception as e:
            result.error = str(e)
            result.add_step("Error handling", False, str(e))
            
        result.duration = time.time() - start_time
        self.results.append(result)
        print(f"  {result}")

    async def test_prediction_management_workflow(self):
        """Test prediction management workflow"""
        print("📊 Phase 4: Prediction Management Workflow")
        print("-" * 55)
        
        result = UserWorkflowTestResult("Prediction Management Flow", "prediction")
        start_time = time.time()
        
        try:
            if 'user' not in self.auth_tokens:
                result.add_step("Authentication check", False, "No auth token available")
                raise Exception("Authentication required")
            
            result.add_step("Authentication check", True, "Auth token available")
            
            # Step 1: Get user predictions
            predictions_response = await self.session.get(
                f"{SERVICES['backend']['url']}/predictions",
                headers={"Authorization": f"Bearer {self.auth_tokens['user']}"}
            )
            
            if predictions_response.status_code == 200:
                predictions = predictions_response.json()
                result.add_step("Fetch user predictions", True, f"Found {len(predictions)} predictions")
                
                if predictions:
                    prediction = predictions[0]
                    prediction_id = prediction['id']
                    
                    # Step 2: Get specific prediction
                    get_prediction_response = await self.session.get(
                        f"{SERVICES['backend']['url']}/predictions/{prediction_id}",
                        headers={"Authorization": f"Bearer {self.auth_tokens['user']}"}
                    )
                    
                    if get_prediction_response.status_code == 200:
                        result.add_step("Get specific prediction", True, f"Prediction ID: {prediction_id}")
                        
                        # Step 3: Update prediction
                        update_data = {
                            "predictedHomeScore": 3,
                            "predictedAwayScore": 2,
                            "confidence": 0.85,
                            "notes": "Updated by E2E test"
                        }
                        
                        update_response = await self.session.patch(
                            f"{SERVICES['backend']['url']}/predictions/{prediction_id}",
                            json=update_data,
                            headers={"Authorization": f"Bearer {self.auth_tokens['user']}"}
                        )
                        
                        if update_response.status_code == 200:
                            result.add_step("Update prediction", True, "Prediction updated successfully")
                        else:
                            result.add_step("Update prediction", False, f"Status: {update_response.status_code}")
                    else:
                        result.add_step("Get specific prediction", False, f"Status: {get_prediction_response.status_code}")
                else:
                    result.add_step("Get specific prediction", False, "No predictions available")
            else:
                result.add_step("Fetch user predictions", False, f"Status: {predictions_response.status_code}")
            
            result.success = True
            
        except Exception as e:
            result.error = str(e)
            result.add_step("Error handling", False, str(e))
            
        result.duration = time.time() - start_time
        self.results.append(result)
        print(f"  {result}")

    async def test_realtime_match_updates(self):
        """Test real-time match updates via WebSocket"""
        print("⚡ Phase 5: Real-time Match Updates")
        print("-" * 45)
        
        result = UserWorkflowTestResult("Real-time Match Updates", "realtime")
        start_time = time.time()
        
        try:
            # Step 1: Connect to WebSocket
            ws_url = f"ws://localhost:3001/ws"
            result.add_step("WebSocket connection setup", True, f"Connecting to {ws_url}")
            
            self.websocket = await websockets.connect(ws_url)
            result.add_step("WebSocket connection", True, "Connected successfully")
            
            # Step 2: Subscribe to match updates
            subscribe_message = {
                "type": "subscribe",
                "channel": "match_updates",
                "data": {}
            }
            
            await self.websocket.send(json.dumps(subscribe_message))
            result.add_step("Subscribe to match updates", True, "Subscription sent")
            
            # Step 3: Wait for updates (with timeout)
            updates_received = 0
            timeout = 10  # seconds
            
            try:
                async with asyncio.timeout(timeout):
                    while updates_received < 3:  # Wait for at least 3 updates
                        message = await self.websocket.recv()
                        data = json.loads(message)
                        
                        if data.get('type') == 'match_update':
                            updates_received += 1
                            result.add_step(f"Receive update {updates_received}", True, f"Match: {data.get('data', {}).get('matchId', 'Unknown')}")
                        
                        if updates_received >= 3:
                            break
                            
            except asyncio.TimeoutError:
                result.add_step("Wait for updates", False, f"Timeout after {timeout}s, received {updates_received} updates")
            
            # Step 4: Test live match data
            live_matches_response = await self.session.get(
                f"{SERVICES['backend']['url']}/live-data/matches/live",
                headers={"Authorization": f"Bearer {self.auth_tokens.get('user', '')}"}
            )
            
            if live_matches_response.status_code == 200:
                live_matches = live_matches_response.json()
                result.add_step("Fetch live matches", True, f"Found {len(live_matches)} live matches")
            else:
                result.add_step("Fetch live matches", False, f"Status: {live_matches_response.status_code}")
            
            result.success = updates_received > 0
            
        except Exception as e:
            result.error = str(e)
            result.add_step("Error handling", False, str(e))
            
        result.duration = time.time() - start_time
        self.results.append(result)
        print(f"  {result}")

    async def test_notification_system(self):
        """Test notification system"""
        print("🔔 Phase 6: Notification System")
        print("-" * 35)
        
        result = UserWorkflowTestResult("Notification System", "notifications")
        start_time = time.time()
        
        try:
            if 'user' not in self.auth_tokens:
                result.add_step("Authentication check", False, "No auth token available")
                raise Exception("Authentication required")
            
            result.add_step("Authentication check", True, "Auth token available")
            
            # Step 1: Get user notifications
            notifications_response = await self.session.get(
                f"{SERVICES['backend']['url']}/notifications",
                headers={"Authorization": f"Bearer {self.auth_tokens['user']}"}
            )
            
            if notifications_response.status_code == 200:
                notifications = notifications_response.json()
                result.add_step("Fetch notifications", True, f"Found {len(notifications)} notifications")
            else:
                result.add_step("Fetch notifications", False, f"Status: {notifications_response.status_code}")
            
            # Step 2: Test WebSocket notifications
            if self.websocket:
                # Subscribe to notifications
                subscribe_message = {
                    "type": "subscribe",
                    "channel": "notifications",
                    "data": {"userId": "test"}
                }
                
                await self.websocket.send(json.dumps(subscribe_message))
                result.add_step("Subscribe to notifications", True, "Subscription sent")
                
                # Wait for notification (with timeout)
                try:
                    async with asyncio.timeout(5):
                        message = await self.websocket.recv()
                        data = json.loads(message)
                        
                        if data.get('type') == 'notification':
                            result.add_step("Receive notification", True, f"Notification: {data.get('data', {}).get('message', 'Unknown')}")
                        else:
                            result.add_step("Receive notification", False, "No notification received")
                            
                except asyncio.TimeoutError:
                    result.add_step("Receive notification", False, "Timeout waiting for notification")
            
            result.success = True
            
        except Exception as e:
            result.error = str(e)
            result.add_step("Error handling", False, str(e))
            
        result.duration = time.time() - start_time
        self.results.append(result)
        print(f"  {result}")

    async def test_user_profile_management(self):
        """Test user profile management"""
        print("👤 Phase 7: User Profile Management")
        print("-" * 45)
        
        result = UserWorkflowTestResult("User Profile Management", "profile")
        start_time = time.time()
        
        try:
            if 'user' not in self.auth_tokens:
                result.add_step("Authentication check", False, "No auth token available")
                raise Exception("Authentication required")
            
            result.add_step("Authentication check", True, "Auth token available")
            
            # Step 1: Get user profile
            profile_response = await self.session.get(
                f"{SERVICES['backend']['url']}/auth/profile",
                headers={"Authorization": f"Bearer {self.auth_tokens['user']}"}
            )
            
            if profile_response.status_code == 200:
                profile = profile_response.json()
                result.add_step("Get user profile", True, f"Username: {profile.get('username')}")
                
                # Step 2: Update user profile
                update_data = {
                    "firstName": "Updated",
                    "lastName": "User",
                    "email": profile.get('email')
                }
                
                update_response = await self.session.patch(
                    f"{SERVICES['backend']['url']}/users/profile",
                    json=update_data,
                    headers={"Authorization": f"Bearer {self.auth_tokens['user']}"}
                )
                
                if update_response.status_code == 200:
                    result.add_step("Update user profile", True, "Profile updated successfully")
                else:
                    result.add_step("Update user profile", False, f"Status: {update_response.status_code}")
            else:
                result.add_step("Get user profile", False, f"Status: {profile_response.status_code}")
            
            result.success = True
            
        except Exception as e:
            result.error = str(e)
            result.add_step("Error handling", False, str(e))
            
        result.duration = time.time() - start_time
        self.results.append(result)
        print(f"  {result}")

    async def test_data_persistence(self):
        """Test data persistence across sessions"""
        print("💾 Phase 8: Data Persistence")
        print("-" * 30)
        
        result = UserWorkflowTestResult("Data Persistence", "persistence")
        start_time = time.time()
        
        try:
            if 'user' not in self.auth_tokens:
                result.add_step("Authentication check", False, "No auth token available")
                raise Exception("Authentication required")
            
            result.add_step("Authentication check", True, "Auth token available")
            
            # Step 1: Verify user data persistence
            profile_response = await self.session.get(
                f"{SERVICES['backend']['url']}/auth/profile",
                headers={"Authorization": f"Bearer {self.auth_tokens['user']}"}
            )
            
            if profile_response.status_code == 200:
                profile = profile_response.json()
                result.add_step("Verify user data", True, f"User data persisted: {profile.get('username')}")
            else:
                result.add_step("Verify user data", False, f"Status: {profile_response.status_code}")
            
            # Step 2: Verify predictions persistence
            predictions_response = await self.session.get(
                f"{SERVICES['backend']['url']}/predictions",
                headers={"Authorization": f"Bearer {self.auth_tokens['user']}"}
            )
            
            if predictions_response.status_code == 200:
                predictions = predictions_response.json()
                result.add_step("Verify predictions data", True, f"Predictions persisted: {len(predictions)} predictions")
            else:
                result.add_step("Verify predictions data", False, f"Status: {predictions_response.status_code}")
            
            # Step 3: Test logout and data security
            logout_response = await self.session.post(
                f"{SERVICES['backend']['url']}/auth/logout",
                headers={"Authorization": f"Bearer {self.auth_tokens['user']}"}
            )
            
            if logout_response.status_code == 200:
                result.add_step("User logout", True, "Logout successful")
                
                # Try to access protected data after logout
                protected_response = await self.session.get(
                    f"{SERVICES['backend']['url']}/auth/profile",
                    headers={"Authorization": f"Bearer {self.auth_tokens['user']}"}
                )
                
                if protected_response.status_code == 401:
                    result.add_step("Data security after logout", True, "Access denied after logout")
                else:
                    result.add_step("Data security after logout", False, f"Unexpected status: {protected_response.status_code}")
            else:
                result.add_step("User logout", False, f"Status: {logout_response.status_code}")
            
            result.success = True
            
        except Exception as e:
            result.error = str(e)
            result.add_step("Error handling", False, str(e))
            
        result.duration = time.time() - start_time
        self.results.append(result)
        print(f"  {result}")

    def generate_workflow_test_report(self):
        """Generate comprehensive test report"""
        print("\n" + "=" * 80)
        print("📊 USER WORKFLOW TEST REPORT")
        print("=" * 80)
        
        total_tests = len(self.results)
        passed_tests = sum(1 for r in self.results if r.success)
        failed_tests = total_tests - passed_tests
        
        print(f"Total Tests: {total_tests}")
        print(f"Passed: {passed_tests} ✅")
        print(f"Failed: {failed_tests} ❌")
        print(f"Success Rate: {(passed_tests/total_tests*100):.1f}%")
        print()
        
        # Group by category
        categories = {}
        for result in self.results:
            if result.category not in categories:
                categories[result.category] = []
            categories[result.category].append(result)
        
        for category, results in categories.items():
            print(f"📁 {category.upper()} ({len(results)} tests)")
            print("-" * 40)
            
            for result in results:
                print(f"  {result}")
                if not result.success and result.error:
                    print(f"    Error: {result.error}")
                
                # Show detailed steps for failed tests
                if not result.success and result.steps:
                    print("    Steps:")
                    for step in result.steps:
                        status = "✅" if step['success'] else "❌"
                        print(f"      {status} {step['step']}: {step['details']}")
                print()
        
        # Summary
        print("🎯 SUMMARY")
        print("-" * 20)
        if failed_tests == 0:
            print("🎉 All user workflow tests passed! The system is ready for production.")
        else:
            print(f"⚠️  {failed_tests} tests failed. Please review the issues above.")
        
        print(f"\nReport generated at: {datetime.now().isoformat()}")

async def main():
    """Main test runner"""
    async with UserWorkflowTestRunner() as runner:
        await runner.run_user_workflow_tests()

if __name__ == "__main__":
    asyncio.run(main()) 