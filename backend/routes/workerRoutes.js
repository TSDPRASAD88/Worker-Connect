import express from "express";
import Worker from "../models/Worker.js";
import protect from "../middleware/authMiddleware.js";

const router = express.Router();

// GET ALL WORKERS (public — no password)
router.get("/", async (req, res) => {
  try {
    const workers = await Worker.find().select("-password");
    res.json(workers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET NEARBY WORKERS — supports area text search + geo distance filter
router.get("/nearby", async (req, res) => {
  try {
    const { lat, lng, area, skill } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({ message: "lat and lng are required" });
    }

    const geoStages = [
      {
        $geoNear: {
          near: {
            type: "Point",
            coordinates: [parseFloat(lng), parseFloat(lat)],
          },
          distanceField: "distance",
          spherical: true,
          maxDistance: 10000, // 10km
        },
      },
    ];

    const matchConditions = { availability: true };

    // Area text filter (case-insensitive partial match)
    if (area && area.trim() !== "") {
      matchConditions.area = { $regex: area.trim(), $options: "i" };
    }

    // Skill filter
    if (skill && skill !== "all") {
      matchConditions.skills = skill;
    }

    const pipeline = [
      ...geoStages,
      { $match: matchConditions },
      { $project: { password: 0 } },
    ];

    const workers = await Worker.aggregate(pipeline);
    res.json(workers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET SINGLE WORKER (protected)
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