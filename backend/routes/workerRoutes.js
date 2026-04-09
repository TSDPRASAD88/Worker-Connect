import express from "express";
import Worker from "../models/Worker.js";

const router = express.Router();

// Add worker
router.post("/", async (req, res) => {
  try {
    const worker = await Worker.create(req.body);
    res.json(worker);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all workers
router.get("/", async (req, res) => {
  try {
    const workers = await Worker.find();
    res.json(workers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
router.get("/nearby", async (req, res) => {
  try {
    const { lat, lng } = req.query;

    const workers = await Worker.find({
        availability: true,
      location: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [parseFloat(lng), parseFloat(lat)],
          },
          $maxDistance: 5000, // 5km radius
        },
      },
    });
    

    res.json(workers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;