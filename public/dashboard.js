const user = JSON.parse(localStorage.getItem("user"));
if (!user) window.location.href = "index.html";

document.getElementById("userDisplay").textContent = `👤 ${user.username} (${user.role})`;
if (user.role !== "admin") document.querySelectorAll(".adminOnly").forEach(btn => btn.style.display = "none");

// logout
document.getElementById("logout").addEventListener("click", () => {
  localStorage.removeItem("user");
  window.location.href = "index.html";
});

// Tab switching
const sections = document.querySelectorAll(".tabSection");
document.querySelectorAll(".tabBtn").forEach(btn => {
  btn.addEventListener("click", () => {
    sections.forEach(s => s.classList.add("hidden"));
    document.getElementById(btn.dataset.tab).classList.remove("hidden");
  });
});

// ==================== DASHBOARD (Announcements) ====================
async function loadAnnouncements() {
  const res = await fetch("/announcement");
  const list = await res.json();
  const dash = document.getElementById("dashboard");
  dash.innerHTML = `<h2>📢 Announcements</h2>`;

  if (user.role === "admin") {
    dash.innerHTML += `
      <textarea id="announceText" placeholder="Write announcement..."></textarea>
      <button id="postAnn">Post Announcement</button>
    `;
    document.getElementById("postAnn").onclick = async () => {
      const text = document.getElementById("announceText").value.trim();
      if (!text) return alert("Enter text");
      await fetch("/announcement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: user.username, role: user.role, text })
      });
      loadAnnouncements();
    };
  }

  const listDiv = document.createElement("div");
  listDiv.className = "announcementList";
  list.forEach((a, i) => {
    listDiv.innerHTML += `
      <div class="announceItem">
        <p>${a.text}</p>
        <small>By ${a.author || "Admin"} - ${new Date(a.date).toLocaleString()}</small>
        ${
          user.role === "admin"
            ? `<button onclick="editAnn(${i})">✏️</button>
               <button onclick="delAnn(${i})">🗑️</button>`
            : ""
        }
      </div>`;
  });
  dash.appendChild(listDiv);
}
window.editAnn = async (i) => {
  const text = prompt("Edit announcement:");
  if (text) await fetch(`/announcement/${i}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text })
  });
  loadAnnouncements();
};
window.delAnn = async (i) => {
  if (confirm("Delete this?")) {
    await fetch(`/announcement/${i}`, { method: "DELETE" });
    loadAnnouncements();
  }
};

// ==================== WALLET ====================
async function loadWallet() {
  const res = await fetch("/wallet");
  const list = await res.json();
  const wallet = document.getElementById("wallet");
  wallet.innerHTML = `<h2>💼 Wallet List</h2>`;

  if (user.role === "guest") {
    wallet.innerHTML += `<button id="addWalletBtn">Add your wallet</button>`;
    document.getElementById("addWalletBtn").onclick = () => {
      const w = prompt("Enter your wallet address:");
      if (!w) return;
      fetch("/wallet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: user.username, wallet: w })
      }).then(() => loadWallet());
    };
  }

  let table = `<table border="1" width="100%">
    <tr><th>Name</th><th>Wallet</th><th>Date</th>${user.role === "admin" ? "<th>Action</th>" : ""}</tr>`;
  list.forEach((w, i) => {
    table += `<tr>
      <td>${w.name}</td>
      <td>${w.wallet}</td>
      <td>${new Date(w.date).toLocaleString()}</td>
      ${
        user.role === "admin"
          ? `<td><button onclick="delWallet(${i})">🗑️</button></td>`
          : ""
      }
    </tr>`;
  });
  table += `</table>`;
  wallet.innerHTML += table;
}
window.delWallet = async (i) => {
  const list = await fetch("/wallet").then(r => r.json());
  list.splice(i, 1);
  await fetch("/wallet", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(list)
  });
};

// ==================== COMBAT ====================
async function loadCombat() {
  const res = await fetch("/combat");
  const list = await res.json();
  const combat = document.getElementById("combat");
  combat.innerHTML = `<h2>⚔️ Combat Records</h2>`;

  if (user.role === "guest") {
    combat.innerHTML += `
      <input type="file" id="combatFile">
      <button id="uploadCombat">Upload & Detect</button>`;
    document.getElementById("uploadCombat").onclick = async () => {
      const f = document.getElementById("combatFile").files[0];
      if (!f) return alert("Select file");
      const fd = new FormData();
      fd.append("file", f);
      fd.append("name", user.username);
      const res = await fetch("/upload", { method: "POST", body: fd });
      const out = await res.json();
      alert(`Detected Combat Power: ${out.combatPower}`);
      loadCombat();
    };
  }

  let table = `<table border="1" width="100%">
    <tr><th>Name</th><th>Combat Power</th><th>Date</th>${user.role === "admin" ? "<th>Action</th>" : ""}</tr>`;
  list.forEach((c, i) => {
    table += `<tr>
      <td>${c.name}</td>
      <td>${c.combatPower}</td>
      <td>${new Date(c.date).toLocaleString()}</td>
      ${
        user.role === "admin"
          ? `<td><button onclick="delCombat(${i})">🗑️</button></td>`
          : ""
      }
    </tr>`;
  });
  table += `</table>`;
  combat.innerHTML += table;
}
window.delCombat = async (i) => {
  await fetch(`/combat/${i}`, { method: "DELETE" });
  loadCombat();
};

// ==================== REQUESTS (ADMIN ONLY) ====================
async function loadRequests() {
  const res = await fetch("/requests");
  const list = await res.json();
  const reqs = document.getElementById("requests");
  reqs.innerHTML = `<h2>📨 Edit Requests</h2>`;

  if (user.role !== "admin") {
    reqs.innerHTML = `<p>Only admin can view this section.</p>`;
    return;
  }

  let table = `<table border="1" width="100%">
    <tr><th>Name</th><th>Message</th><th>Status</th><th>Date</th><th>Action</th></tr>`;
  list.forEach((r, i) => {
    table += `<tr>
      <td>${r.username}</td>
      <td>${r.message}</td>
      <td>${r.status}</td>
      <td>${new Date(r.date).toLocaleString()}</td>
      <td>
        <button onclick="approveReq(${i})">✅</button>
        <button onclick="denyReq(${i})">❌</button>
      </td>
    </tr>`;
  });
  table += `</table>`;
  reqs.innerHTML += table;
}
window.approveReq = async (i) => {
  await fetch(`/requests/${i}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: "Approved" })
  });
  loadRequests();
};
window.denyReq = async (i) => {
  await fetch(`/requests/${i}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: "Denied" })
  });
  loadRequests();
};

// ==================== INITIAL LOAD ====================
loadAnnouncements();
loadWallet();
loadCombat();
loadRequests();
