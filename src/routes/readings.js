import express from "express";
import Reading from "../models/Reading.js";
import Device from "../models/Device.js";
import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();

/*
  Endpoint para que el dispositivo envíe lecturas.
  Aquí aceptamos POST sin autenticación para facilitar (en producción usa token de dispositivo o MQTT).
  Body: { serial, levelPercent, distanceCm, lat, lon, timestamp }
*/
router.post("/", async (req, res) => {
  try {
    const { serial, levelPercent, distanceCm, lat, lon, timestamp } = req.body;
    if (!serial) return res.status(400).json({ error: "serial requerido" });

    // buscar o crear device
    let device = await Device.findOne({ serial });
    if (!device) {
      device = new Device({ name: serial, serial, lat, lon, status: "online", lastSeen: timestamp ? new Date(timestamp) : new Date() });
      await device.save();
    } else {
      device.lastSeen = timestamp ? new Date(timestamp) : new Date();
      if (lat) device.lat = lat;
      if (lon) device.lon = lon;
      device.status = "online";
      await device.save();
    }

    const r = new Reading({ deviceId: device._id, levelPercent, distanceCm, timestamp: timestamp ? new Date(timestamp) : undefined });
    await r.save();

    // emitir via socket si tienes io en app
    try {
      const io = req.app.get("io");
      if (io) {
        io.to(`device:${device._id}`).emit("device:reading", { deviceId: device._id, levelPercent, distanceCm, ts: r.timestamp });
        io.emit("device:reading", { deviceId: device._id, levelPercent, distanceCm, ts: r.timestamp });
      }
    } catch (e) { /* no fatal */ }

    res.json({ ok: true, reading: r });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Obtener lecturas de un dispositivo (auth)
router.get("/:deviceId", authMiddleware, async (req, res) => {
  const { deviceId } = req.params;
  const { from, to, limit = 100 } = req.query;
  const q = { deviceId };
  if (from || to) q.timestamp = {};
  if (from) q.timestamp.$gte = new Date(from);
  if (to) q.timestamp.$lte = new Date(to);
  const readings = await Reading.find(q).sort({ timestamp: -1 }).limit(Number(limit));
  res.json(readings);
});

export default router;