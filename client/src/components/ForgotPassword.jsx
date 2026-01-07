import { useState } from "react";
import { AUTH_API_VERSION } from "../config";

export default function ForgotPassword({ onBackToLogin }) {
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    async function handleReset(e) {
        e.preventDefault();
        setError("");
        setSuccess("");

        if (password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        try {
            const res = await fetch(
                `http://localhost:4000/api/${AUTH_API_VERSION}/auth/reset-password`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        username,
                        email,
                        password,
                    }),
                }
            );
            // console.log(res);

            if (!res.ok) {
                throw new Error("Failed to reset the password, check the details are correct?");
            } 

            setSuccess("Password reset successfully. You can now sign in.");
        } catch (err) {
            setError(err.message);
        }
    }

    return (
        <div className="login-container">
            <form className="login-card" onSubmit={handleReset}>
                <h2 className="login-title">Reset Password</h2>

                {error && <div className="login-error">{error}</div>}
                {success && <div className="login-success">{success}</div>}

                <input
                    className="login-input"
                    placeholder="Username"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
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
                    placeholder="New password"
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                />

                <input
                    className="login-input"
                    placeholder="Confirm password"
                    type="password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    required
                />

                <button className="login-button" type="submit">
                    Reset password
                </button>

                <button
                    type="button"
                    className="link-button"
                    onClick={onBackToLogin}
                >
                    Back to login
                </button>
            </form>
        </div>
    );
}
