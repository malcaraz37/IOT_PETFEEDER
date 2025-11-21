document.addEventListener("DOMContentLoaded", () => {
const socket = io("https://iot-petfeeder.onrender.com");

  // 🎛️ Elementos UI
  const feedBtn = document.getElementById("feedBtn");
  const skipBtn = document.getElementById("skipBtn");
  const addHorarioBtn = document.getElementById("addHorarioBtn");
  const guardarHorariosBtn = document.getElementById("guardarHorariosBtn");
  const horariosList = document.getElementById("horariosList");

  const horaElem = document.getElementById("hora");
  const fechaElem = document.getElementById("fecha");
  const estadoPlatoElem = document.getElementById("estadoPlato");
  const luzElem = document.getElementById("luz");
  const modoNocheElem = document.getElementById("modoNoche");
  const proximaHoraElem = document.getElementById("proximaHora");
  const platoImg = document.getElementById("platoImg");
  const body = document.body;
  const estadoCard = document.getElementById("estadoCard");
  const controlesCard = document.getElementById("controlesCard");
  const modoImg = document.getElementById("modoImg");
  const nuevaHoraInput = document.getElementById("nuevaHora");
  // 📊 Contador de dispensaciones del día
const contadorElem = document.getElementById("contadorDispensaciones");

socket.on("contador:update", (data) => {
  contadorElem.textContent = data.dispensacionesHoy ?? 0;
});

  let horarios = [];

  // Forzar formato 24 horas en input type="time"
  nuevaHoraInput.step = 60;
  nuevaHoraInput.addEventListener("input", () => {
    const value = nuevaHoraInput.value;
    if (value) {
      const [h, m] = value.split(":");
      const hh = String(h).padStart(2, "0");
      const mm = String(m).padStart(2, "0");
      nuevaHoraInput.value = `${hh}:${mm}`;
    }
  });

  // 🌙 Funciones modo noche / día
  function activarModoNoche() {
    body.classList.add("night-mode");
    estadoCard.classList.add("night-card", "night-glow");
    controlesCard.classList.add("night-card", "night-glow");
    modoImg.src = "img/modonoche.png";
  }

  function activarModoDia() {
    body.classList.remove("night-mode");
    estadoCard.classList.remove("night-card", "night-glow");
    controlesCard.classList.remove("night-card", "night-glow");
    modoImg.src = "img/modonochefalse.png";
  }

  // 📅 Función para formatear fecha
  function formatearFecha(fechaISO) {
    if (!fechaISO) return "--/--/----";
    try {
      const fecha = new Date(fechaISO);
      const opciones = { weekday: "long", day: "numeric", month: "long", year: "numeric" };
      return fecha.toLocaleDateString("es-MX", opciones)
        .replace(/^\w/, (c) => c.toUpperCase()); // Capitalizar
    } catch {
      return fechaISO;
    }
  }

  // 🟢 Escuchar estado desde backend
  socket.on("estado:update", (data) => {
    // Forzar formato 24h
    if (data.hora) {
      const [h, m, s] = data.hora.split(":");
      const hh = String(h).padStart(2, "0");
      const mm = String(m).padStart(2, "0");
      const ss = String(s ?? "00").padStart(2, "0");
      horaElem.textContent = `${hh}:${mm}:${ss}`;
    } else {
      horaElem.textContent = "--:--:--";
    }

    // 📅 Mostrar fecha formateada
    fechaElem.textContent = formatearFecha(data.fecha);

    estadoPlatoElem.textContent = data.estadoPlato || "---";
    luzElem.textContent = `${data.luz_lux ?? 0} lux`;
    modoNocheElem.textContent = data.modoNoche ? "Activado" : "Desactivado";
    proximaHoraElem.textContent = data.proximaHora || "---";

    // 🥣 Cambiar imagen de plato según estado
    if (data.estadoPlato && data.estadoPlato.toLowerCase() === "vacio") {
      platoImg.src = "img/vacio.png";
    } else if (data.estadoPlato && data.estadoPlato.toLowerCase() === "lleno") {
      platoImg.src = "img/lleno.png";
    }

    // 🌙 Cambiar modo visual automáticamente
    if (data.modoNoche) {
      activarModoNoche();
    } else {
      activarModoDia();
    }
  });

  // 🔘 Botones
  feedBtn.addEventListener("click", () => {
    socket.emit("command:dispense", { command: "FEED" });
    alert("🐾 Dispensando comida...");
  });

  skipBtn.addEventListener("click", () => {
    socket.emit("command:skipMeal", { command: "SKIP_MEAL" });
    alert("⏭️ Saltando la próxima comida...");
  });

  // 🕓 Agregar horario (formato 24h)
  addHorarioBtn.addEventListener("click", () => {
    const nuevaHora = nuevaHoraInput.value;
    if (nuevaHora && horarios.length < 10) {
      const [h, m] = nuevaHora.split(":");
      const hh = String(h).padStart(2, "0");
      const mm = String(m).padStart(2, "0");
      const formato24h = `${hh}:${mm}`;

      if (!horarios.includes(formato24h)) {
        horarios.push(formato24h);
        renderHorarios();
      } else {
        alert("⚠️ Esa hora ya está programada");
      }
    } else if (horarios.length >= 10) {
      alert("⚠️ Solo puedes programar hasta 10 horarios");
    }
  });

  // 💾 Guardar horarios (en formato 24h)
  guardarHorariosBtn.addEventListener("click", () => {
    socket.emit("command:setSchedule", { horarios });
    alert("✅ Horarios enviados al dispensador");
  });

  // 🗑️ Renderizar lista
  function renderHorarios() {
    horariosList.innerHTML = "";
    horarios.forEach((h, i) => {
      const li = document.createElement("li");
      li.className =
        "flex justify-between items-center bg-blue-100 p-2 rounded mb-2 text-blue-900";

      li.innerHTML = `
        <span>${h}</span>
        <button class="text-red-600 hover:text-red-800 transition" data-index="${i}" title="Eliminar">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M10 3h4a1 1 0 011 1v1H9V4a1 1 0 011-1z" />
          </svg>
        </button>
      `;

      horariosList.appendChild(li);
    });

    horariosList.querySelectorAll("button").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const index = e.currentTarget.dataset.index;
        horarios.splice(index, 1);
        renderHorarios();
      });
    });
  }
});
