import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import "../styles/global.css";
import "../styles/home.css";

const SKILL_FILTERS = [
  { value: "all", label: "All" },
  { value: "plumber", label: "🔧 Plumber" },
  { value: "electrician", label: "⚡ Electrician" },
  { value: "painter", label: "🎨 Painter" },
  { value: "carpenter", label: "🪚 Carpenter" },
];

const SERVICE_ICONS = {
  plumber: "🔧",
  electrician: "⚡",
  painter: "🎨",
  carpenter: "🪚",
};

const getInitials = (name) =>
  name?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "?";

const HomePage = () => {
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("all");
  const [bookingId, setBookingId] = useState(null); // track which worker is being booked
  const [toast, setToast] = useState({ show: false, msg: "", type: "" });
  const navigate = useNavigate();

  useEffect(() => {
    getWorkers();
  }, []);

  const showToast = (msg, type = "success") => {
    setToast({ show: true, msg, type });
    setTimeout(() => setToast({ show: false, msg: "", type: "" }), 3000);
  };

  const getWorkers = async () => {
    setLoading(true);
    try {
      // Use real GPS if available, fallback to Vizag
      const position = await new Promise((resolve) =>
        navigator.geolocation.getCurrentPosition(resolve, () =>
          resolve({ coords: { latitude: 17.7, longitude: 83.3 } })
        )
      );
      const { latitude: lat, longitude: lng } = position.coords;
      const res = await API.get(`/workers/nearby?lat=${lat}&lng=${lng}`);
      setWorkers(res.data);
    } catch (err) {
      console.error(err);
      showToast("Could not load workers", "error");
    } finally {
      setLoading(false);
    }
  };

  const bookWorker = async (workerId) => {
    // Get real userId from localStorage (set after login, or use anonymous id)
    const userId = localStorage.getItem("userId") || "guest-" + Date.now();

    setBookingId(workerId);
    try {
      await API.post("/bookings", {
        userId,
        workerId,
        serviceType: workers.find((w) => w._id === workerId)?.skills?.[0] || "general",
      });
      showToast("Booking sent! Worker will be notified shortly.", "success");
    } catch (err) {
      const msg = err.response?.data?.message || "Booking failed";
      showToast(msg, "error");
    } finally {
      setBookingId(null);
    }
  };

  const filteredWorkers =
    activeFilter === "all"
      ? workers
      : workers.filter((w) => w.skills?.includes(activeFilter));

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

      {/* Filters */}
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
          <h2 className="section-title">Available Near You</h2>
          {!loading && (
            <span className="section-count">{filteredWorkers.length} found</span>
          )}
        </div>

        {loading ? (
          <div className="workers-grid">
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton-card">
                <div className="skeleton" style={{ width: "48px", height: "48px", borderRadius: "14px", marginBottom: "12px" }} />
                <div className="skeleton" style={{ width: "60%", height: "16px", marginBottom: "8px" }} />
                <div className="skeleton" style={{ width: "40%", height: "13px", marginBottom: "16px" }} />
                <div className="skeleton" style={{ width: "100%", height: "36px" }} />
              </div>
            ))}
          </div>
        ) : filteredWorkers.length === 0 ? (
          <div className="empty-state">
            <span className="empty-state__icon">🔍</span>
            <p className="empty-state__text">No workers available in this category right now</p>
          </div>
        ) : (
          <div className="workers-grid">
            {filteredWorkers.map((w) => (
              <div className="worker-card" key={w._id}>
                <div className="worker-card__top">
                  <div className="worker-avatar">{getInitials(w.name)}</div>
                  <div className="worker-availability">Available</div>
                </div>

                <div className="worker-name">{w.name}</div>

                <div className="worker-skills">
                  {w.skills?.map((s) => (
                    <span key={s} className="skill-tag">
                      {SERVICE_ICONS[s] || "🛠️"} {s}
                    </span>
                  ))}
                </div>

                <div className="worker-meta">
                  <span className="worker-distance">
                    📍 {w.distance ? `${(w.distance / 1000).toFixed(1)} km away` : "Nearby"}
                  </span>
                  {w.rating > 0 && (
                    <span className="worker-rating">⭐ {w.rating.toFixed(1)}</span>
                  )}
                </div>

                <button
                  className="book-btn"
                  onClick={() => bookWorker(w._id)}
                  disabled={bookingId === w._id}
                >
                  {bookingId === w._id ? (
                    <>
                      <span className="spinner" />
                      Booking...
                    </>
                  ) : (
                    "Book Now"
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Toast */}
      <div className={`toast toast--${toast.type} ${toast.show ? "show" : ""}`}>
        {toast.msg}
      </div>
    </div>
  );
};

export default HomePage;
