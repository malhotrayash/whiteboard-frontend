import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import io from "socket.io-client";

const socket = io("https://whiteboard-backend-27jg.onrender.com");

export default function HomePage() {
    const [boards, setBoards] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        fetch("https://whiteboard-backend-27jg.onrender.com/boards")
            .then((res) => res.json())
            .then(setBoards);
    }, []);

    // 👉 new function to create a board and redirect immediately
    const handleCreateBoard = async () => {
        const res = await fetch("https://whiteboard-backend-27jg.onrender.com/boards", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: "New Board" }), // optional: send a name
        });
        const data = await res.json();
        navigate(`/board/${data.id}`); // redirect straight to the board
    };

    return (
        <div style={{ padding: "20px" }}>
            <h1>Available Boards</h1>
            <button
                onClick={handleCreateBoard}
                style={{ marginBottom: "20px", padding: "10px 15px" }}
            >
                ➕ Create Board
            </button>

            <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, 250px)",
                gap: "20px"
            }}>
                {boards.map((board) => (
                    <BoardPreview
                        key={board.id}
                        board={board}
                        onJoin={() => navigate(`/board/${board.id}`)}
                    />
                ))}
            </div>
        </div>
    );
}

function BoardPreview({ board, onJoin }) {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");

        canvas.width = 200;
        canvas.height = 150;

        socket.emit("join-board", board.id);

        socket.on("init", (segments) => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            segments.forEach((segment) => drawLine(ctx, segment));
        });

        socket.on("draw-segment", (segment) => {
            drawLine(ctx, segment);
        });

        socket.on("clear-board", () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        });

        return () => {
            socket.off("init");
            socket.off("draw-segment");
            socket.off("clear-board");
        };
    }, [board.id]);

    const drawLine = (ctx, segment) => {
        const { x0, y0, x1, y1, color, size } = segment;
        ctx.strokeStyle = color;
        ctx.lineWidth = Math.max(1, size * 0.2);
        ctx.beginPath();
        ctx.moveTo(x0 * 0.2, y0 * 0.2);
        ctx.lineTo(x1 * 0.2, y1 * 0.2);
        ctx.stroke();
        ctx.closePath();
    };

    return (
        <div style={{
            border: "1px solid #ccc",
            padding: "10px",
            borderRadius: "8px",
            background: "#fafafa"
        }}>
            {/* Show board name if available, otherwise fallback to ID */}
            <h3>{board.name || `Board ${board.id}`}</h3>

            <canvas
                ref={canvasRef}
                style={{
                    border: "1px solid #000",
                    display: "block",
                    marginBottom: "10px"
                }}
            />
            <button onClick={onJoin}>Join</button>
        </div>
    );
}
