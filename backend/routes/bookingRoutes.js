import express from "express";
import Booking from "../models/Booking.js";
import Worker from "../models/Worker.js";
import { io } from "../server.js";
import protect from "../middleware/authMiddleware.js";

const router = express.Router();


// ✅ CREATE BOOKING
router.post("/", async (req, res) => {
  try {
    const { workerId, userId, serviceType } = req.body;

    if (!workerId) {
      return res.status(400).json({ message: "workerId is required" });
    }

    // 🔍 Check worker exists
    const worker = await Worker.findById(workerId);
    if (!worker) {
      return res.status(404).json({ message: "Worker not found" });
    }

    // 🔥 Create booking
    const booking = await Booking.create({
      workerId,
      userId,
      serviceType,
      status: "pending",
    });

    // 🔥 DEBUG LOG (VERY IMPORTANT)
    console.log("📤 Sending booking to worker:", workerId);

    // 🔥 EMIT TO SPECIFIC WORKER ROOM
    io.to(workerId.toString()).emit("new-booking", booking);

    res.json(booking);

  } catch (error) {
    console.log("❌ Booking Error:", error.message);
    res.status(500).json({ message: error.message });
  }
});


// ✅ GET ALL BOOKINGS
router.get("/", async (req, res) => {
  try {
    const bookings = await Booking.find().populate("workerId");
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


// ✅ UPDATE BOOKING STATUS
router.put("/:id", protect, async (req, res) => {
  try {
    const { status } = req.body;

    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    const worker = await Worker.findById(booking.workerId);
    if (!worker) {
      return res.status(404).json({ message: "Worker not found" });
    }

    // 🔥 ACCEPT BOOKING
    if (status === "accepted") {
      if (!worker.availability) {
        return res.status(400).json({ message: "Worker not available" });
      }

      worker.availability = false;
      await worker.save();
    }

    // 🔥 COMPLETE BOOKING
    if (status === "completed") {
      worker.availability = true;
      await worker.save();
    }

    booking.status = status;
    await booking.save();

    res.json(booking);

  } catch (error) {
    console.log("❌ Update Error:", error.message);
    res.status(500).json({ message: error.message });
  }
});

export default router;