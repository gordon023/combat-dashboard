let role = localStorage.getItem("role") || "guest";
const api = (url, opts = {}) => fetch(url, opts).then(r => r.json());

document.addEventListener("DOMContentLoaded", () => {
  if (role !== "admin") document.querySelectorAll(".admin-only").forEach(e => e.style.display = "none");
  loadAnnouncements();
  loadWallets();
  loadCombats();
});

// ANNOUNCEMENTS
async function loadAnnouncements() {
  const data = await api("/announcements");
  const container = document.getElementById("announcementList");
  container.innerHTML = data.map((a, i) => `
    <div class="card">
      <p>${a.text}</p>
      <small>${a.time}</small>
      ${role === "admin" ? `<button onclick="deleteAnnouncement(${i})">Delete</button>` : ""}
    </div>`).join("");
}
async function postAnnouncement() {
  const text = document.getElementById("announcementText").value;
  await api("/announcements", { method: "POST", body: JSON.stringify({ text }), headers: {"Content-Type":"application/json"} });
  loadAnnouncements();
}

// WALLETS
async function loadWallets() {
  const data = await api("/wallets");
  const list = document.getElementById("walletList");
  list.innerHTML = data.map((w, i) => `
    <div class="card">
      <b>${w.name}</b>: ${w.address}
      ${role === "admin"
        ? `<button onclick="deleteWallet(${i})">Del</button><button onclick="copyWallet(${i})">Copy</button>`
        : `<button onclick="requestUpdate('wallet', ${i})">Request Edit</button>`}
    </div>`).join("");
}
async function addWallet() {
  if (role !== "admin" && localStorage.getItem("walletAdded")) return alert("You can only add once!");
  const name = walletName.value, address = walletAddress.value;
  await api("/wallets", { method:"POST", headers:{ "Content-Type":"application/json" }, body: JSON.stringify({ name, address }) });
  localStorage.setItem("walletAdded", "true");
  loadWallets();
}
async function deleteWallet(i) { await api(`/wallets/${i}`, { method:"DELETE" }); loadWallets(); }
async function copyWallet(i) { const data = await api("/wallets"); const item = data[i]; await api("/wallets", { method:"POST", headers:{ "Content-Type":"application/json" }, body: JSON.stringify(item) }); loadWallets(); }

// COMBAT
async function loadCombats() {
  const data = await api("/combats");
  const list = document.getElementById("combatList");
  list.innerHTML = data.map((c, i) => `
    <div class="card">
      <b>${c.user}</b> – Combat Power: ${c.combatPower}
      ${role === "admin"
        ? `<button onclick="deleteCombat(${i})">Del</button>`
        : `<button onclick="requestUpdate('combat', ${i})">Request Edit</button>`}
    </div>`).join("");
}
document.getElementById("combatForm").onsubmit = async e => {
  e.preventDefault();
  if (role !== "admin" && localStorage.getItem("combatAdded")) return alert("You can only upload once!");
  const formData = new FormData(e.target);
  formData.append("user", localStorage.getItem("username") || "Guest");
  const res = await api("/upload", { method:"POST", body: formData });
  alert("Detected Combat Power: " + res.combatPower);
  localStorage.setItem("combatAdded", "true");
  loadCombats();
};
async function deleteCombat(i) { await api(`/combats/${i}`, { method:"DELETE" }); loadCombats(); }

// GUEST REQUEST UPDATE
async function requestUpdate(type, id) {
  const reason = prompt("Enter reason for update:");
  if (!reason) return;
  await api("/request-update", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type, id, reason, user: localStorage.getItem("username") || "Guest" })
  });
  alert("Request sent to admin!");
}
