import express from "express";
import Event from "../models/Event.js";
import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();

// Crear evento (puede venir del backend o dispositivo)
router.post("/", async (req, res) => {
  try {
    const { deviceId, type, payload } = req.body;
    const ev = new Event({ deviceId, type, payload });
    await ev.save();

    // emitir via socket
    try {
      const io = req.app.get("io");
      if (io) io.emit("device:event", { deviceId: ev.deviceId, type: ev.type, payload: ev.payload, ts: ev.timestamp });
    } catch (e) {}

    res.json(ev);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Listar eventos (auth)
router.get("/", authMiddleware, async (req, res) => {
  const events = await Event.find().sort({ timestamp: -1 }).limit(500);
  res.json(events);
});

export default router;