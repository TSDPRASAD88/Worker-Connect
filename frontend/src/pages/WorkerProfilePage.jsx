import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../services/api";
import "../styles/global.css";
import "../styles/worker-profile.css";

const SERVICE_ICONS = {
  plumber: "🔧", electrician: "⚡", painter: "🎨",
  carpenter: "🪚", "house cleaning": "🧹",
  construction: "🏗️", labour: "💪", other: "✏️", general: "🛠️",
};

const AVATAR_COLORS = [
  ["#FF5C00", "#fff"], ["#3B82F6", "#fff"], ["#10B981", "#fff"],
  ["#8B5CF6", "#fff"], ["#F59E0B", "#fff"], ["#EF4444", "#fff"],
  ["#06B6D4", "#fff"], ["#EC4899", "#fff"],
];

const getInitials = (name) =>
  name?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "?";

const getAvatarColors = (name) =>
  AVATAR_COLORS[(name?.charCodeAt(0) || 0) % AVATAR_COLORS.length];

const StarRating = ({ value, onChange, readonly = false }) => (
  <div className="star-row">
    {[1, 2, 3, 4, 5].map((star) => (
      <span
        key={star}
        className={`star ${star <= value ? "star--filled" : ""} ${!readonly ? "star--interactive" : ""}`}
        onClick={() => !readonly && onChange && onChange(star)}
      >
        ★
      </span>
    ))}
  </div>
);

