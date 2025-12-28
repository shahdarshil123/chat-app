export default function LoginPanel({ onLogin }) {
    return (
        <div className="login-container">
            <div className="login-card">
                <h2 className="login-title">Sign in</h2>

                <input
                    className="login-input"
                    placeholder="Email"
                    type="email"
                />

                <input
                    className="login-input"
                    placeholder="Password"
                    type="password"
                />

                <button className="login-button" onClick={onLogin}>
                    Continue
                </button>

                <div className="login-footer">
                    <span>New here?</span>
                    <button className="link-button">Create account</button>
                </div>
            </div>
        </div>
    );
}
