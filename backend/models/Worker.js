import mongoose from "mongoose";

const workerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phone: { type: String, required: true },
    skills: [{ type: String }],
    customSkill: { type: String, default: "" }, // filled when skill === "other"
    area: { type: String, default: "" },         // neighbourhood e.g. "Gajuwaka"
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number],
        required: true,
      },
    },
    availability: { type: Boolean, default: true },
    rating: { type: Number, default: 0 },
  },
  { timestamps: true }
);

workerSchema.index({ location: "2dsphere" });

const Worker = mongoose.model("Worker", workerSchema);
export default Worker;