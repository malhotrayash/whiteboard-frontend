import React, { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import io from "socket.io-client";

const socket = io("https://whiteboard-backend-27jg.onrender.com"); // change to your backend URL

export default function Whiteboard() {
    const { id: boardId } = useParams(); // board ID from URL
    const canvasRef = useRef(null);
    const ctxRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [brushColor, setBrushColor] = useState("#000000");
    const [brushSize, setBrushSize] = useState(5);

    useEffect(() => {
        const canvas = canvasRef.current;
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        const ctx = canvas.getContext("2d");
        ctx.lineCap = "round";
        ctx.strokeStyle = brushColor;
        ctx.lineWidth = brushSize;
        ctxRef.current = ctx;

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
            <div style={{ padding: "10px", background: "#eee" }}>
                <input
                    type="color"
                    value={brushColor}
                    onChange={(e) => setBrushColor(e.target.value)}
                />
                <input
                    type="number"
                    value={brushSize}
                    min="1"
                    max="50"
                    onChange={(e) => setBrushSize(parseInt(e.target.value))}
                />
                <button onClick={clearBoard}>Clear Board</button>
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
