import express from "express";
import Worker from "../models/Worker.js";
import Booking from "../models/Booking.js";
import { adminOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

// All admin routes are protected by adminOnly middleware

// GET all workers with full details
router.get("/workers", adminOnly, async (req, res) => {
  try {
    const workers = await Worker.find().select("-password").sort({ createdAt: -1 });
    res.json(workers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET dashboard stats
router.get("/stats", adminOnly, async (req, res) => {
  try {
    const totalWorkers = await Worker.countDocuments();
    const availableWorkers = await Worker.countDocuments({ availability: true });
    const totalBookings = await Booking.countDocuments();
    const pendingBookings = await Booking.countDocuments({ status: "pending" });
    const completedBookings = await Booking.countDocuments({ status: "completed" });
    const paidBookings = await Booking.countDocuments({ status: "paid" });

    res.json({
      totalWorkers,
      availableWorkers,
      totalBookings,
      pendingBookings,
      completedBookings,
      paidBookings,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// UPDATE worker (name, skills, area, availability, phone)
router.put("/workers/:id", adminOnly, async (req, res) => {
  try {
    const { name, skills, customSkill, area, phone, availability } = req.body;

    const worker = await Worker.findById(req.params.id);
    if (!worker) return res.status(404).json({ message: "Worker not found" });

    if (name !== undefined) worker.name = name;
    if (skills !== undefined) worker.skills = skills;
    if (customSkill !== undefined) worker.customSkill = customSkill;
    if (area !== undefined) worker.area = area;
    if (phone !== undefined) worker.phone = phone;
    if (availability !== undefined) worker.availability = availability;

    await worker.save();
    const updated = worker.toObject();
    delete updated.password;
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// DELETE worker
router.delete("/workers/:id", adminOnly, async (req, res) => {
  try {
    const worker = await Worker.findById(req.params.id);
    if (!worker) return res.status(404).json({ message: "Worker not found" });

    await Worker.findByIdAndDelete(req.params.id);
    // Also clean up their bookings
    await Booking.deleteMany({ workerId: req.params.id });

    res.json({ message: "Worker and their bookings deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET all bookings (admin view)
router.get("/bookings", adminOnly, async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate("workerId", "name phone area skills")
      .sort({ createdAt: -1 });
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;