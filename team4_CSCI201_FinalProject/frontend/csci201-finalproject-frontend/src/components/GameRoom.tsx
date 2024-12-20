import React, { useState, useEffect, useRef } from "react";
import { useWebSocket } from "../context/WebSocketContext";
import { useParams } from "react-router-dom";
import "./GameRoom.css";
import DrawingBoard from "./DrawingBoard";

interface Player {
  id: string;
  username: string;
  score: number;
  isDrawer: boolean;
}

interface Message {
  id: string;
  sender: string;
  content: string;
  timestamp: number;
  type: "user" | "self" | "system";
}

interface Score {
  username: string;
  score: number;
}

const GameRoom: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const { sendMessage, registerHandler, unregisterHandler, isConnected } =
    useWebSocket();
  const [chatMessages, setChatMessages] = useState<string[]>([]);
  const [drawingData, setDrawingData] = useState<any[]>([]);
  const [currentDrawer, setCurrentDrawer] = useState<string | null>(null);
  const [word, setWord] = useState<string | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentWord, setCurrentWord] = useState<string>("");
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [isCurrentDrawer, setIsCurrentDrawer] = useState<boolean>(false);
  const [timeRemaining, setTimeRemaining] = useState<number>(60);
  const [scores, setScores] = useState<Score[]>([]);
  const [isGameEnded, setIsGameEnded] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chatInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const currentUsername = sessionStorage.getItem("username");
  // Rest of the code remains the same...

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const startDrawing = (e: MouseEvent) => {
      if (!isCurrentDrawer) return;
      setIsDrawing(true);
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      ctx.beginPath();
      ctx.moveTo(x, y);
    };

    const draw = (e: MouseEvent) => {
      if (!isDrawing || !isCurrentDrawer) return;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      ctx.lineTo(x, y);
      ctx.stroke();

      // Send drawing data to server
      sendMessage("draw", {
        x,
        y,
        drawing: true,
      });
    };

    const stopDrawing = () => {
      setIsDrawing(false);
      ctx.closePath();
    };

    canvas.addEventListener("mousedown", startDrawing);
    canvas.addEventListener("mousemove", draw);
    canvas.addEventListener("mouseup", stopDrawing);
    canvas.addEventListener("mouseout", stopDrawing);

    return () => {
      canvas.removeEventListener("mousedown", startDrawing);
      canvas.removeEventListener("mousemove", draw);
      canvas.removeEventListener("mouseup", stopDrawing);
      canvas.removeEventListener("mouseout", stopDrawing);
    };
  }, [isCurrentDrawer]);

  useEffect(() => {
    setIsCurrentDrawer(currentDrawer === sessionStorage.getItem("username"));
  }, [currentDrawer]);

  // Add this to handle incoming drawing data
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    drawingData.forEach((data) => {
      // Implement drawing logic based on received data
      if (data.x && data.y) {
        ctx.lineTo(data.x, data.y);
        ctx.stroke();
      }
    });
  }, [drawingData]);
  useEffect(() => {
    const handleWebSocketMessage = (action: string, data: any) => {
      console.log("Received action:", action);

      switch (action) {
		case 'timer_update':
		  handleTimerUpdate(data);
		  break;
		case 'score_update':
		  handleScoreUpdate(data);
		  break;
		case 'game_end':
		  handleGameEnd(data);
		  break;
        case "chat":
          console.log("Chat message received:", data);
          setChatMessages((prev) => [...prev, data.message]);
          break;
        case "draw":
          setDrawingData((prev) => [...prev, data.drawingData]);
          break;
        case "drawer_chosen":
          // data will have { drawerUsername: string, players: Player[] }
          setCurrentDrawer(data.drawerUsername);
          setPlayers(data.players);
          break;
        case "drawer_status":
          setIsCurrentDrawer(data.isDrawer);
          setCurrentDrawer(data.currentDrawer);
          break;
        case "drawer_update":
          setCurrentDrawer(data.currentDrawer);
          setPlayers(data.players);
          setIsCurrentDrawer(
            data.currentDrawer === sessionStorage.getItem("username")
          );
          break;
        case "select_word":
          console.log("Selecting word for display");
          setWord(data.word);
          break;
        case "word_update":
          console.log("Word update received:", data);
          setWord(data.word);
          setIsCurrentDrawer(data.isDrawer);
          break;
        case "update_players":
          setPlayers(data.players);
          break;
        case "message":
          console.log("Message from server:", data.message);
          break;
        case "error":
          console.error("Error from server:", data.message);
          break;
        default:
          console.warn("Unhandled WebSocket action:", action);
      }
    };

    registerHandler(handleWebSocketMessage);

    return () => {
      unregisterHandler(handleWebSocketMessage);
    };
  }, [registerHandler, unregisterHandler]);

  const handleTimerUpdate = (data: any) => {
    setTimeRemaining(data.timeRemaining);
  };

  const handleScoreUpdate = (data: any) => {
    setScores(data.scores);
    setPlayers(prev => prev.map(player => ({
      ...player,
      score: data.scores.find((s: Score) => s.username === player.username)?.score || 0
    })));
  };

  const handleGameEnd = (data: any) => {
    setIsGameEnded(true);
    const finalScores = data.finalScores;
    const winner = finalScores.reduce((prev: Score, current: Score) => 
      (prev.score > current.score) ? prev : current
    );
  };
  
  const sendChatMessage = (message: string) => {
    if (!isConnected) {
      console.error("WebSocket is not connected.");
      return;
    }
    const username = sessionStorage.getItem("username");
    if (!username) {
      console.error("Username not found in sessionStorage.");
      return;
    }

    sendMessage("chat", { username, message });
  };

  const handleSendMessage = () => {
    const input = document.getElementById("message-input") as HTMLInputElement;
    const message = input.value.trim();
    if (!message) return;

    sendChatMessage(message);
    input.value = "";
  };

  return (
    <div className="game-room">
    <div className="game-status">
      <div className="player-list">
        <h3>Players</h3>
        <ul>
            {players.map((player) => {
              // Find the score for the current player
              const playerScore = scores.find(
                (score) => score.username === player.username
              );
  
              return (
                <li
                  key={player.username}
                  className={player.isDrawer ? "current-drawer" : ""}
                >
                  <div className="scoreboard">
                    {player.username}
                    {player.isDrawer && " (Drawing)"}
                    <span className="score">{playerScore?.score || 0} pts</span>
                  </div>
                </li>
              );
            })}
        </ul>
      </div>


      <div className="drawer-info">
        {currentDrawer && (
          <div>
            <h3>
              {currentDrawer === sessionStorage.getItem("username")
                ? "It's your turn to draw!"
                : `${currentDrawer} is drawing`}
            </h3>
            {word && isCurrentDrawer && <h4>Word to draw: {word}</h4>}
          </div>
        )}
        {!currentDrawer && <h3>Waiting for drawer...</h3>}
      </div>
    </div>

      {/* Drawing Section */}
      <div className="drawing-board-container">
      <DrawingBoard
        isCurrentDrawer={isCurrentDrawer}
        currentDrawer={currentDrawer}
        username={sessionStorage.getItem("username") || ""}
        word={word}
      />
    </div>

      {/* Chat Section */}
      <div className="chatbody">
        <div className="chatroom">
          <div className="chat-header">Chatroom</div>
          <div id="chat-messages" className="chat-messages">
            {chatMessages.map((msg, index) => (
              <div key={index}>{msg}</div>
            ))}
          </div>

          <div className="chat-input">
            <input
              type="text"
              id="message-input"
              placeholder="Enter Your Guess..."
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSendMessage();
                }
              }}
            />
            <button id="send-button" onClick={handleSendMessage}>
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameRoom;
