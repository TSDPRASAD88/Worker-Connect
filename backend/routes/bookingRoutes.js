import express from "express";
import Booking from "../models/Booking.js";
import Worker from "../models/Worker.js";
import { getIO } from "../sockets/socketInstance.js";
import protect from "../middleware/authMiddleware.js";

const router = express.Router();

// ✅ CREATE BOOKING — duplicate prevention
router.post("/", async (req, res) => {
  try {
    const { workerId, userId, serviceType } = req.body;

    if (!workerId || !userId || !serviceType) {
      return res.status(400).json({ message: "workerId, userId and serviceType are required" });
    }

    const worker = await Worker.findById(workerId);
    if (!worker) return res.status(404).json({ message: "Worker not found" });

    if (!worker.availability) {
      return res.status(400).json({ message: "Worker is currently unavailable" });
    }

    const existing = await Booking.findOne({
      userId,
      workerId,
      status: { $in: ["pending", "accepted"] },
    });
    if (existing) {
      return res.status(409).json({ message: "You already have an active booking with this worker" });
    }

    const booking = await Booking.create({ workerId, userId, serviceType, status: "pending" });

    try {
      const io = getIO();
      io.to(workerId.toString()).emit("new-booking", booking);
    } catch (socketErr) {
      console.warn("Socket emit failed (non-fatal):", socketErr.message);
    }

    res.status(201).json(booking);
  } catch (error) {
    console.error("❌ Booking Error:", error.message);
    res.status(500).json({ message: error.message });
  }
});

// ✅ SUBMIT REVIEW — after completed/paid booking
router.post("/:id/review", async (req, res) => {
  try {
    const { userId, rating, comment } = req.body;

    if (!userId || !rating) {
      return res.status(400).json({ message: "userId and rating are required" });
    }
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: "Rating must be between 1 and 5" });
    }

    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    if (!["completed", "paid"].includes(booking.status)) {
      return res.status(400).json({ message: "Can only review completed bookings" });
    }
    if (booking.userId !== userId) {
      return res.status(403).json({ message: "Not your booking" });
    }
    if (booking.reviewed) {
      return res.status(409).json({ message: "Already reviewed this booking" });
    }

    const worker = await Worker.findById(booking.workerId);
    if (!worker) return res.status(404).json({ message: "Worker not found" });

    // Add review to worker
    worker.reviews.push({ userId, bookingId: booking._id, rating, comment: comment || "" });

    // Recalculate average rating
    const total = worker.reviews.reduce((sum, r) => sum + r.rating, 0);
    worker.rating = parseFloat((total / worker.reviews.length).toFixed(1));
    await worker.save();

    // Mark booking as reviewed
    booking.reviewed = true;
    await booking.save();

    res.status(201).json({ message: "Review submitted!", rating: worker.rating });
  } catch (error) {
    console.error("❌ Review Error:", error.message);
    res.status(500).json({ message: error.message });
  }
});

// ✅ GET ALL BOOKINGS (admin/protected)
router.get("/", protect, async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate("workerId", "name phone skills area")
      .sort({ createdAt: -1 });
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ✅ GET BOOKINGS FOR A SPECIFIC WORKER
router.get("/worker/:workerId", protect, async (req, res) => {
  try {
    const bookings = await Booking.find({ workerId: req.params.workerId })
      .sort({ createdAt: -1 });
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ✅ GET BOOKINGS FOR A SPECIFIC USER (to check if review is possible) — no auth needed
router.get("/user/:userId", async (req, res) => {
  try {
    const bookings = await Booking.find({ userId: req.params.userId })
      .populate("workerId", "name skills area rating")
      .sort({ createdAt: -1 });
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ✅ GET SINGLE BOOKING
router.get("/:id", protect, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate("workerId", "name phone email skills area");
    if (!booking) return res.status(404).json({ message: "Booking not found" });
    res.json(booking);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ✅ UPDATE BOOKING STATUS
router.put("/:id", protect, async (req, res) => {
  try {
    const { status, paymentMethod } = req.body;

    if (!["accepted", "completed", "paid"].includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    const worker = await Worker.findById(booking.workerId);
    if (!worker) return res.status(404).json({ message: "Worker not found" });

    if (status === "accepted") {
      if (!worker.availability) {
        return res.status(400).json({ message: "Worker not available" });
      }
      worker.availability = false;
      await worker.save();

      try {
        const io = getIO();
        io.to(`user-${booking.userId}`).emit("booking-accepted", {
          bookingId: booking._id,
          workerName: worker.name,
          workerPhone: worker.phone,
        });
      } catch (e) {
        console.warn("booking-accepted emit failed (non-fatal):", e.message);
      }
    }

    if (status === "completed") {
      worker.availability = true;
      await worker.save();
    }

    booking.status = status;
    if (paymentMethod) booking.paymentMethod = paymentMethod;
    await booking.save();

    res.json(booking);
  } catch (error) {
    console.error("❌ Update Error:", error.message);
    res.status(500).json({ message: error.message });
  }
});

export default router;