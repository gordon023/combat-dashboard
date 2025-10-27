document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();

  try {
    const res = await fetch("/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    });

    const data = await res.json();
    if (data.success) {
      localStorage.setItem("username", username);
      localStorage.setItem("role", data.role);
      window.location.href = "/dashboard.html";
    } else {
      alert(data.message || "Login failed");
    }
  } catch (err) {
    alert("Error connecting to server");
  }
});
