import { useEffect, useState } from "react";
import { AUTH_API_VERSION } from "../config";

export default function ResetPassword({ token, onBackToLogin }) {
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [loading, setLoading] = useState("");

    // useEffect(() => {
    //     const params = new URLSearchParams(window.location.search);
    //     const tokenFromUrl = params.get("token");

    //     if (!tokenFromUrl) {
    //         setError("Invalid or missing reset token.");
    //         return;
    //     }

    //     setToken(tokenFromUrl);
    // }, []);

    async function handleResetPassword(e) {
        e.preventDefault();
        setError("");
        setSuccess("");

        if (!token){
            setError("Invalid or missing reset token");
        }

        if (password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        try {
            setLoading(true);

            console.log("Token:", token);
            const res = await fetch(
                `http://localhost:4000/api/${AUTH_API_VERSION}/auth/reset-password`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        token,
                        newPassword: password,
                    }),
                }
            );

            if (!res.ok) {
                throw new Error("Failed to reset password. The link may have expired.");
            }

            setSuccess("Password updated successfully. You can now sign in.");
            setPassword("");
            setConfirmPassword("");
        } catch (err) {
            setError(err.message);
        }
        finally{
            setLoading(false);
        }
    }

    return (
        <div className="login-container">
            <form className="login-card" onSubmit={handleResetPassword}>
                <h2 className="login-title">Set New Password</h2>

                {error && <div className="login-error">{error}</div>}
                {success && <div className="login-success">{success}</div>}

                <input
                    className="login-input"
                    placeholder="New password"
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    disabled={loading || !!success}
                    required
                />

                <input
                    className="login-input"
                    placeholder="Confirm new password"
                    type="password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    disabled={loading || !!success}
                    required
                />

                <button className="login-button" type="submit">
                    {loading ? "Resetting..." : "Reset Password"}
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
