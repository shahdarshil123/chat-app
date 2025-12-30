import { useEffect, useState } from "react";
import LoginPanel from "./components/LoginPanel";
import ChatLayout from "./components/ChatLayout";
import { disconnectSocket } from "./socket";
import "./styles/chat.css";

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);

  // 🔑 Restore login on refresh
  useEffect(() => {
    const stored = localStorage.getItem("currentUser");
    if (stored) {
      setCurrentUser(JSON.parse(stored));
    }
  }, []);

  function handleLogin(user) {
    setCurrentUser(user);
    localStorage.setItem("currentUser", JSON.stringify(user));
  }

  function handleLogout() {
    localStorage.removeItem("currentUser");
    disconnectSocket()
    setCurrentUser(null);
  }

  return (
    <div className="app-root">
      {!currentUser ? (
        <LoginPanel onLogin={handleLogin} />
      ) : (
        <ChatLayout currentUser={currentUser} onLogout={handleLogout} />
      )}
    </div>
  );
}