const WorkerProfilePage = () => {
  const { workerId } = useParams();
  const navigate = useNavigate();

  const [worker, setWorker] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bookingId, setBookingId] = useState(null);
  const [booking, setBooking] = useState(false);
  const [toast, setToast] = useState({ show: false, msg: "", type: "" });

  // Review form state
  const [reviewable, setReviewable] = useState(null); // booking eligible for review
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  const userId = (() => {
    let id = localStorage.getItem("userId");
    if (!id) { id = "guest-" + Date.now(); localStorage.setItem("userId", id); }
    return id;
  })();

  const showToast = (msg, type = "success") => {
    setToast({ show: true, msg, type });
    setTimeout(() => setToast({ show: false, msg: "", type: "" }), 3000);
  };

  useEffect(() => {
    fetchWorker();
    checkReviewable();
  }, [workerId]);

  const fetchWorker = async () => {
    try {
      const res = await API.get(`/workers/${workerId}/profile`);
      setWorker(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Check if this user has a completed+unreviewed booking with this worker
  const checkReviewable = async () => {
    try {
      const res = await API.get(`/bookings/user/${userId}`);
      const eligible = res.data.find(
        (b) =>
          b.workerId?._id === workerId &&
          ["completed", "paid"].includes(b.status) &&
          !b.reviewed
      );
      setReviewable(eligible || null);
    } catch {}
  };

  const bookWorker = async () => {
    if (!worker?.availability) return;
    setBooking(true);
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
      setBooking(false);
    }
  };

  const submitReview = async () => {
    if (!reviewable) return;
    setSubmittingReview(true);
    try {
      await API.post(`/bookings/${reviewable._id}/review`, {
        userId,
        rating: reviewRating,
        comment: reviewComment,
      });
      showToast("⭐ Review submitted! Thank you.", "success");
      setShowReviewForm(false);
      setReviewable(null);
      fetchWorker(); // refresh rating
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to submit review", "error");
    } finally {
      setSubmittingReview(false);
    }
  };

  const formatDate = (d) =>
    new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

  if (loading) {
    return (
      <div className="profile-page">
        <div className="profile-loading">
          <div className="spinner spinner--dark" style={{ width: 32, height: 32 }} />
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!worker) {
    return (
      <div className="profile-page">
        <div className="profile-loading">
          <p>Worker not found.</p>
          <button className="btn btn--primary" onClick={() => navigate("/")}>Go Home</button>
        </div>
      </div>
    );
  }

  const [bgColor, textColor] = getAvatarColors(worker.name);
  const displaySkill =
    worker.skills?.[0] === "other" && worker.customSkill
      ? worker.customSkill
      : worker.skills?.[0];

  const reviews = worker.reviews || [];
  const reviewCount = reviews.length;

  return (
    <div className="profile-page">
      {/* Top bar */}
      <div className="profile-topbar">
        <button className="profile-back" onClick={() => navigate(-1)}>←</button>
        <span className="profile-topbar__title">Worker Profile</span>
        <div />
      </div>

      {/* Hero card */}
      <div className="profile-hero">
        <div className="profile-avatar" style={{ background: bgColor, color: textColor }}>
          {getInitials(worker.name)}
        </div>

        <h1 className="profile-name">{worker.name}</h1>

        <div className="profile-skill-badge">
          {SERVICE_ICONS[worker.skills?.[0]] || "🛠️"} {displaySkill}
        </div>

        {worker.area && (
          <div className="profile-location">📍 {worker.area}</div>
        )}

        <div className="profile-rating-row">
          <StarRating value={Math.round(worker.rating)} readonly />
          <span className="profile-rating-val">
            {worker.rating > 0 ? worker.rating.toFixed(1) : "No ratings yet"}
          </span>
          {reviewCount > 0 && (
            <span className="profile-review-count">({reviewCount} review{reviewCount !== 1 ? "s" : ""})</span>
          )}
        </div>

        <div className={`profile-availability ${worker.availability ? "avail--on" : "avail--off"}`}>
          <span className="avail-dot" />
          {worker.availability ? "Available Now" : "Currently Busy"}
        </div>
      </div>

      {/* Action buttons */}
      <div className="profile-actions">
        <a className="profile-action-btn profile-action-btn--call" href={`tel:${worker.phone}`}>
          📞 Call
        </a>
        <button
          className={`profile-action-btn profile-action-btn--book ${!worker.availability ? "disabled" : ""}`}
          onClick={bookWorker}
          disabled={booking || !worker.availability}
        >
          {booking ? <><span className="spinner" /> Booking...</> : "Book Now"}
        </button>
      </div>

      {/* Leave a review CTA */}
      {reviewable && !showReviewForm && (
        <div className="review-cta">
          <div className="review-cta__text">
            <span>⭐</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14 }}>Rate your experience</div>
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
                You used this worker's service — share your feedback!
              </div>
            </div>
          </div>
          <button className="btn btn--primary btn--sm" onClick={() => setShowReviewForm(true)}>
            Write Review
          </button>
        </div>
      )}

      {/* Review form */}
      {showReviewForm && (
        <div className="review-form-card">
          <h3 className="review-form-title">Your Review</h3>
          <p className="review-form-sub">How was your experience with {worker.name}?</p>
          <StarRating value={reviewRating} onChange={setReviewRating} />
          <textarea
            className="review-textarea"
            placeholder="Write something about the service... (optional)"
            value={reviewComment}
            onChange={(e) => setReviewComment(e.target.value)}
            rows={3}
          />
          <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
            <button className="btn btn--ghost" style={{ flex: 1 }} onClick={() => setShowReviewForm(false)}>
              Cancel
            </button>
            <button
              className="btn btn--primary"
              style={{ flex: 2 }}
              onClick={submitReview}
              disabled={submittingReview}
            >
              {submittingReview ? <><span className="spinner" /> Submitting...</> : "Submit Review"}
            </button>
          </div>
        </div>
      )}

      {/* Reviews section */}
      <div className="reviews-section">
        <h2 className="reviews-title">
          Customer Reviews
          {reviewCount > 0 && <span className="reviews-badge">{reviewCount}</span>}
        </h2>

        {reviews.length === 0 ? (
          <div className="reviews-empty">
            <span>💬</span>
            <p>No reviews yet. Be the first to review!</p>
          </div>
        ) : (
          <div className="reviews-list">
            {[...reviews].reverse().map((r, i) => (
              <div key={i} className="review-card">
                <div className="review-card__header">
                  <div className="review-user-avatar">
                    {r.userId?.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="review-user-name">Customer</div>
                    <div className="review-date">{formatDate(r.createdAt)}</div>
                  </div>
                  <div className="review-stars">
                    <StarRating value={r.rating} readonly />
                  </div>
                </div>
                {r.comment && (
                  <p className="review-comment">{r.comment}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className={`toast toast--${toast.type} ${toast.show ? "show" : ""}`}>
        {toast.msg}
      </div>
    </div>
  );
};

export default WorkerProfilePage;
