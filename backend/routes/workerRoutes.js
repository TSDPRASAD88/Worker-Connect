import express from "express";
import Worker from "../models/Worker.js";
import protect from "../middleware/authMiddleware.js";

const router = express.Router();

// Get all workers (public)
router.get("/", async (req, res) => {
  try {
    const workers = await Worker.find().select("-password");
    res.json(workers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Nearby workers (public — used by homepage)
router.get("/nearby", async (req, res) => {
  try {
    const { lat, lng } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({ message: "lat and lng query params are required" });
    }

    const workers = await Worker.aggregate([
      {
        $geoNear: {
          near: {
            type: "Point",
            coordinates: [parseFloat(lng), parseFloat(lat)],
          },
          distanceField: "distance",
          spherical: true,
          maxDistance: 5000, // 5km radius
        },
      },
      {
        $match: { availability: true },
      },
      {
        $project: { password: 0 }, // Never expose password
      },
    ]);

    res.json(workers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get single worker (protected)
router.get("/:id", protect, async (req, res) => {
  try {
    const worker = await Worker.findById(req.params.id).select("-password");
    if (!worker) return res.status(404).json({ message: "Worker not found" });
    res.json(worker);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;