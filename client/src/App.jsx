import { useEffect, useState } from "react";
import {Routes, Route, Navigate} from "react-router-dom";
import LoginPanel from "./components/LoginPanel";
import ChatLayout from "./components/ChatLayout";
import { disconnectSocket } from "./socket";
import RegisterPanel from "./components/RegisterPanel";

import "./styles/chat.css";
import ForgotPassword from "./components/ForgotPassword";
import ResetPassword from "./components/ResetPassword";
import { AUTH_API_VERSION } from "./config";

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authMode, setAuthMode] = useState("login"); // login | register
  const [resetToken, setResetToken] = useState(null);

  // 🔑 Restore session from SERVER (not localStorage)
  useEffect(() => {
    async function restoreSession() {
      try {
        const res = await fetch(`http://localhost:4000/api/${AUTH_API_VERSION}/auth/me`, {
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
    await fetch(`http://localhost:4000/api/${AUTH_API_VERSION}/auth/logout`, {
      method: "POST",
      credentials: "include", // 🔑 REQUIRED
    });

    disconnectSocket();
    setCurrentUser(null);
    setAuthMode("login");
  }

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <Routes>
      {/* Public routes */}
      <Route
        path="/login"
        element={
          currentUser
            ? <Navigate to="/chat" />
            : <LoginPanel onLogin={handleLogin}  onSwitchToRegister={() => setAuthMode("register")}
            onForgotPassword={() => setAuthMode("forgot")} />
        }
      />

      <Route
        path="/register"
        element={
          currentUser
            ? <Navigate to="/chat" />
            : <RegisterPanel onRegister={handleLogin} onSwitchToLogin={() => setAuthMode("login")}
             />
        }
      />

      <Route path="/forgot-password" element={<ForgotPassword onBackToLogin={() => setAuthMode("login")} />} />
      <Route path="/reset-password" element={<ResetPassword token={resetToken} onBackToLogin={() => setAuthMode("login")} />} />

      {/* Protected route */}
      <Route
        path="/chat"
        element={
          currentUser
            ? <ChatLayout currentUser={currentUser} onLogout={handleLogout} />
            : <Navigate to="/login" />
        }
      />

      {/* Default redirect */}
      <Route
        path="*"
        element={<Navigate to={currentUser ? "/chat" : "/login"} />}
      />
    </Routes>
  );
}