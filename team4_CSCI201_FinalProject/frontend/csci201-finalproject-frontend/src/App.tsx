import React from 'react';
import { WebSocketProvider } from './context/WebSocketContext';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import AuthPage from './components/AuthPage';
import SignUpPage from './components/SignUpPage';
import GameRoomSelectionPage from './components/GameRoomSelectionPage';
import GameRoom from './components/GameRoom';  // Change this line
//import DrawingBoard from './DrawingBoard'; // Import DrawingBoard

const App: React.FC = () => {
  console.log('App is rendering');
  return (
    <WebSocketProvider>
      <Router basename="/team4_CSCI201_FinalProject">
        <Routes>
          <Route path="/" element={<AuthPage />} />
          <Route path="/signup" element={<SignUpPage />} />
          <Route path="/game-room-selection" element={<GameRoomSelectionPage />} />
          <Route path="/game/:roomId" element={<GameRoom />} /> {/* GamePage route */}
        </Routes>
      </Router>
    </WebSocketProvider>
  );
};

export default App;
