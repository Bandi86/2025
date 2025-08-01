#!/usr/bin/env python3
"""
WebSocket Real-time Testing for TippMixMentor
Tests live match updates, agent performance updates, and user presence and notifications.
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
from typing import Dict, Any, List, Optional, Set
import subprocess
import signal

# Configuration
SERVICES = {
    "backend": {
        "url": "http://localhost:3001",
        "ws_url": "ws://localhost:3001/ws",
        "health_endpoint": "/health",
        "name": "Backend API"
    },
    "agent_os": {
        "url": "http://localhost:8001",
        "ws_url": "ws://localhost:8001/ws",
        "health_endpoint": "/health",
        "name": "Agent OS"
    }
}

class WebSocketTestResult:
    def __init__(self, test_name: str, category: str = "websocket"):
        self.test_name = test_name
        self.category = category
        self.success = False
        self.error = None
        self.duration = 0
        self.data = None
        self.timestamp = datetime.now()
        self.messages_received = []
        self.connection_events = []

    def add_message(self, message_type: str, data: Any, timestamp: datetime = None):
        self.messages_received.append({
            "type": message_type,
            "data": data,
            "timestamp": timestamp or datetime.now()
        })

    def add_connection_event(self, event: str, details: str = ""):
        self.connection_events.append({
            "event": event,
            "details": details,
            "timestamp": datetime.now()
        })

    def __str__(self):
        status = "✅ PASS" if self.success else "❌ FAIL"
        return f"{status} {self.test_name} ({self.duration:.2f}s, {len(self.messages_received)} messages)"

class WebSocketTestRunner:
    def __init__(self):
        self.results: List[WebSocketTestResult] = []
        self.test_data = {}
        self.session = None
        self.websockets = {}
        self.auth_tokens = {}
        self.active_connections = set()
        
    async def __aenter__(self):
        self.session = httpx.AsyncClient(timeout=30.0)
        return self
        
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.aclose()
        
        # Close all WebSocket connections
        for ws in self.websockets.values():
            if ws:
                await ws.close()

    async def run_websocket_tests(self):
        """Run the complete WebSocket real-time test suite"""
        print("🚀 Starting WebSocket Real-time Test Suite")
        print("=" * 80)
        print(f"Timestamp: {datetime.now().isoformat()}")
        print()
        
        # Test phases
        await self.test_websocket_connectivity()
        await self.test_live_match_updates()
        await self.test_agent_performance_updates()
        await self.test_user_presence_system()
        await self.test_notification_broadcasting()
        await self.test_multi_client_scenarios()
        await self.test_connection_reliability()
        await self.test_message_throughput()
        
        # Generate report
        self.generate_websocket_test_report()

    async def test_websocket_connectivity(self):
        """Test basic WebSocket connectivity"""
        print("🔌 Phase 1: WebSocket Connectivity")
        print("-" * 40)
        
        result = WebSocketTestResult("WebSocket Connectivity", "connectivity")
        start_time = time.time()
        
        try:
            # Test Backend WebSocket
            result.add_connection_event("Attempting backend connection", f"Connecting to {SERVICES['backend']['ws_url']}")
            
            backend_ws = await websockets.connect(SERVICES['backend']['ws_url'])
            self.websockets['backend'] = backend_ws
            self.active_connections.add('backend')
            
            result.add_connection_event("Backend connected", "Successfully connected to backend WebSocket")
            
            # Test Agent OS WebSocket
            result.add_connection_event("Attempting agent-os connection", f"Connecting to {SERVICES['agent_os']['ws_url']}")
            
            try:
                agent_ws = await websockets.connect(SERVICES['agent_os']['ws_url'])
                self.websockets['agent_os'] = agent_ws
                self.active_connections.add('agent_os')
                result.add_connection_event("Agent OS connected", "Successfully connected to agent OS WebSocket")
            except Exception as e:
                result.add_connection_event("Agent OS connection failed", f"Agent OS WebSocket not available: {str(e)}")
            
            # Test ping/pong
            await backend_ws.ping()
            result.add_connection_event("Ping test", "Ping sent successfully")
            
            # Test connection health
            if backend_ws.open:
                result.add_connection_event("Connection health", "WebSocket connection is healthy")
            else:
                result.add_connection_event("Connection health", "WebSocket connection is closed")
            
            result.success = True
            
        except Exception as e:
            result.error = str(e)
            result.add_connection_event("Connection error", str(e))
            
        result.duration = time.time() - start_time
        self.results.append(result)
        print(f"  {result}")

    async def test_live_match_updates(self):
        """Test live match updates via WebSocket"""
        print("⚽ Phase 2: Live Match Updates")
        print("-" * 35)
        
        result = WebSocketTestResult("Live Match Updates", "match_updates")
        start_time = time.time()
        
        try:
            if 'backend' not in self.websockets:
                result.add_connection_event("Connection check", "No backend WebSocket connection")
                raise Exception("Backend WebSocket connection required")
            
            ws = self.websockets['backend']
            
            # Subscribe to match updates
            subscribe_message = {
                "type": "subscribe",
                "channel": "match_updates",
                "data": {
                    "userId": "test_user",
                    "filters": {
                        "live_only": True,
                        "leagues": ["all"]
                    }
                }
            }
            
            await ws.send(json.dumps(subscribe_message))
            result.add_message("subscribe", subscribe_message)
            
            # Wait for subscription confirmation
            try:
                async with asyncio.timeout(5):
                    message = await ws.recv()
                    data = json.loads(message)
                    
                    if data.get('type') == 'subscription_confirmed':
                        result.add_message("subscription_confirmed", data)
                    else:
                        result.add_message("unexpected_message", data)
                        
            except asyncio.TimeoutError:
                result.add_message("timeout", "No subscription confirmation received")
            
            # Wait for match updates
            updates_received = 0
            timeout = 15  # seconds
            
            try:
                async with asyncio.timeout(timeout):
                    while updates_received < 5:  # Wait for at least 5 updates
                        message = await ws.recv()
                        data = json.loads(message)
                        
                        if data.get('type') == 'match_update':
                            updates_received += 1
                            result.add_message(f"match_update_{updates_received}", {
                                "matchId": data.get('data', {}).get('matchId'),
                                "homeScore": data.get('data', {}).get('homeScore'),
                                "awayScore": data.get('data', {}).get('awayScore'),
                                "status": data.get('data', {}).get('status')
                            })
                        
                        if updates_received >= 5:
                            break
                            
            except asyncio.TimeoutError:
                result.add_message("timeout", f"Timeout after {timeout}s, received {updates_received} updates")
            
            # Test specific match subscription
            specific_match_subscribe = {
                "type": "subscribe",
                "channel": "match_updates",
                "data": {
                    "matchId": "test_match_123",
                    "userId": "test_user"
                }
            }
            
            await ws.send(json.dumps(specific_match_subscribe))
            result.add_message("specific_match_subscribe", specific_match_subscribe)
            
            result.success = updates_received > 0
            
        except Exception as e:
            result.error = str(e)
            result.add_message("error", str(e))
            
        result.duration = time.time() - start_time
        self.results.append(result)
        print(f"  {result}")

    async def test_agent_performance_updates(self):
        """Test agent performance updates via WebSocket"""
        print("🤖 Phase 3: Agent Performance Updates")
        print("-" * 45)
        
        result = WebSocketTestResult("Agent Performance Updates", "agent_updates")
        start_time = time.time()
        
        try:
            if 'backend' not in self.websockets:
                result.add_connection_event("Connection check", "No backend WebSocket connection")
                raise Exception("Backend WebSocket connection required")
            
            ws = self.websockets['backend']
            
            # Subscribe to agent updates
            subscribe_message = {
                "type": "subscribe",
                "channel": "agent_updates",
                "data": {
                    "userId": "test_user",
                    "agentIds": ["all"]
                }
            }
            
            await ws.send(json.dumps(subscribe_message))
            result.add_message("subscribe", subscribe_message)
            
            # Wait for agent performance updates
            updates_received = 0
            timeout = 10  # seconds
            
            try:
                async with asyncio.timeout(timeout):
                    while updates_received < 3:  # Wait for at least 3 updates
                        message = await ws.recv()
                        data = json.loads(message)
                        
                        if data.get('type') == 'agent_performance_update':
                            updates_received += 1
                            result.add_message(f"agent_update_{updates_received}", {
                                "agentId": data.get('data', {}).get('agentId'),
                                "performance": data.get('data', {}).get('performance'),
                                "status": data.get('data', {}).get('status'),
                                "timestamp": data.get('data', {}).get('timestamp')
                            })
                        elif data.get('type') == 'agent_task_update':
                            updates_received += 1
                            result.add_message(f"agent_task_{updates_received}", {
                                "agentId": data.get('data', {}).get('agentId'),
                                "taskId": data.get('data', {}).get('taskId'),
                                "status": data.get('data', {}).get('status')
                            })
                        
                        if updates_received >= 3:
                            break
                            
            except asyncio.TimeoutError:
                result.add_message("timeout", f"Timeout after {timeout}s, received {updates_received} updates")
            
            # Test agent OS direct connection if available
            if 'agent_os' in self.websockets:
                agent_ws = self.websockets['agent_os']
                
                # Subscribe to agent OS events
                agent_subscribe = {
                    "type": "subscribe",
                    "channel": "agent_events",
                    "data": {}
                }
                
                await agent_ws.send(json.dumps(agent_subscribe))
                result.add_message("agent_os_subscribe", agent_subscribe)
                
                # Wait for agent OS events
                try:
                    async with asyncio.timeout(5):
                        message = await agent_ws.recv()
                        data = json.loads(message)
                        result.add_message("agent_os_event", data)
                        
                except asyncio.TimeoutError:
                    result.add_message("agent_os_timeout", "No agent OS events received")
            
            result.success = updates_received > 0
            
        except Exception as e:
            result.error = str(e)
            result.add_message("error", str(e))
            
        result.duration = time.time() - start_time
        self.results.append(result)
        print(f"  {result}")

    async def test_user_presence_system(self):
        """Test user presence and online status"""
        print("👥 Phase 4: User Presence System")
        print("-" * 35)
        
        result = WebSocketTestResult("User Presence System", "presence")
        start_time = time.time()
        
        try:
            if 'backend' not in self.websockets:
                result.add_connection_event("Connection check", "No backend WebSocket connection")
                raise Exception("Backend WebSocket connection required")
            
            ws = self.websockets['backend']
            
            # Send user presence update
            presence_message = {
                "type": "user_presence",
                "data": {
                    "userId": "test_user_123",
                    "status": "online",
                    "lastSeen": datetime.now().isoformat(),
                    "userAgent": "WebSocket Test Client"
                }
            }
            
            await ws.send(json.dumps(presence_message))
            result.add_message("presence_update", presence_message)
            
            # Subscribe to presence updates
            subscribe_message = {
                "type": "subscribe",
                "channel": "user_presence",
                "data": {
                    "userId": "test_user_123"
                }
            }
            
            await ws.send(json.dumps(subscribe_message))
            result.add_message("presence_subscribe", subscribe_message)
            
            # Wait for presence confirmations
            confirmations_received = 0
            timeout = 10  # seconds
            
            try:
                async with asyncio.timeout(timeout):
                    while confirmations_received < 2:  # Wait for presence confirmations
                        message = await ws.recv()
                        data = json.loads(message)
                        
                        if data.get('type') == 'presence_confirmed':
                            confirmations_received += 1
                            result.add_message(f"presence_confirmed_{confirmations_received}", data)
                        elif data.get('type') == 'user_online':
                            confirmations_received += 1
                            result.add_message(f"user_online_{confirmations_received}", data)
                        
                        if confirmations_received >= 2:
                            break
                            
            except asyncio.TimeoutError:
                result.add_message("timeout", f"Timeout after {timeout}s, received {confirmations_received} confirmations")
            
            # Test user away status
            away_message = {
                "type": "user_presence",
                "data": {
                    "userId": "test_user_123",
                    "status": "away",
                    "lastSeen": datetime.now().isoformat()
                }
            }
            
            await ws.send(json.dumps(away_message))
            result.add_message("away_update", away_message)
            
            result.success = confirmations_received > 0
            
        except Exception as e:
            result.error = str(e)
            result.add_message("error", str(e))
            
        result.duration = time.time() - start_time
        self.results.append(result)
        print(f"  {result}")

    async def test_notification_broadcasting(self):
        """Test notification broadcasting system"""
        print("🔔 Phase 5: Notification Broadcasting")
        print("-" * 45)
        
        result = WebSocketTestResult("Notification Broadcasting", "notifications")
        start_time = time.time()
        
        try:
            if 'backend' not in self.websockets:
                result.add_connection_event("Connection check", "No backend WebSocket connection")
                raise Exception("Backend WebSocket connection required")
            
            ws = self.websockets['backend']
            
            # Subscribe to notifications
            subscribe_message = {
                "type": "subscribe",
                "channel": "notifications",
                "data": {
                    "userId": "test_user_123",
                    "types": ["match_result", "prediction_alert", "system_alert"]
                }
            }
            
            await ws.send(json.dumps(subscribe_message))
            result.add_message("notification_subscribe", subscribe_message)
            
            # Wait for notifications
            notifications_received = 0
            timeout = 10  # seconds
            
            try:
                async with asyncio.timeout(timeout):
                    while notifications_received < 3:  # Wait for notifications
                        message = await ws.recv()
                        data = json.loads(message)
                        
                        if data.get('type') == 'notification':
                            notifications_received += 1
                            result.add_message(f"notification_{notifications_received}", {
                                "notificationId": data.get('data', {}).get('id'),
                                "type": data.get('data', {}).get('type'),
                                "message": data.get('data', {}).get('message'),
                                "priority": data.get('data', {}).get('priority')
                            })
                        elif data.get('type') == 'broadcast':
                            notifications_received += 1
                            result.add_message(f"broadcast_{notifications_received}", {
                                "broadcastId": data.get('data', {}).get('id'),
                                "message": data.get('data', {}).get('message'),
                                "target": data.get('data', {}).get('target')
                            })
                        
                        if notifications_received >= 3:
                            break
                            
            except asyncio.TimeoutError:
                result.add_message("timeout", f"Timeout after {timeout}s, received {notifications_received} notifications")
            
            # Test notification acknowledgment
            if notifications_received > 0:
                ack_message = {
                    "type": "notification_ack",
                    "data": {
                        "userId": "test_user_123",
                        "notificationIds": ["test_notification_1"]
                    }
                }
                
                await ws.send(json.dumps(ack_message))
                result.add_message("notification_ack", ack_message)
            
            result.success = notifications_received > 0
            
        except Exception as e:
            result.error = str(e)
            result.add_message("error", str(e))
            
        result.duration = time.time() - start_time
        self.results.append(result)
        print(f"  {result}")

    async def test_multi_client_scenarios(self):
        """Test multiple client scenarios"""
        print("👥 Phase 6: Multi-Client Scenarios")
        print("-" * 40)
        
        result = WebSocketTestResult("Multi-Client Scenarios", "multi_client")
        start_time = time.time()
        
        try:
            # Create multiple WebSocket connections
            clients = []
            client_count = 3
            
            for i in range(client_count):
                try:
                    ws = await websockets.connect(SERVICES['backend']['ws_url'])
                    clients.append({
                        "id": f"client_{i}",
                        "ws": ws,
                        "messages": []
                    })
                    result.add_message("client_connected", f"Client {i} connected")
                except Exception as e:
                    result.add_message("client_connection_failed", f"Client {i} failed: {str(e)}")
            
            if not clients:
                raise Exception("No clients could connect")
            
            # Subscribe all clients to match updates
            for client in clients:
                subscribe_message = {
                    "type": "subscribe",
                    "channel": "match_updates",
                    "data": {
                        "userId": client["id"],
                        "clientId": client["id"]
                    }
                }
                
                await client["ws"].send(json.dumps(subscribe_message))
                result.add_message(f"client_subscribe_{client['id']}", subscribe_message)
            
            # Wait for messages on all clients
            messages_received = 0
            timeout = 10  # seconds
            
            try:
                async with asyncio.timeout(timeout):
                    while messages_received < client_count * 2:  # Wait for at least 2 messages per client
                        # Check all clients for messages
                        for client in clients:
                            try:
                                message = await asyncio.wait_for(client["ws"].recv(), timeout=0.1)
                                data = json.loads(message)
                                client["messages"].append(data)
                                messages_received += 1
                                result.add_message(f"client_message_{client['id']}", {
                                    "messageType": data.get('type'),
                                    "messageCount": len(client["messages"])
                                })
                            except asyncio.TimeoutError:
                                continue  # No message from this client
                        
                        if messages_received >= client_count * 2:
                            break
                            
            except asyncio.TimeoutError:
                result.add_message("timeout", f"Timeout after {timeout}s, received {messages_received} messages across {len(clients)} clients")
            
            # Test client-to-client communication
            if len(clients) >= 2:
                broadcast_message = {
                    "type": "client_broadcast",
                    "data": {
                        "fromClient": clients[0]["id"],
                        "message": "Hello from client 0",
                        "targetClients": [clients[1]["id"]]
                    }
                }
                
                await clients[0]["ws"].send(json.dumps(broadcast_message))
                result.add_message("client_broadcast", broadcast_message)
            
            # Close all client connections
            for client in clients:
                await client["ws"].close()
                result.add_message(f"client_disconnected_{client['id']}", "Client disconnected")
            
            result.success = messages_received > 0
            
        except Exception as e:
            result.error = str(e)
            result.add_message("error", str(e))
            
        result.duration = time.time() - start_time
        self.results.append(result)
        print(f"  {result}")

    async def test_connection_reliability(self):
        """Test connection reliability and reconnection"""
        print("🔄 Phase 7: Connection Reliability")
        print("-" * 40)
        
        result = WebSocketTestResult("Connection Reliability", "reliability")
        start_time = time.time()
        
        try:
            # Test connection stability
            ws = await websockets.connect(SERVICES['backend']['ws_url'])
            result.add_connection_event("initial_connection", "Connected successfully")
            
            # Send periodic pings
            ping_count = 0
            max_pings = 5
            
            for i in range(max_pings):
                try:
                    await ws.ping()
                    ping_count += 1
                    result.add_connection_event(f"ping_{i+1}", "Ping successful")
                    await asyncio.sleep(1)  # Wait 1 second between pings
                except Exception as e:
                    result.add_connection_event(f"ping_failed_{i+1}", str(e))
            
            # Test reconnection after disconnect
            await ws.close()
            result.add_connection_event("disconnect", "Connection closed")
            
            await asyncio.sleep(1)  # Wait before reconnecting
            
            try:
                ws = await websockets.connect(SERVICES['backend']['ws_url'])
                result.add_connection_event("reconnection", "Reconnected successfully")
                
                # Test functionality after reconnection
                subscribe_message = {
                    "type": "subscribe",
                    "channel": "match_updates",
                    "data": {}
                }
                
                await ws.send(json.dumps(subscribe_message))
                result.add_message("post_reconnect_subscribe", subscribe_message)
                
                # Wait for response
                try:
                    async with asyncio.timeout(5):
                        message = await ws.recv()
                        data = json.loads(message)
                        result.add_message("post_reconnect_response", data)
                except asyncio.TimeoutError:
                    result.add_message("post_reconnect_timeout", "No response after reconnection")
                
                await ws.close()
                
            except Exception as e:
                result.add_connection_event("reconnection_failed", str(e))
            
            result.success = ping_count >= 3  # At least 3 successful pings
            
        except Exception as e:
            result.error = str(e)
            result.add_connection_event("error", str(e))
            
        result.duration = time.time() - start_time
        self.results.append(result)
        print(f"  {result}")

    async def test_message_throughput(self):
        """Test message throughput and performance"""
        print("📊 Phase 8: Message Throughput")
        print("-" * 35)
        
        result = WebSocketTestResult("Message Throughput", "performance")
        start_time = time.time()
        
        try:
            ws = await websockets.connect(SERVICES['backend']['ws_url'])
            result.add_connection_event("connection", "Connected for throughput test")
            
            # Send multiple messages rapidly
            message_count = 50
            sent_messages = 0
            received_messages = 0
            
            # Subscribe first
            subscribe_message = {
                "type": "subscribe",
                "channel": "match_updates",
                "data": {}
            }
            
            await ws.send(json.dumps(subscribe_message))
            
            # Send rapid messages
            send_start = time.time()
            for i in range(message_count):
                test_message = {
                    "type": "test_message",
                    "data": {
                        "messageId": f"msg_{i}",
                        "timestamp": datetime.now().isoformat(),
                        "payload": f"Test message {i}"
                    }
                }
                
                try:
                    await ws.send(json.dumps(test_message))
                    sent_messages += 1
                except Exception as e:
                    result.add_message(f"send_error_{i}", str(e))
            
            send_duration = time.time() - send_start
            result.add_message("send_performance", {
                "messages_sent": sent_messages,
                "send_duration": send_duration,
                "messages_per_second": sent_messages / send_duration if send_duration > 0 else 0
            })
            
            # Receive messages
            receive_start = time.time()
            timeout = 10  # seconds
            
            try:
                async with asyncio.timeout(timeout):
                    while received_messages < message_count:
                        message = await ws.recv()
                        data = json.loads(message)
                        received_messages += 1
                        
                        if received_messages % 10 == 0:  # Log every 10th message
                            result.add_message(f"received_batch_{received_messages//10}", {
                                "messages_received": received_messages,
                                "message_type": data.get('type')
                            })
                        
                        if received_messages >= message_count:
                            break
                            
            except asyncio.TimeoutError:
                result.add_message("receive_timeout", f"Timeout after {timeout}s, received {received_messages} messages")
            
            receive_duration = time.time() - receive_start
            result.add_message("receive_performance", {
                "messages_received": received_messages,
                "receive_duration": receive_duration,
                "messages_per_second": received_messages / receive_duration if receive_duration > 0 else 0
            })
            
            await ws.close()
            
            # Calculate throughput metrics
            total_duration = time.time() - start_time
            throughput = (sent_messages + received_messages) / total_duration if total_duration > 0 else 0
            
            result.add_message("throughput_summary", {
                "total_messages": sent_messages + received_messages,
                "total_duration": total_duration,
                "overall_throughput": throughput,
                "success_rate": (received_messages / sent_messages * 100) if sent_messages > 0 else 0
            })
            
            result.success = received_messages >= message_count * 0.8  # At least 80% success rate
            
        except Exception as e:
            result.error = str(e)
            result.add_message("error", str(e))
            
        result.duration = time.time() - start_time
        self.results.append(result)
        print(f"  {result}")

    def generate_websocket_test_report(self):
        """Generate comprehensive WebSocket test report"""
        print("\n" + "=" * 80)
        print("📊 WEBSOCKET REAL-TIME TEST REPORT")
        print("=" * 80)
        
        total_tests = len(self.results)
        passed_tests = sum(1 for r in self.results if r.success)
        failed_tests = total_tests - passed_tests
        
        print(f"Total Tests: {total_tests}")
        print(f"Passed: {passed_tests} ✅")
        print(f"Failed: {failed_tests} ❌")
        print(f"Success Rate: {(passed_tests/total_tests*100):.1f}%")
        print()
        
        # Calculate message statistics
        total_messages = sum(len(r.messages_received) for r in self.results)
        total_connections = sum(len(r.connection_events) for r in self.results)
        
        print(f"Total Messages Processed: {total_messages}")
        print(f"Total Connection Events: {total_connections}")
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
                
                # Show message statistics for each test
                if result.messages_received:
                    print(f"    Messages: {len(result.messages_received)}")
                    message_types = {}
                    for msg in result.messages_received:
                        msg_type = msg['type']
                        message_types[msg_type] = message_types.get(msg_type, 0) + 1
                    
                    for msg_type, count in message_types.items():
                        print(f"      {msg_type}: {count}")
                print()
        
        # Performance summary
        print("🚀 PERFORMANCE SUMMARY")
        print("-" * 25)
        
        avg_duration = sum(r.duration for r in self.results) / len(self.results) if self.results else 0
        print(f"Average Test Duration: {avg_duration:.2f}s")
        print(f"Message Throughput: {total_messages / avg_duration:.1f} messages/second" if avg_duration > 0 else "N/A")
        
        # Summary
        print("\n🎯 SUMMARY")
        print("-" * 20)
        if failed_tests == 0:
            print("🎉 All WebSocket tests passed! Real-time communication is working perfectly.")
        else:
            print(f"⚠️  {failed_tests} tests failed. Please review the issues above.")
        
        print(f"\nReport generated at: {datetime.now().isoformat()}")

async def main():
    """Main test runner"""
    async with WebSocketTestRunner() as runner:
        await runner.run_websocket_tests()

if __name__ == "__main__":
    asyncio.run(main()) 