import express from "express";
import Worker from "../models/Worker.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const router = express.Router();

// REGISTER
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, phone, skills, location } = req.body;

    const existing = await Worker.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: "Worker already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const worker = await Worker.create({
      name,
      email,
      password: hashedPassword,
      phone,
      skills,
      location,
    });

    res.json({
      message: "Registered successfully",
      workerId: worker._id,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// LOGIN
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const worker = await Worker.findOne({ email });
    if (!worker) {
      return res.status(404).json({ message: "Worker not found" });
    }

    const isMatch = await bcrypt.compare(password, worker.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid password" });
    }

    // 🔥 CREATE TOKEN
    const token = jwt.sign(
      { id: worker._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      message: "Login successful",
      token,
      workerId: worker._id,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
export default router;