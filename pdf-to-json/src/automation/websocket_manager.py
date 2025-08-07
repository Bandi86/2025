"""
WebSocket Manager for real-time updates and event broadcasting.

This module provides comprehensive WebSocket support for:
- Real-time processing status updates
- Event broadcasting to multiple connected clients
- Connection management with proper cleanup and error handling
- Heartbeat mechanism to detect disconnected clients
- Authentication and authorization for WebSocket connections
"""

import asyncio
import json
import logging
import time
import uuid
from datetime import datetime, timezone, timedelta
from typing import Dict, List, Set, Optional, Any, Callable, Awaitable
from dataclasses import dataclass, field
from enum import Enum

from fastapi import WebSocket, WebSocketDisconnect, HTTPException, status
from fastapi.security import HTTPBearer
import jwt


class WebSocketEventType(Enum):
    """WebSocket event types."""
    # Connection events
    CONNECTION_ESTABLISHED = "connection_established"
    CONNECTION_CLOSED = "connection_closed"
    HEARTBEAT = "heartbeat"
    HEARTBEAT_RESPONSE = "heartbeat_response"
    
    # Processing events
    PROCESSING_STARTED = "processing_started"
    PROCESSING_PROGRESS = "processing_progress"
    PROCESSING_COMPLETED = "processing_completed"
    PROCESSING_FAILED = "processing_failed"
    
    # File events
    FILE_DETECTED = "file_detected"
    FILE_UPLOADED = "file_uploaded"
    DOWNLOAD_COMPLETED = "download_completed"
    
    # System events
    SYSTEM_STATUS_UPDATE = "system_status_update"
    SYSTEM_ERROR = "system_error"
    SYSTEM_ALERT = "system_alert"
    CONFIG_UPDATED = "config_updated"
    
    # Queue events
    QUEUE_STATUS_UPDATE = "queue_status_update"
    JOB_QUEUED = "job_queued"
    JOB_CANCELLED = "job_cancelled"
    
    # User events
    USER_NOTIFICATION = "user_notification"
    ERROR_NOTIFICATION = "error_notification"


@dataclass
class WebSocketConnection:
    """Represents a WebSocket connection with metadata."""
    websocket: WebSocket
    connection_id: str
    user_id: Optional[str] = None
    user_roles: List[str] = field(default_factory=list)
    connected_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    last_heartbeat: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    subscriptions: Set[str] = field(default_factory=set)
    is_authenticated: bool = False
    client_info: Dict[str, Any] = field(default_factory=dict)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert connection to dictionary representation."""
        return {
            'connection_id': self.connection_id,
            'user_id': self.user_id,
            'user_roles': self.user_roles,
            'connected_at': self.connected_at.isoformat(),
            'last_heartbeat': self.last_heartbeat.isoformat(),
            'subscriptions': list(self.subscriptions),
            'is_authenticated': self.is_authenticated,
            'client_info': self.client_info,
        }


@dataclass
class WebSocketMessage:
    """Represents a WebSocket message."""
    type: str
    data: Dict[str, Any]
    timestamp: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    message_id: str = field(default_factory=lambda: str(uuid.uuid4()))
    target_connections: Optional[List[str]] = None
    required_roles: Optional[List[str]] = None
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert message to dictionary representation."""
        return {
            'id': self.message_id,
            'type': self.type,
            'data': self.data,
            'timestamp': self.timestamp.isoformat(),
        }


