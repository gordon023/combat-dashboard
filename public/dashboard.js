// --- Access Control ---
const username = localStorage.getItem("username");
const role = localStorage.getItem("role");
if (!username || !role) window.location.href = "/";

document.getElementById("userInfo").textContent = `${role.toUpperCase()}: ${username}`;
if (role !== "admin") document.querySelectorAll(".adminOnly").forEach(el => el.style.display = "none");

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
document.getElementById("announcement").classList.remove("hidden");

// ==========================
// ANNOUNCEMENTS
// ==========================
async function loadAnnouncements() {
  const res = await fetch("/announcement");
  const data = await res.json();
  const list = document.getElementById("announcementList");
  list.innerHTML = "";
  data.forEach((a, i) => {
    const div = document.createElement("div");
    div.className = "border p-2 mb-2 rounded bg-gray-800";
    div.innerHTML = `
      <p>${a.text}</p>
      <small>By: ${a.author}</small>
      ${role === "admin" ? `<button data-i="${i}" class="delAnn bg-red-600 ml-2 px-2">Delete</button>` : ""}
    `;
    list.appendChild(div);
  });
  if (role === "admin")
    document.querySelectorAll(".delAnn").forEach(btn => {
      btn.onclick = async () => {
        await fetch(`/announcement/${btn.dataset.i}`, { method: "DELETE" });
        loadAnnouncements();
      };
    });
}

document.getElementById("postAnnouncement")?.addEventListener("click", async () => {
  const text = document.getElementById("announceText").value.trim();
  if (!text) return alert("Enter announcement text");
  await fetch("/announcement", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, author: username })
  });
  document.getElementById("announceText").value = "";
  loadAnnouncements();
});
loadAnnouncements();

// ==========================
// WALLET
// ==========================
async function loadWallet() {
  const res = await fetch("/wallet");
  const data = await res.json();
  const list = document.getElementById("walletList");
  list.innerHTML = "";
  const filter = document.getElementById("walletFilter").value.toLowerCase();

  data
    .filter(w => w.name.toLowerCase().includes(filter))
    .forEach((w, i) => {
      const div = document.createElement("div");
      div.className = "border p-2 mb-2 rounded bg-gray-800";
      div.innerHTML = `
        <p><b>${w.name}</b>: ${w.amount}</p>
        ${role === "admin"
          ? `<button data-i="${i}" class="delWallet bg-red-600 ml-2 px-2">Delete</button>`
          : `<button data-i="${i}" class="reqEdit bg-yellow-600 ml-2 px-2">Request Edit</button>`}
      `;
      list.appendChild(div);
    });

  if (role === "admin") {
    document.querySelectorAll(".delWallet").forEach(btn => {
      btn.onclick = async () => {
        await fetch(`/wallet/${btn.dataset.i}`, { method: "DELETE" });
        loadWallet();
      };
    });
  } else {
    document.querySelectorAll(".reqEdit").forEach(btn => {
      btn.onclick = async () => {
        await fetch("/requests", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user: username, type: "wallet", index: btn.dataset.i })
        });
        alert("Edit request sent to admin.");
      };
    });
  }
}
document.getElementById("walletFilter").addEventListener("input", loadWallet);
loadWallet();

document.getElementById("addWallet").addEventListener("click", async () => {
  const amount = document.getElementById("walletAmount").value.trim();
  if (!amount) return alert("Enter amount");
  await fetch("/wallet", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: username, amount })
  });
  document.getElementById("walletAmount").value = "";
  loadWallet();
});

// ==========================
// COMBAT
// ==========================
document.getElementById("uploadCombat").addEventListener("click", async () => {
  const file = document.getElementById("combatImage").files[0];
  if (!file) return alert("Select an image first");

  const formData = new FormData();
  formData.append("file", file);
  formData.append("name", username);

  const res = await fetch("/upload", { method: "POST", body: formData });
  const data = await res.json();

  document.getElementById("combatPreview").innerHTML = `
    <p>Uploaded: ${data.filename}</p>
    <p>Detected Combat Power: <b>${data.combatPower}</b></p>
    <img src="/uploads/${data.filename}" alt="preview" class="mt-2 max-w-sm rounded">
  `;
});
// ==========================
// COMBAT LIST
// ==========================
async function loadCombat() {
  const res = await fetch("/combat");
  const data = await res.json();
  const list = document.getElementById("combatList");
  list.innerHTML = "";

  data
    .filter(c => role === "admin" || c.name === username)
    .forEach((c, i) => {
      const div = document.createElement("div");
      div.className = "border p-2 mb-2 rounded bg-gray-800";
      div.innerHTML = `
        <p><b>${c.name}</b> — Combat Power: <span class="text-green-400">${c.combatPower}</span></p>
        <small>${new Date(c.date).toLocaleString()}</small><br>
        <img src="/uploads/${c.filename}" class="mt-2 max-w-xs rounded">
        ${role === "admin" ? `<br><button data-i="${i}" class="delCombat bg-red-600 mt-2 px-2 rounded">Delete</button>` : ""}
      `;
      list.appendChild(div);
    });

  if (role === "admin") {
    document.querySelectorAll(".delCombat").forEach(btn => {
      btn.onclick = async () => {
        await fetch(`/combat/${btn.dataset.i}`, { method: "DELETE" });
        loadCombat();
      };
    });
  }
}

// Load combat list after upload and page load
document.getElementById("uploadCombat").addEventListener("click", async () => {
  const file = document.getElementById("combatImage").files[0];
  if (!file) return alert("Select an image first");

  const formData = new FormData();
  formData.append("file", file);
  formData.append("name", username);

  const res = await fetch("/upload", { method: "POST", body: formData });
  const data = await res.json();

  document.getElementById("combatPreview").innerHTML = `
    <p>Uploaded: ${data.filename}</p>
    <p>Detected Combat Power: <b>${data.combatPower}</b></p>
    <img src="/uploads/${data.filename}" alt="preview" class="mt-2 max-w-sm rounded">
  `;
  loadCombat();
});

loadCombat();


// ==========================
// REQUESTS (Admin only)
// ==========================
async function loadRequests() {
  if (role !== "admin") return;
  const res = await fetch("/requests");
  const data = await res.json();
  const list = document.getElementById("requestList");
  list.innerHTML = "";
  data.forEach((r, i) => {
    const div = document.createElement("div");
    div.className = "border p-2 mb-2 rounded bg-gray-800";
    div.innerHTML = `
      <p><b>${r.user}</b> requested edit on ${r.type} [#${r.index}]</p>
      <button data-i="${i}" class="delReq bg-red-600 px-2">Delete</button>
    `;
    list.appendChild(div);
  });
  document.querySelectorAll(".delReq").forEach(btn => {
    btn.onclick = async () => {
      await fetch(`/requests/${btn.dataset.i}`, { method: "DELETE" });
      loadRequests();
    };
  });
}
loadRequests();
