import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../services/api";
import "../styles/global.css";
import "../styles/payment-admin.css";

const UPI_ID = import.meta.env.VITE_UPI_ID || "yourname@upi";

const PaymentPage = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [confirming, setConfirming] = useState(false);
  const [paid, setPaid] = useState(false);
  const [toast, setToast] = useState({ show: false, msg: "", type: "" });
  const [copied, setCopied] = useState(false);

  const showToast = (msg, type = "success") => {
    setToast({ show: true, msg, type });
    setTimeout(() => setToast({ show: false, msg: "", type: "" }), 3000);
  };

  useEffect(() => {
    fetchBooking();
  }, [bookingId]);

  const fetchBooking = async () => {
    setLoading(true);
    try {
      const res = await API.get(`/bookings/${bookingId}`);
      setBooking(res.data);
      if (res.data.status === "paid") setPaid(true);
    } catch (err) {
      showToast("Could not load booking details", "error");
    } finally {
      setLoading(false);
    }
  };

  const confirmPayment = async () => {
    if (!selected) { showToast("Please select a payment method", "error"); return; }
    setConfirming(true);
    try {
      await API.put(`/bookings/${bookingId}`, { status: "paid", paymentMethod: selected });
      setPaid(true);
      showToast("Payment confirmed! 🎉", "success");
    } catch (err) {
      showToast(err.response?.data?.message || "Confirmation failed", "error");
    } finally {
      setConfirming(false);
    }
  };

  const copyUPI = () => {
    navigator.clipboard.writeText(UPI_ID).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="payment-page">
      <nav className="navbar">
        <div className="navbar__inner">
          <span className="navbar__brand">Vizag<span>Connect</span></span>
          <div className="navbar__actions">
            <button className="btn btn--ghost btn--sm" onClick={() => navigate("/worker")}>
              ← Dashboard
            </button>
          </div>
        </div>
      </nav>

      <div className="payment-section">
        <div className="payment-card">

          {loading ? (
            <>
              <div className="skeleton" style={{ height: "22px", width: "50%", marginBottom: "12px" }} />
              <div className="skeleton" style={{ height: "90px", marginBottom: "12px" }} />
              <div className="skeleton" style={{ height: "58px", marginBottom: "10px" }} />
              <div className="skeleton" style={{ height: "58px" }} />
            </>
          ) : paid ? (
            <div className="paid-success">
              <span className="paid-icon">🎉</span>
              <div className="paid-title">Payment Confirmed!</div>
              <p className="paid-msg">
                {booking?.paymentMethod === "upi"
                  ? "UPI payment recorded. Thank you!"
                  : "Cash payment recorded. Thank you!"}
              </p>
              <button
                className="confirm-btn"
                style={{ marginTop: "24px" }}
                onClick={() => navigate("/worker")}
              >
                Back to Dashboard
              </button>
            </div>
          ) : (
            <>
              <h2 className="payment-title">Payment</h2>
              <p className="payment-subtitle">Confirm payment for the completed job</p>

              {booking && (
                <div className="job-summary">
                  <div className="job-summary__row">
                    <span>Service</span>
                    <strong style={{ textTransform: "capitalize" }}>{booking.serviceType}</strong>
                  </div>
                  <div className="job-summary__row">
                    <span>Worker</span>
                    <strong>{booking.workerId?.name || "—"}</strong>
                  </div>
                  <div className="job-summary__row">
                    <span>Phone</span>
                    <strong>{booking.workerId?.phone || "—"}</strong>
                  </div>
                  <div className="job-summary__row">
                    <span>Status</span>
                    <span className={`badge badge--${booking.status}`}>{booking.status}</span>
                  </div>
                </div>
              )}

              <p className="payment-methods-title">Choose Payment Method</p>

              <div className="payment-methods">
                {[
                  { key: "upi",  icon: "📱", name: "UPI / GPay / PhonePe", desc: "Pay instantly via UPI" },
                  { key: "cash", icon: "💵", name: "Cash on Completion",   desc: "Pay directly to the worker" },
                ].map((m) => (
                  <button
                    key={m.key}
                    className={`payment-method-btn ${selected === m.key ? "selected" : ""}`}
                    onClick={() => setSelected(m.key)}
                  >
                    <span className="payment-method-icon">{m.icon}</span>
                    <div>
                      <div className="payment-method-name">{m.name}</div>
                      <div className="payment-method-desc">{m.desc}</div>
                    </div>
                    {selected === m.key && (
                      <span style={{ marginLeft: "auto", color: "var(--brand)", fontSize: "20px" }}>✓</span>
                    )}
                  </button>
                ))}
              </div>

              {selected === "upi" && (
                <div className="upi-box">
                  <div className="upi-id">{UPI_ID}</div>
                  <div className="upi-hint">Open any UPI app and pay to the above ID</div>
                  <button className="btn btn--ghost btn--sm" style={{ marginTop: "12px" }} onClick={copyUPI}>
                    {copied ? "✅ Copied!" : "📋 Copy UPI ID"}
                  </button>
                </div>
              )}

              {selected === "cash" && (
                <div className="upi-box" style={{ marginBottom: "16px" }}>
                  <div style={{ fontSize: "32px", marginBottom: "6px" }}>💵</div>
                  <div style={{ fontWeight: 600, color: "var(--text-primary)", marginBottom: "4px" }}>
                    Collect cash from the customer
                  </div>
                  <div className="upi-hint">Click confirm once cash has been received</div>
                </div>
              )}

              <button className="confirm-btn" onClick={confirmPayment} disabled={confirming || !selected}>
                {confirming
                  ? <><span className="spinner" /> Confirming...</>
                  : "Confirm Payment ✓"}
              </button>
            </>
          )}
        </div>
      </div>

      <div className={`toast toast--${toast.type} ${toast.show ? "show" : ""}`}>{toast.msg}</div>
    </div>
  );
};

export default PaymentPage;