class WebSocketManager:
    """
    Manages WebSocket connections and event broadcasting.
    
    Features:
    - Connection lifecycle management
    - Event broadcasting with filtering
    - Authentication and authorization
    - Heartbeat mechanism for connection health
    - Subscription-based event filtering
    - Message queuing for offline clients
    - Connection statistics and monitoring
    """
    
    def __init__(self, 
                 heartbeat_interval: int = 30,
                 heartbeat_timeout: int = 60,
                 max_connections: int = 1000,
                 jwt_secret: str = "your-secret-key",
                 jwt_algorithm: str = "HS256"):
        """
        Initialize the WebSocket manager.
        
        Args:
            heartbeat_interval: Interval between heartbeat checks (seconds)
            heartbeat_timeout: Timeout for heartbeat responses (seconds)
            max_connections: Maximum number of concurrent connections
            jwt_secret: JWT secret key for authentication
            jwt_algorithm: JWT algorithm for token verification
        """
        self.heartbeat_interval = heartbeat_interval
        self.heartbeat_timeout = heartbeat_timeout
        self.max_connections = max_connections
        self.jwt_secret = jwt_secret
        self.jwt_algorithm = jwt_algorithm
        
        # Connection management
        self.connections: Dict[str, WebSocketConnection] = {}
        self.user_connections: Dict[str, Set[str]] = {}  # user_id -> connection_ids
        
        # Event handling
        self.event_handlers: Dict[str, List[Callable]] = {}
        self.message_queue: Dict[str, List[WebSocketMessage]] = {}  # connection_id -> messages
        
        # Background tasks
        self.heartbeat_task: Optional[asyncio.Task] = None
        self.cleanup_task: Optional[asyncio.Task] = None
        self.running = False
        
        # Statistics
        self.stats = {
            'total_connections': 0,
            'messages_sent': 0,
            'messages_failed': 0,
            'heartbeats_sent': 0,
            'heartbeats_failed': 0,
            'connections_dropped': 0,
        }
        
        # Logging
        self.logger = logging.getLogger(__name__)
    
    async def start(self) -> None:
        """Start the WebSocket manager and background tasks."""
        if self.running:
            return
        
        self.running = True
        self.logger.info("Starting WebSocket manager")
        
        # Start background tasks
        self.heartbeat_task = asyncio.create_task(self._heartbeat_loop())
        self.cleanup_task = asyncio.create_task(self._cleanup_loop())
        
        self.logger.info("WebSocket manager started")
    
    async def stop(self) -> None:
        """Stop the WebSocket manager and close all connections."""
        if not self.running:
            return
        
        self.logger.info("Stopping WebSocket manager")
        self.running = False
        
        # Cancel background tasks
        if self.heartbeat_task:
            self.heartbeat_task.cancel()
        if self.cleanup_task:
            self.cleanup_task.cancel()
        
        # Close all connections
        connections_copy = list(self.connections.values())
        for connection in connections_copy:
            await self._close_connection(connection.connection_id, "Server shutdown")
        
        self.logger.info("WebSocket manager stopped")
    
    async def connect(self, websocket: WebSocket, 
                     token: Optional[str] = None,
                     client_info: Optional[Dict[str, Any]] = None) -> str:
        """
        Accept a new WebSocket connection.
        
        Args:
            websocket: WebSocket instance
            token: Optional JWT token for authentication
            client_info: Optional client information
            
        Returns:
            Connection ID
            
        Raises:
            HTTPException: If connection limit exceeded or authentication fails
        """
        # Check connection limit
        if len(self.connections) >= self.max_connections:
            await websocket.close(code=1008, reason="Connection limit exceeded")
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Connection limit exceeded"
            )
        
        # Accept the connection
        await websocket.accept()
        
        # Create connection object
        connection_id = str(uuid.uuid4())
        connection = WebSocketConnection(
            websocket=websocket,
            connection_id=connection_id,
            client_info=client_info or {}
        )
        
        # Authenticate if token provided
        if token:
            try:
                user_info = await self._authenticate_token(token)
                connection.user_id = user_info.get('user_id')
                connection.user_roles = user_info.get('roles', [])
                connection.is_authenticated = True
                
                # Track user connections
                if connection.user_id:
                    if connection.user_id not in self.user_connections:
                        self.user_connections[connection.user_id] = set()
                    self.user_connections[connection.user_id].add(connection_id)
                    
            except Exception as e:
                self.logger.warning(f"Authentication failed for connection {connection_id}: {e}")
                # Allow unauthenticated connections but with limited access
        
        # Store connection
        self.connections[connection_id] = connection
        self.stats['total_connections'] += 1
        
        # Send connection established message
        await self._send_to_connection(connection_id, WebSocketMessage(
            type=WebSocketEventType.CONNECTION_ESTABLISHED.value,
            data={
                'connection_id': connection_id,
                'authenticated': connection.is_authenticated,
                'user_id': connection.user_id,
                'server_time': datetime.now(timezone.utc).isoformat(),
                'heartbeat_interval': self.heartbeat_interval,
            }
        ))
        
        self.logger.info(f"WebSocket connection established: {connection_id} "
                        f"(authenticated: {connection.is_authenticated})")
        
        # Emit connection event
        await self._emit_event('connection_established', {
            'connection_id': connection_id,
            'user_id': connection.user_id,
            'authenticated': connection.is_authenticated,
        })
        
        return connection_id
    
    async def disconnect(self, connection_id: str, reason: str = "Client disconnect") -> None:
        """
        Handle WebSocket disconnection.
        
        Args:
            connection_id: Connection ID to disconnect
            reason: Reason for disconnection
        """
        await self._close_connection(connection_id, reason)
    
    async def send_message(self, message: WebSocketMessage) -> int:
        """
        Send a message to connections based on targeting criteria.
        
        Args:
            message: Message to send
            
        Returns:
            Number of connections the message was sent to
        """
        sent_count = 0
        target_connections = []
        
        # Determine target connections
        if message.target_connections:
            # Send to specific connections
            target_connections = [
                conn for conn_id, conn in self.connections.items()
                if conn_id in message.target_connections
            ]
        else:
            # Send to all connections (with role filtering)
            target_connections = list(self.connections.values())
        
        # Filter by required roles
        if message.required_roles:
            target_connections = [
                conn for conn in target_connections
                if conn.is_authenticated and any(role in conn.user_roles for role in message.required_roles)
            ]
        
        # Send to target connections
        for connection in target_connections:
            if await self._send_to_connection(connection.connection_id, message):
                sent_count += 1
        
        self.logger.debug(f"Sent message {message.message_id} to {sent_count} connections")
        return sent_count
    
    async def broadcast(self, event_type: str, data: Dict[str, Any], 
                      required_roles: Optional[List[str]] = None) -> int:
        """
        Broadcast an event to all connected clients.
        
        Args:
            event_type: Type of event to broadcast
            data: Event data
            required_roles: Optional list of required roles
            
        Returns:
            Number of connections the message was sent to
        """
        message = WebSocketMessage(
            type=event_type,
            data=data,
            required_roles=required_roles
        )
        return await self.send_message(message)
    
    async def send_to_user(self, user_id: str, event_type: str, data: Dict[str, Any]) -> int:
        """
        Send a message to all connections for a specific user.
        
        Args:
            user_id: Target user ID
            event_type: Type of event to send
            data: Event data
            
        Returns:
            Number of connections the message was sent to
        """
        if user_id not in self.user_connections:
            return 0
        
        message = WebSocketMessage(
            type=event_type,
            data=data,
            target_connections=list(self.user_connections[user_id])
        )
        return await self.send_message(message)
    
    async def subscribe(self, connection_id: str, event_types: List[str]) -> bool:
        """
        Subscribe a connection to specific event types.
        
        Args:
            connection_id: Connection ID
            event_types: List of event types to subscribe to
            
        Returns:
            True if subscription was successful
        """
        if connection_id not in self.connections:
            return False
        
        connection = self.connections[connection_id]
        connection.subscriptions.update(event_types)
        
        self.logger.debug(f"Connection {connection_id} subscribed to {event_types}")
        return True
    
    async def unsubscribe(self, connection_id: str, event_types: List[str]) -> bool:
        """
        Unsubscribe a connection from specific event types.
        
        Args:
            connection_id: Connection ID
            event_types: List of event types to unsubscribe from
            
        Returns:
            True if unsubscription was successful
        """
        if connection_id not in self.connections:
            return False
        
        connection = self.connections[connection_id]
        connection.subscriptions.difference_update(event_types)
        
        self.logger.debug(f"Connection {connection_id} unsubscribed from {event_types}")
        return True
    
    def get_connection_stats(self) -> Dict[str, Any]:
        """Get connection statistics."""
        active_connections = len(self.connections)
        authenticated_connections = sum(1 for conn in self.connections.values() if conn.is_authenticated)
        
        return {
            'active_connections': active_connections,
            'authenticated_connections': authenticated_connections,
            'total_connections': self.stats['total_connections'],
            'messages_sent': self.stats['messages_sent'],
            'messages_failed': self.stats['messages_failed'],
            'heartbeats_sent': self.stats['heartbeats_sent'],
            'heartbeats_failed': self.stats['heartbeats_failed'],
            'connections_dropped': self.stats['connections_dropped'],
            'unique_users': len(self.user_connections),
        }
    
    def get_connections(self) -> List[Dict[str, Any]]:
        """Get list of active connections."""
        return [conn.to_dict() for conn in self.connections.values()]
    
    def add_event_handler(self, event_type: str, handler: Callable[[Dict[str, Any]], Awaitable[None]]) -> None:
        """Add an event handler for WebSocket events."""
        if event_type not in self.event_handlers:
            self.event_handlers[event_type] = []
        self.event_handlers[event_type].append(handler)
    
    def remove_event_handler(self, event_type: str, handler: Callable) -> None:
        """Remove an event handler."""
        if event_type in self.event_handlers and handler in self.event_handlers[event_type]:
            self.event_handlers[event_type].remove(handler)
    
    async def handle_client_message(self, connection_id: str, message: Dict[str, Any]) -> None:
        """
        Handle incoming message from client.
        
        Args:
            connection_id: Connection ID that sent the message
            message: Message data from client
        """
        if connection_id not in self.connections:
            return
        
        connection = self.connections[connection_id]
        message_type = message.get('type')
        
        try:
            if message_type == 'heartbeat_response':
                # Update last heartbeat time
                connection.last_heartbeat = datetime.now(timezone.utc)
                self.logger.debug(f"Received heartbeat response from {connection_id}")
                
            elif message_type == 'subscribe':
                # Handle subscription request
                event_types = message.get('data', {}).get('event_types', [])
                success = await self.subscribe(connection_id, event_types)
                
                if success:
                    # Send confirmation
                    await self._send_to_connection(connection_id, WebSocketMessage(
                        type='subscription_confirmed',
                        data={'event_types': event_types}
                    ))
                
            elif message_type == 'unsubscribe':
                # Handle unsubscription request
                event_types = message.get('data', {}).get('event_types', [])
                await self.unsubscribe(connection_id, event_types)
                
                # Send confirmation
                await self._send_to_connection(connection_id, WebSocketMessage(
                    type='unsubscription_confirmed',
                    data={'event_types': event_types}
                ))
                
            elif message_type == 'authenticate':
                # Handle authentication request
                token = message.get('data', {}).get('token')
                if token:
                    try:
                        user_info = await self._authenticate_token(token)
                        connection.user_id = user_info.get('user_id')
                        connection.user_roles = user_info.get('roles', [])
                        connection.is_authenticated = True
                        
                        # Track user connections
                        if connection.user_id:
                            if connection.user_id not in self.user_connections:
                                self.user_connections[connection.user_id] = set()
                            self.user_connections[connection.user_id].add(connection_id)
                        
                        # Send success response
                        await self._send_to_connection(connection_id, WebSocketMessage(
                            type='authentication_success',
                            data={
                                'user_id': connection.user_id,
                                'roles': connection.user_roles
                            }
                        ))
                        
                    except Exception as e:
                        # Send error response
                        await self._send_to_connection(connection_id, WebSocketMessage(
                            type='authentication_error',
                            data={'error': str(e)}
                        ))
                
            else:
                # Emit custom event for other message types
                await self._emit_event('client_message', {
                    'connection_id': connection_id,
                    'user_id': connection.user_id,
                    'message': message
                })
                
        except Exception as e:
            self.logger.error(f"Error handling client message from {connection_id}: {e}")
            await self._send_to_connection(connection_id, WebSocketMessage(
                type='error',
                data={'error': 'Failed to process message'}
            ))
    
    async def _send_to_connection(self, connection_id: str, message: WebSocketMessage) -> bool:
        """
        Send a message to a specific connection.
        
        Args:
            connection_id: Target connection ID
            message: Message to send
            
        Returns:
            True if message was sent successfully
        """
        if connection_id not in self.connections:
            return False
        
        connection = self.connections[connection_id]
        
        # Check subscription filter - but allow system messages through
        system_messages = {
            'connection_established', 'subscription_confirmed', 'unsubscription_confirmed',
            'authentication_success', 'authentication_error', 'error', 'heartbeat'
        }
        
        if (connection.subscriptions and 
            message.type not in connection.subscriptions and 
            message.type not in system_messages):
            return False
        
        try:
            await connection.websocket.send_json(message.to_dict())
            self.stats['messages_sent'] += 1
            return True
            
        except Exception as e:
            self.logger.error(f"Failed to send message to connection {connection_id}: {e}")
            self.stats['messages_failed'] += 1
            
            # Connection is likely broken, close it
            await self._close_connection(connection_id, f"Send failed: {e}")
            return False
    
    async def _close_connection(self, connection_id: str, reason: str) -> None:
        """Close a WebSocket connection and clean up."""
        if connection_id not in self.connections:
            return
        
        connection = self.connections[connection_id]
        
        try:
            # Try to close the WebSocket gracefully
            await connection.websocket.close()
        except Exception as e:
            self.logger.debug(f"Error closing WebSocket for {connection_id}: {e}")
        
        # Clean up user connections mapping
        if connection.user_id and connection.user_id in self.user_connections:
            self.user_connections[connection.user_id].discard(connection_id)
            if not self.user_connections[connection.user_id]:
                del self.user_connections[connection.user_id]
        
        # Remove from connections
        del self.connections[connection_id]
        self.stats['connections_dropped'] += 1
        
        self.logger.info(f"WebSocket connection closed: {connection_id} - {reason}")
        
        # Emit disconnection event
        await self._emit_event('connection_closed', {
            'connection_id': connection_id,
            'user_id': connection.user_id,
            'reason': reason,
        })
    
    async def _authenticate_token(self, token: str) -> Dict[str, Any]:
        """
        Authenticate a JWT token.
        
        Args:
            token: JWT token to authenticate
            
        Returns:
            User information from token
            
        Raises:
            Exception: If token is invalid
        """
        try:
            payload = jwt.decode(token, self.jwt_secret, algorithms=[self.jwt_algorithm])
            return {
                'user_id': payload.get('sub'),
                'roles': payload.get('roles', []),
                'exp': payload.get('exp'),
            }
        except jwt.ExpiredSignatureError:
            raise Exception("Token has expired")
        except jwt.InvalidTokenError:
            raise Exception("Invalid token")
    
    async def _heartbeat_loop(self) -> None:
        """Background task for sending heartbeats and checking connection health."""
        while self.running:
            try:
                await asyncio.sleep(self.heartbeat_interval)
                
                if not self.running:
                    break
                
                current_time = datetime.now(timezone.utc)
                timeout_threshold = current_time - timedelta(seconds=self.heartbeat_timeout)
                
                # Check for timed out connections
                timed_out_connections = []
                for connection_id, connection in self.connections.items():
                    if connection.last_heartbeat < timeout_threshold:
                        timed_out_connections.append(connection_id)
                
                # Close timed out connections
                for connection_id in timed_out_connections:
                    await self._close_connection(connection_id, "Heartbeat timeout")
                
                # Send heartbeat to remaining connections
                heartbeat_message = WebSocketMessage(
                    type=WebSocketEventType.HEARTBEAT.value,
                    data={
                        'timestamp': current_time.isoformat(),
                        'server_time': current_time.isoformat(),
                    }
                )
                
                sent_count = 0
                failed_count = 0
                
                for connection_id in list(self.connections.keys()):
                    if await self._send_to_connection(connection_id, heartbeat_message):
                        sent_count += 1
                    else:
                        failed_count += 1
                
                self.stats['heartbeats_sent'] += sent_count
                self.stats['heartbeats_failed'] += failed_count
                
                if sent_count > 0:
                    self.logger.debug(f"Sent heartbeat to {sent_count} connections")
                
            except asyncio.CancelledError:
                break
            except Exception as e:
                self.logger.error(f"Heartbeat loop error: {e}")
    
    async def _cleanup_loop(self) -> None:
        """Background task for periodic cleanup."""
        while self.running:
            try:
                await asyncio.sleep(300)  # Run every 5 minutes
                
                if not self.running:
                    break
                
                # Clean up message queues for disconnected connections
                active_connection_ids = set(self.connections.keys())
                queued_connection_ids = set(self.message_queue.keys())
                
                for connection_id in queued_connection_ids - active_connection_ids:
                    del self.message_queue[connection_id]
                
                # Clean up empty user connection sets
                empty_users = [
                    user_id for user_id, conn_ids in self.user_connections.items()
                    if not conn_ids
                ]
                for user_id in empty_users:
                    del self.user_connections[user_id]
                
                self.logger.debug("Completed periodic cleanup")
                
            except asyncio.CancelledError:
                break
            except Exception as e:
                self.logger.error(f"Cleanup loop error: {e}")
    
    async def _emit_event(self, event_type: str, data: Dict[str, Any]) -> None:
        """Emit an event to registered handlers."""
        if event_type in self.event_handlers:
            for handler in self.event_handlers[event_type]:
                try:
                    await handler(data)
                except Exception as e:
                    self.logger.error(f"Event handler error for {event_type}: {e}")