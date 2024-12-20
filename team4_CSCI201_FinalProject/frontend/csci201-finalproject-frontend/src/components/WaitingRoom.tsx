import React, { useEffect, useState } from 'react';
import './WaitingRoom.css';

interface WaitingRoomProps {
    roomId: string;
}

interface WaitingStatus {
    currentPlayers: number;
    requiredPlayers: number;
    players: { username: string }[];
    isGameStarted: boolean;
}

const WaitingRoom: React.FC<WaitingRoomProps> = ({ roomId }) => {
    const [waitingStatus, setWaitingStatus] = useState<WaitingStatus>({
        currentPlayers: 0,
        requiredPlayers: 4,
        players: [],
        isGameStarted: false
    });

    // Handle websocket message for waiting status
    const handleWaitingStatus = (data: any) => {
        setWaitingStatus({
            currentPlayers: data.currentPlayers,
            requiredPlayers: data.requiredPlayers,
            players: data.players,
            isGameStarted: data.isGameStarted
        });
    };

    return (
        <div className="waiting-room">
            <h2>Waiting Room</h2>
            <div className="room-info">
                <p>Room ID: {roomId}</p>
                <p>Players ({waitingStatus.currentPlayers}/{waitingStatus.requiredPlayers})</p>
            </div>
            <div className="players-list">
                {waitingStatus.players.map((player, index) => (
                    <div key={index} className="player-item">
                        {player.username}
                    </div>
                ))}
            </div>
            <div className="waiting-message">
                {waitingStatus.currentPlayers < waitingStatus.requiredPlayers ? (
                    <p>Waiting for {waitingStatus.requiredPlayers - waitingStatus.currentPlayers} more players...</p>
                ) : (
                    <p>Game is starting...</p>
                )}
            </div>
        </div>
    );
};

export default WaitingRoom;
