// dashboard.js
const username = localStorage.getItem("username");
const role = localStorage.getItem("role");
if (!username || !role) location.href = "/";

document.getElementById('userInfo').textContent = `${role.toUpperCase()} : ${username}`;

// Tabs
const tabs = document.querySelectorAll('.tab');
tabs.forEach(t => {
  t.addEventListener('click', () => {
    tabs.forEach(x => x.classList.remove('active'));
    t.classList.add('active');
    document.querySelectorAll('.card').forEach(c => c.classList.add('hidden'));
    document.getElementById(t.dataset.tab).classList.remove('hidden');
  });
});

// show requests tab for admin
if (role === 'admin') {
  document.getElementById('requestsTabBtn').classList.remove('hidden');
  document.getElementById('announcementForm').classList.remove('hidden');
}

// logout
document.getElementById('logoutBtn').addEventListener('click', () => {
  localStorage.clear();
  location.href = '/';
});

// ----------------- ANNOUNCEMENTS -----------------
async function loadAnnouncements(){
  const res = await fetch('/announcement');
  const list = await res.json();
  const container = document.getElementById('announcementList');
  container.innerHTML = '';
  list.forEach((a,i) => {
    const div = document.createElement('div');
    div.style.marginBottom = '8px';
    div.innerHTML = `
      <div style="font-size:12px;color:#9fb4c9">${new Date(a.date).toLocaleString()}</div>
      <div style="margin-top:6px">${a.text}</div>
    `;
    if (role === 'admin'){
      const editBtn = document.createElement('button'); editBtn.textContent='Edit'; editBtn.className='btn ghost';
      const delBtn = document.createElement('button'); delBtn.textContent='Del'; delBtn.className='btn'; delBtn.style.marginLeft='8px';
      editBtn.onclick = async () => {
        const newText = prompt('Edit announcement', a.text);
        if (!newText) return;
        await fetch(`/announcement/${i}`, { method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ role:'admin', text:newText }) });
        loadAnnouncements();
      };
      delBtn.onclick = async () => {
        if (!confirm('Delete announcement?')) return;
        await fetch(`/announcement/${i}`, { method:'DELETE', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ role:'admin' }) });
        loadAnnouncements();
      };
      const ctrl = document.createElement('div'); ctrl.style.marginTop='6px';
      ctrl.appendChild(editBtn); ctrl.appendChild(delBtn);
      div.appendChild(ctrl);
    }
    container.appendChild(div);
  });
}
document.getElementById('postAnnouncementBtn')?.addEventListener('click', async () => {
  if (role !== 'admin') return alert('Only admin can post announcements');
  const text = document.getElementById('announcementText').value.trim();
  if (!text) return alert('Enter announcement');
  await fetch('/announcement', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ role:'admin', text, name: username }) });
  document.getElementById('announcementText').value = '';
  loadAnnouncements();
});
loadAnnouncements();

// ----------------- WALLET -----------------
const walletTable = document.getElementById('walletTable');
document.getElementById('showAddWallet').addEventListener('click', () => {
  document.getElementById('addWalletForm').classList.toggle('hidden');
});

document.getElementById('addWalletBtn').addEventListener('click', async () => {
  const val = document.getElementById('walletInput').value.trim();
  if (!val) return alert('Enter wallet info');
  await fetch('/wallet', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ name: username, wallet: val, date: new Date().toISOString() }) });
  document.getElementById('walletInput').value = '';
  document.getElementById('addWalletForm').classList.add('hidden');
  loadWallets();
});

