import { useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';

// Use your Render backend URL here:
const socket = io('https://whiteboard-backend.onrender.com');

export default function App() {
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const drawingRef = useRef(false);
  const lastPointRef = useRef(null);

  // Simple style controls (expand later)
  const [color, setColor] = useState('#000000');
  const [size, setSize] = useState(3);

  // Resize canvas to full window
  const resizeCanvas = () => {
    const canvas = canvasRef.current;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.floor(window.innerWidth * dpr);
    canvas.height = Math.floor(window.innerHeight * dpr);
    canvas.style.width = '100vw';
    canvas.style.height = '100vh';
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctxRef.current = ctx;

    // Optional: redraw background grid or UI later
  };

  // Helpers to convert between pixel and normalized coords (0..1)
  const toNorm = (x, y) => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    return { x: x / w, y: y / h };
  };

  const toPx = (nx, ny) => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    return { x: nx * w, y: ny * h };
  };

  // Draw a single segment
  const drawSegment = (seg, local = false) => {
    const ctx = ctxRef.current;
    if (!ctx) return;

    const from = toPx(seg.from.x, seg.from.y);
    const to = toPx(seg.to.x, seg.to.y);

    ctx.strokeStyle = seg.color || '#000000';
    ctx.lineWidth = seg.size || 3;

    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();

    // If this was drawn locally, we already rendered it; remote segments are also drawn here.
    // Nothing else needed.
  };

  // Mouse / touch handlers
  const startDrawing = (clientX, clientY) => {
    drawingRef.current = true;
    lastPointRef.current = { x: clientX, y: clientY };
  };

  const continueDrawing = (clientX, clientY) => {
    if (!drawingRef.current || !lastPointRef.current) return;
    const fromPx = lastPointRef.current;
    const toPxPoint = { x: clientX, y: clientY };

    // Local draw
    drawSegment({
      from: toNorm(fromPx.x, fromPx.y),
      to: toNorm(toPxPoint.x, toPxPoint.y),
      color,
      size
    });

    // Emit to server (normalized)
    socket.emit('draw-segment', {
      from: toNorm(fromPx.x, fromPx.y),
      to: toNorm(toPxPoint.x, toPxPoint.y),
      color,
      size
    });

    lastPointRef.current = toPxPoint;
  };

  const stopDrawing = () => {
    drawingRef.current = false;
    lastPointRef.current = null;
  };

  useEffect(() => {
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Incoming initial board
    socket.on('init', (segments) => {
      // Redraw everything
      // Clear first
      const ctx = ctxRef.current;
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      segments.forEach(seg => drawSegment(seg));
    });

    // Incoming live segments
    socket.on('draw-segment', (seg) => {
      drawSegment(seg);
    });

    // Incoming clear
    socket.on('clear-board', () => {
      const ctx = ctxRef.current;
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    });

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      socket.off('init');
      socket.off('draw-segment');
      socket.off('clear-board');
    };
  }, [color, size]);

  return (
    <>
      {/* Minimal UI for color/size and clear (can style later) */}
      <div
        style={{
          position: 'fixed',
          top: 10,
          left: 10,
          background: 'rgba(255,255,255,0.9)',
          padding: 8,
          borderRadius: 8,
          display: 'flex',
          gap: 8,
          alignItems: 'center',
          zIndex: 10
        }}
      >
        <input type="color" value={color} onChange={(e) => setColor(e.target.value)} />
        <input
          type="range"
          min="1"
          max="20"
          value={size}
          onChange={(e) => setSize(Number(e.target.value))}
          title="Brush size"
        />
        <button onClick={() => socket.emit('clear-board')}>Clear</button>
      </div>

      <canvas
        ref={canvasRef}
        onMouseDown={(e) => startDrawing(e.clientX, e.clientY)}
        onMouseMove={(e) => continueDrawing(e.clientX, e.clientY)}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={(e) => {
          const t = e.touches[0];
          startDrawing(t.clientX, t.clientY);
        }}
        onTouchMove={(e) => {
          const t = e.touches[0];
          continueDrawing(t.clientX, t.clientY);
        }}
        onTouchEnd={stopDrawing}
        style={{ display: 'block', cursor: 'crosshair' }}
      />
    </>
  );
}
