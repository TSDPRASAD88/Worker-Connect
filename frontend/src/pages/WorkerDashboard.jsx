import { useEffect, useState } from "react";
import { connectSocket } from "../hooks/useSocket";
import API from "../services/api";

const WorkerDashboard = () => {
  const [bookings, setBookings] = useState([]);

  useEffect(() => {
    console.log("🔥 WorkerDashboard mounted");

    const socket = connectSocket();

    if (!socket) {
      console.log("❌ No socket created (token missing)");
      return;
    }

    console.log("✅ Socket object created");

    // 🔥 VERY IMPORTANT
    socket.on("connect", () => {
      console.log("🟢 CONNECTED:", socket.id);
    });

    socket.on("connect_error", (err) => {
      console.log("🔴 CONNECT ERROR:", err.message);
    });

    socket.on("new-booking", (data) => {
      console.log("📩 New booking received:", data);
      setBookings((prev) => [...prev, data]);
    });

    socket.on("disconnect", () => {
      console.log("❌ Socket disconnected");
    });

    return () => {
      console.log("🧹 Cleanup skipped (dev mode)");
    };
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

      alert("Booking accepted");
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

      alert("Booking completed");
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Incoming Jobs</h2>

      {bookings.length === 0 && <p>No jobs yet</p>}

      {bookings.map((b) => (
        <div
          key={b._id}
          style={{
            border: "1px solid #ccc",
            padding: "10px",
            marginBottom: "10px",
          }}
        >
          <p><strong>Service:</strong> {b.serviceType}</p>
          <p><strong>Status:</strong> {b.status}</p>

          {b.status === "pending" && (
            <button onClick={() => acceptBooking(b._id)}>
              Accept
            </button>
          )}

          {b.status === "accepted" && (
            <button onClick={() => completeBooking(b._id)}>
              Complete
            </button>
          )}
        </div>
      ))}
    </div>
  );
};

export default WorkerDashboard;