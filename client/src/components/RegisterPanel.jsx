import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AUTH_API_VERSION } from "../config";

export default function RegisterPanel({ onRegister, onSwitchToLogin }) {
    const navigate = useNavigate();

    const [username, setUserName] = useState("");
    const [displayName, setDisplayName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [loading, setLoading] = useState("");

    async function handleSubmit(e) {
        e.preventDefault();
        setError("");
        setSuccess("");

        try {
            setLoading(true);

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

            setSuccess(
                "Account created successfully. Please check your email to verify your account."
            );

            setUserName("");
            setDisplayName("");
            setEmail("");
            setPassword("");

            const user = await res.json();
            onRegister(user);
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
                <h2 className="login-title">Create account</h2>

                {error && <div className="login-error">{error}</div>}
                {success && <div className="login-success">{success}</div>}

                <input
                    className="login-input"
                    placeholder="Display name"
                    value={displayName}
                    onChange={e => setDisplayName(e.target.value)}
                    required
                    disabled={loading || !!success}
                />

                <input
                    className="login-input"
                    placeholder="Username"
                    value={username}
                    onChange={e => setUserName(e.target.value)}
                    required
                    disabled={loading || !!success}
                />

                <input
                    className="login-input"
                    placeholder="Email"
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    disabled={loading || !!success}
                />

                <input
                    className="login-input"
                    placeholder="Password"
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    disabled={loading || !!success}
                />

                <button className="login-button" type="submit"  disabled={loading || !!success}>
                    {loading ? "Creating account..." : "Create account"}
                </button>

                <div className="login-footer">
                    <span>Already have an account?</span>
                    <button
                        type="button"
                        className="link-button"
                        onClick={()=>{
                            navigate("/login");
                            onSwitchToLogin;
                        }
                    } 
                    >
                        Sign in
                    </button>
                </div>
            </form>
        </div>
    );
}
