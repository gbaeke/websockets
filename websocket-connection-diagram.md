# WebSocket Connection Flow Diagram

```
┌─────────────┐     ┌─────────────────────────────────────────────────────────────┐
│             │     │                                                             │
│  Web Client │     │                   Connection Flow                           │
│             │     │                                                             │
└──────┬──────┘     └─────────────────────────────────────────────────────────────┘
       │
       │ WebSocket Connection
       │ ws://localhost:5001/socket.io/  (Local Development)
       │ wss://apim-realtime-dashboard.azure-api.net/dashboard-ws  (Production)
       ▼
┌──────────────┐     HTTP/WebSocket Request
│              │◄────────────────────┐
│     APIM     │                     │
│              │─────────────────────┘
└──────┬───────┘     Proxy Request
       │             (Adds routing & authentication)
       │
       │ WebSocket Connection
       │ ws://[ngrok-url]/socket.io/
       ▼
┌──────────────┐
│              │
│    ngrok     │
│              │
└──────┬───────┘
       │
       │ WebSocket Connection
       │ ws://localhost:5001/socket.io/
       ▼
┌──────────────┐
│              │
│ Python Server│
│  (server.py) │
│              │
└──────────────┘
```

## Connection Flow Explanation

### 1. Local Development Flow
```
Web Client ──► Python Server
   │               │
   └─► ws://localhost:5001/socket.io/
```
- Client connects directly to the local Python server
- URL includes `/socket.io/` path as expected by the server
- No intermediaries involved

### 2. Production Flow with APIM
```
Web Client ──► APIM ──► ngrok ──► Python Server
   │            │         │           │
   │            │         │           │
   └─► wss://apim-realtime-dashboard.azure-api.net/dashboard-ws
                └─► ws://[ngrok-url]/socket.io/
                              └─► ws://localhost:5001/socket.io/
```

- Client connects to APIM endpoint without `/socket.io/` suffix
- APIM routes the request to ngrok URL with `/socket.io/` path
- ngrok forwards the connection to your local server
- Server receives the connection at the `/socket.io/` endpoint

### 3. Key Points

1. **Client Configuration**:
   - Local: Uses `ws://localhost:5001/socket.io/`
   - APIM: Uses `wss://apim-realtime-dashboard.azure-api.net/dashboard-ws` (no `/socket.io/`)

2. **APIM Configuration**:
   - Accepts connections at `/dashboard-ws`
   - Forwards to backend at `/socket.io/`
   - Handles WebSocket protocol upgrade

3. **Server Configuration**:
   - Listens for WebSocket connections at `/socket.io/`
   - Also provides alternative endpoint at `/ws/{path}`

## Common Issues and Solutions

| Issue | Possible Cause | Solution |
|-------|----------------|----------|
| 400 Bad Request | Path mismatch | Ensure APIM is configured to forward to `/socket.io/` |
| Connection refused | Server not running | Check if Python server is running |
| Connection closed | Heartbeat failure | Ensure heartbeat messages are being sent |
| CORS errors | APIM CORS settings | Configure CORS in APIM policies |

## APIM WebSocket API Configuration

When configuring your WebSocket API in Azure API Management:

1. **Create a WebSocket API**:
   - API type: WebSocket
   - Web service URL: `ws://[ngrok-url]/socket.io/` (include the `/socket.io/` path)
   - API URL suffix: `dashboard-ws` (no `/socket.io/` here)

2. **Client Connection**:
   - Connect to: `wss://apim-realtime-dashboard.azure-api.net/dashboard-ws`
   - Do NOT add `/socket.io/` in the client URL

3. **Testing the Connection**:
   - Use browser developer tools to monitor WebSocket connections
   - Check for successful connection and message exchange
   - Verify heartbeat messages are being sent and received

This configuration ensures that:
- The client connects to APIM without the `/socket.io/` path
- APIM forwards the connection to your backend with the `/socket.io/` path
- The server receives the connection at the expected endpoint 