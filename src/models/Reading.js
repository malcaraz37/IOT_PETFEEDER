import mongoose from "mongoose";

const readingSchema = new mongoose.Schema({
  deviceId: { type: mongoose.Schema.Types.ObjectId, ref: "Device", required: true },
  levelPercent: { type: Number },
  distanceCm: { type: Number },
  timestamp: { type: Date, default: Date.now }
});

export default mongoose.model("Reading", readingSchema);