import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    bookingId: { type: mongoose.Schema.Types.ObjectId, ref: "Booking", required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, default: "" },
  },
  { timestamps: true }
);

const workerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phone: { type: String, required: true },
    skills: [{ type: String }],
    customSkill: { type: String, default: "" },
    area: { type: String, default: "" },
    location: {
      type: { type: String, enum: ["Point"], default: "Point" },
      coordinates: { type: [Number], required: true },
    },
    availability: { type: Boolean, default: true },
    rating: { type: Number, default: 0 },
    reviews: [reviewSchema],
  },
  { timestamps: true }
);

workerSchema.index({ location: "2dsphere" });

const Worker = mongoose.model("Worker", workerSchema);
export default Worker;