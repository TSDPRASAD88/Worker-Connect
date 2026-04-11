import express from "express";
import Booking from "../models/Booking.js";
import Worker from "../models/Worker.js";
import { getIO } from "../sockets/socketInstance.js";
import protect from "../middleware/authMiddleware.js";

const router = express.Router();

// ✅ CREATE BOOKING — with duplicate prevention
router.post("/", async (req, res) => {
  try {
    const { workerId, userId, serviceType } = req.body;

    if (!workerId || !userId || !serviceType) {
      return res.status(400).json({ message: "workerId, userId and serviceType are required" });
    }

    const worker = await Worker.findById(workerId);
    if (!worker) {
      return res.status(404).json({ message: "Worker not found" });
    }

    if (!worker.availability) {
      return res.status(400).json({ message: "Worker is currently unavailable" });
    }

    // 🔥 DUPLICATE CHECK: block if a pending/accepted booking already exists for this pair
    const existing = await Booking.findOne({
      userId,
      workerId,
      status: { $in: ["pending", "accepted"] },
    });

    if (existing) {
      return res.status(409).json({ message: "You already have an active booking with this worker" });
    }

    const booking = await Booking.create({
      workerId,
      userId,
      serviceType,
      status: "pending",
    });

    // Emit to the worker's socket room
    try {
      const io = getIO();
      io.to(workerId.toString()).emit("new-booking", booking);
      console.log(`📤 Booking emitted to worker ${workerId}`);
    } catch (socketErr) {
      console.warn("Socket emit failed (non-fatal):", socketErr.message);
    }

    res.status(201).json(booking);

  } catch (error) {
    console.error("❌ Booking Error:", error.message);
    res.status(500).json({ message: error.message });
  }
});

// ✅ GET ALL BOOKINGS (admin use — protected)
router.get("/", protect, async (req, res) => {
  try {
    const bookings = await Booking.find().populate("workerId", "name phone skills").sort({ createdAt: -1 });
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ✅ GET BOOKINGS FOR A SPECIFIC WORKER (used by dashboard on load)
router.get("/worker/:workerId", protect, async (req, res) => {
  try {
    const bookings = await Booking.find({ workerId: req.params.workerId })
      .sort({ createdAt: -1 });
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ✅ UPDATE BOOKING STATUS (accept / complete)
router.put("/:id", protect, async (req, res) => {
  try {
    const { status } = req.body;

    if (!["accepted", "completed"].includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    const worker = await Worker.findById(booking.workerId);
    if (!worker) {
      return res.status(404).json({ message: "Worker not found" });
    }

    if (status === "accepted") {
      if (!worker.availability) {
        return res.status(400).json({ message: "Worker not available" });
      }
      worker.availability = false;
      await worker.save();
    }

    if (status === "completed") {
      worker.availability = true;
      await worker.save();
    }

    booking.status = status;
    await booking.save();

    res.json(booking);

  } catch (error) {
    console.error("❌ Update Error:", error.message);
    res.status(500).json({ message: error.message });
  }
});

export default router;