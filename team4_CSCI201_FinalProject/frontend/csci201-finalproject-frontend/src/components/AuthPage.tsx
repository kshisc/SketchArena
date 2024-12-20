// AuthPage.tsx
import React, { useState } from 'react';
import axios from 'axios';
import './AuthPage.css';
import Button from './Button';
import { useNavigate } from 'react-router-dom';
import { useWebSocket } from '../context/WebSocketContext';

const AuthPage: React.FC = () => {
  console.log('AuthPage is rendering');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate();
  const { connect } = useWebSocket();

  const handleLogin = async () => {
    try {
      const response = await axios.post('./auth/login', { username, password });
      console.log('HELP ME');

      // Extract user ID from the response
      const userId = response.data.userId;
	  const user = response.data.username;

      // Save user ID to local storage
      sessionStorage.setItem('userId', userId);
	  sessionStorage.setItem('username', user);
      console.log('User ID saved:', sessionStorage.getItem('userId'));

      // Establish WebSocket connection via context
      await connect(userId);

      // Navigate to game room selection
      navigate('/game-room-selection');
    } catch (error) {
      console.error('Login error:', error);
      setErrorMessage('Login failed. Please check your credentials.');
    }
  };

  const handleSignUp = () => {
    navigate('/signup');
  };

  const handleGuest = async () => {
    try {
      const response = await axios.post('./auth/guest');
      console.log('Guest login successful');

      // Extract user ID from the response
      const userId = response.data.userId;
	  const user = response.data.username;

      // Save user ID to local storage
      sessionStorage.setItem('userId', userId);
	  sessionStorage.setItem('username', user);
      console.log('Guest User ID saved:', sessionStorage.getItem('userId'));

      // Establish WebSocket connection via context
      await connect(userId);

      // Navigate to game room selection
      navigate('/game-room-selection');
    } catch (error) {
      console.error('Guest login error:', error);
      setErrorMessage('Guest login failed.');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h1 className="auth-title">Welcome! Please Sign In!</h1>

        {errorMessage && <div className="error-message">{errorMessage}</div>}

        <input
          className="auth-input"
          type="text"
          placeholder="User Name"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          className="auth-input"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <div className="auth-buttons">
          <Button onClick={handleLogin} text="Sign in" className="sign-in" />
          <Button onClick={handleSignUp} text="Sign up" className="sign-up" />
          <Button onClick={handleGuest} text="Guest in" className="guest-in" />
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
