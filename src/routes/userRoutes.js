import express from "express";
import User from "../models/User.js";
import { authMiddleware, requireRole } from "../middleware/auth.js";

const router = express.Router();

/* 🟢 Crear usuario (registro público) */
router.post("/", async (req, res) => {
  try {
    const { nombre, email, password } = req.body;

    // Validar que no exista
    const existe = await User.findOne({ email });
    if (existe) return res.status(400).json({ mensaje: "El correo ya está registrado" });

    // Guardar contraseña tal cual
    const user = new User({ nombre, email, password });
    await user.save();

    const userSafe = { _id: user._id, nombre: user.nombre, email: user.email, rol: user.rol };

    res.status(201).json({ mensaje: "Usuario creado correctamente", user: userSafe });
  } catch (error) {
    res.status(500).json({ mensaje: "Error al crear usuario", error: error.message });
  }
});

/* 🟡 Obtener todos los usuarios (solo admin) */
router.get("/", authMiddleware, requireRole("admin"), async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json(users);
  } catch (error) {
    res.status(500).json({ mensaje: "Error al obtener usuarios", error: error.message });
  }
});

/* 🟡 Obtener usuario por ID (autenticado) */
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) return res.status(404).json({ mensaje: "Usuario no encontrado" });
    res.json(user);
  } catch (error) {
    res.status(500).json({ mensaje: "Error al buscar usuario", error: error.message });
  }
});

/* 🔵 Actualizar usuario (solo el mismo o admin) */
router.put("/:id", authMiddleware, async (req, res) => {
  try {
    if (req.user.id !== req.params.id && req.user.rol !== "admin") {
      return res.status(403).json({ mensaje: "No autorizado para editar este usuario" });
    }

    const { nombre, email, password } = req.body;
    const data = { nombre, email };
    if (password) data.password = password; // guardar sin hashear

    const user = await User.findByIdAndUpdate(req.params.id, data, { new: true }).select("-password");
    res.json({ mensaje: "Usuario actualizado", user });
  } catch (error) {
    res.status(500).json({ mensaje: "Error al actualizar usuario", error: error.message });
  }
});

/* 🔴 Eliminar usuario (solo admin) */
router.delete("/:id", authMiddleware, requireRole("admin"), async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ mensaje: "Usuario eliminado correctamente" });
  } catch (error) {
    res.status(500).json({ mensaje: "Error al eliminar usuario", error: error.message });
  }
});

/* 🧩 Resetear contraseña por email (sin encriptación) */
router.put("/reset-password/:email", async (req, res) => {
  try {
    const { newPassword } = req.body;
    const user = await User.findOne({ email: req.params.email });
    if (!user) return res.status(404).json({ mensaje: "Usuario no encontrado" });

    user.password = newPassword;
    await user.save();

    res.json({ mensaje: "Contraseña actualizada correctamente" });
  } catch (error) {
    res.status(500).json({ mensaje: "Error al resetear contraseña", error: error.message });
  }
});

export default router;