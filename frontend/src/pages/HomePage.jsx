import { useEffect, useState } from "react";
import API from "../services/api";
import "../styles/home.css";
import "../styles/global.css";


const HomePage = () => {
  const [workers, setWorkers] = useState([]);

  useEffect(() => {
    getWorkers();
  }, []);

  const getWorkers = async () => {
    try {
      const res = await API.get(
        "/workers/nearby?lat=17.7&lng=83.3"
      );
      setWorkers(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const bookWorker = async (workerId) => {
    try {
      await API.post("/bookings", {
        userId: "123",
        workerId,
        serviceType: "plumber",
      });

      alert("Booking sent!");
    } catch (err) {
      console.error(err);
    }
  };

  return (
    
  <div className="container">
  <h2 className="title">Nearby Workers</h2>

      {workers.map((w) => (
    <div className="worker-card" key={w._id}>
      <p className="worker-name">{w.name}</p>
      <p className="worker-skill">{w.skills[0]}</p>

      {w.distance && (
        <p className="worker-distance">
          {(w.distance / 1000).toFixed(2)} km away
        </p>
      )}

      <button className="book-btn">Book</button>
    </div>
  ))}
    </div>
  );
};

export default HomePage;