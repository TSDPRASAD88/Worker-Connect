import { useState } from "react";
import API from "../services/api";
import { useNavigate } from "react-router-dom";

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

  // 📍 Get real GPS location
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
      console.error(err);

      alert("Location access denied");

      setLoadingLocation(false); // 🔥 IMPORTANT FIX
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
      console.error(err);
      alert("Registration failed");
    }
  };

  return (
    <div style={{ padding: "20px", maxWidth: "400px", margin: "auto" }}>
      <h2>Worker Register</h2>

      <input
        name="name"
        placeholder="Name"
        onChange={handleChange}
        style={{ display: "block", marginBottom: "10px", width: "100%" }}
      />

      <input
        name="email"
        placeholder="Email"
        onChange={handleChange}
        style={{ display: "block", marginBottom: "10px", width: "100%" }}
      />

      <input
        name="password"
        placeholder="Password"
        type="password"
        onChange={handleChange}
        style={{ display: "block", marginBottom: "10px", width: "100%" }}
      />

      <input
        name="phone"
        placeholder="Phone"
        onChange={handleChange}
        style={{ display: "block", marginBottom: "10px", width: "100%" }}
      />

      {/* 🔧 Skill Selection */}
      <select
        value={skill}
        onChange={(e) => setSkill(e.target.value)}
        style={{ display: "block", marginBottom: "10px", width: "100%" }}
      >
        <option value="plumber">Plumber</option>
        <option value="electrician">Electrician</option>
        <option value="painter">Painter</option>
        <option value="carpenter">Carpenter</option>
      </select>

      {/* 📍 Location Button */}
      <button
        onClick={getLocation}
        style={{ marginBottom: "10px", width: "100%" }}
      >
        {loadingLocation ? "Getting location..." : "Get Location"}
      </button>

      {location && (
        <p style={{ fontSize: "12px", color: "green" }}>
          Location captured ✅
        </p>
      )}

      <button
        onClick={handleRegister}
        style={{ width: "100%" }}
      >
        Register
      </button>
    </div>
  );
};

export default RegisterPage;