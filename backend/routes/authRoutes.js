import express from "express";
import Worker from "../models/Worker.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const router = express.Router();
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@vizagconnect.com";

// REGISTER
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, phone, skills, customSkill, area, location } = req.body;

    if (!name || !email || !password || !phone || !location) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const existing = await Worker.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: "An account with this email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const worker = await Worker.create({
      name,
      email,
      password: hashedPassword,
      phone,
      skills,
      customSkill: customSkill || "",
      area: area || "",
      location,
    });

    res.status(201).json({
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

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const worker = await Worker.findOne({ email });
    if (!worker) {
      return res.status(404).json({ message: "No account found with this email" });
    }

    const isMatch = await bcrypt.compare(password, worker.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Incorrect password" });
    }

    const isAdmin = email === ADMIN_EMAIL;

    // Include email in token payload so adminOnly middleware can verify it
    const token = jwt.sign(
      { id: worker._id, email: worker.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      message: "Login successful",
      token,
      workerId: worker._id,
      isAdmin,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;