import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../services/api";
import { connectSocket, connectUserSocket } from "../hooks/useSocket";
import "../styles/global.css";
import "../styles/tracking.css";

// ── Leaflet loader (CDN, no npm needed) ───────────────────────
const loadLeaflet = () =>
  new Promise((resolve, reject) => {
    if (window.L) { resolve(window.L); return; }

    // CSS
    if (!document.getElementById("leaflet-css")) {
      const link = document.createElement("link");
      link.id = "leaflet-css";
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }

    // JS
    if (document.getElementById("leaflet-js")) {
      // already injected, wait for it
      const check = setInterval(() => {
        if (window.L) { clearInterval(check); resolve(window.L); }
      }, 50);
      return;
    }

    const script = document.createElement("script");
    script.id = "leaflet-js";
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.async = true;
    script.onload = () => resolve(window.L);
    script.onerror = () => reject(new Error("Leaflet failed to load"));
    document.head.appendChild(script);
  });

// ── Custom circle marker factory ──────────────────────────────
const makeCircleIcon = (L, color) =>
  L.divIcon({
    className: "",
    html: `<div style="
      width:20px;height:20px;border-radius:50%;
      background:${color};border:3px solid #fff;
      box-shadow:0 0 0 2px ${color},0 2px 8px rgba(0,0,0,.35);
    "></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });

const TrackingPage = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();

  const mapRef = useRef(null);        // DOM node
  const mapInstance = useRef(null);   // L.Map
  const workerMarker = useRef(null);
  const userMarker = useRef(null);
  const watchId = useRef(null);
  const socketRef = useRef(null);

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mapReady, setMapReady] = useState(false);
  const [workerPos, setWorkerPos] = useState(null);
  const [userPos, setUserPos] = useState(null);
  const [status, setStatus] = useState("connecting");
  const [role, setRole] = useState(null);

  const isWorker = !!localStorage.getItem("token");
  const userId = localStorage.getItem("userId") || "guest";

  // ── 1. Fetch booking details ─────────────────────────────────
  useEffect(() => {
    const fetchBooking = async () => {
      try {
        const res = await API.get(`/bookings/${bookingId}`);
        setBooking(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchBooking();
    setRole(isWorker ? "worker" : "user");
  }, [bookingId]);

  // ── 2. Init Leaflet map ──────────────────────────────────────
  useEffect(() => {
    if (loading) return;

    loadLeaflet()
      .then((L) => {
        if (mapInstance.current) return; // already initialised

        // Default center: Vizag
        mapInstance.current = L.map(mapRef.current, {
          center: [17.7, 83.3],
          zoom: 14,
          zoomControl: true,
        });

        // OpenStreetMap tiles — completely free, no API key
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 19,
        }).addTo(mapInstance.current);

        // Worker marker (orange)
        workerMarker.current = L.marker([17.7, 83.3], {
          icon: makeCircleIcon(L, "#FF5C00"),
          title: "Worker",
        });

        // User marker (blue)
        userMarker.current = L.marker([17.7, 83.3], {
          icon: makeCircleIcon(L, "#3B82F6"),
          title: "You",
        });

        setMapReady(true);
      })
      .catch((err) => console.error("Leaflet load error:", err));

    // Cleanup on unmount
    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, [loading]);

  // ── helper: update a marker position ────────────────────────
  const moveMarker = (marker, map, pos, addIfAbsent) => {
    if (!marker || !map) return;
    if (addIfAbsent && !map.hasLayer(marker)) {
      marker.addTo(map);
    }
    marker.setLatLng([pos.lat, pos.lng]);
  };

  // ── helper: fit bounds to show both markers ──────────────────
  const fitBoth = (wPos, uPos) => {
    if (!wPos || !uPos || !mapInstance.current) return;
    const L = window.L;
    if (!L) return;
    const bounds = L.latLngBounds(
      [wPos.lat, wPos.lng],
      [uPos.lat, uPos.lng]
    );
    mapInstance.current.fitBounds(bounds, { padding: [60, 60] });
  };

  // ── 3. Connect socket + join tracking room ───────────────────
  useEffect(() => {
    if (!mapReady) return;

    let socket;
    if (isWorker) {
      socket = connectSocket();
    } else {
      socket = connectUserSocket(userId);
    }

    if (!socket) return;
    socketRef.current = socket;

    socket.emit("join-tracking", { bookingId });
    setStatus("connected");

    socket.on("worker-location", ({ lat, lng }) => {
      const pos = { lat, lng };
      setWorkerPos(pos);
      moveMarker(workerMarker.current, mapInstance.current, pos, true);
      if (!isWorker) {
        mapInstance.current?.panTo([lat, lng]);
      }
    });

    socket.on("user-location", ({ lat, lng }) => {
      const pos = { lat, lng };
      setUserPos(pos);
      moveMarker(userMarker.current, mapInstance.current, pos, true);
      if (isWorker) {
        mapInstance.current?.panTo([lat, lng]);
      }
    });

    socket.on("disconnect", () => setStatus("disconnected"));
    socket.on("connect", () => setStatus("connected"));

    return () => {
      socket.emit("leave-tracking", { bookingId });
      socket.off("worker-location");
      socket.off("user-location");
    };
  }, [mapReady]);

  // ── 4. Broadcast own location via GPS ───────────────────────
  useEffect(() => {
    if (!mapReady || !socketRef.current) return;

    const emitEvent = isWorker ? "worker-location" : "user-location";

    watchId.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        const ownPos = { lat, lng };

        if (isWorker) {
          setWorkerPos(ownPos);
          moveMarker(workerMarker.current, mapInstance.current, ownPos, true);
        } else {
          setUserPos(ownPos);
          moveMarker(userMarker.current, mapInstance.current, ownPos, true);
        }

        mapInstance.current?.panTo([lat, lng]);
        socketRef.current.emit(emitEvent, { bookingId, lat, lng });
      },
      (err) => console.warn("GPS error:", err),
      { enableHighAccuracy: true, maximumAge: 3000, timeout: 10000 }
    );

    return () => {
      if (watchId.current != null) {
        navigator.geolocation.clearWatch(watchId.current);
      }
    };
  }, [mapReady]);

  // ── 5. Fit bounds when both positions are known ──────────────
  useEffect(() => {
    fitBoth(workerPos, userPos);
  }, [workerPos, userPos]);

  const handleBack = () => {
    if (watchId.current != null) navigator.geolocation.clearWatch(watchId.current);
    if (socketRef.current) socketRef.current.emit("leave-tracking", { bookingId });
    navigate(isWorker ? "/worker" : "/");
  };

  const distanceBetween = (a, b) => {
    if (!a || !b) return null;
    const R = 6371;
    const dLat = ((b.lat - a.lat) * Math.PI) / 180;
    const dLng = ((b.lng - a.lng) * Math.PI) / 180;
    const h =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((a.lat * Math.PI) / 180) *
        Math.cos((b.lat * Math.PI) / 180) *
        Math.sin(dLng / 2) ** 2;
    return (R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h))).toFixed(2);
  };

  const distance = distanceBetween(workerPos, userPos);

  return (
    <div className="tracking-page">
      {/* Top bar */}
      <div className="tracking-bar">
        <button className="tracking-back" onClick={handleBack}>←</button>
        <div className="tracking-bar__center">
          <div className="tracking-title">
            {booking ? `Tracking — ${booking.serviceType}` : "Live Tracking"}
          </div>
          {booking?.workerId?.name && (
            <div className="tracking-subtitle">
              {isWorker ? `Customer booking` : `Worker: ${booking.workerId.name}`}
            </div>
          )}
        </div>
        <div className={`conn-pill ${status === "connected" ? "conn-pill--on" : "conn-pill--off"}`}>
          <span className="conn-pill__dot" />
          {status === "connected" ? "Live" : "Reconnecting"}
        </div>
      </div>

      {/* Map */}
      <div className="tracking-map" ref={mapRef}>
        {!mapReady && (
          <div className="tracking-map__loader">
            <div className="spinner spinner--dark" style={{ width: "28px", height: "28px" }} />
            <p>Loading map...</p>
          </div>
        )}
      </div>

      {/* Bottom info panel */}
      <div className="tracking-panel">
        <div className="tracking-legend">
          <div className="legend-item">
            <span className="legend-dot legend-dot--worker" />
            <span>{isWorker ? "You (Worker)" : "Worker"}</span>
            {workerPos
              ? <span className="legend-status legend-status--live">● Live</span>
              : <span className="legend-status">Waiting...</span>}
          </div>
          <div className="legend-item">
            <span className="legend-dot legend-dot--user" />
            <span>{isWorker ? "Customer" : "You"}</span>
            {userPos
              ? <span className="legend-status legend-status--live">● Live</span>
              : <span className="legend-status">Waiting...</span>}
          </div>
        </div>

        {distance && (
          <div className="tracking-distance">
            <span className="tracking-distance__value">{distance} km</span>
            <span className="tracking-distance__label">between you</span>
          </div>
        )}

        {booking?.workerId?.phone && !isWorker && (
          <a href={`tel:${booking.workerId.phone}`} className="tracking-call-btn">
            📞 Call Worker
          </a>
        )}
      </div>
    </div>
  );
};

export default TrackingPage;
