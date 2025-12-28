import { useState } from "react";
import LoginPanel from "./components/LoginPanel";
import ChatLayout from "./components/ChatLayout";
import "./styles/chat.css";

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  return (
    <div className="app-root">
      {!isAuthenticated ? (
        <LoginPanel onLogin={() => setIsAuthenticated(true)} />
      ) : (
        <ChatLayout onLogout={() => setIsAuthenticated(false)} />
      )}
    </div>
  );
}
