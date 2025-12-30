import { useEffect, useState } from "react";
import LoginPanel from "./components/LoginPanel";
import ChatLayout from "./components/ChatLayout";
import { disconnectSocket } from "./socket";
import "./styles/chat.css";

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // 🔑 Restore session from SERVER (not localStorage)
  useEffect(() => {
    async function restoreSession() {
      try {
        const res = await fetch("http://localhost:4000/api/auth/me", {
          credentials: "include", // 🔑 REQUIRED
        });

        if (!res.ok) throw new Error("Not logged in");

        const user = await res.json();
        setCurrentUser(user);
      } catch {
        setCurrentUser(null);
      } finally {
        setLoading(false);
      }
    }

    restoreSession();
  }, []);

  function handleLogin(user) {
    // user comes from login response
    setCurrentUser(user);
  }

  async function handleLogout() {
    await fetch("http://localhost:4000/api/auth/logout", {
      method: "POST",
      credentials: "include", // 🔑 REQUIRED
    });

    disconnectSocket();
    setCurrentUser(null);
  }

  if (loading) {
    return <div className="loading">Loading...</div>;
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
