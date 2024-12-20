import React, { useState } from 'react';
import axios from 'axios';
import './AuthPage.css';
import Button from './Button';
import { useNavigate } from 'react-router-dom';
import { useWebSocket } from '../context/WebSocketContext';

const SignUpPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate();
  const { connect } = useWebSocket();

  const handleSignUp = async () => {
    try {
      const response = await axios.post('./auth/signup', { username, password });
      console.log('signup successful');

      // Extract user ID from the response
      const userId = response.data.userId;

      // Save user ID to local storage
      sessionStorage.setItem('userId', userId);
	  sessionStorage.setItem('username', username);
      
      // Establish WebSocket connection via context
      await connect(userId);

      // Navigate to game room selection
      navigate('/game-room-selection');
    } catch (error) {
      setErrorMessage('Signup failed. Username might already be taken.');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h1 className="auth-title">Create an Account</h1>

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
          <Button onClick={handleSignUp} text="Sign up" className="sign-up" />
        </div>
      </div>
    </div>
  );
};

export default SignUpPage;



