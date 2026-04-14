import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import { connectUserSocket } from "../hooks/useSocket";
import "../styles/global.css";
import "../styles/home.css";

const SKILL_FILTERS = [
  { value: "all",            label: "All" },
  { value: "plumber",        label: "🔧 Plumber" },
  { value: "electrician",    label: "⚡ Electrician" },
  { value: "painter",        label: "🎨 Painter" },
  { value: "carpenter",      label: "🪚 Carpenter" },
  { value: "house cleaning", label: "🧹 Cleaning" },
  { value: "construction",   label: "🏗️ Construction" },
  { value: "labour",         label: "💪 Labour" },
  { value: "other",          label: "✏️ Other" },
];

const SERVICE_ICONS = {
  plumber: "🔧", electrician: "⚡", painter: "🎨",
  carpenter: "🪚", "house cleaning": "🧹",
  construction: "🏗️", labour: "💪", other: "✏️", general: "🛠️",
};

// Distinct bg colors for avatars based on name
const AVATAR_COLORS = [
  ["#FF5C00", "#fff"],
  ["#3B82F6", "#fff"],
  ["#10B981", "#fff"],
  ["#8B5CF6", "#fff"],
  ["#F59E0B", "#fff"],
  ["#EF4444", "#fff"],
  ["#06B6D4", "#fff"],
  ["#EC4899", "#fff"],
];

const getInitials = (name) =>
  name?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "?";

