let websocket: WebSocket | null = null;

const globalMessageHandlers: ((action: string, data: any) => void)[] = [];

export const connectWebSocket = (userId: string): Promise<WebSocket> => {
  if (websocket && (websocket.readyState === WebSocket.OPEN || websocket.readyState === WebSocket.CONNECTING)) {
    return Promise.resolve(websocket);
  }

  
  return new Promise((resolve, reject) => {
    if (!userId) {
      return reject(new Error('User ID is required'));
    }

    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const host = window.location.host;
    const path = '/team4_CSCI201_FinalProject/game';

    websocket = new WebSocket(`${protocol}://${host}${path}`);

    websocket.onopen = () => {
      console.log('WebSocket connection established.');
      resolve(websocket!);
    };

    websocket.onmessage = (event) => {
      try {
        const { action, data } = JSON.parse(event.data);

        // Dispatch the message to all registered handlers
        globalMessageHandlers.forEach((handler) => handler(action, data));
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
      }
    };

    websocket.onerror = (error) => {
      console.error('WebSocket error:', error);
      websocket = null; // Reset WebSocket on error
      reject(error);
    };

    websocket.onclose = () => {
      console.log('WebSocket connection closed.');
      websocket = null;
    };
  });
};

export const sendWebSocketMessage = (action: string, data: object) => {
  if (!websocket) {
    console.error('WebSocket is not connected.');
    return;
  }

  const message = JSON.stringify({ action, data });
  websocket.send(message);
};

// Allow components to register their own handlers for WebSocket messages
export const registerMessageHandler = (handler: (action: string, data: any) => void) => {
  globalMessageHandlers.push(handler);
};

// Allow components to remove their handlers
export const unregisterMessageHandler = (handler: (action: string, data: any) => void) => {
  const index = globalMessageHandlers.indexOf(handler);
  if (index !== -1) {
    globalMessageHandlers.splice(index, 1);
  }
};

export const getWebSocket = (): WebSocket | null => websocket;



