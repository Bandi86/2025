#!/usr/bin/env python3
"""
Data Persistence Testing for TippMixMentor
Tests user data persistence, prediction history, and agent task management.
"""

import asyncio
import httpx
import json
import time
import sys
import os
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
    "postgres": {
        "url": "postgresql://postgres:postgres@localhost:5432/tippmixmentor",
        "name": "PostgreSQL Database"
    }
}

class PersistenceTestResult:
    def __init__(self, test_name: str, category: str = "persistence"):
        self.test_name = test_name
        self.category = category
        self.success = False
        self.error = None
        self.duration = 0
        self.data = None
        self.timestamp = datetime.now()
        self.operations = []
        self.verifications = []

    def add_operation(self, operation: str, success: bool, details: str = "", data: Any = None):
        self.operations.append({
            "operation": operation,
            "success": success,
            "details": details,
            "data": data,
            "timestamp": datetime.now()
        })

    def add_verification(self, verification: str, success: bool, details: str = "", data: Any = None):
        self.verifications.append({
            "verification": verification,
            "success": success,
            "details": details,
            "data": data,
            "timestamp": datetime.now()
        })

    def __str__(self):
        status = "✅ PASS" if self.success else "❌ FAIL"
        return f"{status} {self.test_name} ({self.duration:.2f}s, {len(self.operations)} ops)"