async function loadWallets(){
  const res = await fetch('/wallet');
  const data = await res.json();
  walletTable.innerHTML = '';
  data.forEach((w,i) => {
    // show all entries to admin; guests see all but request only their own
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${w.name}</td>
      <td>${w.wallet}</td>
      <td>${new Date(w.date).toLocaleString()}</td>
      <td></td>
    `;
    const actions = tr.querySelector('td:last-child');
    if (role === 'admin'){
      const del = document.createElement('button'); del.textContent='Delete'; del.className='btn'; del.onclick = async () => {
        if (!confirm('Delete wallet?')) return;
        await fetch(`/wallet/${i}`, { method:'DELETE' });
        loadWallets();
      };
      actions.appendChild(del);
    } else {
      // guest: can request edit only on own entries
      if (w.name === username){
        const reqBtn = document.createElement('button'); reqBtn.textContent='Request Edit'; reqBtn.className='btn ghost';
        reqBtn.onclick = async () => {
          const note = prompt('Describe the change you want:');
          if (!note) return;
          await fetch('/request', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ name: username, type:'wallet', target: i, note, date: new Date().toISOString() }) });
          alert('Request sent to admin');
        };
        actions.appendChild(reqBtn);
      }
    }
    walletTable.appendChild(tr);
  });
}
loadWallets();

// ----------------- COMBAT -----------------
document.getElementById('uploadCombatBtn').addEventListener('click', async () => {
  const file = document.getElementById('combatImage').files[0];
  if (!file) return alert('Select an image');
  const fd = new FormData();
  fd.append('file', file);
  fd.append('name', username);
  const res = await fetch('/upload', { method:'POST', body: fd });
  const j = await res.json();
  if (!j.success) return alert('Upload failed');
  document.getElementById('combatPreview').innerHTML = `<div>Detected: <b>${j.combatPower}</b></div><img src="/uploads/${j.filename}" class="thumb" />`;
  loadCombats();
});

const combatTable = document.getElementById('combatTable');
async function loadCombats(){
  const res = await fetch('/combat');
  const data = await res.json();
  combatTable.innerHTML = '';
  data.forEach((c,i) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${c.name}</td>
      <td>${c.combatPower}</td>
      <td>${new Date(c.date).toLocaleString()}</td>
      <td><img src="/uploads/${c.filename}" class="thumb" /></td>
      <td></td>
    `;
    const actions = tr.querySelector('td:last-child');
    if (role === 'admin'){
      const del = document.createElement('button'); del.textContent='Delete'; del.className='btn';
      del.onclick = async () => {
        if (!confirm('Delete record?')) return;
        await fetch(`/combat/${i}`, { method:'DELETE' });
        loadCombats();
      };
      actions.appendChild(del);
    } else {
      if (c.name === username){
        const req = document.createElement('button'); req.textContent='Request Edit'; req.className='btn ghost';
        req.onclick = async () => {
          const note = prompt('Describe the change you want:');
          if (!note) return;
          await fetch('/request', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ name: username, type:'combat', target: i, note, date: new Date().toISOString() })});
          alert('Request sent to admin');
        };
        actions.appendChild(req);
      }
    }
    combatTable.appendChild(tr);
  });
}
loadCombats();

// ----------------- REQUESTS (admin only) -----------------
async function loadRequests(){
  if (role !== 'admin') return;
  const res = await fetch('/request');
  const data = await res.json();
  const list = document.getElementById('requestList');
  list.innerHTML = '';
  data.forEach((r,i) => {
    const div = document.createElement('div');
    div.style.marginBottom='8px';
    div.innerHTML = `<div><b>${r.name}</b> requested edit for ${r.type} #${r.target}</div><div class="muted">${new Date(r.date).toLocaleString()}</div>`;
    const appr = document.createElement('button'); appr.textContent='Approve'; appr.className='btn';
    const deny = document.createElement('button'); deny.textContent='Deny'; deny.className='btn ghost'; deny.style.marginLeft='8px';
    appr.onclick = async () => {
      // Approve simply removes request; admin can later modify the item manually
      await fetch(`/request/approve/${i}`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ role:'admin' }) });
      loadRequests(); loadWallets(); loadCombats();
    };
    deny.onclick = async () => {
      await fetch(`/request/deny/${i}`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ role:'admin' }) });
      loadRequests();
    };
    div.appendChild(document.createElement('br'));
    div.appendChild(appr); div.appendChild(deny);
    list.appendChild(div);
  });
}
loadRequests();
