document.addEventListener("DOMContentLoaded", () => {
  const savedName = localStorage.getItem("username");
  if (savedName) document.getElementById("username").value = savedName;
});

document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();

  const res = await fetch("/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password })
  });
  const data = await res.json();

  localStorage.setItem("username", username);
  localStorage.setItem("role", data.role);
  window.location.href = "/dashboard.html";
});
