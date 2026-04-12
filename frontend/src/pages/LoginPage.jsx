import { useState } from "react";
import API from "../services/api";
import { useNavigate } from "react-router-dom";
import "../styles/auth.css";
import "../styles/global.css";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async () => {
    if (!email || !password) { setError("Please fill in all fields"); return; }
    setError("");
    setLoading(true);
    try {
      const res = await API.post("/auth/login", { email, password });

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("workerId", res.data.workerId);

      // Only set "isAdmin" to "true" if the server confirmed it —
      // otherwise remove it entirely so a stale "false" string
      // never leaks between sessions.
      if (res.data.isAdmin) {
        localStorage.setItem("isAdmin", "true");
        navigate("/admin");
      } else {
        localStorage.removeItem("isAdmin");
        navigate("/worker");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Login failed. Check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => { if (e.key === "Enter") handleLogin(); };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">Vizag<span>Connect</span></div>
        <h1 className="auth-title">Welcome back</h1>
        <p className="auth-subtitle">Sign in to your account</p>
        <div className="auth-divider" />

        {error && <div className="error-box">{error}</div>}

        <div className="form-group">
          <label className="form-label">Email address</label>
          <input
            className="form-input"
            type="email"
            placeholder="worker@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={handleKeyDown}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Password</label>
          <input
            className="form-input"
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={handleKeyDown}
          />
        </div>

        <button className="auth-btn" onClick={handleLogin} disabled={loading}>
          {loading ? <><span className="spinner" /> Signing in...</> : "Sign In"}
        </button>

        <div className="auth-footer">
          New worker?{" "}
          <span className="auth-link" onClick={() => navigate("/register")}>
            Register here
          </span>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
