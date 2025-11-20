import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

export function authMiddleware(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer ")) return res.status(401).json({ error: "No token" });
  const token = auth.split(" ")[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload; // { id, role, email }
    return next();
  } catch (e) {
    return res.status(401).json({ error: "Token inválido" });
  }
}

export function requireRole(role) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: "No autenticado" });
    if (req.user.role === "admin") return next(); // admin pasa todo
    if (Array.isArray(role)) {
      if (role.includes(req.user.role)) return next();
    } else {
      if (req.user.role === role) return next();
    }
    return res.status(403).json({ error: "Permisos insuficientes" });
  };
}