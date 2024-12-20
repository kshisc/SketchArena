import React, { useState, useEffect } from 'react';
import './GameRoomSelectionPage.css';
import Button from './Button';
import { useWebSocket} from '../context/WebSocketContext';
import { useNavigate } from 'react-router-dom';

const GameRoomSelectionPage: React.FC = () => {
  const [roomId, setRoomId] = useState('');
  const { sendMessage, registerHandler, unregisterHandler } = useWebSocket();
  const navigate = useNavigate();

  useEffect(() => {
    const messageHandler = (action: string, data: any) => {
      if (action === 'join_room') {
        console.log(`Successfully joined room: ${data.roomId}`);
      } else if (action === 'error') {
        alert(data.error);
      }
    };

    registerHandler(messageHandler);

    return () => unregisterHandler(messageHandler);
  }, []);

  const handleJoinRoom = () => {
    if (!roomId) {
      alert('Please enter a game room ID.');
      return;
    }

	const username = sessionStorage.getItem('username');
    sendMessage('join_room', { roomId, username: username });
    navigate(`/game/${roomId}`);
  };

  return (
    <div className="desktop-select-game-room">
      <div className="join-window">
        {/* Title */}
        <h1 className="join-create-a-game-room">Join/Create a Game Room!</h1>

        {/* Input Container */}
        <div className="input-area">
          <input
            type="text"
            placeholder="Enter Room ID"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            className="game-room-id"
          />
        </div>

        {/* Join Button */}
        <button className="join-button" onClick={handleJoinRoom}>
          Join
        </button>
      </div>
    </div>
  );
};

export default GameRoomSelectionPage;



