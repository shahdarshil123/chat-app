import { useState } from "react";

export default function LoginPanel({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault(); // ⭐ VERY IMPORTANT
    setError("");

    try {
      const res = await fetch("http://localhost:4000/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        throw new Error("Invalid email or password");
      }

      const user  = await res.json();

      // ✅ store logged-in user (NO JWT)
      localStorage.setItem("currentUser", JSON.stringify(user));

      // ✅ notify App that login succeeded
      onLogin(user);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="login-container">
      <form className="login-card" onSubmit={handleSubmit}>
        <h2 className="login-title">Sign in</h2>

        {error && <div className="login-error">{error}</div>}

        <input
          className="login-input"
          placeholder="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          className="login-input"
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button className="login-button" type="submit">
          Continue
        </button>

        <div className="login-footer">
          <span>New here?</span>
          <button
            type="button"
            className="link-button"
            onClick={() => alert("Create account")}
          >
            Create account
          </button>
        </div>
      </form>
    </div>
  );
}
