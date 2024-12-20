// WebSocketContext.tsx (Enhanced)
import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { connectWebSocket as connectWebSocketService, sendWebSocketMessage, registerMessageHandler, unregisterMessageHandler } from '../services/websocketService';

interface WebSocketContextType {
  connect: (userId: string) => Promise<void>;
  sendMessage: (action: string, data: object) => void;
  isConnected: boolean;
  registerHandler: (handler: (action: string, data: any) => void) => void;
  unregisterHandler: (handler: (action: string, data: any) => void) => void;
}

interface WebSocketProviderProps {
  children: ReactNode;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);

  const connect = useCallback(async (userId: string) => {
    try {
      await connectWebSocketService(userId);
      setIsConnected(true);
    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
      setIsConnected(false);
    }
  }, []);

  const sendMessage = useCallback((action: string, data: object) => {
    sendWebSocketMessage(action, data);
  }, []);

  const registerHandler = useCallback((handler: (action: string, data: any) => void) => {
    registerMessageHandler(handler);
  }, []);

  const unregisterHandler = useCallback((handler: (action: string, data: any) => void) => {
    unregisterMessageHandler(handler);
  }, []);

  useEffect(() => {
    // Optional: Add global message handlers if needed
    const globalHandler = (action: string, data: any) => {
      console.log('Global handler received message:', { action, data });
    };

    registerHandler(globalHandler);

    return () => {
      unregisterHandler(globalHandler);
    };
  }, [registerHandler, unregisterHandler]);

  return (
    <WebSocketContext.Provider value={{ connect, sendMessage, isConnected, registerHandler, unregisterHandler }}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = (): WebSocketContextType => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};
