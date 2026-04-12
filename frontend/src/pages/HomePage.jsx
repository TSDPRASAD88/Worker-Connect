import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import "../styles/global.css";
import "../styles/home.css";

const SKILL_FILTERS = [
  { value: "all",           label: "All" },
  { value: "plumber",       label: "🔧 Plumber" },
  { value: "electrician",   label: "⚡ Electrician" },
  { value: "painter",       label: "🎨 Painter" },
  { value: "carpenter",     label: "🪚 Carpenter" },
  { value: "house cleaning",label: "🧹 Cleaning" },
  { value: "construction",  label: "🏗️ Construction" },
  { value: "labour",        label: "💪 Labour" },
  { value: "other",         label: "✏️ Other" },
];

const SERVICE_ICONS = {
  plumber: "🔧", electrician: "⚡", painter: "🎨",
  carpenter: "🪚", "house cleaning": "🧹",
  construction: "🏗️", labour: "💪", other: "✏️", general: "🛠️",
};

const getInitials = (name) =>
  name?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "?";

// Debounce helper
const useDebounce = (value, delay) => {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
};

const HomePage = () => {
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("all");
  const [areaSearch, setAreaSearch] = useState("");
  const [bookingId, setBookingId] = useState(null);
  const [toast, setToast] = useState({ show: false, msg: "", type: "" });
  const [userCoords, setUserCoords] = useState({ lat: 17.7, lng: 83.3 });
  const navigate = useNavigate();

  const debouncedArea = useDebounce(areaSearch, 500);

  const showToast = (msg, type = "success") => {
    setToast({ show: true, msg, type });
    setTimeout(() => setToast({ show: false, msg: "", type: "" }), 3000);
  };

  // Get user GPS once
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {} // keep default Vizag coords
    );
  }, []);

  // Fetch workers whenever coords, area, or skill filter changes
  useEffect(() => {
    fetchWorkers();
  }, [userCoords, debouncedArea, activeFilter]);

  const fetchWorkers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        lat: userCoords.lat,
        lng: userCoords.lng,
      });
      if (debouncedArea.trim()) params.append("area", debouncedArea.trim());
      if (activeFilter !== "all") params.append("skill", activeFilter);

      const res = await API.get(`/workers/nearby?${params.toString()}`);
      setWorkers(res.data);
    } catch (err) {
      console.error(err);
      showToast("Could not load workers", "error");
    } finally {
      setLoading(false);
    }
  };

  const bookWorker = async (worker) => {
    const userId = localStorage.getItem("userId") || "guest-" + Date.now();
    localStorage.setItem("userId", userId);

    setBookingId(worker._id);
    try {
      const serviceType =
        worker.skills?.[0] === "other" && worker.customSkill
          ? worker.customSkill
          : worker.skills?.[0] || "general";

      await API.post("/bookings", { userId, workerId: worker._id, serviceType });
      showToast("✅ Booking sent! Worker will be notified.", "success");
    } catch (err) {
      showToast(err.response?.data?.message || "Booking failed", "error");
    } finally {
      setBookingId(null);
    }
  };

  return (
    <div className="home-page">
      {/* Navbar */}
      <nav className="navbar">
        <div className="navbar__inner">
          <span className="navbar__brand">Vizag<span>Connect</span></span>
          <div className="navbar__actions">
            <button className="btn btn--ghost btn--sm" onClick={() => navigate("/login")}>
              Worker Login
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="hero-section">
        <div className="hero-inner">
          <div className="hero-eyebrow">📍 Visakhapatnam</div>
          <h1 className="hero-title">
            Trusted workers,<br />
            <span className="accent">at your doorstep</span>
          </h1>
          <p className="hero-subtitle">
            Book verified plumbers, electricians, painters & more — in your neighbourhood, instantly.
          </p>
        </div>
      </section>

      {/* Area search */}
      <div className="search-bar">
        <div className="search-bar__inner">
          <div className="search-input-wrap">
            <span className="search-icon">🔍</span>
            <input
              className="search-input"
              placeholder="Search by area — Gajuwaka, MVP Colony, Rushikonda..."
              value={areaSearch}
              onChange={(e) => setAreaSearch(e.target.value)}
            />
          </div>
          {areaSearch && (
            <button className="btn btn--ghost btn--sm" onClick={() => setAreaSearch("")}>
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Skill filters */}
      <div className="filter-bar">
        <div className="filter-bar__inner">
          {SKILL_FILTERS.map((f) => (
            <button
              key={f.value}
              className={`filter-chip ${activeFilter === f.value ? "active" : ""}`}
              onClick={() => setActiveFilter(f.value)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Workers */}
      <div className="workers-section">
        <div className="section-header">
          <h2 className="section-title">
            {areaSearch ? `Workers in "${areaSearch}"` : "Available Near You"}
          </h2>
          {!loading && (
            <span className="section-count">{workers.length} found</span>
          )}
        </div>

        {loading ? (
          <div className="workers-grid">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="skeleton-card">
                <div className="skeleton" style={{ width: "48px", height: "48px", borderRadius: "14px", marginBottom: "12px" }} />
                <div className="skeleton" style={{ width: "60%", height: "16px", marginBottom: "8px" }} />
                <div className="skeleton" style={{ width: "40%", height: "13px", marginBottom: "16px" }} />
                <div className="skeleton" style={{ width: "100%", height: "36px" }} />
              </div>
            ))}
          </div>
        ) : workers.length === 0 ? (
          <div className="empty-state">
            <span className="empty-state__icon">🔍</span>
            <p className="empty-state__text">
              No workers found{areaSearch ? ` in "${areaSearch}"` : " nearby"}. Try a different area or category.
            </p>
          </div>
        ) : (
          <div className="workers-grid">
            {workers.map((w) => {
              const displaySkill =
                w.skills?.[0] === "other" && w.customSkill ? w.customSkill : w.skills?.[0];
              return (
                <div className="worker-card" key={w._id}>
                  <div className="worker-card__top">
                    <div className="worker-avatar">{getInitials(w.name)}</div>
                    <div className="worker-availability">Available</div>
                  </div>

                  <div className="worker-name">{w.name}</div>
                  {w.area && (
                    <div className="worker-area">📍 {w.area}</div>
                  )}

                  <div className="worker-skills">
                    <span className="skill-tag">
                      {SERVICE_ICONS[w.skills?.[0]] || "🛠️"} {displaySkill}
                    </span>
                  </div>

                  <div className="worker-meta">
                    <span className="worker-distance">
                      {w.distance ? `${(w.distance / 1000).toFixed(1)} km away` : "Nearby"}
                    </span>
                    {w.rating > 0 && (
                      <span className="worker-rating">⭐ {w.rating.toFixed(1)}</span>
                    )}
                  </div>

                  <div className="worker-actions">
                    {/* Call button */}
                    <a
                      className="contact-btn"
                      href={`tel:${w.phone}`}
                      title={`Call ${w.name}`}
                    >
                      📞
                    </a>
                    {/* Email button */}
                    <a
                      className="contact-btn"
                      href={`mailto:${w.email}`}
                      title={`Email ${w.name}`}
                    >
                      ✉️
                    </a>
                    {/* Book button */}
                    <button
                      className="book-btn"
                      onClick={() => bookWorker(w)}
                      disabled={bookingId === w._id}
                    >
                      {bookingId === w._id
                        ? <><span className="spinner" /> Booking...</>
                        : "Book Now"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className={`toast toast--${toast.type} ${toast.show ? "show" : ""}`}>
        {toast.msg}
      </div>
    </div>
  );
};

export default HomePage;
