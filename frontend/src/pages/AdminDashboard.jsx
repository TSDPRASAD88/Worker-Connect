import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import "../styles/global.css";
import "../styles/payment-admin.css";

const SKILLS = [
  "plumber", "electrician", "painter", "carpenter",
  "house cleaning", "construction", "labour", "other",
];

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState("workers");
  const [workers, setWorkers] = useState([]);
  const [workerSearch, setWorkerSearch] = useState("");
  const [loadingWorkers, setLoadingWorkers] = useState(true);
  const [bookings, setBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [stats, setStats] = useState(null);
  const [editWorker, setEditWorker] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState({ show: false, msg: "", type: "" });

  const showToast = (msg, type = "success") => {
    setToast({ show: true, msg, type });
    setTimeout(() => setToast({ show: false, msg: "", type: "" }), 3000);
  };

  useEffect(() => {
    const isAdmin = localStorage.getItem("isAdmin");
    if (!isAdmin || isAdmin !== "true") { navigate("/login"); return; }
    fetchStats();
    fetchWorkers();
  }, []);

  useEffect(() => {
    if (tab === "bookings" && bookings.length === 0) fetchBookings();
  }, [tab]);

  const fetchStats = async () => {
    try { const res = await API.get("/admin/stats"); setStats(res.data); } catch {}
  };

  const fetchWorkers = async () => {
    setLoadingWorkers(true);
    try { const res = await API.get("/admin/workers"); setWorkers(res.data); }
    catch { showToast("Failed to load workers", "error"); }
    finally { setLoadingWorkers(false); }
  };

  const fetchBookings = async () => {
    setLoadingBookings(true);
    try { const res = await API.get("/admin/bookings"); setBookings(res.data); }
    catch { showToast("Failed to load bookings", "error"); }
    finally { setLoadingBookings(false); }
  };

  const toggleAvailability = async (worker) => {
    try {
      const res = await API.put(`/admin/workers/${worker._id}`, { availability: !worker.availability });
      setWorkers((prev) => prev.map((w) => (w._id === worker._id ? res.data : w)));
      showToast(`${worker.name} is now ${!worker.availability ? "available" : "offline"}`);
    } catch { showToast("Update failed", "error"); }
  };

  const openEdit = (worker) => {
    setEditWorker(worker);
    setEditForm({ name: worker.name, phone: worker.phone, area: worker.area || "", skills: worker.skills?.[0] || "plumber", customSkill: worker.customSkill || "" });
  };

  const saveEdit = async () => {
    setSaving(true);
    try {
      const res = await API.put(`/admin/workers/${editWorker._id}`, {
        name: editForm.name, phone: editForm.phone, area: editForm.area,
        skills: [editForm.skills],
        customSkill: editForm.skills === "other" ? editForm.customSkill : "",
      });
      setWorkers((prev) => prev.map((w) => (w._id === editWorker._id ? res.data : w)));
      setEditWorker(null);
      showToast("Worker updated!");
    } catch (err) { showToast(err.response?.data?.message || "Save failed", "error"); }
    finally { setSaving(false); }
  };

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await API.delete(`/admin/workers/${deleteId}`);
      setWorkers((prev) => prev.filter((w) => w._id !== deleteId));
      setDeleteId(null);
      showToast("Worker deleted");
      fetchStats();
    } catch { showToast("Delete failed", "error"); }
    finally { setDeleting(false); }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("workerId");
    localStorage.removeItem("isAdmin");
    navigate("/login");
  };

  const filteredWorkers = workers.filter((w) => {
    const q = workerSearch.toLowerCase();
    return w.name?.toLowerCase().includes(q) || w.area?.toLowerCase().includes(q) ||
      w.skills?.join(" ").toLowerCase().includes(q) || w.phone?.includes(q);
  });

  const fmt = (d) => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

  const STAT_ITEMS = [
    { label: "Total Workers",   value: stats?.totalWorkers,     color: "" },
    { label: "Available Now",   value: stats?.availableWorkers, color: "stat-value--success" },
    { label: "Total Bookings",  value: stats?.totalBookings,    color: "stat-value--brand" },
    { label: "Pending",         value: stats?.pendingBookings,  color: "" },
    { label: "Completed",       value: stats?.completedBookings,color: "stat-value--success" },
    { label: "Paid",            value: stats?.paidBookings,     color: "" },
  ];

  return (
    <div className="admin-page">
      <nav className="navbar">
        <div className="navbar__inner">
          <span className="navbar__brand">
            Vizag<span>Connect</span>
            <span style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: 500, marginLeft: "8px" }}>Admin</span>
          </span>
          <div className="navbar__actions">
            <button className="btn btn--ghost btn--sm" onClick={handleLogout}>Logout</button>
          </div>
        </div>
      </nav>

      {/* Stats */}
      <div className="admin-stats">
        <div className="admin-stats__inner">
          {STAT_ITEMS.map((s) => (
            <div key={s.label} className="stat-item">
              <div className={`stat-value ${s.color}`}>{s.value ?? "—"}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="admin-section">
        {/* Tabs */}
        <div className="tab-bar">
          <button className={`tab-btn ${tab === "workers" ? "active" : ""}`} onClick={() => setTab("workers")}>👷 Workers</button>
          <button className={`tab-btn ${tab === "bookings" ? "active" : ""}`} onClick={() => setTab("bookings")}>📋 Bookings</button>
        </div>

        {/* Workers tab */}
        {tab === "workers" && (
          <>
            <div className="admin-search">
              <div style={{ position: "relative", maxWidth: "320px", flex: 1 }}>
                <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>🔍</span>
                <input
                  className="form-input"
                  style={{ paddingLeft: "36px" }}
                  placeholder="Search name, area, skill, phone..."
                  value={workerSearch}
                  onChange={(e) => setWorkerSearch(e.target.value)}
                />
              </div>
              <span style={{ fontSize: "13px", color: "var(--text-muted)", alignSelf: "center" }}>
                {filteredWorkers.length} workers
              </span>
            </div>

            {loadingWorkers ? (
              <div style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>Loading...</div>
            ) : filteredWorkers.length === 0 ? (
              <div className="empty-state"><span className="empty-state__icon">👷</span><p className="empty-state__text">No workers found</p></div>
            ) : (
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Worker</th><th>Phone</th><th>Skill</th><th>Area</th>
                      <th>Status</th><th>Joined</th><th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredWorkers.map((w) => {
                      const displaySkill = w.skills?.[0] === "other" && w.customSkill ? w.customSkill : w.skills?.[0] || "—";
                      return (
                        <tr key={w._id}>
                          <td>
                            <div style={{ fontWeight: 600 }}>{w.name}</div>
                            <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>{w.email}</div>
                          </td>
                          <td>{w.phone}</td>
                          <td style={{ textTransform: "capitalize" }}>{displaySkill}</td>
                          <td>{w.area || <span style={{ color: "var(--text-muted)" }}>—</span>}</td>
                          <td>
                            <button
                              className={`avail-toggle ${w.availability ? "avail-toggle--on" : "avail-toggle--off"}`}
                              onClick={() => toggleAvailability(w)}
                            >
                              {w.availability ? "● Available" : "○ Offline"}
                            </button>
                          </td>
                          <td style={{ fontSize: "13px", color: "var(--text-muted)" }}>{fmt(w.createdAt)}</td>
                          <td>
                            <div className="action-btns">
                              <button className="btn btn--ghost btn--sm" onClick={() => openEdit(w)}>✏️ Edit</button>
                              <button className="btn btn--danger btn--sm" onClick={() => setDeleteId(w._id)}>🗑️</button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {/* Bookings tab */}
        {tab === "bookings" && (
          <>
            {loadingBookings ? (
              <div style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>Loading...</div>
            ) : bookings.length === 0 ? (
              <div className="empty-state"><span className="empty-state__icon">📋</span><p className="empty-state__text">No bookings yet</p></div>
            ) : (
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr><th>Service</th><th>Worker</th><th>Area</th><th>User</th><th>Status</th><th>Payment</th><th>Date</th></tr>
                  </thead>
                  <tbody>
                    {bookings.map((b) => (
                      <tr key={b._id}>
                        <td style={{ textTransform: "capitalize", fontWeight: 600 }}>{b.serviceType}</td>
                        <td>
                          <div>{b.workerId?.name || "—"}</div>
                          <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>{b.workerId?.phone}</div>
                        </td>
                        <td>{b.workerId?.area || "—"}</td>
                        <td style={{ fontSize: "12px", color: "var(--text-muted)", maxWidth: "100px", overflow: "hidden", textOverflow: "ellipsis" }}>{b.userId}</td>
                        <td><span className={`badge badge--${b.status}`}>{b.status}</span></td>
                        <td style={{ textTransform: "capitalize", fontSize: "13px", color: "var(--text-muted)" }}>{b.paymentMethod || "—"}</td>
                        <td style={{ fontSize: "13px", color: "var(--text-muted)" }}>{fmt(b.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>

      {/* Edit Modal */}
      {editWorker && (
        <div className="modal-overlay" onClick={() => setEditWorker(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">Edit Worker</h3>
            {[
              { label: "Full Name", key: "name",  placeholder: "Ravi Kumar" },
              { label: "Phone",     key: "phone", placeholder: "+91 98765 43210" },
              { label: "Area",      key: "area",  placeholder: "Gajuwaka" },
            ].map((f) => (
              <div key={f.key} className="form-group">
                <label className="form-label">{f.label}</label>
                <input className="form-input" placeholder={f.placeholder} value={editForm[f.key]}
                  onChange={(e) => setEditForm({ ...editForm, [f.key]: e.target.value })} />
              </div>
            ))}
            <div className="form-group">
              <label className="form-label">Skill</label>
              <select className="form-select" value={editForm.skills}
                onChange={(e) => setEditForm({ ...editForm, skills: e.target.value })}>
                {SKILLS.map((s) => <option key={s} value={s} style={{ textTransform: "capitalize" }}>{s}</option>)}
              </select>
            </div>
            {editForm.skills === "other" && (
              <div className="form-group">
                <label className="form-label">Custom Skill</label>
                <input className="form-input" placeholder="e.g. AC Repair" value={editForm.customSkill}
                  onChange={(e) => setEditForm({ ...editForm, customSkill: e.target.value })} />
              </div>
            )}
            <div style={{ display: "flex", gap: "10px", marginTop: "8px" }}>
              <button className="btn btn--ghost" style={{ flex: 1 }} onClick={() => setEditWorker(null)}>Cancel</button>
              <button className="btn btn--primary" style={{ flex: 1 }} onClick={saveEdit} disabled={saving}>
                {saving ? <><span className="spinner" /> Saving...</> : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deleteId && (
        <div className="modal-overlay" onClick={() => setDeleteId(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">Delete Worker?</h3>
            <p style={{ fontSize: "14px", color: "var(--text-secondary)", marginBottom: "24px" }}>
              This permanently deletes the worker and all their bookings. Cannot be undone.
            </p>
            <div style={{ display: "flex", gap: "10px" }}>
              <button className="btn btn--ghost" style={{ flex: 1 }} onClick={() => setDeleteId(null)}>Cancel</button>
              <button className="btn btn--danger" style={{ flex: 1 }} onClick={confirmDelete} disabled={deleting}>
                {deleting ? <><span className="spinner" /> Deleting...</> : "Yes, Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className={`toast toast--${toast.type} ${toast.show ? "show" : ""}`}>{toast.msg}</div>
    </div>
  );
};

export default AdminDashboard;
