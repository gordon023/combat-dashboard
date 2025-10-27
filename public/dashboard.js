// public/dashboard.js
document.addEventListener("DOMContentLoaded", async () => {
  const user = JSON.parse(localStorage.getItem("user"));
  const usernameSpan = document.getElementById("username");
  const logoutBtn = document.getElementById("logoutBtn");
  const tabs = document.querySelectorAll(".tab");
  const sections = document.querySelectorAll(".section");

  if (!user) return (window.location.href = "/");

  usernameSpan.textContent = `${user.role}: ${user.username}`;

  // Logout
  logoutBtn.onclick = () => {
    localStorage.removeItem("user");
    window.location.href = "/";
  };

  // Tab switching
  tabs.forEach((tab) =>
    tab.addEventListener("click", () => {
      sections.forEach((sec) => (sec.style.display = "none"));
      document.getElementById(tab.dataset.target).style.display = "block";
    })
  );

  // Fetch initial data
  await loadAnnouncements();
  await loadWallets();
  await loadCombats();
  if (user.role === "admin") await loadRequests();

  // 🔔 ANNOUNCEMENTS
  async function loadAnnouncements() {
    const res = await fetch("/api/announcements");
    const data = await res.json();
    const list = document.getElementById("announcementsList");
    list.innerHTML = "";

    data.forEach((a) => {
      const date = new Date(a.date || Date.now()).toLocaleString();
      const div = document.createElement("div");
      div.classList.add("announcement-item");
      div.innerHTML = `
        <b>${date}</b><br>${a.text}
        ${
          user.role === "admin"
            ? `<br><button class="edit" data-id="${a.id}">Edit</button>
               <button class="del" data-id="${a.id}">Delete</button>`
            : ""
        }
      `;
      list.appendChild(div);
    });

    if (user.role === "admin") {
      document.getElementById("newAnnouncement").style.display = "block";
    }
  }

  document
    .getElementById("postAnnouncement")
    .addEventListener("click", async () => {
      const text = document.getElementById("announcementText").value.trim();
      if (!text) return alert("Enter announcement text");
      await fetch("/api/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      document.getElementById("announcementText").value = "";
      loadAnnouncements();
    });

  // 💰 WALLET
  async function loadWallets() {
    const res = await fetch("/api/wallets");
    const wallets = await res.json();
    const table = document.getElementById("walletTableBody");
    table.innerHTML = "";

    wallets.forEach((w) => {
      const date = new Date(w.date || Date.now()).toLocaleString();
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${w.name}</td>
        <td>${w.wallet}</td>
        <td>${date}</td>
        <td>
          ${
            user.role === "admin"
              ? `<button data-id="${w.id}" class="delWallet">Del</button>`
              : `<button data-id="${w.id}" class="reqEdit">Request Edit</button>`
          }
        </td>
      `;
      table.appendChild(tr);
    });

    // Delete (admin)
    if (user.role === "admin") {
      document.querySelectorAll(".delWallet").forEach((btn) =>
        btn.addEventListener("click", async () => {
          await fetch(`/api/wallets/${btn.dataset.id}`, { method: "DELETE" });
          loadWallets();
        })
      );
    }

    // Request edit (guest)
    if (user.role === "guest") {
      document.querySelectorAll(".reqEdit").forEach((btn) =>
        btn.addEventListener("click", async () => {
          await fetch("/api/requests", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              user: user.username,
              target: btn.dataset.id,
              type: "wallet",
            }),
          });
          alert("Edit request sent to admin");
        })
      );
    }
  }

  document.getElementById("addWalletBtn").addEventListener("click", async () => {
    const walletText = prompt("Enter your wallet info:");
    if (!walletText) return;
    await fetch("/api/wallets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ wallet: walletText }),
    });
    loadWallets();
  });

  // ⚔️ COMBAT
  async function loadCombats() {
    const res = await fetch("/api/combats");
    const combats = await res.json();
    const table = document.getElementById("combatTableBody");
    table.innerHTML = "";

    combats.forEach((c) => {
      const date = new Date(c.date || Date.now()).toLocaleString();
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${c.name}</td>
        <td>${c.power}</td>
        <td>${date}</td>
        <td><img src="/uploads/${c.image}" width="80"></td>
        ${
          user.role === "admin"
            ? `<td><button data-id="${c.id}" class="delCombat">Del</button></td>`
            : ""
        }
      `;
      table.appendChild(tr);
    });
  }

  // 📩 REQUESTS (admin only)
  async function loadRequests() {
    const res = await fetch("/api/requests");
    const reqs = await res.json();
    const list = document.getElementById("requestsList");
    list.innerHTML = "";

    reqs.forEach((r) => {
      const div = document.createElement("div");
      div.innerHTML = `
        ${r.user} requested edit for ${r.type} [${r.target}]
        <button class="approveReq" data-id="${r.id}">Approve</button>
        <button class="denyReq" data-id="${r.id}">Deny</button>
      `;
      list.appendChild(div);
    });
  }
});
