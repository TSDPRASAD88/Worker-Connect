import { useEffect, useState } from "react";
import API from "../services/api";

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
    <div>
      <h2>Nearby Workers</h2>

      {workers.map((w) => (
        <div key={w._id}>
          <h3>{w.name}</h3>
          <p>{w.skills.join(", ")}</p>
          <button onClick={() => bookWorker(w._id)}>
            Book
          </button>
        </div>
      ))}
    </div>
  );
};

export default HomePage;