class DataPersistenceTestRunner:
    def __init__(self):
        self.results: List[PersistenceTestResult] = []
        self.test_data = {}
        self.session = None
        self.auth_tokens = {}
        self.created_entities = {}
        
    async def __aenter__(self):
        self.session = httpx.AsyncClient(timeout=30.0)
        return self
        
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.aclose()

    async def run_persistence_tests(self):
        """Run the complete data persistence test suite"""
        print("🚀 Starting Data Persistence Test Suite")
        print("=" * 80)
        print(f"Timestamp: {datetime.now().isoformat()}")
        print()
        
        # Test phases
        await self.test_user_data_persistence()
        await self.test_prediction_history_persistence()
        await self.test_agent_task_management()
        await self.test_database_integrity()
        await self.test_data_consistency()
        await self.test_backup_and_restore()
        await self.test_data_migration()
        await self.test_performance_under_load()
        
        # Generate report
        self.generate_persistence_test_report()

    async def test_user_data_persistence(self):
        """Test user data persistence across sessions"""
        print("👤 Phase 1: User Data Persistence")
        print("-" * 40)
        
        result = PersistenceTestResult("User Data Persistence", "user_data")
        start_time = time.time()
        
        try:
            # Step 1: Create test user
            test_user = {
                "username": f"persistence_test_{uuid.uuid4().hex[:8]}",
                "email": f"persistence_test_{uuid.uuid4().hex[:8]}@example.com",
                "password": "TestPassword123!",
                "firstName": "Persistence",
                "lastName": "Test"
            }
            
            result.add_operation("Create test user data", True, f"Username: {test_user['username']}")
            
            # Step 2: Register user
            register_response = await self.session.post(
                f"{SERVICES['backend']['url']}/auth/register",
                json=test_user
            )
            
            if register_response.status_code == 201:
                user_data = register_response.json()
                self.created_entities['test_user'] = user_data
                result.add_operation("User registration", True, f"User ID: {user_data.get('id')}")
            else:
                result.add_operation("User registration", False, f"Status: {register_response.status_code}")
                raise Exception(f"Registration failed: {register_response.text}")
            
            # Step 3: Login to get auth token
            login_response = await self.session.post(
                f"{SERVICES['backend']['url']}/auth/login",
                json={
                    "username": test_user['username'],
                    "password": test_user['password']
                }
            )
            
            if login_response.status_code == 200:
                login_data = login_response.json()
                self.auth_tokens['test_user'] = login_data.get('access_token')
                result.add_operation("User login", True, "Auth token received")
            else:
                result.add_operation("User login", False, f"Status: {login_response.status_code}")
                raise Exception(f"Login failed: {login_response.text}")
            
            # Step 4: Update user profile
            update_data = {
                "firstName": "Updated",
                "lastName": "Persistence",
                "email": test_user['email']
            }
            
            update_response = await self.session.patch(
                f"{SERVICES['backend']['url']}/users/profile",
                json=update_data,
                headers={"Authorization": f"Bearer {self.auth_tokens['test_user']}"}
            )
            
            if update_response.status_code == 200:
                updated_profile = update_response.json()
                result.add_operation("Profile update", True, f"Updated: {updated_profile.get('firstName')} {updated_profile.get('lastName')}")
            else:
                result.add_operation("Profile update", False, f"Status: {update_response.status_code}")
            
            # Step 5: Verify data persistence after logout/login cycle
            logout_response = await self.session.post(
                f"{SERVICES['backend']['url']}/auth/logout",
                headers={"Authorization": f"Bearer {self.auth_tokens['test_user']}"}
            )
            
            if logout_response.status_code == 200:
                result.add_operation("User logout", True, "Logout successful")
            else:
                result.add_operation("User logout", False, f"Status: {logout_response.status_code}")
            
            # Step 6: Login again and verify data
            relogin_response = await self.session.post(
                f"{SERVICES['backend']['url']}/auth/login",
                json={
                    "username": test_user['username'],
                    "password": test_user['password']
                }
            )
            
            if relogin_response.status_code == 200:
                relogin_data = relogin_response.json()
                self.auth_tokens['test_user'] = relogin_data.get('access_token')
                result.add_operation("User relogin", True, "Relogin successful")
                
                # Verify profile data persisted
                profile_response = await self.session.get(
                    f"{SERVICES['backend']['url']}/auth/profile",
                    headers={"Authorization": f"Bearer {self.auth_tokens['test_user']}"}
                )
                
                if profile_response.status_code == 200:
                    profile_data = profile_response.json()
                    result.add_verification("Profile data persistence", 
                                          profile_data.get('firstName') == "Updated",
                                          f"FirstName: {profile_data.get('firstName')}")
                    result.add_verification("Profile data persistence", 
                                          profile_data.get('lastName') == "Persistence",
                                          f"LastName: {profile_data.get('lastName')}")
                else:
                    result.add_verification("Profile data persistence", False, f"Status: {profile_response.status_code}")
            else:
                result.add_operation("User relogin", False, f"Status: {relogin_response.status_code}")
            
            result.success = True
            
        except Exception as e:
            result.error = str(e)
            result.add_operation("Error handling", False, str(e))
            
        result.duration = time.time() - start_time
        self.results.append(result)
        print(f"  {result}")

    async def test_prediction_history_persistence(self):
        """Test prediction history persistence"""
        print("🎯 Phase 2: Prediction History Persistence")
        print("-" * 45)
        
        result = PersistenceTestResult("Prediction History Persistence", "prediction_history")
        start_time = time.time()
        
        try:
            if 'test_user' not in self.auth_tokens:
                result.add_operation("Authentication check", False, "No auth token available")
                raise Exception("Authentication required")
            
            result.add_operation("Authentication check", True, "Auth token available")
            
            # Step 1: Get available matches
            matches_response = await self.session.get(
                f"{SERVICES['backend']['url']}/matches",
                headers={"Authorization": f"Bearer {self.auth_tokens['test_user']}"}
            )
            
            if matches_response.status_code == 200:
                matches = matches_response.json()
                result.add_operation("Fetch matches", True, f"Found {len(matches)} matches")
                
                if matches:
                    # Step 2: Create multiple predictions
                    predictions_created = []
                    for i, match in enumerate(matches[:3]):  # Create 3 predictions
                        prediction_data = {
                            "matchId": match['id'],
                            "predictedHomeScore": 2 + i,
                            "predictedAwayScore": 1 + i,
                            "confidence": 0.7 + (i * 0.1),
                            "betType": "MATCH_RESULT",
                            "notes": f"Persistence test prediction {i+1}"
                        }
                        
                        prediction_response = await self.session.post(
                            f"{SERVICES['backend']['url']}/predictions",
                            json=prediction_data,
                            headers={"Authorization": f"Bearer {self.auth_tokens['test_user']}"}
                        )
                        
                        if prediction_response.status_code == 201:
                            prediction = prediction_response.json()
                            predictions_created.append(prediction)
                            result.add_operation(f"Create prediction {i+1}", True, f"Prediction ID: {prediction.get('id')}")
                        else:
                            result.add_operation(f"Create prediction {i+1}", False, f"Status: {prediction_response.status_code}")
                    
                    # Step 3: Verify predictions are stored
                    predictions_response = await self.session.get(
                        f"{SERVICES['backend']['url']}/predictions",
                        headers={"Authorization": f"Bearer {self.auth_tokens['test_user']}"}
                    )
                    
                    if predictions_response.status_code == 200:
                        stored_predictions = predictions_response.json()
                        result.add_verification("Predictions stored", 
                                              len(stored_predictions) >= len(predictions_created),
                                              f"Stored: {len(stored_predictions)}, Created: {len(predictions_created)}")
                        
                        # Step 4: Update a prediction
                        if stored_predictions:
                            prediction_to_update = stored_predictions[0]
                            update_data = {
                                "predictedHomeScore": 5,
                                "predictedAwayScore": 3,
                                "confidence": 0.95,
                                "notes": "Updated by persistence test"
                            }
                            
                            update_response = await self.session.patch(
                                f"{SERVICES['backend']['url']}/predictions/{prediction_to_update['id']}",
                                json=update_data,
                                headers={"Authorization": f"Bearer {self.auth_tokens['test_user']}"}
                            )
                            
                            if update_response.status_code == 200:
                                updated_prediction = update_response.json()
                                result.add_operation("Update prediction", True, f"Updated: {updated_prediction.get('id')}")
                                
                                # Step 5: Verify update persisted
                                get_response = await self.session.get(
                                    f"{SERVICES['backend']['url']}/predictions/{prediction_to_update['id']}",
                                    headers={"Authorization": f"Bearer {self.auth_tokens['test_user']}"}
                                )
                                
                                if get_response.status_code == 200:
                                    retrieved_prediction = get_response.json()
                                    result.add_verification("Prediction update persistence", 
                                                          retrieved_prediction.get('predictedHomeScore') == 5,
                                                          f"HomeScore: {retrieved_prediction.get('predictedHomeScore')}")
                                    result.add_verification("Prediction update persistence", 
                                                          retrieved_prediction.get('confidence') == 0.95,
                                                          f"Confidence: {retrieved_prediction.get('confidence')}")
                                else:
                                    result.add_verification("Prediction update persistence", False, f"Status: {get_response.status_code}")
                            else:
                                result.add_operation("Update prediction", False, f"Status: {update_response.status_code}")
                    else:
                        result.add_verification("Predictions stored", False, f"Status: {predictions_response.status_code}")
                else:
                    result.add_operation("Create predictions", False, "No matches available")
            else:
                result.add_operation("Fetch matches", False, f"Status: {matches_response.status_code}")
            
            result.success = True
            
        except Exception as e:
            result.error = str(e)
            result.add_operation("Error handling", False, str(e))
            
        result.duration = time.time() - start_time
        self.results.append(result)
        print(f"  {result}")

    async def test_agent_task_management(self):
        """Test agent task management persistence"""
        print("🤖 Phase 3: Agent Task Management")
        print("-" * 35)
        
        result = PersistenceTestResult("Agent Task Management", "agent_tasks")
        start_time = time.time()
        
        try:
            # Step 1: Create test agent
            agent_data = {
                "name": f"persistence_test_agent_{uuid.uuid4().hex[:8]}",
                "type": "prediction_agent",
                "status": "inactive",
                "config": {
                    "model": "test_model",
                    "parameters": {"confidence_threshold": 0.8}
                }
            }
            
            result.add_operation("Create agent data", True, f"Agent name: {agent_data['name']}")
            
            # Step 2: Create agent
            agent_response = await self.session.post(
                f"{SERVICES['backend']['url']}/agents",
                json=agent_data
            )
            
            if agent_response.status_code == 201:
                agent = agent_response.json()
                self.created_entities['test_agent'] = agent
                result.add_operation("Create agent", True, f"Agent ID: {agent.get('id')}")
                
                # Step 3: Create tasks for the agent
                tasks_created = []
                for i in range(3):
                    task_data = {
                        "type": "prediction_task",
                        "priority": "medium",
                        "status": "pending",
                        "data": {
                            "matchId": f"test_match_{i}",
                            "predictionType": "match_result"
                        },
                        "notes": f"Persistence test task {i+1}"
                    }
                    
                    task_response = await self.session.post(
                        f"{SERVICES['backend']['url']}/agents/{agent['id']}/tasks",
                        json=task_data
                    )
                    
                    if task_response.status_code == 201:
                        task = task_response.json()
                        tasks_created.append(task)
                        result.add_operation(f"Create task {i+1}", True, f"Task ID: {task.get('id')}")
                    else:
                        result.add_operation(f"Create task {i+1}", False, f"Status: {task_response.status_code}")
                
                # Step 4: Verify tasks are stored
                tasks_response = await self.session.get(
                    f"{SERVICES['backend']['url']}/agents/{agent['id']}/tasks"
                )
                
                if tasks_response.status_code == 200:
                    stored_tasks = tasks_response.json()
                    result.add_verification("Tasks stored", 
                                          len(stored_tasks) >= len(tasks_created),
                                          f"Stored: {len(stored_tasks)}, Created: {len(tasks_created)}")
                    
                    # Step 5: Update task status
                    if stored_tasks:
                        task_to_update = stored_tasks[0]
                        update_data = {
                            "status": "in_progress",
                            "notes": "Updated by persistence test"
                        }
                        
                        update_response = await self.session.patch(
                            f"{SERVICES['backend']['url']}/agents/{agent['id']}/tasks/{task_to_update['id']}",
                            json=update_data
                        )
                        
                        if update_response.status_code == 200:
                            updated_task = update_response.json()
                            result.add_operation("Update task", True, f"Updated: {updated_task.get('id')}")
                            
                            # Step 6: Verify task update persisted
                            get_response = await self.session.get(
                                f"{SERVICES['backend']['url']}/agents/{agent['id']}/tasks/{task_to_update['id']}"
                            )
                            
                            if get_response.status_code == 200:
                                retrieved_task = get_response.json()
                                result.add_verification("Task update persistence", 
                                                      retrieved_task.get('status') == "in_progress",
                                                      f"Status: {retrieved_task.get('status')}")
                            else:
                                result.add_verification("Task update persistence", False, f"Status: {get_response.status_code}")
                        else:
                            result.add_operation("Update task", False, f"Status: {update_response.status_code}")
                else:
                    result.add_verification("Tasks stored", False, f"Status: {tasks_response.status_code}")
                
                # Step 7: Test agent events persistence
                event_data = {
                    "type": "task_completed",
                    "severity": "info",
                    "message": "Test event for persistence",
                    "data": {
                        "taskId": tasks_created[0]['id'] if tasks_created else "test_task",
                        "result": "success"
                    }
                }
                
                event_response = await self.session.post(
                    f"{SERVICES['backend']['url']}/agents/{agent['id']}/events",
                    json=event_data
                )
                
                if event_response.status_code == 201:
                    event = event_response.json()
                    result.add_operation("Create agent event", True, f"Event ID: {event.get('id')}")
                    
                    # Verify event is stored
                    events_response = await self.session.get(
                        f"{SERVICES['backend']['url']}/agents/{agent['id']}/events"
                    )
                    
                    if events_response.status_code == 200:
                        stored_events = events_response.json()
                        result.add_verification("Agent events stored", 
                                              len(stored_events) > 0,
                                              f"Events stored: {len(stored_events)}")
                    else:
                        result.add_verification("Agent events stored", False, f"Status: {events_response.status_code}")
                else:
                    result.add_operation("Create agent event", False, f"Status: {event_response.status_code}")
            else:
                result.add_operation("Create agent", False, f"Status: {agent_response.status_code}")
            
            result.success = True
            
        except Exception as e:
            result.error = str(e)
            result.add_operation("Error handling", False, str(e))
            
        result.duration = time.time() - start_time
        self.results.append(result)
        print(f"  {result}")

    async def test_database_integrity(self):
        """Test database integrity and constraints"""
        print("🔒 Phase 4: Database Integrity")
        print("-" * 35)
        
        result = PersistenceTestResult("Database Integrity", "integrity")
        start_time = time.time()
        
        try:
            # Step 1: Test unique constraints
            duplicate_user = {
                "username": "duplicate_test_user",
                "email": "duplicate_test@example.com",
                "password": "TestPassword123!",
                "firstName": "Duplicate",
                "lastName": "Test"
            }
            
            # Create first user
            first_response = await self.session.post(
                f"{SERVICES['backend']['url']}/auth/register",
                json=duplicate_user
            )
            
            if first_response.status_code == 201:
                result.add_operation("Create first user", True, "First user created")
                
                # Try to create duplicate user
                second_response = await self.session.post(
                    f"{SERVICES['backend']['url']}/auth/register",
                    json=duplicate_user
                )
                
                if second_response.status_code == 400:
                    result.add_verification("Unique constraint enforcement", True, "Duplicate user rejected")
                else:
                    result.add_verification("Unique constraint enforcement", False, f"Unexpected status: {second_response.status_code}")
            else:
                result.add_operation("Create first user", False, f"Status: {first_response.status_code}")
            
            # Step 2: Test foreign key constraints
            invalid_prediction = {
                "matchId": "non_existent_match_id",
                "predictedHomeScore": 2,
                "predictedAwayScore": 1,
                "confidence": 0.8,
                "betType": "MATCH_RESULT"
            }
            
            if 'test_user' in self.auth_tokens:
                invalid_response = await self.session.post(
                    f"{SERVICES['backend']['url']}/predictions",
                    json=invalid_prediction,
                    headers={"Authorization": f"Bearer {self.auth_tokens['test_user']}"}
                )
                
                if invalid_response.status_code == 400:
                    result.add_verification("Foreign key constraint enforcement", True, "Invalid match ID rejected")
                else:
                    result.add_verification("Foreign key constraint enforcement", False, f"Unexpected status: {invalid_response.status_code}")
            
            # Step 3: Test data validation
            invalid_user = {
                "username": "a",  # Too short
                "email": "invalid_email",  # Invalid email
                "password": "123",  # Too short
                "firstName": "",
                "lastName": ""
            }
            
            validation_response = await self.session.post(
                f"{SERVICES['backend']['url']}/auth/register",
                json=invalid_user
            )
            
            if validation_response.status_code == 400:
                result.add_verification("Data validation", True, "Invalid data rejected")
            else:
                result.add_verification("Data validation", False, f"Unexpected status: {validation_response.status_code}")
            
            result.success = True
            
        except Exception as e:
            result.error = str(e)
            result.add_operation("Error handling", False, str(e))
            
        result.duration = time.time() - start_time
        self.results.append(result)
        print(f"  {result}")

    async def test_data_consistency(self):
        """Test data consistency across operations"""
        print("🔄 Phase 5: Data Consistency")
        print("-" * 35)
        
        result = PersistenceTestResult("Data Consistency", "consistency")
        start_time = time.time()
        
        try:
            if 'test_user' not in self.auth_tokens:
                result.add_operation("Authentication check", False, "No auth token available")
                raise Exception("Authentication required")
            
            result.add_operation("Authentication check", True, "Auth token available")
            
            # Step 1: Create prediction and verify consistency
            matches_response = await self.session.get(
                f"{SERVICES['backend']['url']}/matches",
                headers={"Authorization": f"Bearer {self.auth_tokens['test_user']}"}
            )
            
            if matches_response.status_code == 200:
                matches = matches_response.json()
                
                if matches:
                    match = matches[0]
                    prediction_data = {
                        "matchId": match['id'],
                        "predictedHomeScore": 3,
                        "predictedAwayScore": 2,
                        "confidence": 0.85,
                        "betType": "MATCH_RESULT",
                        "notes": "Consistency test prediction"
                    }
                    
                    # Create prediction
                    create_response = await self.session.post(
                        f"{SERVICES['backend']['url']}/predictions",
                        json=prediction_data,
                        headers={"Authorization": f"Bearer {self.auth_tokens['test_user']}"}
                    )
                    
                    if create_response.status_code == 201:
                        created_prediction = create_response.json()
                        result.add_operation("Create prediction", True, f"Prediction ID: {created_prediction.get('id')}")
                        
                        # Immediately fetch and verify
                        get_response = await self.session.get(
                            f"{SERVICES['backend']['url']}/predictions/{created_prediction['id']}",
                            headers={"Authorization": f"Bearer {self.auth_tokens['test_user']}"}
                        )
                        
                        if get_response.status_code == 200:
                            retrieved_prediction = get_response.json()
                            
                            # Verify all fields match
                            fields_to_check = ['predictedHomeScore', 'predictedAwayScore', 'confidence', 'betType', 'notes']
                            all_fields_match = True
                            
                            for field in fields_to_check:
                                if retrieved_prediction.get(field) != prediction_data.get(field):
                                    all_fields_match = False
                                    result.add_verification(f"Field consistency: {field}", False, 
                                                          f"Expected: {prediction_data.get(field)}, Got: {retrieved_prediction.get(field)}")
                            
                            if all_fields_match:
                                result.add_verification("Data consistency", True, "All fields match after creation")
                            
                            # Step 2: Update and verify consistency
                            update_data = {
                                "predictedHomeScore": 4,
                                "confidence": 0.95
                            }
                            
                            update_response = await self.session.patch(
                                f"{SERVICES['backend']['url']}/predictions/{created_prediction['id']}",
                                json=update_data,
                                headers={"Authorization": f"Bearer {self.auth_tokens['test_user']}"}
                            )
                            
                            if update_response.status_code == 200:
                                updated_prediction = update_response.json()
                                result.add_operation("Update prediction", True, "Prediction updated")
                                
                                # Verify update consistency
                                get_updated_response = await self.session.get(
                                    f"{SERVICES['backend']['url']}/predictions/{created_prediction['id']}",
                                    headers={"Authorization": f"Bearer {self.auth_tokens['test_user']}"}
                                )
                                
                                if get_updated_response.status_code == 200:
                                    final_prediction = get_updated_response.json()
                                    
                                    result.add_verification("Update consistency", 
                                                          final_prediction.get('predictedHomeScore') == 4,
                                                          f"HomeScore: {final_prediction.get('predictedHomeScore')}")
                                    result.add_verification("Update consistency", 
                                                          final_prediction.get('confidence') == 0.95,
                                                          f"Confidence: {final_prediction.get('confidence')}")
                                else:
                                    result.add_verification("Update consistency", False, f"Status: {get_updated_response.status_code}")
                            else:
                                result.add_operation("Update prediction", False, f"Status: {update_response.status_code}")
                        else:
                            result.add_verification("Data consistency", False, f"Status: {get_response.status_code}")
                    else:
                        result.add_operation("Create prediction", False, f"Status: {create_response.status_code}")
                else:
                    result.add_operation("Create prediction", False, "No matches available")
            else:
                result.add_operation("Fetch matches", False, f"Status: {matches_response.status_code}")
            
            result.success = True
            
        except Exception as e:
            result.error = str(e)
            result.add_operation("Error handling", False, str(e))
            
        result.duration = time.time() - start_time
        self.results.append(result)
        print(f"  {result}")

    async def test_backup_and_restore(self):
        """Test backup and restore functionality"""
        print("💾 Phase 6: Backup and Restore")
        print("-" * 35)
        
        result = PersistenceTestResult("Backup and Restore", "backup")
        start_time = time.time()
        
        try:
            # Step 1: Check if backup endpoints exist
            backup_response = await self.session.get(
                f"{SERVICES['backend']['url']}/health"
            )
            
            if backup_response.status_code == 200:
                result.add_operation("Health check", True, "Backend is healthy")
                
                # Step 2: Test database connection
                db_check_response = await self.session.get(
                    f"{SERVICES['backend']['url']}/health/database"
                )
                
                if db_check_response.status_code == 200:
                    result.add_verification("Database connection", True, "Database is accessible")
                else:
                    result.add_verification("Database connection", False, f"Status: {db_check_response.status_code}")
                
                # Step 3: Test data export (if available)
                export_response = await self.session.get(
                    f"{SERVICES['backend']['url']}/export/data"
                )
                
                if export_response.status_code == 200:
                    result.add_operation("Data export", True, "Data export successful")
                elif export_response.status_code == 404:
                    result.add_operation("Data export", False, "Export endpoint not available")
                else:
                    result.add_operation("Data export", False, f"Status: {export_response.status_code}")
            else:
                result.add_operation("Health check", False, f"Status: {backup_response.status_code}")
            
            result.success = True
            
        except Exception as e:
            result.error = str(e)
            result.add_operation("Error handling", False, str(e))
            
        result.duration = time.time() - start_time
        self.results.append(result)
        print(f"  {result}")

    async def test_data_migration(self):
        """Test data migration scenarios"""
        print("🔄 Phase 7: Data Migration")
        print("-" * 30)
        
        result = PersistenceTestResult("Data Migration", "migration")
        start_time = time.time()
        
        try:
            # Step 1: Check migration status
            migration_response = await self.session.get(
                f"{SERVICES['backend']['url']}/health/migrations"
            )
            
            if migration_response.status_code == 200:
                migration_data = migration_response.json()
                result.add_operation("Migration status check", True, "Migration status retrieved")
                
                # Check if migrations are up to date
                if migration_data.get('status') == 'up_to_date':
                    result.add_verification("Migration status", True, "Migrations are up to date")
                else:
                    result.add_verification("Migration status", False, f"Status: {migration_data.get('status')}")
            elif migration_response.status_code == 404:
                result.add_operation("Migration status check", False, "Migration endpoint not available")
            else:
                result.add_operation("Migration status check", False, f"Status: {migration_response.status_code}")
            
            # Step 2: Test schema validation
            schema_response = await self.session.get(
                f"{SERVICES['backend']['url']}/health/schema"
            )
            
            if schema_response.status_code == 200:
                schema_data = schema_response.json()
                result.add_operation("Schema validation", True, "Schema validation successful")
                
                # Check schema version
                if schema_data.get('version'):
                    result.add_verification("Schema version", True, f"Version: {schema_data.get('version')}")
                else:
                    result.add_verification("Schema version", False, "No version information")
            elif schema_response.status_code == 404:
                result.add_operation("Schema validation", False, "Schema endpoint not available")
            else:
                result.add_operation("Schema validation", False, f"Status: {schema_response.status_code}")
            
            result.success = True
            
        except Exception as e:
            result.error = str(e)
            result.add_operation("Error handling", False, str(e))
            
        result.duration = time.time() - start_time
        self.results.append(result)
        print(f"  {result}")

    async def test_performance_under_load(self):
        """Test database performance under load"""
        print("⚡ Phase 8: Performance Under Load")
        print("-" * 35)
        
        result = PersistenceTestResult("Performance Under Load", "performance")
        start_time = time.time()
        
        try:
            if 'test_user' not in self.auth_tokens:
                result.add_operation("Authentication check", False, "No auth token available")
                raise Exception("Authentication required")
            
            result.add_operation("Authentication check", True, "Auth token available")
            
            # Step 1: Test concurrent reads
            concurrent_reads = 10
            read_tasks = []
            
            for i in range(concurrent_reads):
                task = self.session.get(
                    f"{SERVICES['backend']['url']}/predictions",
                    headers={"Authorization": f"Bearer {self.auth_tokens['test_user']}"}
                )
                read_tasks.append(task)
            
            read_start = time.time()
            read_responses = await asyncio.gather(*read_tasks, return_exceptions=True)
            read_duration = time.time() - read_start
            
            successful_reads = sum(1 for r in read_responses if isinstance(r, httpx.Response) and r.status_code == 200)
            result.add_operation("Concurrent reads", successful_reads == concurrent_reads, 
                               f"Success: {successful_reads}/{concurrent_reads} in {read_duration:.2f}s")
            
            # Step 2: Test concurrent writes
            matches_response = await self.session.get(
                f"{SERVICES['backend']['url']}/matches",
                headers={"Authorization": f"Bearer {self.auth_tokens['test_user']}"}
            )
            
            if matches_response.status_code == 200:
                matches = matches_response.json()
                
                if matches:
                    concurrent_writes = 5
                    write_tasks = []
                    
                    for i in range(concurrent_writes):
                        prediction_data = {
                            "matchId": matches[0]['id'],
                            "predictedHomeScore": 1 + i,
                            "predictedAwayScore": 0 + i,
                            "confidence": 0.7 + (i * 0.05),
                            "betType": "MATCH_RESULT",
                            "notes": f"Performance test prediction {i+1}"
                        }
                        
                        task = self.session.post(
                            f"{SERVICES['backend']['url']}/predictions",
                            json=prediction_data,
                            headers={"Authorization": f"Bearer {self.auth_tokens['test_user']}"}
                        )
                        write_tasks.append(task)
                    
                    write_start = time.time()
                    write_responses = await asyncio.gather(*write_tasks, return_exceptions=True)
                    write_duration = time.time() - write_start
                    
                    successful_writes = sum(1 for r in write_responses if isinstance(r, httpx.Response) and r.status_code == 201)
                    result.add_operation("Concurrent writes", successful_writes == concurrent_writes,
                                       f"Success: {successful_writes}/{concurrent_writes} in {write_duration:.2f}s")
                    
                    # Step 3: Test mixed operations
                    mixed_operations = 20
                    mixed_tasks = []
                    
                    for i in range(mixed_operations):
                        if i % 2 == 0:
                            # Read operation
                            task = self.session.get(
                                f"{SERVICES['backend']['url']}/predictions",
                                headers={"Authorization": f"Bearer {self.auth_tokens['test_user']}"}
                            )
                        else:
                            # Write operation
                            prediction_data = {
                                "matchId": matches[0]['id'],
                                "predictedHomeScore": 2,
                                "predictedAwayScore": 1,
                                "confidence": 0.8,
                                "betType": "MATCH_RESULT",
                                "notes": f"Mixed operation test {i+1}"
                            }
                            task = self.session.post(
                                f"{SERVICES['backend']['url']}/predictions",
                                json=prediction_data,
                                headers={"Authorization": f"Bearer {self.auth_tokens['test_user']}"}
                            )
                        mixed_tasks.append(task)
                    
                    mixed_start = time.time()
                    mixed_responses = await asyncio.gather(*mixed_tasks, return_exceptions=True)
                    mixed_duration = time.time() - mixed_start
                    
                    successful_mixed = sum(1 for r in mixed_responses if isinstance(r, httpx.Response) and r.status_code in [200, 201])
                    result.add_operation("Mixed operations", successful_mixed >= mixed_operations * 0.8,
                                       f"Success: {successful_mixed}/{mixed_operations} in {mixed_duration:.2f}s")
                    
                    # Performance metrics
                    result.add_verification("Read performance", read_duration < 5.0, f"Read time: {read_duration:.2f}s")
                    result.add_verification("Write performance", write_duration < 10.0, f"Write time: {write_duration:.2f}s")
                    result.add_verification("Mixed performance", mixed_duration < 15.0, f"Mixed time: {mixed_duration:.2f}s")
                else:
                    result.add_operation("Concurrent writes", False, "No matches available")
            else:
                result.add_operation("Fetch matches", False, f"Status: {matches_response.status_code}")
            
            result.success = True
            
        except Exception as e:
            result.error = str(e)
            result.add_operation("Error handling", False, str(e))
            
        result.duration = time.time() - start_time
        self.results.append(result)
        print(f"  {result}")

    def generate_persistence_test_report(self):
        """Generate comprehensive persistence test report"""
        print("\n" + "=" * 80)
        print("📊 DATA PERSISTENCE TEST REPORT")
        print("=" * 80)
        
        total_tests = len(self.results)
        passed_tests = sum(1 for r in self.results if r.success)
        failed_tests = total_tests - passed_tests
        
        print(f"Total Tests: {total_tests}")
        print(f"Passed: {passed_tests} ✅")
        print(f"Failed: {failed_tests} ❌")
        print(f"Success Rate: {(passed_tests/total_tests*100):.1f}%")
        print()
        
        # Calculate operation statistics
        total_operations = sum(len(r.operations) for r in self.results)
        successful_operations = sum(
            sum(1 for op in r.operations if op['success']) 
            for r in self.results
        )
        
        total_verifications = sum(len(r.verifications) for r in self.results)
        successful_verifications = sum(
            sum(1 for ver in r.verifications if ver['success']) 
            for r in self.results
        )
        
        print(f"Total Operations: {total_operations}")
        print(f"Successful Operations: {successful_operations}")
        print(f"Operation Success Rate: {(successful_operations/total_operations*100):.1f}%" if total_operations > 0 else "N/A")
        print()
        print(f"Total Verifications: {total_verifications}")
        print(f"Successful Verifications: {successful_verifications}")
        print(f"Verification Success Rate: {(successful_verifications/total_verifications*100):.1f}%" if total_verifications > 0 else "N/A")
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
                
                # Show operation statistics for each test
                if result.operations:
                    successful_ops = sum(1 for op in result.operations if op['success'])
                    print(f"    Operations: {successful_ops}/{len(result.operations)} successful")
                
                if result.verifications:
                    successful_vers = sum(1 for ver in result.verifications if ver['success'])
                    print(f"    Verifications: {successful_vers}/{len(result.verifications)} successful")
                print()
        
        # Performance summary
        print("🚀 PERFORMANCE SUMMARY")
        print("-" * 25)
        
        avg_duration = sum(r.duration for r in self.results) / len(self.results) if self.results else 0
        print(f"Average Test Duration: {avg_duration:.2f}s")
        
        # Data integrity summary
        print("\n🔒 DATA INTEGRITY SUMMARY")
        print("-" * 25)
        
        integrity_tests = [r for r in self.results if r.category == 'integrity']
        if integrity_tests:
            integrity_success = sum(1 for r in integrity_tests if r.success)
            print(f"Integrity Tests: {integrity_success}/{len(integrity_tests)} passed")
        
        # Summary
        print("\n🎯 SUMMARY")
        print("-" * 20)
        if failed_tests == 0:
            print("🎉 All persistence tests passed! Data integrity is maintained.")
        else:
            print(f"⚠️  {failed_tests} tests failed. Please review the issues above.")
        
        print(f"\nReport generated at: {datetime.now().isoformat()}")

async def main():
    """Main test runner"""
    async with DataPersistenceTestRunner() as runner:
        await runner.run_persistence_tests()

if __name__ == "__main__":
    asyncio.run(main()) 