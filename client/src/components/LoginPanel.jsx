import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AUTH_API_VERSION_ENUM } from "../constants/apiVersions";
import { AUTH_API_VERSION } from "../config";

export default function LoginPanel({ onLogin, onSwitchToRegister, onForgotPassword }) {
  const navigate = useNavigate();

  const [email, setEmail] = useState("alice@example.com");
  const [password, setPassword] = useState("password123");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault(); // ⭐ VERY IMPORTANT
    setError("");

    try {
      setLoading(true);

      const res = await fetch(`http://localhost:4000/api/${AUTH_API_VERSION}/auth/login`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        throw new Error("Invalid email or password");
      }

      const user = await res.json();

      // ✅ notify App that login succeeded
      onLogin(user);
    } catch (err) {
      setError(err.message);
    }
    finally{
      setLoading(false);
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
          disabled={loading}
        />

        <input
          className="login-input"
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={loading}
        />

         <button
          type="button"
          className="link-button forgot-link"
          onClick={()=>{
            navigate("/forgot-password");
            onForgotPassword;
          }
        }
        >
          Forgot password?
        </button>

        <button className="login-button" type="submit" disabled={loading}>
         {loading ? "Signing in..." : "Continue"}
        </button>

        <div className="login-footer">
          <span>New here?</span>
          <button
            type="button"
            className="link-button"
            onClick={()=>{
              navigate("/register");
              onSwitchToRegister;
            }
            }
          >
            Create account
          </button>
        </div>
      </form>
    </div>
  );
}
