import { useState } from "react";

export default function LoginPanel({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  function handleSubmit(e) {
    e.preventDefault(); // ⭐ VERY IMPORTANT
    onLogin();
  }

  return (
    <div className="login-container">
      <form className="login-card" onSubmit={handleSubmit}>
        <h2 className="login-title">Sign in</h2>

        <input
          className="login-input"
          placeholder="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          className="login-input"
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
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
