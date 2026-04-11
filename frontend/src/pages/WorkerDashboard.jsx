import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { connectSocket, disconnectSocket } from "../hooks/useSocket";
import API from "../services/api";
import "../styles/global.css";
import "../styles/dashboard.css";

const SERVICE_ICONS = {
  plumber: "🔧",
  electrician: "⚡",
  painter: "🎨",
  carpenter: "🪚",
  general: "🛠️",
};

const formatTime = (dateStr) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
};

const WorkerDashboard = () => {
  const [bookings, setBookings] = useState([]);
  const [connected, setConnected] = useState(false);
  const [loadingId, setLoadingId] = useState(null);
  const [toast, setToast] = useState({ show: false, msg: "", type: "" });
  const navigate = useNavigate();

  const workerId = localStorage.getItem("workerId");

  const showToast = (msg, type = "success") => {
    setToast({ show: true, msg, type });
    setTimeout(() => setToast({ show: false, msg: "", type: "" }), 3000);
  };

  // Load existing bookings for this worker on mount
  useEffect(() => {
    if (!workerId) {
      navigate("/login");
      return;
    }
    loadBookings();
  }, []);

  const loadBookings = async () => {
    try {
      const res = await API.get(`/bookings/worker/${workerId}`);
      setBookings(res.data);
    } catch (err) {
      console.error("Failed to load bookings:", err);
    }
  };

  // Socket connection
  useEffect(() => {
    const socket = connectSocket();
    if (!socket) {
      navigate("/login");
      return;
    }

    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));
    socket.on("connect_error", () => setConnected(false));

    socket.on("new-booking", (data) => {
      setBookings((prev) => {
        // Deduplicate: ignore if booking with same _id already exists
        if (prev.some((b) => b._id === data._id)) return prev;
        return [data, ...prev];
      });
      showToast("🔔 New job request received!", "success");
    });

    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("connect_error");
      socket.off("new-booking");
    };
  }, []);

  const updateBooking = async (id, status) => {
    setLoadingId(id);
    try {
      await API.put(`/bookings/${id}`, { status });
      setBookings((prev) =>
        prev.map((b) => (b._id === id ? { ...b, status } : b))
      );
      showToast(status === "accepted" ? "Job accepted!" : "Job marked complete ✅");
    } catch (err) {
      showToast(err.response?.data?.message || "Update failed", "error");
    } finally {
      setLoadingId(null);
    }
  };

  const handleLogout = () => {
    disconnectSocket();
    localStorage.removeItem("token");
    localStorage.removeItem("workerId");
    navigate("/login");
  };

  const stats = {
    total: bookings.length,
    pending: bookings.filter((b) => b.status === "pending").length,
    completed: bookings.filter((b) => b.status === "completed").length,
  };

  return (
    <div className="dashboard-page">
      {/* Navbar */}
      <nav className="navbar">
        <div className="navbar__inner">
          <span className="navbar__brand">Vizag<span>Connect</span></span>
          <div className="navbar__actions">
            <div className={`conn-status ${connected ? "conn-status--connected" : "conn-status--disconnected"}`}>
              <span className="conn-dot" />
              {connected ? "Online" : "Offline"}
            </div>
            <button className="btn btn--ghost btn--sm" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>
      </nav>

      {/* Stats */}
      <div className="stats-bar">
        <div className="stats-bar__inner">
          <div className="stat-item">
            <div className="stat-value stat-value--brand">{stats.total}</div>
            <div className="stat-label">Total Jobs</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">{stats.pending}</div>
            <div className="stat-label">Pending</div>
          </div>
          <div className="stat-item">
            <div className="stat-value stat-value--success">{stats.completed}</div>
            <div className="stat-label">Completed</div>
          </div>
        </div>
      </div>

      {/* Jobs */}
      <div className="jobs-section">
        <div className="jobs-header">
          <h2 className="jobs-title">Incoming Jobs</h2>
          <div className="live-badge">
            <span className="live-dot" />
            Live
          </div>
        </div>

        {bookings.length === 0 ? (
          <div className="empty-state">
            <span className="empty-state__icon">📭</span>
            <p className="empty-state__text">No jobs yet. Stay online to receive requests!</p>
          </div>
        ) : (
          bookings.map((b) => (
            <div
              key={b._id}
              className={`job-card job-card--${b.status}`}
            >
              <div className="job-card__header">
                <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                  <div className="job-icon">
                    {SERVICE_ICONS[b.serviceType] || "🛠️"}
                  </div>
                  <div>
                    <div className="job-service">{b.serviceType}</div>
                    <div className="job-meta">{formatTime(b.createdAt)}</div>
                  </div>
                </div>
                <span className={`badge badge--${b.status}`}>
                  {b.status}
                </span>
              </div>

              <div className="job-actions">
                {b.status === "pending" && (
                  <button
                    className="job-btn job-btn--accept"
                    onClick={() => updateBooking(b._id, "accepted")}
                    disabled={loadingId === b._id}
                  >
                    {loadingId === b._id ? <span className="spinner" /> : "✓"}
                    {loadingId === b._id ? "Accepting..." : "Accept Job"}
                  </button>
                )}
                {b.status === "accepted" && (
                  <button
                    className="job-btn job-btn--complete"
                    onClick={() => updateBooking(b._id, "completed")}
                    disabled={loadingId === b._id}
                  >
                    {loadingId === b._id ? <span className="spinner" /> : "✓"}
                    {loadingId === b._id ? "Completing..." : "Mark Complete"}
                  </button>
                )}
                {b.status === "completed" && (
                  <span style={{ fontSize: "13px", color: "var(--success)", fontWeight: 500 }}>
                    ✅ Job completed
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Toast */}
      <div className={`toast toast--${toast.type} ${toast.show ? "show" : ""}`}>
        {toast.msg}
      </div>
    </div>
  );
};

export default WorkerDashboard;
