const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');

// Initialize Express app
const app = express();
const server = http.createServer(app);

// Load OpenAPI specification
const swaggerDocument = YAML.load(path.join(__dirname, 'openapi.yaml'));

// Configure Socket.IO with APIM-compatible settings
const io = socketIo(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  },
  // WebSocket configuration for APIM compatibility
  transports: ['websocket'],
  upgrade: false,
  // Increase ping timeout for APIM
  pingTimeout: 60000,
  // Reduce ping frequency for APIM
  pingInterval: 25000,
  cookie: false,
  // Disable per-message deflate for APIM
  perMessageDeflate: false
});

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve OpenAPI documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.get('/openapi.yaml', (req, res) => {
  res.sendFile(path.join(__dirname, 'openapi.yaml'));
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'client/build')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
  });
}

// Store notifications/updates
const updates = [];

// Socket.IO connection handler
io.on('connection', (socket) => {
  try {
    const transportName = socket.conn && socket.conn.transport ? socket.conn.transport.name : 'websocket';
    console.log('New client connected:', socket.id, 'Transport:', transportName);
    
    // Send existing updates to newly connected client
    socket.emit('initial-updates', updates);
    
    socket.on('disconnect', (reason) => {
      console.log('Client disconnected:', socket.id, 'Reason:', reason);
    });

    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
    
    // Add heartbeat handler for APIM connections
    socket.on('heartbeat', (data) => {
      console.log(`Heartbeat received from ${socket.id}, timestamp: ${data.timestamp}`);
      // Respond with a pong to keep the connection alive
      socket.emit('heartbeat-response', { timestamp: Date.now() });
    });
  } catch (err) {
    console.error('Error in connection handler:', err);
  }
});

// API Routes
app.post('/api/update', (req, res) => {
  const { message, type = 'info', title = 'Update' } = req.body;
  
  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }
  
  const update = {
    id: Date.now(),
    message,
    type,
    title,
    timestamp: new Date().toISOString()
  };
  
  // Add to updates array (limit to last 100)
  updates.unshift(update);
  if (updates.length > 100) updates.pop();
  
  // Broadcast to all connected clients
  io.emit('new-update', update);
  
  res.status(201).json({ success: true, update });
});

// Get all updates
app.get('/api/updates', (req, res) => {
  res.json(updates);
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: Date.now()
  });
});

// Start server
const PORT = process.env.PORT || 5001;

// Function to start server and handle port conflicts
const startServer = (port) => {
  server.listen(port, () => {
    console.log(`Server running on port ${port}`);
    console.log('Socket.IO configured to use WebSockets only');
    console.log(`API documentation available at http://localhost:${port}/api-docs`);
  }).on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`Port ${port} is already in use, trying port ${port + 1}`);
      startServer(port + 1);
    } else {
      console.error('Server error:', err);
    }
  });
};

// Start the server with the initial port
startServer(PORT); 