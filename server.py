#!/usr/bin/env python3
import asyncio
import json
import logging
import os
import time
from datetime import datetime
from typing import Dict, List, Optional, Set, Union

import uvicorn
from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

# Set up logging
logging.basicConfig(
    format="%(asctime)s %(levelname)s: %(message)s",
    level=logging.INFO,
)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="Real-time Dashboard API",
    description="API for sending and receiving real-time updates to the dashboard",
    version="1.0.0",
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allow all methods
    allow_headers=["*"],  # Allow all headers
    expose_headers=["*"],  # Expose all headers
)

# Serve OpenAPI documentation
@app.get("/openapi.yaml", include_in_schema=False)
async def get_openapi_yaml():
    return FileResponse("openapi.yaml")

# Serve static files in production
if os.environ.get("ENVIRONMENT") == "production":
    app.mount("/", StaticFiles(directory="client/build", html=True), name="static")

# Models
class UpdateBase(BaseModel):
    message: str
    type: str = Field(default="info", description="Type of update")
    title: str = Field(default="Update", description="Title of the update")

class Update(UpdateBase):
    id: int = Field(..., description="Unique identifier for the update")
    timestamp: str = Field(..., description="ISO timestamp of when the update was created")

class UpdateResponse(BaseModel):
    success: bool
    update: Update

class HealthResponse(BaseModel):
    status: str
    uptime: float
    timestamp: int

class HeartbeatData(BaseModel):
    timestamp: int

# Store updates
updates: List[Dict] = []

# WebSocket connection manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: Set[WebSocket] = set()

    async def connect(self, websocket: WebSocket):
        try:
            await websocket.accept()
            self.active_connections.add(websocket)
            logger.info(f"New client connected: {id(websocket)}")
        except Exception as e:
            logger.error(f"Error accepting WebSocket connection: {e}")
            raise

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            logger.info(f"Client disconnected: {id(websocket)}")

    async def send_personal_message(self, message: str, websocket: WebSocket):
        try:
            await websocket.send_text(message)
        except Exception as e:
            logger.error(f"Error sending message to client: {e}")
            self.disconnect(websocket)

    async def broadcast(self, message: str):
        disconnected_clients = set()
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except Exception:
                disconnected_clients.add(connection)
        
        # Remove disconnected clients
        for client in disconnected_clients:
            self.disconnect(client)

manager = ConnectionManager()

# Handle Socket.IO-like query parameters
@app.get("/socket.io/")
async def handle_socketio_get(request: Request):
    return JSONResponse({"error": "WebSocket endpoint requires WebSocket protocol"})

# WebSocket endpoint - main endpoint
@app.websocket("/socket.io/")
async def websocket_endpoint(websocket: WebSocket):
    try:
        logger.info(f"New WebSocket connection from {websocket.client}")
        await manager.connect(websocket)
        
        # Send existing updates to newly connected client
        try:
            # First, send a simple test message to verify the connection
            await websocket.send_json({"type": "connection-test", "status": "ok"})
            
            # Then send the actual updates
            if updates:
                # Use manual JSON serialization with error handling
                try:
                    # Limit to 10 most recent updates to avoid large payloads
                    recent_updates = updates[:10]
                    json_data = json.dumps({"type": "initial-updates", "data": recent_updates})
                    await websocket.send_text(json_data)
                except Exception as e:
                    logger.error(f"JSON serialization error: {e}")
                    # Try sending a simplified version
                    simple_updates = []
                    for update in updates[:10]:
                        try:
                            # Create a simplified version of each update
                            simple_update = {
                                "id": update.get("id", 0),
                                "message": str(update.get("message", "")),
                                "type": str(update.get("type", "info")),
                                "title": str(update.get("title", "Update")),
                                "timestamp": str(update.get("timestamp", datetime.now().isoformat()))
                            }
                            simple_updates.append(simple_update)
                        except Exception:
                            pass
                    
                    await websocket.send_json({"type": "initial-updates", "data": simple_updates})
            else:
                await websocket.send_json({"type": "initial-updates", "data": []})
        except Exception as e:
            logger.error(f"Error sending initial updates: {e}")
            # Don't disconnect, try to continue with the connection
        
        try:
            while True:
                data = await websocket.receive_text()
                try:
                    json_data = json.loads(data)
                    event_type = json_data.get("type")
                    
                    if event_type == "heartbeat":
                        await websocket.send_json({
                            "type": "heartbeat-response", 
                            "data": {"timestamp": int(time.time() * 1000)}
                        })
                except json.JSONDecodeError:
                    pass
                    
        except WebSocketDisconnect:
            manager.disconnect(websocket)
        except Exception as e:
            logger.error(f"WebSocket error: {e}")
            manager.disconnect(websocket)
    except Exception as e:
        logger.error(f"Error in websocket_endpoint: {e}")

# Alternative WebSocket endpoint with any path
@app.websocket("/ws/{path:path}")
async def websocket_any_path(websocket: WebSocket, path: str):
    await websocket_endpoint(websocket)

# API Routes
@app.post("/api/update", response_model=UpdateResponse, status_code=201)
async def create_update(update_data: UpdateBase):
    update = {
        "id": int(time.time() * 1000),
        "message": update_data.message,
        "type": update_data.type,
        "title": update_data.title,
        "timestamp": datetime.now().isoformat()
    }
    
    # Add to updates array (limit to last 100)
    updates.insert(0, update)
    if len(updates) > 100:
        updates.pop()
    
    # Broadcast to all connected clients
    await manager.broadcast(json.dumps({"type": "new-update", "data": update}))
    
    return {"success": True, "update": update}

@app.get("/api/updates", response_model=List[Update])
async def get_updates():
    # Return only the 20 most recent updates to avoid large payloads
    return updates[:20]

@app.get("/health", response_model=HealthResponse)
async def health_check():
    return {
        "status": "ok",
        "uptime": time.time() - start_time,
        "timestamp": int(time.time() * 1000)
    }

# Start server function
def start_server(port: int = 5001):
    try:
        # Configure Uvicorn with WebSocket settings
        uvicorn.run(
            app, 
            host="0.0.0.0", 
            port=port,
            log_level="info",
            # Increase timeout for WebSocket connections
            timeout_keep_alive=120,
            # Enable WebSocket ping/pong for connection health checks
            ws_ping_interval=20.0,
            ws_ping_timeout=30.0,
        )
    except OSError as e:
        if "Address already in use" in str(e):
            logger.warning(f"Port {port} is already in use, trying port {port + 1}")
            start_server(port + 1)
        else:
            logger.error(f"Server error: {e}")
            raise

if __name__ == "__main__":
    # Record start time for uptime calculation
    start_time = time.time()
    
    # Get port from environment variable or use default
    port = int(os.environ.get("PORT", 5001))
    
    logger.info(f"Starting server on port {port}")
    logger.info(f"API documentation available at http://localhost:{port}/docs")
    logger.info(f"WebSocket endpoint available at ws://localhost:{port}/socket.io/")
    
    start_server(port) 