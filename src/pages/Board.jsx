import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import io from "socket.io-client";

const socket = io("https://whiteboard-backend-27jg.onrender.com");

export default function Whiteboard() {
    const { id: boardId } = useParams();
    const canvasRef = useRef(null);
    const ctxRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [brushColor, setBrushColor] = useState("#000000");
    const [brushSize, setBrushSize] = useState(5);
    const [username, setUsername] = useState("");
    const [activeUsers, setActiveUsers] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        let name = prompt("Enter your username:");
        if (!name) name = "Anonymous";
        setUsername(name);

        socket.emit("join-board", { boardId, username: name });

        socket.on("active-users", (users) => {
            setActiveUsers(users);
        });

        // Join board room
        socket.emit("join-board", boardId);

        // Receive existing data
        socket.on("init", (segments) => {
            segments.forEach((segment) => {
                drawLine(segment, false);
            });
        });

        // Listen for incoming drawings
        socket.on("draw-segment", (segment) => {
            drawLine(segment, false);
        });

        // Listen for clear
        socket.on("clear-board", () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        });

        return () => {
            socket.emit("leave-board", { boardId, username: name });
            socket.off("active-users");
            socket.off("init");
            socket.off("draw-segment");
            socket.off("clear-board");
        };
    }, [boardId]);

    // Drawing function
    const drawLine = (segment, emit = true) => {
        const { x0, y0, x1, y1, color, size } = segment;
        ctxRef.current.strokeStyle = color;
        ctxRef.current.lineWidth = size;
        ctxRef.current.beginPath();
        ctxRef.current.moveTo(x0, y0);
        ctxRef.current.lineTo(x1, y1);
        ctxRef.current.stroke();
        ctxRef.current.closePath();

        if (emit) {
            socket.emit("draw-segment", { boardId, segment });
        }
    };

    const startDrawing = ({ nativeEvent }) => {
        setIsDrawing(true);
        const { offsetX, offsetY } = nativeEvent;
        ctxRef.current.beginPath();
        ctxRef.current.moveTo(offsetX, offsetY);
        ctxRef.current.stroke();
        ctxRef.current.closePath();
        lastPos.current = { x: offsetX, y: offsetY };
    };

    const lastPos = useRef({ x: 0, y: 0 });

    const finishDrawing = () => {
        setIsDrawing(false);
    };

    const draw = ({ nativeEvent }) => {
        if (!isDrawing) return;
        const { offsetX, offsetY } = nativeEvent;
        drawLine({
            x0: lastPos.current.x,
            y0: lastPos.current.y,
            x1: offsetX,
            y1: offsetY,
            color: brushColor,
            size: brushSize,
        });
        lastPos.current = { x: offsetX, y: offsetY };
    };

    const clearBoard = () => {
        socket.emit("clear-board", boardId);
    };

    return (
        <div>
            <div style={{ padding: "10px", background: "#eee", display: "flex", alignItems: "center", gap: "10px" }}>
                <button onClick={() => navigate("/")}>Home</button>
                <input
                    type="color"
                    value={brushColor}
                    onChange={(e) => setBrushColor(e.target.value)}
                />
                <input
                    type="range"
                    min="1"
                    max="50"
                    value={brushSize}
                    onChange={(e) => setBrushSize(parseInt(e.target.value))}
                    style={{ width: "100px" }}
                />
                <button onClick={clearBoard}>Clear Board</button>
                <span style={{ marginLeft: "auto" }}>You: {username}</span>
            </div>
            <div style={{ padding: "10px", background: "#fafafa", borderBottom: "1px solid #ddd" }}>
                <strong>Active Users:</strong> {activeUsers.join(", ")}
            </div>
            <canvas
                ref={canvasRef}
                style={{ border: "1px solid black" }}
                onMouseDown={startDrawing}
                onMouseUp={finishDrawing}
                onMouseMove={draw}
            />
        </div>
    );
}
