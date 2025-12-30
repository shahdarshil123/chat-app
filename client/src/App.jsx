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

  async function handleLogout() {
    localStorage.removeItem("currentUser");

    disconnectSocket();

    const message = await fetch("http://localhost:4000/api/auth/logout", {
        method: "POST",
        credentials: "include", // 🔑 REQUIRED
      });
    console.log(message);

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
