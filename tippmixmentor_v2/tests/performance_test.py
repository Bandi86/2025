#!/usr/bin/env python3
"""
Performance Testing for TippMixMentor
Tests load testing with multiple concurrent users, real-time data throughput testing,
and database performance under load.
"""

import asyncio
import httpx
import json
import time
import sys
import os
import uuid
import statistics
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
import subprocess
import signal
import websockets
import threading
from concurrent.futures import ThreadPoolExecutor

# Configuration
SERVICES = {
    "backend": {
        "url": "http://localhost:3001",
        "ws_url": "ws://localhost:3001/ws",
        "health_endpoint": "/health",
        "name": "Backend API"
    },
    "frontend": {
        "url": "http://localhost:3000",
        "health_endpoint": "/",
        "name": "Frontend"
    }
}

class PerformanceTestResult:
    def __init__(self, test_name: str, category: str = "performance"):
        self.test_name = test_name
        self.category = category
        self.success = False
        self.error = None
        self.duration = 0
        self.data = None
        self.timestamp = datetime.now()
        self.metrics = {}
        self.requests = []
        self.response_times = []

    def add_metric(self, name: str, value: float, unit: str = ""):
        self.metrics[name] = {"value": value, "unit": unit, "timestamp": datetime.now()}

    def add_request(self, method: str, endpoint: str, status_code: int, response_time: float):
        self.requests.append({
            "method": method,
            "endpoint": endpoint,
            "status_code": status_code,
            "response_time": response_time,
            "timestamp": datetime.now()
        })
        self.response_times.append(response_time)

    def get_statistics(self):
        if not self.response_times:
            return {}
        
        return {
            "count": len(self.response_times),
            "mean": statistics.mean(self.response_times),
            "median": statistics.median(self.response_times),
            "min": min(self.response_times),
            "max": max(self.response_times),
            "std_dev": statistics.stdev(self.response_times) if len(self.response_times) > 1 else 0,
            "p95": sorted(self.response_times)[int(len(self.response_times) * 0.95)],
            "p99": sorted(self.response_times)[int(len(self.response_times) * 0.99)]
        }

    def __str__(self):
        status = "✅ PASS" if self.success else "❌ FAIL"
        stats = self.get_statistics()
        return f"{status} {self.test_name} ({self.duration:.2f}s, {stats.get('count', 0)} requests)"

