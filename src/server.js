import express from "express";
import http from "http";
import { Server as SocketIOServer } from "socket.io";
import mongoose from "mongoose";
import mqtt from "mqtt";
import cors from "cors";
import dotenv from "dotenv";

import eventRoutes from "./routes/events.js";
import authRoutes from "./routes/auth.js";
import deviceRoutes from "./routes/devices.js";
import readingRoutes from "./routes/readings.js";
import userRoutes from "./routes/userRoutes.js";

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: { origin: process.env.CORS_ORIGIN || "*" },
});

app.use(express.static("public"));
app.use(cors());
app.use(express.json());
app.use("/api/users", userRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/devices", deviceRoutes);
app.use("/api/readings", readingRoutes);
app.use("/api/events", eventRoutes);


// 📦 Conexión a MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Conectado a MongoDB Atlas"))
  .catch((err) => console.error("❌ Error de conexión MongoDB:", err));


// ======================================================
// 📊 CONTADOR DIARIO DE DISPENSACIONES (FEED)
// ======================================================
let dispensacionesHoy = 0;
let fechaActual = new Date().toLocaleDateString("es-MX");

function verificarCambioDeDia() {
  const hoy = new Date().toLocaleDateString("es-MX");
  if (hoy !== fechaActual) {
    fechaActual = hoy;
    dispensacionesHoy = 0;

    io.emit("contador:update", { dispensacionesHoy });
  }
}

setInterval(verificarCambioDeDia, 60000);


// ======================================================
// 🔗 Conexión MQTT
// ======================================================
const mqttClient = mqtt.connect(process.env.MQTT_BROKER_URL || "mqtt://broker.hivemq.com");

mqttClient.on("connect", () => {
  console.log("✅ Conectado al broker MQTT");

  mqttClient.subscribe("/petfeeder/IOTeam/estado");
  mqttClient.subscribe("/petfeeder/IOTeam/comandos");
  mqttClient.subscribe("/petfeeder/IOTeam/horarios");
});

mqttClient.on("message", (topic, message) => {
  const text = message.toString();
  console.log("📩 MQTT", topic, text);

  try {
    let payload;

    try {
      payload = JSON.parse(text);
    } catch {
      payload = { raw: text };
    }

    // 📡 Estado del PetFeeder
    if (topic === "/petfeeder/IOTeam/estado") {
      io.emit("estado:update", payload);
    }

    // ⚙️ Confirmaciones o respuestas
    if (topic === "/petfeeder/IOTeam/comandos") {
      io.emit("comando:respuesta", payload);

      // -----------------------------------------------------
      // 📊 SUMAR SOLO CUANDO EL ESP REPORTA UN FEED REAL
      // -----------------------------------------------------
      if (text.includes("FEED")) {
        dispensacionesHoy++;
        io.emit("contador:update", { dispensacionesHoy });
      }
    }

    // ⏰ Horarios
    if (topic === "/petfeeder/IOTeam/horarios") {
      io.emit("horarios:update", payload);
    }

  } catch (err) {
    console.error("❌ Error procesando mensaje MQTT:", err);
  }
});


// ======================================================
// 🔌 Socket.io
// ======================================================
io.on("connection", (socket) => {
  console.log("🔌 Cliente conectado:", socket.id);

  // 🟢 Dispensar comida (FEED)
  socket.on("command:dispense", () => {
    console.log("🍖 Enviando comando FEED al MQTT...");
    mqttClient.publish("/petfeeder/IOTeam/comandos", "FEED");

    // ❌ YA NO SUMAMOS AQUÍ — SOLO SUMA EL ESP32
  });

  // ⏭️ Saltar próxima comida (SKIP_MEAL)
  socket.on("command:skipMeal", () => {
    console.log("⏭️ Enviando comando SKIP_MEAL al MQTT...");
    mqttClient.publish("/petfeeder/IOTeam/comandos", "SKIP_MEAL");
  });

  // 🕓 Establecer horarios
  socket.on("command:setSchedule", (data) => {
    console.log("🕓 Enviando nuevos horarios al MQTT:", data);
    mqttClient.publish("/petfeeder/IOTeam/horarios", JSON.stringify(data.horarios || []));
  });

  // 📶 Solicitar estado
  socket.on("command:getStatus", () => {
    console.log("📶 Solicitando estado actual al dispositivo...");
    mqttClient.publish("/petfeeder/IOTeam/comandos", "GET_STATUS");
  });

  // 📤 Enviar contador actual al conectar
  socket.emit("contador:update", { dispensacionesHoy });

  socket.on("disconnect", () => {
    console.log("❌ Cliente desconectado:", socket.id);
  });
});


// 🌐 Endpoint
app.get("/", (req, res) => res.send("Servidor PetFeeder funcionando 🐾"));


// 🚀 Arranque del servidor
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
});
