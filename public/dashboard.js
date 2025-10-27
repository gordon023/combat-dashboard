document.addEventListener("DOMContentLoaded", () => {
  const username = localStorage.getItem("username");
  const role = localStorage.getItem("role");
  const usernameDisplay = document.getElementById("usernameDisplay");
  const roleDisplay = document.getElementById("roleDisplay");
  const requestsTab = document.getElementById("requestsTab");

  if (!username || !role) window.location.href = "/";

  usernameDisplay.textContent = username;
  roleDisplay.textContent = role;

  if (role === "admin") document.getElementById("announcementForm").style.display = "block";
  if (role === "admin") requestsTab.style.display = "block";

  // Tabs
  document.querySelectorAll(".tab").forEach(tab => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
      tab.classList.add("active");

      document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active"));
      document.getElementById(tab.dataset.tab).classList.add("active");
    });
  });

  // Logout
  document.getElementById("logoutBtn").addEventListener("click", () => {
    localStorage.clear();
    window.location.href = "/";
  });

  // Wallet filtering
  const walletFilter = document.getElementById("walletFilter");
  walletFilter.addEventListener("input", () => {
    const filter = walletFilter.value.toLowerCase();
    document.querySelectorAll(".wallet-item").forEach(item => {
      item.style.display = item.textContent.toLowerCase().includes(filter) ? "block" : "none";
    });
  });

  // Placeholder Wallet + Announcement loading
  loadWallet();
  loadAnnouncements();

  // Wallet Add
  document.getElementById("addWallet").addEventListener("click", async () => {
    const value = document.getElementById("walletValue").value.trim();
    if (!value) return alert("Enter wallet amount.");
    const entry = { user: username, value, time: new Date().toISOString() };
    await fetch("/wallet", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(entry)
    });
    document.getElementById("walletValue").value = "";
    loadWallet();
  });

  // Announcement Add (admin)
  document.getElementById("addAnnouncement")?.addEventListener("click", async () => {
    const text = document.getElementById("announcementText").value.trim();
    if (!text) return alert("Enter announcement text.");
    const entry = { user: username, text, time: new Date().toISOString() };
    await fetch("/announcement", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(entry)
    });
    document.getElementById("announcementText").value = "";
    loadAnnouncements();
  });

  // Load wallet list
  async function loadWallet() {
    const res = await fetch("/wallet");
    const data = await res.json();
    const walletList = document.getElementById("walletList");
    walletList.innerHTML = "";
    data.forEach((w, i) => {
      const div = document.createElement("div");
      div.className = "wallet-item";
      div.innerHTML = `
        <div class="wallet-header">
          <strong>${w.user}</strong> <span>${w.value}</span>
        </div>
        ${role === "admin"
          ? `<button onclick="deleteWallet(${i})">Delete</button>`
          : `<button onclick="requestEdit('${w.user}', ${i})">Request Edit</button>`}
      `;
      walletList.appendChild(div);
    });
  }

  // Load announcements
  async function loadAnnouncements() {
    const res = await fetch("/announcement");
    const data = await res.json();
    const list = document.getElementById("announcementList");
    list.innerHTML = "";
    data.forEach((a, i) => {
      const div = document.createElement("div");
      div.className = "announcement";
      div.innerHTML = `
        <strong>${a.user}</strong>: ${a.text}
        ${role === "admin"
          ? `<br><button onclick="deleteAnnouncement(${i})">Delete</button>`
          : ""}`;
      list.appendChild(div);
    });
  }

  window.deleteWallet = async (i) => {
    await fetch(`/wallet/${i}`, { method: "DELETE" });
    loadWallet();
  };

  window.requestEdit = async (user, index) => {
    const reason = prompt("Enter your edit request:");
    if (!reason) return;
    await fetch("/requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user, reason, index, time: new Date().toISOString() })
    });
    alert("Request sent to admin.");
  };

  window.deleteAnnouncement = async (i) => {
    await fetch(`/announcement/${i}`, { method: "DELETE" });
    loadAnnouncements();
  };
});
