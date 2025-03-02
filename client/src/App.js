import React, { useState, useEffect, useRef } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import styled from 'styled-components';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import UpdateList from './components/UpdateList';
import Footer from './components/Footer';

// API Management endpoints
const APIM_HTTP_ENDPOINT = 'https://apim-realtime-dashboard.azure-api.net/dashboard';
const APIM_WS_ENDPOINT = 'wss://apim-realtime-dashboard.azure-api.net/dashboard-ws';

// Local server endpoints
const LOCAL_HTTP_ENDPOINT = 'http://localhost:5001';
const LOCAL_WS_ENDPOINT = 'ws://localhost:5001';

const useApim = true;

// Determine the correct server URL
const getServerUrl = () => {
  // Check for environment variables first
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  
  // Use local endpoint by default
  return useApim ? APIM_HTTP_ENDPOINT : LOCAL_HTTP_ENDPOINT;
};

// Determine the correct WebSocket URL
const getWebSocketUrl = () => {
  // Check for environment variables first
  if (process.env.REACT_APP_WS_URL) {
    return process.env.REACT_APP_WS_URL;
  }
  
  // For APIM, don't add /socket.io/ suffix as it's handled by APIM routing
  // For local development, keep the /socket.io/ suffix as our server expects it
  return useApim ? APIM_WS_ENDPOINT : `${LOCAL_WS_ENDPOINT}/socket.io/`;
};

// Initialize HTTP API URL
const apiUrl = getServerUrl();

// Initialize WebSocket URL
const wsUrl = getWebSocketUrl();
console.log('WebSocket URL:', wsUrl);

function App() {
  const [updates, setUpdates] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [transportType, setTransportType] = useState('websocket');
  
  // WebSocket reference
  const socketRef = useRef(null);
  const heartbeatIntervalRef = useRef(null);

  // Function to fetch updates from the API
  const fetchUpdates = async () => {
    try {
      const response = await fetch(`${apiUrl}/api/updates`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setUpdates(data);
    } catch (error) {
      console.error('Error fetching updates:', error);
      toast.error(`Failed to fetch updates: ${error.message}`);
    }
  };

  // Function to connect to WebSocket
  const connectWebSocket = () => {
    // Close existing connection if any
    if (socketRef.current && socketRef.current.readyState !== WebSocket.CLOSED) {
      socketRef.current.close();
    }

    // Create new WebSocket connection
    const socket = new WebSocket(wsUrl);
    socketRef.current = socket;

    // Connection opened
    socket.addEventListener('open', (event) => {
      console.log('Connected to WebSocket server');
      setIsConnected(true);
      setTransportType('websocket');
      toast.success('Connected to server!');
      
      // Start heartbeat
      startHeartbeat();
    });

    // Listen for messages
    socket.addEventListener('message', (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('Message from server:', data);
        
        if (data.type === 'initial-updates') {
          setUpdates(data.data || []);
        } else if (data.type === 'new-update') {
          setUpdates((prevUpdates) => [data.data, ...prevUpdates]);
          
          // Show toast notification
          const update = data.data;
          const toastType = update.type && toast[update.type] ? update.type : 'info';
          toast[toastType](update.message, {
            position: "top-right",
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
          });
        }
      } catch (error) {
        console.error('Error parsing message:', error);
      }
    });

    // Connection closed
    socket.addEventListener('close', (event) => {
      console.log('Disconnected from WebSocket server:', event.code, event.reason);
      setIsConnected(false);
      toast.error('Disconnected from server!');
      
      // Clear heartbeat
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
        heartbeatIntervalRef.current = null;
      }
      
      // Try to reconnect after a delay
      setTimeout(() => {
        if (socket === socketRef.current) { // Only reconnect if this is still the current socket
          console.log('Attempting to reconnect...');
          connectWebSocket();
        }
      }, 5000);
    });

    // Connection error
    socket.addEventListener('error', (error) => {
      console.error('WebSocket error:', error);
      toast.error(`Connection error: ${error.message || 'Unknown error'}`);
    });
  };

  // Function to start heartbeat
  const startHeartbeat = () => {
    // Clear existing interval if any
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
    }
    
    // Send a heartbeat every 30 seconds
    heartbeatIntervalRef.current = setInterval(() => {
      if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        console.log('Sending heartbeat...');
        socketRef.current.send(JSON.stringify({
          type: 'heartbeat',
          timestamp: Date.now()
        }));
      }
    }, 30000);
  };

  useEffect(() => {
    console.log('Connecting to WebSocket server at:', wsUrl);
    console.log('API endpoint:', apiUrl);
    
    // Fetch initial updates from the API
    fetchUpdates();
    
    // Connect to WebSocket server
    connectWebSocket();
    
    // Cleanup on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
      
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  // We're disabling the exhaustive-deps rule here because including all dependencies
  // would cause the effect to re-run when they change, which is not desired for this initialization effect

  return (
    <AppContainer>
      <ToastContainer />
      <Header isConnected={isConnected} transportType={transportType} />
      <MainContent>
        <Dashboard updates={updates} />
        <UpdateList updates={updates} />
      </MainContent>
      <Footer />
      <ServerInfo>
        <p>API Endpoint: {apiUrl}</p>
        <p>WebSocket Endpoint: {wsUrl}</p>
        <p>Connection Status: {isConnected ? 'Connected' : 'Disconnected'}</p>
      </ServerInfo>
    </AppContainer>
  );
}

const AppContainer = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
`;

const MainContent = styled.main`
  flex: 1;
  padding: 2rem;
  display: flex;
  flex-direction: column;
  gap: 2rem;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
`;

const ServerInfo = styled.div`
  padding: 0.5rem;
  background-color: rgba(0, 0, 0, 0.05);
  text-align: center;
  font-size: 0.75rem;
  color: var(--text-secondary);
`;

export default App; 