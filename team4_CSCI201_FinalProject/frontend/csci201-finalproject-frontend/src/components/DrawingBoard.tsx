import React, { useRef, useState, useEffect } from "react";
import { useWebSocket } from "../context/WebSocketContext";

interface DrawingBoardProps {
  isCurrentDrawer: boolean;
  currentDrawer: string | null;
  username: string;
  word?: string | null;
}

interface Score {
	username: string; 
	score: number; 
}

const DrawingBoard: React.FC<DrawingBoardProps> = ({
  isCurrentDrawer,
  currentDrawer,
  username,
  word
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [brushSize, setBrushSize] = useState(2);
  const [brushType, setBrushType] = useState<"round" | "square">("round");
  const [brushColor, setBrushColor] = useState("#000000");
  const [isDrawing, setIsDrawing] = useState(false);
  const [lastPos, setLastPos] = useState({ x: 0, y: 0 });
  const [timeRemaining, setTimeRemaining] = useState<number>(60);
  const [scores, setScores] = useState<Score[]>([]);

  const { sendMessage, registerHandler, unregisterHandler } = useWebSocket();

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = 800;
    canvas.height = 600;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set initial canvas properties
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = brushColor;
    ctx.lineWidth = brushSize;

    // Set white background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  // Handle WebSocket messages for drawings
  // In DrawingBoard.tsx, modify the useEffect for WebSocket messages
  useEffect(() => {
    const handleWebSocketMessage = (action: string, data: any) => {
      console.log("Received WebSocket message:", action, data);
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      switch (action) {
		case 'timer_update':
		  setTimeRemaining(data.timeRemaining);
		  break;
		case 'score_update':
		  setScores(data.scores);
		  break;
		case 'game_end':
		  handleGameEnd(data.finalScores);
		  break;
        case "draw":
          console.log("Processing draw action:", data);
          if (data && data.type === "clear") {
            // Process clear command regardless of drawer status
            console.log("Clearing canvas from websocket message");
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
          } else if (!isCurrentDrawer) {
            // Only handle drawing commands for non-drawers
            handleReceivedDrawing(data);
          }
          break;
        default:
			if (!['timer_update', 'score_update', 'game_end'].includes(action)) {
			  console.warn("Unhandled WebSocket action:", action);
			}

          console.warn("Unhandled WebSocket action:", action);
      }
    };

    registerHandler(handleWebSocketMessage);
    return () => unregisterHandler(handleWebSocketMessage);
  }, [isCurrentDrawer, registerHandler, unregisterHandler]);

  
  useEffect(() => {
    clearCanvas();
  }, [currentDrawer]); // clear board for new round

  
  const handleGameEnd = (finalScores: Score[]) => {
    const winner = finalScores.reduce((prev, current) => 
      (prev.score > current.score) ? prev : current
    );
    alert(`Game Over! Winner: ${winner.username}`);
  };
  
  const getCoordinates = (
    e: React.MouseEvent<HTMLCanvasElement>
  ): { x: number; y: number } => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isCurrentDrawer) return;

    const coords = getCoordinates(e);
    setIsDrawing(true);
    setLastPos(coords);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !isCurrentDrawer) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const coords = getCoordinates(e);

    // Draw locally
    ctx.beginPath();
    ctx.moveTo(lastPos.x, lastPos.y);
    ctx.lineTo(coords.x, coords.y);
    ctx.strokeStyle = brushColor;
    ctx.lineWidth = brushSize;
    ctx.lineCap = brushType;
    ctx.stroke();

    // Send drawing data to server
    sendMessage("draw", {
      prevX: lastPos.x,
      prevY: lastPos.y,
      x: coords.x,
      y: coords.y,
      color: brushColor,
      size: brushSize,
      type: brushType,
    });

    setLastPos(coords);
  };

  const handleReceivedDrawing = (drawingData: any) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.strokeStyle = drawingData.color;
    ctx.lineWidth = drawingData.size;
    ctx.lineCap = drawingData.type as CanvasLineCap;

    ctx.beginPath();
    ctx.moveTo(drawingData.prevX, drawingData.prevY);
    ctx.lineTo(drawingData.x, drawingData.y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isCurrentDrawer) return;
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    if (!isCurrentDrawer) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    sendMessage("draw", {
      type: "clear",
    });
  };

  return (
    <div className="drawing-board">
		<div className="game-info flex justify-between items-center p-4">
		  <div className="timer text-xl font-bold">
		    Time: {timeRemaining}s
		  </div>
		</div>
      <div className="drawer-info">
        {isCurrentDrawer ? (
          <>
            <h3>You are the current drawer!</h3>
            {word && <h4>Word to draw: {word}</h4>}
          </>
        ) : (
          <>
            <h3>Current Drawer: {currentDrawer || "None"}</h3>
            {word && <h4>Word: {word}</h4>}
          </>
        )}
      </div>

      <canvas
        ref={canvasRef}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={(e) => {
          e.preventDefault();
          const touch = e.touches[0];
          const mouseEvent = new MouseEvent("mousedown", {
            clientX: touch.clientX,
            clientY: touch.clientY,
          });
          startDrawing(mouseEvent as any);
        }}
        onTouchMove={(e) => {
          e.preventDefault();
          const touch = e.touches[0];
          const mouseEvent = new MouseEvent("mousemove", {
            clientX: touch.clientX,
            clientY: touch.clientY,
          });
          draw(mouseEvent as any);
        }}
        onTouchEnd={stopDrawing}
        className="canvas"
        style={{
          pointerEvents: isCurrentDrawer ? "auto" : "none",
          opacity: isCurrentDrawer ? 1 : 0.5,
        }}
      />

      <div className="controls">
        <label htmlFor="colorPicker">Brush Color:</label>
        <input
          type="color"
          id="colorPicker"
          value={brushColor}
          onChange={(e) => setBrushColor(e.target.value)}
          disabled={!isCurrentDrawer}
        />

        <label htmlFor="brushSize">Brush Size:</label>
        <input
          type="range"
          id="brushSize"
          min="1"
          max="20"
          value={brushSize}
          onChange={(e) => setBrushSize(Number(e.target.value))}
          disabled={!isCurrentDrawer}
        />

        <label htmlFor="brushType">Brush Type:</label>
        <select
          id="brushType"
          value={brushType}
          onChange={(e) => setBrushType(e.target.value as "round" | "square")}
          disabled={!isCurrentDrawer}
        >
          <option value="round">Round</option>
          <option value="square">Square</option>
        </select>

        <button
          onClick={clearCanvas}
          className="clear-button"
          disabled={!isCurrentDrawer}
        >
          Clear Canvas
        </button>
      </div>
    </div>
  );
};

export default DrawingBoard;
