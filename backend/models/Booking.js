import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    workerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Worker",
      required: true,
    },
    serviceType: { type: String, required: true },
    status: {
      type: String,
      enum: ["pending", "accepted", "completed", "paid"],
      default: "pending",
    },
    paymentMethod: {
      type: String,
      enum: ["upi", "cash", ""],
      default: "",
    },
    reviewed: { type: Boolean, default: false }, // prevents double reviews
  },
  { timestamps: true }
);

const Booking = mongoose.model("Booking", bookingSchema);
export default Booking;