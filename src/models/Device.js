import mongoose from "mongoose";

const deviceSchema = new mongoose.Schema({
  name: { type: String, required: true },
  serial: { type: String, unique: true, required: true },
  lastSeen: Date,
  lat: Number,
  lon: Number,
  status: { type: String, enum: ["online","offline","error"], default: "offline" },
}, { timestamps: true });

export default mongoose.model("Device", deviceSchema);