class PerformanceTestRunner:
    def __init__(self):
        self.results: List[PerformanceTestResult] = []
        self.test_data = {}
        self.session = None
        self.auth_tokens = {}
        self.test_users = []
        
    async def __aenter__(self):
        self.session = httpx.AsyncClient(timeout=60.0)
        return self
        
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.aclose()

    async def run_performance_tests(self):
        """Run the complete performance test suite"""
        print("🚀 Starting Performance Test Suite")
        print("=" * 80)
        print(f"Timestamp: {datetime.now().isoformat()}")
        print()
        
        # Test phases
        await self.test_basic_performance()
        await self.test_concurrent_user_load()
        await self.test_realtime_data_throughput()
        await self.test_database_performance()
        await self.test_api_endpoint_performance()
        await self.test_websocket_performance()
        await self.test_memory_usage()
        await self.test_stress_testing()
        
        # Generate report
        self.generate_performance_test_report()

    async def test_basic_performance(self):
        """Test basic API performance"""
        print("⚡ Phase 1: Basic Performance")
        print("-" * 30)
        
        result = PerformanceTestResult("Basic Performance", "basic")
        start_time = time.time()
        
        try:
            # Test health endpoint
            health_start = time.time()
            health_response = await self.session.get(f"{SERVICES['backend']['url']}/health")
            health_time = time.time() - health_start
            
            result.add_request("GET", "/health", health_response.status_code, health_time)
            
            if health_response.status_code == 200:
                result.add_metric("health_response_time", health_time, "seconds")
                result.add_metric("health_status", 1, "success")
            else:
                result.add_metric("health_status", 0, "failed")
            
            # Test multiple endpoints
            endpoints = [
                "/matches",
                "/predictions", 
                "/users",
                "/agents"
            ]
            
            for endpoint in endpoints:
                endpoint_start = time.time()
                try:
                    response = await self.session.get(f"{SERVICES['backend']['url']}{endpoint}")
                    endpoint_time = time.time() - endpoint_start
                    result.add_request("GET", endpoint, response.status_code, endpoint_time)
                except Exception as e:
                    endpoint_time = time.time() - endpoint_start
                    result.add_request("GET", endpoint, 0, endpoint_time)
            
            # Calculate basic metrics
            stats = result.get_statistics()
            if stats:
                result.add_metric("avg_response_time", stats["mean"], "seconds")
                result.add_metric("max_response_time", stats["max"], "seconds")
                result.add_metric("min_response_time", stats["min"], "seconds")
                result.add_metric("response_time_std", stats["std_dev"], "seconds")
            
            result.success = True
            
        except Exception as e:
            result.error = str(e)
            
        result.duration = time.time() - start_time
        self.results.append(result)
        print(f"  {result}")

    async def test_concurrent_user_load(self):
        """Test system performance under concurrent user load"""
        print("👥 Phase 2: Concurrent User Load")
        print("-" * 35)
        
        result = PerformanceTestResult("Concurrent User Load", "concurrent")
        start_time = time.time()
        
        try:
            # Create test users
            user_count = 10
            concurrent_users = []
            
            for i in range(user_count):
                user_data = {
                    "username": f"perf_user_{uuid.uuid4().hex[:8]}",
                    "email": f"perf_user_{uuid.uuid4().hex[:8]}@example.com",
                    "password": "TestPassword123!",
                    "firstName": f"Perf{i}",
                    "lastName": "User"
                }
                
                # Register user
                register_response = await self.session.post(
                    f"{SERVICES['backend']['url']}/auth/register",
                    json=user_data
                )
                
                if register_response.status_code == 201:
                    # Login to get token
                    login_response = await self.session.post(
                        f"{SERVICES['backend']['url']}/auth/login",
                        json={
                            "username": user_data["username"],
                            "password": user_data["password"]
                        }
                    )
                    
                    if login_response.status_code == 200:
                        login_data = login_response.json()
                        concurrent_users.append({
                            "user": user_data,
                            "token": login_data.get('access_token'),
                            "session": httpx.AsyncClient(timeout=30.0)
                        })
            
            result.add_metric("users_created", len(concurrent_users), "users")
            
            if concurrent_users:
                # Test concurrent requests
                concurrent_requests = 50
                request_tasks = []
                
                for i in range(concurrent_requests):
                    user = concurrent_users[i % len(concurrent_users)]
                    
                    # Create different types of requests
                    if i % 3 == 0:
                        # GET request
                        task = user["session"].get(
                            f"{SERVICES['backend']['url']}/matches",
                            headers={"Authorization": f"Bearer {user['token']}"}
                        )
                    elif i % 3 == 1:
                        # POST request
                        task = user["session"].post(
                            f"{SERVICES['backend']['url']}/predictions",
                            json={
                                "matchId": "test_match",
                                "predictedHomeScore": 2,
                                "predictedAwayScore": 1,
                                "confidence": 0.8,
                                "betType": "MATCH_RESULT"
                            },
                            headers={"Authorization": f"Bearer {user['token']}"}
                        )
                    else:
                        # PUT request
                        task = user["session"].get(
                            f"{SERVICES['backend']['url']}/predictions",
                            headers={"Authorization": f"Bearer {user['token']}"}
                        )
                    
                    request_tasks.append(task)
                
                # Execute concurrent requests
                concurrent_start = time.time()
                responses = await asyncio.gather(*request_tasks, return_exceptions=True)
                concurrent_duration = time.time() - concurrent_start
                
                # Process results
                successful_requests = 0
                for i, response in enumerate(responses):
                    if isinstance(response, httpx.Response):
                        result.add_request(
                            "CONCURRENT", 
                            f"request_{i}", 
                            response.status_code, 
                            concurrent_duration / len(responses)
                        )
                        if response.status_code in [200, 201]:
                            successful_requests += 1
                    else:
                        result.add_request("CONCURRENT", f"request_{i}", 0, concurrent_duration / len(responses))
                
                result.add_metric("concurrent_requests", concurrent_requests, "requests")
                result.add_metric("successful_requests", successful_requests, "requests")
                result.add_metric("success_rate", (successful_requests / concurrent_requests) * 100, "percent")
                result.add_metric("concurrent_duration", concurrent_duration, "seconds")
                result.add_metric("requests_per_second", concurrent_requests / concurrent_duration, "req/s")
                
                # Cleanup user sessions
                for user in concurrent_users:
                    await user["session"].aclose()
            
            result.success = len(concurrent_users) > 0
            
        except Exception as e:
            result.error = str(e)
            
        result.duration = time.time() - start_time
        self.results.append(result)
        print(f"  {result}")

    async def test_realtime_data_throughput(self):
        """Test real-time data throughput"""
        print("📡 Phase 3: Real-time Data Throughput")
        print("-" * 40)
        
        result = PerformanceTestResult("Real-time Data Throughput", "realtime")
        start_time = time.time()
        
        try:
            # Test WebSocket connection performance
            ws_connections = 5
            ws_tasks = []
            
            for i in range(ws_connections):
                task = self.test_websocket_connection(i, result)
                ws_tasks.append(task)
            
            # Execute WebSocket tests concurrently
            ws_start = time.time()
            await asyncio.gather(*ws_tasks)
            ws_duration = time.time() - ws_start
            
            result.add_metric("websocket_connections", ws_connections, "connections")
            result.add_metric("websocket_duration", ws_duration, "seconds")
            
            # Test message throughput
            message_count = 100
            message_size = 1024  # 1KB messages
            
            # Create test messages
            test_messages = []
            for i in range(message_count):
                message = {
                    "type": "test_message",
                    "id": f"msg_{i}",
                    "timestamp": datetime.now().isoformat(),
                    "data": "x" * message_size,
                    "sequence": i
                }
                test_messages.append(message)
            
            # Test message sending performance
            message_start = time.time()
            
            # Connect to WebSocket
            ws = await websockets.connect(SERVICES['backend']['ws_url'])
            
            # Send messages
            for message in test_messages:
                await ws.send(json.dumps(message))
            
            message_duration = time.time() - message_start
            await ws.close()
            
            result.add_metric("messages_sent", message_count, "messages")
            result.add_metric("message_duration", message_duration, "seconds")
            result.add_metric("messages_per_second", message_count / message_duration, "msg/s")
            result.add_metric("message_size", message_size, "bytes")
            result.add_metric("total_data_sent", message_count * message_size, "bytes")
            result.add_metric("data_throughput", (message_count * message_size) / message_duration, "bytes/s")
            
            result.success = True
            
        except Exception as e:
            result.error = str(e)
            
        result.duration = time.time() - start_time
        self.results.append(result)
        print(f"  {result}")

    async def test_websocket_connection(self, connection_id: int, result: PerformanceTestResult):
        """Test individual WebSocket connection"""
        try:
            connection_start = time.time()
            ws = await websockets.connect(SERVICES['backend']['ws_url'])
            connection_time = time.time() - connection_start
            
            result.add_metric(f"ws_connection_{connection_id}_time", connection_time, "seconds")
            
            # Send subscription message
            subscribe_message = {
                "type": "subscribe",
                "channel": "match_updates",
                "data": {"connectionId": connection_id}
            }
            
            await ws.send(json.dumps(subscribe_message))
            
            # Wait for some messages
            messages_received = 0
            receive_start = time.time()
            
            try:
                async with asyncio.timeout(5):
                    while messages_received < 10:
                        message = await ws.recv()
                        messages_received += 1
            except asyncio.TimeoutError:
                pass
            
            receive_duration = time.time() - receive_start
            await ws.close()
            
            result.add_metric(f"ws_connection_{connection_id}_messages", messages_received, "messages")
            result.add_metric(f"ws_connection_{connection_id}_receive_time", receive_duration, "seconds")
            
        except Exception as e:
            result.add_metric(f"ws_connection_{connection_id}_error", 1, "error")

    async def test_database_performance(self):
        """Test database performance under load"""
        print("🗄️ Phase 4: Database Performance")
        print("-" * 35)
        
        result = PerformanceTestResult("Database Performance", "database")
        start_time = time.time()
        
        try:
            # Test database read performance
            read_operations = 100
            read_tasks = []
            
            for i in range(read_operations):
                task = self.session.get(f"{SERVICES['backend']['url']}/matches")
                read_tasks.append(task)
            
            read_start = time.time()
            read_responses = await asyncio.gather(*read_tasks, return_exceptions=True)
            read_duration = time.time() - read_start
            
            successful_reads = sum(1 for r in read_responses if isinstance(r, httpx.Response) and r.status_code == 200)
            result.add_metric("database_reads", read_operations, "operations")
            result.add_metric("successful_reads", successful_reads, "operations")
            result.add_metric("read_duration", read_duration, "seconds")
            result.add_metric("reads_per_second", read_operations / read_duration, "ops/s")
            
            # Test database write performance
            write_operations = 50
            write_tasks = []
            
            # Get a test user token
            if not self.auth_tokens:
                # Create a test user
                test_user = {
                    "username": f"db_test_{uuid.uuid4().hex[:8]}",
                    "email": f"db_test_{uuid.uuid4().hex[:8]}@example.com",
                    "password": "TestPassword123!",
                    "firstName": "DB",
                    "lastName": "Test"
                }
                
                await self.session.post(f"{SERVICES['backend']['url']}/auth/register", json=test_user)
                
                login_response = await self.session.post(
                    f"{SERVICES['backend']['url']}/auth/login",
                    json={"username": test_user["username"], "password": test_user["password"]}
                )
                
                if login_response.status_code == 200:
                    login_data = login_response.json()
                    self.auth_tokens['db_test'] = login_data.get('access_token')
            
            if 'db_test' in self.auth_tokens:
                # Get matches for predictions
                matches_response = await self.session.get(
                    f"{SERVICES['backend']['url']}/matches",
                    headers={"Authorization": f"Bearer {self.auth_tokens['db_test']}"}
                )
                
                if matches_response.status_code == 200:
                    matches = matches_response.json()
                    
                    if matches:
                        for i in range(write_operations):
                            prediction_data = {
                                "matchId": matches[0]['id'],
                                "predictedHomeScore": 1 + (i % 3),
                                "predictedAwayScore": i % 3,
                                "confidence": 0.7 + (i * 0.01),
                                "betType": "MATCH_RESULT",
                                "notes": f"DB performance test {i+1}"
                            }
                            
                            task = self.session.post(
                                f"{SERVICES['backend']['url']}/predictions",
                                json=prediction_data,
                                headers={"Authorization": f"Bearer {self.auth_tokens['db_test']}"}
                            )
                            write_tasks.append(task)
                        
                        write_start = time.time()
                        write_responses = await asyncio.gather(*write_tasks, return_exceptions=True)
                        write_duration = time.time() - write_start
                        
                        successful_writes = sum(1 for r in write_responses if isinstance(r, httpx.Response) and r.status_code == 201)
                        result.add_metric("database_writes", write_operations, "operations")
                        result.add_metric("successful_writes", successful_writes, "operations")
                        result.add_metric("write_duration", write_duration, "seconds")
                        result.add_metric("writes_per_second", write_operations / write_duration, "ops/s")
            
            # Test mixed read/write operations
            mixed_operations = 75
            mixed_tasks = []
            
            for i in range(mixed_operations):
                if i % 2 == 0:
                    # Read operation
                    task = self.session.get(f"{SERVICES['backend']['url']}/matches")
                else:
                    # Write operation (if we have auth)
                    if 'db_test' in self.auth_tokens and matches:
                        prediction_data = {
                            "matchId": matches[0]['id'],
                            "predictedHomeScore": 2,
                            "predictedAwayScore": 1,
                            "confidence": 0.8,
                            "betType": "MATCH_RESULT",
                            "notes": f"Mixed test {i+1}"
                        }
                        task = self.session.post(
                            f"{SERVICES['backend']['url']}/predictions",
                            json=prediction_data,
                            headers={"Authorization": f"Bearer {self.auth_tokens['db_test']}"}
                        )
                    else:
                        task = self.session.get(f"{SERVICES['backend']['url']}/matches")
                
                mixed_tasks.append(task)
            
            mixed_start = time.time()
            mixed_responses = await asyncio.gather(*mixed_tasks, return_exceptions=True)
            mixed_duration = time.time() - mixed_start
            
            successful_mixed = sum(1 for r in mixed_responses if isinstance(r, httpx.Response) and r.status_code in [200, 201])
            result.add_metric("mixed_operations", mixed_operations, "operations")
            result.add_metric("successful_mixed", successful_mixed, "operations")
            result.add_metric("mixed_duration", mixed_duration, "seconds")
            result.add_metric("mixed_ops_per_second", mixed_operations / mixed_duration, "ops/s")
            
            result.success = True
            
        except Exception as e:
            result.error = str(e)
            
        result.duration = time.time() - start_time
        self.results.append(result)
        print(f"  {result}")

    async def test_api_endpoint_performance(self):
        """Test specific API endpoint performance"""
        print("🔗 Phase 5: API Endpoint Performance")
        print("-" * 40)
        
        result = PerformanceTestResult("API Endpoint Performance", "api")
        start_time = time.time()
        
        try:
            # Test different API endpoints
            endpoints = [
                ("GET", "/health"),
                ("GET", "/matches"),
                ("GET", "/predictions"),
                ("GET", "/users"),
                ("GET", "/agents"),
                ("GET", "/live-data/matches/live"),
                ("GET", "/notifications")
            ]
            
            for method, endpoint in endpoints:
                # Test endpoint with multiple requests
                requests_per_endpoint = 20
                endpoint_tasks = []
                
                for i in range(requests_per_endpoint):
                    if method == "GET":
                        task = self.session.get(f"{SERVICES['backend']['url']}{endpoint}")
                    else:
                        task = self.session.post(f"{SERVICES['backend']['url']}{endpoint}")
                    
                    endpoint_tasks.append(task)
                
                endpoint_start = time.time()
                endpoint_responses = await asyncio.gather(*endpoint_tasks, return_exceptions=True)
                endpoint_duration = time.time() - endpoint_start
                
                successful_requests = sum(1 for r in endpoint_responses if isinstance(r, httpx.Response) and r.status_code in [200, 201])
                
                result.add_metric(f"{method}_{endpoint}_requests", requests_per_endpoint, "requests")
                result.add_metric(f"{method}_{endpoint}_successful", successful_requests, "requests")
                result.add_metric(f"{method}_{endpoint}_duration", endpoint_duration, "seconds")
                result.add_metric(f"{method}_{endpoint}_rps", requests_per_endpoint / endpoint_duration, "req/s")
                result.add_metric(f"{method}_{endpoint}_success_rate", (successful_requests / requests_per_endpoint) * 100, "percent")
            
            result.success = True
            
        except Exception as e:
            result.error = str(e)
            
        result.duration = time.time() - start_time
        self.results.append(result)
        print(f"  {result}")

    async def test_websocket_performance(self):
        """Test WebSocket performance"""
        print("🔌 Phase 6: WebSocket Performance")
        print("-" * 35)
        
        result = PerformanceTestResult("WebSocket Performance", "websocket")
        start_time = time.time()
        
        try:
            # Test WebSocket connection establishment
            connection_tests = 10
            connection_times = []
            
            for i in range(connection_tests):
                conn_start = time.time()
                try:
                    ws = await websockets.connect(SERVICES['backend']['ws_url'])
                    conn_time = time.time() - conn_start
                    connection_times.append(conn_time)
                    await ws.close()
                except Exception as e:
                    connection_times.append(float('inf'))
            
            avg_connection_time = statistics.mean([t for t in connection_times if t != float('inf')])
            result.add_metric("avg_connection_time", avg_connection_time, "seconds")
            result.add_metric("connection_success_rate", (len([t for t in connection_times if t != float('inf')]) / connection_tests) * 100, "percent")
            
            # Test message latency
            ws = await websockets.connect(SERVICES['backend']['ws_url'])
            
            # Subscribe to updates
            subscribe_message = {
                "type": "subscribe",
                "channel": "match_updates",
                "data": {}
            }
            
            await ws.send(json.dumps(subscribe_message))
            
            # Measure message round-trip time
            message_times = []
            for i in range(20):
                message = {
                    "type": "ping",
                    "id": f"ping_{i}",
                    "timestamp": datetime.now().isoformat()
                }
                
                send_start = time.time()
                await ws.send(json.dumps(message))
                
                try:
                    async with asyncio.timeout(2):
                        response = await ws.recv()
                        receive_time = time.time() - send_start
                        message_times.append(receive_time)
                except asyncio.TimeoutError:
                    pass
            
            await ws.close()
            
            if message_times:
                result.add_metric("avg_message_latency", statistics.mean(message_times), "seconds")
                result.add_metric("min_message_latency", min(message_times), "seconds")
                result.add_metric("max_message_latency", max(message_times), "seconds")
                result.add_metric("message_success_rate", (len(message_times) / 20) * 100, "percent")
            
            result.success = True
            
        except Exception as e:
            result.error = str(e)
            
        result.duration = time.time() - start_time
        self.results.append(result)
        print(f"  {result}")

    async def test_memory_usage(self):
        """Test memory usage under load"""
        print("🧠 Phase 7: Memory Usage")
        print("-" * 25)
        
        result = PerformanceTestResult("Memory Usage", "memory")
        start_time = time.time()
        
        try:
            # Test memory usage with large payloads
            large_payload_size = 1024 * 1024  # 1MB
            large_payload = "x" * large_payload_size
            
            # Send large payloads
            large_requests = 10
            large_tasks = []
            
            for i in range(large_requests):
                payload = {
                    "type": "large_payload",
                    "id": f"large_{i}",
                    "data": large_payload,
                    "timestamp": datetime.now().isoformat()
                }
                
                task = self.session.post(
                    f"{SERVICES['backend']['url']}/health",
                    json=payload
                )
                large_tasks.append(task)
            
            large_start = time.time()
            large_responses = await asyncio.gather(*large_tasks, return_exceptions=True)
            large_duration = time.time() - large_start
            
            successful_large = sum(1 for r in large_responses if isinstance(r, httpx.Response))
            result.add_metric("large_payload_size", large_payload_size, "bytes")
            result.add_metric("large_requests", large_requests, "requests")
            result.add_metric("large_successful", successful_large, "requests")
            result.add_metric("large_duration", large_duration, "seconds")
            result.add_metric("large_data_processed", large_payload_size * large_requests, "bytes")
            result.add_metric("large_throughput", (large_payload_size * large_requests) / large_duration, "bytes/s")
            
            # Test concurrent large requests
            concurrent_large = 5
            concurrent_tasks = []
            
            for i in range(concurrent_large):
                payload = {
                    "type": "concurrent_large",
                    "id": f"concurrent_{i}",
                    "data": "x" * (512 * 1024),  # 512KB
                    "timestamp": datetime.now().isoformat()
                }
                
                task = self.session.post(
                    f"{SERVICES['backend']['url']}/health",
                    json=payload
                )
                concurrent_tasks.append(task)
            
            concurrent_start = time.time()
            concurrent_responses = await asyncio.gather(*concurrent_tasks, return_exceptions=True)
            concurrent_duration = time.time() - concurrent_start
            
            successful_concurrent = sum(1 for r in concurrent_responses if isinstance(r, httpx.Response))
            result.add_metric("concurrent_large_requests", concurrent_large, "requests")
            result.add_metric("concurrent_successful", successful_concurrent, "requests")
            result.add_metric("concurrent_duration", concurrent_duration, "seconds")
            
            result.success = True
            
        except Exception as e:
            result.error = str(e)
            
        result.duration = time.time() - start_time
        self.results.append(result)
        print(f"  {result}")

    async def test_stress_testing(self):
        """Test system under stress conditions"""
        print("🔥 Phase 8: Stress Testing")
        print("-" * 30)
        
        result = PerformanceTestResult("Stress Testing", "stress")
        start_time = time.time()
        
        try:
            # Test with high concurrent load
            stress_requests = 200
            stress_tasks = []
            
            for i in range(stress_requests):
                # Mix different types of requests
                if i % 4 == 0:
                    task = self.session.get(f"{SERVICES['backend']['url']}/health")
                elif i % 4 == 1:
                    task = self.session.get(f"{SERVICES['backend']['url']}/matches")
                elif i % 4 == 2:
                    task = self.session.get(f"{SERVICES['backend']['url']}/predictions")
                else:
                    task = self.session.get(f"{SERVICES['backend']['url']}/agents")
                
                stress_tasks.append(task)
            
            stress_start = time.time()
            stress_responses = await asyncio.gather(*stress_tasks, return_exceptions=True)
            stress_duration = time.time() - stress_start
            
            successful_stress = sum(1 for r in stress_responses if isinstance(r, httpx.Response) and r.status_code in [200, 201])
            failed_stress = len(stress_responses) - successful_stress
            
            result.add_metric("stress_requests", stress_requests, "requests")
            result.add_metric("stress_successful", successful_stress, "requests")
            result.add_metric("stress_failed", failed_stress, "requests")
            result.add_metric("stress_duration", stress_duration, "seconds")
            result.add_metric("stress_rps", stress_requests / stress_duration, "req/s")
            result.add_metric("stress_success_rate", (successful_stress / stress_requests) * 100, "percent")
            
            # Test error handling under stress
            error_requests = 50
            error_tasks = []
            
            for i in range(error_requests):
                # Send invalid requests
                task = self.session.get(f"{SERVICES['backend']['url']}/invalid-endpoint-{i}")
                error_tasks.append(task)
            
            error_start = time.time()
            error_responses = await asyncio.gather(*error_tasks, return_exceptions=True)
            error_duration = time.time() - error_start
            
            expected_errors = sum(1 for r in error_responses if isinstance(r, httpx.Response) and r.status_code == 404)
            result.add_metric("error_requests", error_requests, "requests")
            result.add_metric("expected_errors", expected_errors, "errors")
            result.add_metric("error_duration", error_duration, "seconds")
            
            # Test recovery after stress
            recovery_start = time.time()
            recovery_response = await self.session.get(f"{SERVICES['backend']['url']}/health")
            recovery_time = time.time() - recovery_start
            
            result.add_metric("recovery_time", recovery_time, "seconds")
            result.add_metric("recovery_success", 1 if recovery_response.status_code == 200 else 0, "success")
            
            result.success = successful_stress >= stress_requests * 0.8  # At least 80% success rate
            
        except Exception as e:
            result.error = str(e)
            
        result.duration = time.time() - start_time
        self.results.append(result)
        print(f"  {result}")

    def generate_performance_test_report(self):
        """Generate comprehensive performance test report"""
        print("\n" + "=" * 80)
        print("📊 PERFORMANCE TEST REPORT")
        print("=" * 80)
        
        total_tests = len(self.results)
        passed_tests = sum(1 for r in self.results if r.success)
        failed_tests = total_tests - passed_tests
        
        print(f"Total Tests: {total_tests}")
        print(f"Passed: {passed_tests} ✅")
        print(f"Failed: {failed_tests} ❌")
        print(f"Success Rate: {(passed_tests/total_tests*100):.1f}%")
        print()
        
        # Calculate overall performance metrics
        total_requests = sum(len(r.requests) for r in self.results)
        all_response_times = []
        for r in self.results:
            all_response_times.extend(r.response_times)
        
        if all_response_times:
            overall_stats = {
                "total_requests": total_requests,
                "avg_response_time": statistics.mean(all_response_times),
                "median_response_time": statistics.median(all_response_times),
                "min_response_time": min(all_response_times),
                "max_response_time": max(all_response_times),
                "p95_response_time": sorted(all_response_times)[int(len(all_response_times) * 0.95)],
                "p99_response_time": sorted(all_response_times)[int(len(all_response_times) * 0.99)]
            }
            
            print("📈 OVERALL PERFORMANCE METRICS")
            print("-" * 35)
            print(f"Total Requests: {overall_stats['total_requests']}")
            print(f"Average Response Time: {overall_stats['avg_response_time']:.3f}s")
            print(f"Median Response Time: {overall_stats['median_response_time']:.3f}s")
            print(f"95th Percentile: {overall_stats['p95_response_time']:.3f}s")
            print(f"99th Percentile: {overall_stats['p99_response_time']:.3f}s")
            print(f"Min Response Time: {overall_stats['min_response_time']:.3f}s")
            print(f"Max Response Time: {overall_stats['max_response_time']:.3f}s")
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
                
                # Show key metrics for each test
                if result.metrics:
                    print("    Key Metrics:")
                    for metric_name, metric_data in result.metrics.items():
                        print(f"      {metric_name}: {metric_data['value']} {metric_data['unit']}")
                
                # Show statistics for each test
                stats = result.get_statistics()
                if stats:
                    print(f"    Response Times: avg={stats['mean']:.3f}s, p95={stats['p95']:.3f}s")
                print()
        
        # Performance recommendations
        print("💡 PERFORMANCE RECOMMENDATIONS")
        print("-" * 35)
        
        if all_response_times:
            avg_response = statistics.mean(all_response_times)
            if avg_response > 1.0:
                print("⚠️  Average response time is high (>1s). Consider optimizing database queries.")
            elif avg_response > 0.5:
                print("⚠️  Average response time is moderate (>0.5s). Consider adding caching.")
            else:
                print("✅ Response times are good (<0.5s).")
        
        # Summary
        print("\n🎯 SUMMARY")
        print("-" * 20)
        if failed_tests == 0:
            print("🎉 All performance tests passed! The system is performing well.")
        else:
            print(f"⚠️  {failed_tests} tests failed. Please review the performance issues above.")
        
        print(f"\nReport generated at: {datetime.now().isoformat()}")

async def main():
    """Main test runner"""
    async with PerformanceTestRunner() as runner:
        await runner.run_performance_tests()

if __name__ == "__main__":
    asyncio.run(main()) 