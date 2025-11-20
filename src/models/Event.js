import mongoose from "mongoose";

const eventSchema = new mongoose.Schema({
  deviceId: { type: mongoose.Schema.Types.ObjectId, ref: "Device" },
  type: { type: String }, // eg. 'dispensed','low_level','manual_trigger'
  payload: { type: mongoose.Schema.Types.Mixed },
  timestamp: { type: Date, default: Date.now }
});

export default mongoose.model("Event", eventSchema);