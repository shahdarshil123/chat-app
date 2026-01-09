import { useState } from "react";
import { AUTH_API_VERSION } from "../config";

export default function ForgotPassword({ onBackToLogin }) {
    // const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    // const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    async function handleForgotPassword(e) {
        e.preventDefault();
        setError("");
        setSuccess("");

        try {
            const res = await fetch(
                `http://localhost:4000/api/${AUTH_API_VERSION}/auth/forgot-password`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        email
                    }),
                }
            );
            // console.log(res);

            if (!res.ok) {
                throw new Error("Something went wrong. Please try again");
            } 

            setSuccess("Password reset successfully. You can now sign in.");
        } catch (err) {
            setError(err.message);
        }
    }

    return (
        <div className="login-container">
            <form className="login-card" onSubmit={handleForgotPassword}>
                <h2 className="login-title">Reset Password</h2>

                {error && <div className="login-error">{error}</div>}
                {success && <div className="login-success">{success}</div>}

                <input
                    className="login-input"
                    placeholder="Email"
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                />

                <button className="login-button" type="submit">
                    Send Reset Link
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
