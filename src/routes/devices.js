import express from "express";
import Device from "../models/Device.js";
import { authMiddleware, requireRole } from "../middleware/auth.js";

const router = express.Router();

// Crear dispositivo (admin)
router.post("/", authMiddleware, requireRole("admin"), async (req, res) => {
  try {
    const { name, serial, lat, lon } = req.body;
    const d = new Device({ name, serial, lat, lon, status: "offline" });
    await d.save();
    res.json(d);
  } catch (e) { res.status(400).json({ error: e.message }); }
});

// Listar dispositivos (autenticado)
router.get("/", authMiddleware, async (req, res) => {
  const devices = await Device.find().sort({ createdAt: -1 });
  res.json(devices);
});

// Obtener por id
router.get("/:id", authMiddleware, async (req, res) => {
  const d = await Device.findById(req.params.id);
  if (!d) return res.status(404).json({ error: "No encontrado" });
  res.json(d);
});

// Actualizar (admin)
router.put("/:id", authMiddleware, requireRole("admin"), async (req, res) => {
  const d = await Device.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(d);
});

// Eliminar (admin)
router.delete("/:id", authMiddleware, requireRole("admin"), async (req, res) => {
  await Device.findByIdAndDelete(req.params.id);
  res.json({ message: "eliminado" });
});

export default router;