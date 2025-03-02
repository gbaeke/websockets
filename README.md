# Python WebSocket Server for APIM Testing

This is a Python implementation of a WebSocket server that can be used to test Azure API Management (APIM) WebSocket capabilities. The server provides both REST API endpoints and WebSocket communication.

## Features

- WebSocket server that handles client connections
- REST API endpoints for creating and retrieving updates
- Automatic broadcasting of updates to all connected WebSocket clients
- Health check endpoint
- CORS support
- OpenAPI documentation
- Robust error handling for WebSocket connections

## Prerequisites

- Python 3.7 or higher
- pip (Python package manager)

## Installation

1. Install the required dependencies:

```bash
pip install -r requirements.txt
```

## Usage

### Running the Server

```bash
python server.py
```

The server will start on port 5001 by default. If that port is already in use, it will automatically try the next port.

### API Endpoints

- `GET /api/updates` - Get all updates
- `POST /api/update` - Create a new update
- `GET /health` - Health check endpoint
- `GET /docs` - OpenAPI documentation (Swagger UI)
- `GET /openapi.yaml` - OpenAPI specification

### WebSocket Endpoints

The server provides multiple WebSocket endpoints for flexibility:

- Primary endpoint: `ws://localhost:5001/socket.io/`
- Alternative endpoint: `ws://localhost:5001/ws/any-path-here`

Both endpoints provide the same functionality, but the alternative endpoint allows any path after `/ws/`, which can be useful for testing different routing configurations in APIM.

## Client Options

### 1. HTML WebSocket Client

A simple HTML-based WebSocket client is included for testing in the browser:

1. Open the `websocket-test-client.html` file in your browser
2. The client will automatically connect to `ws://localhost:5001/socket.io/`
3. You can send messages, heartbeats, and create updates from the UI

### 2. React WebSocket Client

Client is in `client/src`. Run the client with `npm run dev-full`.

## Testing with APIM

To test your APIM instance with this server:

1. Start the server locally:
   ```bash
   python server.py
   ```

2. Configure your APIM instance to proxy WebSocket connections to your local server.
   - You may need to use a tool like ngrok to expose your local server to the internet.
   - Example ngrok command: `ngrok http 5001`

3. Connect the client to your APIM instance:
   
   Configure the client to connect to your APIM instance.

## WebSocket Message Format

### Client to Server (Heartbeat)

```json
{
  "type": "heartbeat",
  "timestamp": 1621234567890
}
```

### Server to Client (Initial Updates)

```json
{
  "type": "initial-updates",
  "data": [
    {
      "id": 1621234567890,
      "message": "System is running normally",
      "type": "info",
      "title": "System Status",
      "timestamp": "2023-07-01T12:00:00.000Z"
    }
  ]
}
```

### Server to Client (New Update)

```json
{
  "type": "new-update",
  "data": {
    "id": 1621234567890,
    "message": "System is running normally",
    "type": "info",
    "title": "System Status",
    "timestamp": "2023-07-01T12:00:00.000Z"
  }
}
```

## Troubleshooting

- If you see connection errors, check that your APIM instance is properly configured for WebSockets.
- Ensure that your APIM policies allow WebSocket upgrade requests.
- Check that the WebSocket protocol is enabled in your APIM instance.
- Verify that your backend service (this server) is accessible from your APIM instance.
- If using the React client, make sure you've replaced the Socket.IO client with the WebSocket client.
- If you're seeing errors with Socket.IO clients, use one of the native WebSocket clients provided. 