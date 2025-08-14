import { useEffect, useRef } from 'react';
import io from 'socket.io-client';

const socket = io('https://whiteboard-backend-27jg.onrender.com'); // backend URL

function App() {
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  let drawing = false;

  useEffect(() => {
    const canvas = canvasRef.current;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const ctx = canvas.getContext('2d');
    ctx.lineCap = 'round';
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 3;
    ctxRef.current = ctx;

    socket.on('draw', ({ x, y }) => {
      ctx.lineTo(x, y);
      ctx.stroke();
    });
  }, []);

  const startDrawing = (e) => {
    drawing = true;
    ctxRef.current.beginPath();
    ctxRef.current.moveTo(e.clientX, e.clientY);
  };

  const draw = (e) => {
    if (!drawing) return;
    ctxRef.current.lineTo(e.clientX, e.clientY);
    ctxRef.current.stroke();
    socket.emit('draw', { x: e.clientX, y: e.clientY });
  };

  const stopDrawing = () => {
    drawing = false;
    ctxRef.current.beginPath();
  };

  return (
    <canvas
      ref={canvasRef}
      onMouseDown={startDrawing}
      onMouseMove={draw}
      onMouseUp={stopDrawing}
    />
  );
}

export default App;