const getAvatarColors = (name) => {
  const idx = (name?.charCodeAt(0) || 0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[idx];
};

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
  const [allWorkers, setAllWorkers] = useState([]); // ✅ store full list to prevent missing workers
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("all");
  const [areaSearch, setAreaSearch] = useState("");
  const [bookingId, setBookingId] = useState(null);
  const [toast, setToast] = useState({ show: false, msg: "", type: "" });
  const [userCoords, setUserCoords] = useState(null); // ✅ null until GPS resolves
  const [coordsReady, setCoordsReady] = useState(false);
  const [acceptedBookings, setAcceptedBookings] = useState([]);
  const navigate = useNavigate();

  const userId = (() => {
    let id = localStorage.getItem("userId");
    if (!id) { id = "guest-" + Date.now(); localStorage.setItem("userId", id); }
    return id;
  })();

  const debouncedArea = useDebounce(areaSearch, 500);

  const showToast = (msg, type = "success") => {
    setToast({ show: true, msg, type });
    setTimeout(() => setToast({ show: false, msg: "", type: "" }), 3000);
  };

  // ✅ Get GPS once — only trigger fetch after coords are ready
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setCoordsReady(true);
      },
      () => {
        // GPS denied — fall back to Vizag center
        setUserCoords({ lat: 17.7, lng: 83.3 });
        setCoordsReady(true);
      },
      { timeout: 6000 }
    );
  }, []);

  // Connect socket for booking-accepted events
  useEffect(() => {
    const socket = connectUserSocket(userId);
    if (!socket) return;

    socket.on("booking-accepted", ({ bookingId: bId, workerName }) => {
      setAcceptedBookings((prev) => {
        if (prev.some((b) => b.bookingId === bId)) return prev;
        return [...prev, { bookingId: bId, workerName }];
      });
      showToast(`✅ ${workerName} accepted your booking!`, "success");
    });

    return () => { socket.off("booking-accepted"); };
  }, [userId]);

  // ✅ Only fetch when coords are ready
  useEffect(() => {
    if (!coordsReady) return;
    fetchWorkers();
  }, [coordsReady, debouncedArea, activeFilter]);

  // ✅ Client-side filter from full list to prevent workers disappearing
  useEffect(() => {
    if (!allWorkers.length) return;
    let filtered = allWorkers;
    if (activeFilter !== "all") {
      filtered = filtered.filter((w) =>
        w.skills?.some((s) => s.toLowerCase() === activeFilter.toLowerCase())
      );
    }
    if (debouncedArea.trim()) {
      filtered = filtered.filter((w) =>
        w.area?.toLowerCase().includes(debouncedArea.trim().toLowerCase())
      );
    }
    setWorkers(filtered);
  }, [allWorkers, activeFilter, debouncedArea]);

  const fetchWorkers = async () => {
    setLoading(true);
    try {
      // ✅ Always fetch ALL nearby workers, filter client-side
      const params = new URLSearchParams({
        lat: userCoords.lat,
        lng: userCoords.lng,
      });

      const res = await API.get(`/workers/nearby?${params.toString()}`);
      setAllWorkers(res.data);   // store full list
      setWorkers(res.data);      // display full list initially
    } catch (err) {
      console.error(err);
      showToast("Could not load workers", "error");
    } finally {
      setLoading(false);
    }
  };

  const bookWorker = async (e, worker) => {
    e.stopPropagation(); // don't navigate to profile
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

  const displayedWorkers = workers;

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

      {/* Accepted booking banners */}
      {acceptedBookings.map((b) => (
        <div key={b.bookingId} className="accepted-banner">
          <span>🟢 <strong>{b.workerName}</strong> accepted your booking!</span>
          <button onClick={() => navigate(`/track/${b.bookingId}`)}>📍 Track Live</button>
        </div>
      ))}

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
            <button className="btn btn--ghost btn--sm" onClick={() => setAreaSearch("")}>Clear</button>
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
          {!loading && <span className="section-count">{displayedWorkers.length} found</span>}
        </div>

        {loading ? (
          <div className="workers-grid">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="skeleton-card">
                <div className="skeleton" style={{ width: "56px", height: "56px", borderRadius: "50%", marginBottom: "12px" }} />
                <div className="skeleton" style={{ width: "60%", height: "16px", marginBottom: "8px" }} />
                <div className="skeleton" style={{ width: "40%", height: "13px", marginBottom: "16px" }} />
                <div className="skeleton" style={{ width: "100%", height: "36px" }} />
              </div>
            ))}
          </div>
        ) : displayedWorkers.length === 0 ? (
          <div className="empty-state">
            <span className="empty-state__icon">🔍</span>
            <p className="empty-state__text">
              No workers found{areaSearch ? ` in "${areaSearch}"` : " nearby"}. Try a different area or category.
            </p>
          </div>
        ) : (
          <div className="workers-grid">
            {displayedWorkers.map((w) => {
              const displaySkill =
                w.skills?.[0] === "other" && w.customSkill ? w.customSkill : w.skills?.[0];
              const [bgColor, textColor] = getAvatarColors(w.name);

              return (
                <div
                  className="worker-card"
                  key={w._id}
                  onClick={() => navigate(`/worker/${w._id}`)}
                  style={{ cursor: "pointer" }}
                >
                  {/* DP Avatar */}
                  <div className="worker-card__top">
                    <div
                      className="worker-avatar worker-avatar--lg"
                      style={{ background: bgColor, color: textColor }}
                    >
                      {getInitials(w.name)}
                    </div>
                    <div className="worker-availability">Available</div>
                  </div>

                  <div className="worker-name">{w.name}</div>

                  {w.area
                    ? <div className="worker-area">📍 {w.area}</div>
                    : <div className="worker-area-placeholder" />
                  }

                  <div className="worker-skills">
                    <span className="skill-tag">
                      {SERVICE_ICONS[w.skills?.[0]] || "🛠️"} {displaySkill}
                    </span>
                  </div>

                  <div className="worker-meta">
                    <span className="worker-distance">
                      📍 {(w.distance / 1000).toFixed(1)} km away
                    </span>
                    {w.rating > 0 && (
                      <span className="worker-rating">⭐ {w.rating.toFixed(1)}</span>
                    )}
                  </div>

                  <div className="worker-actions" onClick={(e) => e.stopPropagation()}>
                    <a className="contact-btn" href={`tel:${w.phone}`} title={`Call ${w.name}`}>📞</a>
                    <a className="contact-btn" href={`mailto:${w.email}`} title={`Email ${w.name}`}>✉️</a>
                    <button
                      className="book-btn"
                      onClick={(e) => bookWorker(e, w)}
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
