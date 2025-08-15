import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import HomePage from "./HomePage";
import Whiteboard from "./Whiteboard";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/board/:id" element={<Whiteboard />} />
      </Routes>
    </Router>
  );
}
