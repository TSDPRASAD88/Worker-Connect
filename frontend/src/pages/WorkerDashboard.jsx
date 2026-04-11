import { useEffect, useState } from "react";
import { connectSocket } from "../hooks/useSocket";
import API from "../services/api";
import "../styles/dashboard.css";
import "../styles/global.css";

const WorkerDashboard = () => {
  const [bookings, setBookings] = useState([]);

  useEffect(() => {
    const socket = connectSocket();

    if (!socket) return;

    socket.on("connect", () => {
      console.log("🟢 CONNECTED:", socket.id);
    });

    socket.on("connect_error", (err) => {
      console.log("🔴 CONNECT ERROR:", err.message);
    });

    socket.on("new-booking", (data) => {
      setBookings((prev) => [...prev, data]);
    });

    socket.on("disconnect", () => {
      console.log("❌ Socket disconnected");
    });

    return () => {};
  }, []);

  const acceptBooking = async (id) => {
    try {
      await API.put(`/bookings/${id}`, {
        status: "accepted",
      });

      setBookings((prev) =>
        prev.map((b) =>
          b._id === id ? { ...b, status: "accepted" } : b
        )
      );
    } catch (err) {
      console.error(err);
    }
  };

  const completeBooking = async (id) => {
    try {
      await API.put(`/bookings/${id}`, {
        status: "completed",
      });

      setBookings((prev) =>
        prev.map((b) =>
          b._id === id ? { ...b, status: "completed" } : b
        )
      );
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="container">
      <h2 className="dashboard-title">Incoming Jobs</h2>

      {bookings.length === 0 && <p>No jobs yet</p>}

      {bookings.map((b) => (
        <div className="job-card" key={b._id}>
          <p><strong>{b.serviceType}</strong></p>
          <p className="job-status">Status: {b.status}</p>

          {b.status === "pending" && (
            <button
              className="job-btn accept-btn"
              onClick={() => acceptBooking(b._id)}
            >
              Accept
            </button>
          )}

          {b.status === "accepted" && (
            <button
              className="job-btn complete-btn"
              onClick={() => completeBooking(b._id)}
            >
              Complete
            </button>
          )}
        </div>
      ))}
    </div>
  );
};

export default WorkerDashboard;