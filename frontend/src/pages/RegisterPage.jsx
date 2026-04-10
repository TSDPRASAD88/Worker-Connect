import { useState } from "react";
import API from "../services/api";
import { useNavigate } from "react-router-dom";
import "../styles/auth.css";
import "../styles/global.css";

const RegisterPage = () => {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
  });

  const [skill, setSkill] = useState("plumber");
  const [location, setLocation] = useState(null);
  const [loadingLocation, setLoadingLocation] = useState(false);

  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const getLocation = () => {
    setLoadingLocation(true);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;

        setLocation({
          type: "Point",
          coordinates: [lng, lat],
        });

        setLoadingLocation(false);
      },
      (err) => {
        console.error("GPS failed:", err);

        setLocation({
          type: "Point",
          coordinates: [83.2185, 17.6868],
        });

        alert("GPS failed. Using Vizag location.");

        setLoadingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  const handleRegister = async () => {
    try {
      if (!location) {
        alert("Please get your location first");
        return;
      }

      await API.post("/auth/register", {
        ...form,
        skills: [skill],
        location: location,
      });

      alert("Registered successfully");
      navigate("/login");
    } catch (err) {
       console.error(err.response?.data || err.message);
  alert(err.response?.data?.message || "Registration failed");
    }
  };

  return (
    <div className="container">
      <div className="auth-card">
        <h2 className="auth-title">Worker Register</h2>

        <input
          className="auth-input"
          name="name"
          placeholder="Name"
          onChange={handleChange}
        />

        <input
          className="auth-input"
          name="email"
          placeholder="Email"
          onChange={handleChange}
        />

        <input
          className="auth-input"
          name="password"
          type="password"
          placeholder="Password"
          onChange={handleChange}
        />

        <input
          className="auth-input"
          name="phone"
          placeholder="Phone"
          onChange={handleChange}
        />

        <select
          className="auth-input"
          value={skill}
          onChange={(e) => setSkill(e.target.value)}
        >
          <option value="plumber">Plumber</option>
          <option value="electrician">Electrician</option>
          <option value="painter">Painter</option>
          <option value="carpenter">Carpenter</option>
        </select>

        <button className="auth-button" onClick={getLocation}>
          {loadingLocation ? "Getting location..." : "Get Location"}
        </button>

        {location && (
          <p style={{ fontSize: "12px", color: "lightgreen" }}>
            Location captured ✅
          </p>
        )}

        <button className="auth-button" onClick={handleRegister}>
          Register
        </button>

        <p className="auth-link" onClick={() => navigate("/login")}>
          Already have an account? Login
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;