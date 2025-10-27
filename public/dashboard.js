// --- Access Control ---
const username = localStorage.getItem("username");
const role = localStorage.getItem("role");

if (!username || !role) {
  window.location.href = "/";
}

// --- Display user info ---
document.getElementById("userInfo").textContent = `${role.toUpperCase()}: ${username}`;
if (role !== "admin") {
  document.querySelectorAll(".adminOnly").forEach(el => el.style.display = "none");
}

// --- Logout ---
document.getElementById("logoutBtn").addEventListener("click", () => {
  localStorage.clear();
  window.location.href = "/";
});

// --- Tabs ---
const tabs = document.querySelectorAll(".tabBtn");
const sections = document.querySelectorAll(".tab");
tabs.forEach(btn => {
  btn.addEventListener("click", () => {
    sections.forEach(sec => sec.classList.add("hidden"));
    document.getElementById(btn.dataset.tab).classList.remove("hidden");
  });
});

// --- Default to first tab ---
sections.forEach(sec => sec.classList.add("hidden"));
document.getElementById("announcement").classList.remove("hidden");
