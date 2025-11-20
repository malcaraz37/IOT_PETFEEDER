// frontend/js/auth.js
document.getElementById("btnLogin").addEventListener("click", async () => {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();
  const msg = document.getElementById("msg");
  const API_URL = "http://localhost:3000";

  if (!email || !password) {
    msg.textContent = "Por favor ingresa correo y contraseña";
    msg.style.color = "red";
    return;
  }

  try {
    const res = await fetch(`${API_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (res.ok) {
      // ✅ Guarda todo el usuario en un solo objeto
      const user = {
        name: data.usuario.nombre,
        email: data.usuario.email,
        role: data.usuario.rol,
        token: data.token
      };

      localStorage.setItem("user", JSON.stringify(user));

      // 🔒 Limpia los campos y redirige
      document.getElementById("email").value = "";
      document.getElementById("password").value = "";
      msg.textContent = "";

      window.location.href = "dashboard.html";
    } else {
      msg.textContent = data.mensaje || "Error al iniciar sesión";
      msg.style.color = "red";
    }
  } catch (error) {
    msg.textContent = "Error de conexión con el servidor";
    msg.style.color = "red";
  }
});
