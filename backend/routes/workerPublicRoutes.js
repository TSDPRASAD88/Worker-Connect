import express from "express";
import Worker from "../models/Worker.js";

const router = express.Router();

// GET public worker profile by ID (no auth needed)
// Returns worker details + reviews (no password/email)
router.get("/:id/profile", async (req, res) => {
  try {
    const worker = await Worker.findById(req.params.id)
      .select("-password -email -location");

    if (!worker) return res.status(404).json({ message: "Worker not found" });

    res.json(worker);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;