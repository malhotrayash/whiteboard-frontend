import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function HomePage() {
    const [boards, setBoards] = useState([]);
    const navigate = useNavigate();

    // Fetch boards from backend
    useEffect(() => {
        fetch("https://whiteboard-backend-27jg.onrender.com/boards")
            .then((res) => res.json())
            .then((data) => setBoards(data))
            .catch((err) => console.error("Error fetching boards:", err));
    }, []);

    const createBoard = async () => {
        const name = prompt("Enter board name:");
        if (!name) return;

        try {
            const res = await fetch("https://whiteboard-backend-27jg.onrender.com/boards", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name }),
            });

            const data = await res.json();
            navigate(`/board/${data.id}`);
        } catch (err) {
            console.error("Error creating board:", err);
        }
    };

    return (
        <div style={{ padding: "20px" }}>
            <h1>Whiteboard Lobby</h1>
            <button
                onClick={createBoard}
                style={{
                    padding: "10px 20px",
                    marginBottom: "20px",
                    fontSize: "16px",
                    cursor: "pointer",
                }}
            >
                Create New Board
            </button>

            {/* Board Grid */}
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, 1fr)",
                    gap: "20px",
                }}
            >
                {boards.map((board) => (
                    <div
                        key={board.id}
                        style={{
                            border: "1px solid #ccc",
                            borderRadius: "8px",
                            overflow: "hidden",
                            cursor: "pointer",
                            boxShadow: "0px 2px 5px rgba(0,0,0,0.1)",
                        }}
                        onClick={() => navigate(`/board/${board.id}`)}
                    >
                        <div style={{ height: "150px", background: "#f0f0f0" }}>
                            {board.preview ? (
                                <img
                                    src={board.preview}
                                    alt={board.name}
                                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                />
                            ) : (
                                <p
                                    style={{
                                        textAlign: "center",
                                        paddingTop: "60px",
                                        color: "#888",
                                    }}
                                >
                                    No preview
                                </p>
                            )}
                        </div>
                        <div style={{ padding: "10px" }}>
                            <h3 style={{ margin: 0 }}>{board.name}</h3>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
