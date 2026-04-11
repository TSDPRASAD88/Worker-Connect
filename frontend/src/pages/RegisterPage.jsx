import { useState } from "react";
import API from "../services/api";
import { useNavigate } from "react-router-dom";
import "../styles/auth.css";
import "../styles/global.css";

const SKILLS = [
  { value: "plumber", label: "🔧 Plumber" },
  { value: "electrician", label: "⚡ Electrician" },
  { value: "painter", label: "🎨 Painter" },
  { value: "carpenter", label: "🪚 Carpenter" },
];

const RegisterPage = () => {
  const [form, setForm] = useState({ name: "", email: "", password: "", phone: "" });
  const [skill, setSkill] = useState("plumber");
  const [location, setLocation] = useState(null);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const getLocation = () => {
    setLoadingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ type: "Point", coordinates: [pos.coords.longitude, pos.coords.latitude] });
        setLoadingLocation(false);
      },
      () => {
        // Fallback to Vizag city center
        setLocation({ type: "Point", coordinates: [83.2185, 17.6868] });
        setLoadingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleRegister = async () => {
    const { name, email, password, phone } = form;
    if (!name || !email || !password || !phone) {
      setError("Please fill in all fields");
      return;
    }
    if (!location) {
      setError("Please capture your location first");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await API.post("/auth/register", { ...form, skills: [skill], location });
      navigate("/login");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">Vizag<span>Connect</span></div>
        <h1 className="auth-title">Join as a worker</h1>
        <p className="auth-subtitle">Start receiving jobs in your area</p>
        <div className="auth-divider" />

        {error && (
          <div style={{
            background: "rgba(239,68,68,0.08)",
            color: "#B91C1C",
            padding: "10px 14px",
            borderRadius: "8px",
            fontSize: "13px",
            marginBottom: "14px",
            fontWeight: 500
          }}>
            {error}
          </div>
        )}

        <div className="form-group">
          <label className="form-label">Full Name</label>
          <input className="form-input" name="name" placeholder="Ravi Kumar" onChange={handleChange} />
        </div>

        <div className="form-group">
          <label className="form-label">Email address</label>
          <input className="form-input" name="email" type="email" placeholder="worker@example.com" onChange={handleChange} />
        </div>

        <div className="form-group">
          <label className="form-label">Password</label>
          <input className="form-input" name="password" type="password" placeholder="Create a password" onChange={handleChange} />
        </div>

        <div className="form-group">
          <label className="form-label">Phone number</label>
          <input className="form-input" name="phone" placeholder="+91 98765 43210" onChange={handleChange} />
        </div>

        <div className="form-group">
          <label className="form-label">Your skill</label>
          <div className="skills-grid">
            {SKILLS.map((s) => (
              <div
                key={s.value}
                className={`skill-option ${skill === s.value ? "active" : ""}`}
                onClick={() => setSkill(s.value)}
              >
                {s.label}
              </div>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Location</label>
          {location ? (
            <div className="location-status">
              ✅ Location captured — ready to go
            </div>
          ) : (
            <button
              className="auth-btn auth-btn--secondary"
              onClick={getLocation}
              disabled={loadingLocation}
              style={{ marginBottom: "14px" }}
            >
              {loadingLocation ? <span className="spinner" style={{ borderTopColor: "#0D0D0D" }} /> : "📍"}
              {loadingLocation ? "Detecting location..." : "Capture My Location"}
            </button>
          )}
        </div>

        <button className="auth-btn" onClick={handleRegister} disabled={loading}>
          {loading ? <span className="spinner" /> : null}
          {loading ? "Creating account..." : "Create Account"}
        </button>

        <div className="auth-footer">
          Already registered?{" "}
          <span className="auth-link" onClick={() => navigate("/login")}>
            Sign in
          </span>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
