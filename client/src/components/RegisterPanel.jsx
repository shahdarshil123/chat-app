import { useState } from "react";
import { AUTH_API_VERSION } from "../config";

export default function RegisterPanel({ onRegister, onSwitchToLogin }) {
    const [username, setUserName] = useState("");
    const [displayName, setDisplayName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    async function handleSubmit(e) {
        e.preventDefault();
        setError("");

        try {
            const res = await fetch(
                `http://localhost:4000/api/${AUTH_API_VERSION}/auth/register`,
                {
                    method: "POST",
                    credentials: "include", // ⭐ important
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        username,
                        email,
                        password,
                        displayName,
                    }),
                }
            );

            if (!res.ok) {
                const msg = await res.text();
                throw new Error(msg || "Registration failed");
            }

            const user = await res.json();
            onRegister(user);
        } catch (err) {
            setError(err.message);
        }
    }

    return (
        <div className="login-container">
            <form className="login-card" onSubmit={handleSubmit}>
                <h2 className="login-title">Create account</h2>

                {error && <div className="login-error">{error}</div>}

                <input
                    className="login-input"
                    placeholder="Display name"
                    value={displayName}
                    onChange={e => setDisplayName(e.target.value)}
                    required
                />

                <input
                    className="login-input"
                    placeholder="Username"
                    value={username}
                    onChange={e => setUserName(e.target.value)}
                    required
                />

                <input
                    className="login-input"
                    placeholder="Email"
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                />

                <input
                    className="login-input"
                    placeholder="Password"
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                />

                <button className="login-button" type="submit">
                    Create account
                </button>

                <div className="login-footer">
                    <span>Already have an account?</span>
                    <button
                        type="button"
                        className="link-button"
                        onClick={onSwitchToLogin}
                    >
                        Sign in
                    </button>
                </div>
            </form>
        </div>
    );
}
