const username = localStorage.getItem("username");
const role = localStorage.getItem("role");

document.getElementById("displayUser").textContent = `${role}: ${username}`;
if (role === "admin") document.querySelectorAll(".adminOnly").forEach(e => e.classList.remove("hidden"));

document.getElementById("logoutBtn").addEventListener("click", () => {
  localStorage.clear();
  window.location.href = "index.html";
});

// Tab navigation
document.querySelectorAll(".tabBtn").forEach(btn => {
  btn.onclick = () => {
    document.querySelectorAll(".tabBtn").forEach(b => b.classList.remove("active-tab"));
    btn.classList.add("active-tab");
    document.querySelectorAll(".tabSection").forEach(s => s.classList.add("hidden"));
    document.getElementById(btn.dataset.tab).classList.remove("hidden");
  };
});

// =========================
// Wallet Logic
// =========================
const walletList = document.getElementById("walletList");

document.getElementById("addWalletBtn").onclick = () => {
  document.getElementById("walletForm").classList.toggle("hidden");
};

document.getElementById("saveWalletBtn").onclick = async () => {
  const val = document.getElementById("walletInput").value.trim();
  if (!val) return alert("Please input wallet info.");
  await fetch("/wallet", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: username, role, wallet: val })
  });
  document.getElementById("walletInput").value = "";
  document.getElementById("walletForm").classList.add("hidden");
  loadWallet();
};

async function loadWallet() {
  const res = await fetch("/wallet");
  const data = await res.json();
  walletList.innerHTML = "";
  data.forEach((w, i) => {
    if (role !== "admin" && w.name !== username) return;
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td class="border border-gray-700 p-2">${w.name}</td>
      <td class="border border-gray-700 p-2">${w.wallet}</td>
      <td class="border border-gray-700 p-2">${new Date(w.date).toLocaleString()}</td>
      <td class="border border-gray-700 p-2">
        ${role === "admin"
          ? `<button class="bg-red-600 px-2 rounded" data-del="${i}">Del</button>`
          : `<button class="bg-yellow-600 px-2 rounded" data-req="${i}">Request Edit</button>`
        }
      </td>`;
    walletList.appendChild(tr);
  });

  document.querySelectorAll("[data-del]").forEach(btn =>
    btn.onclick = async () => {
      await fetch(`/wallet/${btn.dataset.del}`, { method: "DELETE" });
      loadWallet();
    }
  );

  document.querySelectorAll("[data-req]").forEach(btn =>
    btn.onclick = async () => {
      await fetch("/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: username, type: "wallet", target: btn.dataset.req })
      });
      alert("Edit request sent to admin.");
    }
  );
}

// =========================
// Combat Logic (OCR + Table)
// =========================
async function loadCombat() {
  const res = await fetch("/combat");
  const data = await res.json();
  const list = document.getElementById("combatList");
  list.innerHTML = "";

  data.forEach((c, i) => {
    if (role !== "admin" && c.name !== username) return;
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td class="border border-gray-700 p-2">${c.name}</td>
      <td class="border border-gray-700 p-2">${c.combatPower}</td>
      <td class="border border-gray-700 p-2">${new Date(c.date).toLocaleString()}</td>
      <td class="border border-gray-700 p-2"><img src="/uploads/${c.filename}" class="max-w-[100px] rounded"></td>
      <td class="border border-gray-700 p-2">
        ${role === "admin"
          ? `<button class="bg-red-600 px-2 rounded" data-delcombat="${i}">Del</button>`
          : `<button class="bg-yellow-600 px-2 rounded" data-reqcombat="${i}">Request Edit</button>`}
      </td>`;
    list.appendChild(tr);
  });

  document.querySelectorAll("[data-delcombat]").forEach(btn =>
    btn.onclick = async () => {
      await fetch(`/combat/${btn.dataset.delcombat}`, { method: "DELETE" });
      loadCombat();
    }
  );

  document.querySelectorAll("[data-reqcombat]").forEach(btn =>
    btn.onclick = async () => {
      await fetch("/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: username, type: "combat", target: btn.dataset.reqcombat })
      });
      alert("Edit request sent to admin.");
    }
  );
}

document.getElementById("uploadCombat").onclick = async () => {
  const file = document.getElementById("combatImage").files[0];
  if (!file) return alert("Select an image first");

  const formData = new FormData();
  formData.append("file", file);
  formData.append("name", username);

  const res = await fetch("/upload", { method: "POST", body: formData });
  const data = await res.json();

  document.getElementById("combatPreview").innerHTML = `
    <p>Detected Combat Power: <b>${data.combatPower}</b></p>
    <img src="/uploads/${data.filename}" class="max-w-sm mt-2 rounded">
  `;
  loadCombat();
};

// =========================
// Request Handling (Admin)
// =========================
async function loadRequests() {
  if (role !== "admin") return;
  const res = await fetch("/request");
  const reqs = await res.json();
  const list = document.getElementById("requestList");
  list.innerHTML = "";

  reqs.forEach((r, i) => {
    const div = document.createElement("div");
    div.className = "border border-gray-700 p-2 rounded bg-gray-800";
    div.innerHTML = `
      <p><b>${r.name}</b> requested edit for <b>${r.type}</b> entry #${r.target}</p>
      <button class="approve bg-green-600 px-2 rounded" data-i="${i}">Approve</button>
      <button class="deny bg-red-600 px-2 rounded" data-i="${i}">Deny</button>
    `;
    list.appendChild(div);
  });

  document.querySelectorAll(".approve").forEach(btn => {
    btn.onclick = async () => {
      await fetch(`/request/approve/${btn.dataset.i}`, { method: "POST" });
      loadRequests();
    };
  });
  document.querySelectorAll(".deny").forEach(btn => {
    btn.onclick = async () => {
      await fetch(`/request/deny/${btn.dataset.i}`, { method: "POST" });
      loadRequests();
    };
  });
}

// Initial Load
loadWallet();
loadCombat();
loadRequests();
