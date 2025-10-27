// ====================================
// Combat Dashboard Server - Full Build
// ====================================

import express from "express";
import path from "path";
import fs from "fs";
import bodyParser from "body-parser";
import multer from "multer";

const app = express();

// --- Setup Paths ---
const __dirname = path.resolve();
const publicDir = path.join(__dirname, "public");
const dataDir = path.join(__dirname, "data");
const uploadDir = path.join(__dirname, "uploads");

if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

// --- Middleware ---
app.use(bodyParser.json());
app.use(express.static(publicDir));

// --- File Helpers ---
function readJSON(file) {
  const filePath = path.join(dataDir, file);
  if (!fs.existsSync(filePath)) return [];
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}
function writeJSON(file, data) {
  const filePath = path.join(dataDir, file);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

// --- Multer (for combat uploads) ---
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname)
});
const upload = multer({ storage });

// ====================================
// LOGIN
// ====================================
app.post("/login", (req, res) => {
  const { username, password } = req.body;

  const ADMIN_USER = process.env.ADMIN_USER || "admin";
  const ADMIN_PASS = process.env.ADMIN_PASS || "1234";

  if (username === ADMIN_USER && password === ADMIN_PASS)
    return res.json({ success: true, role: "admin" });

  if (username && password === "")
    return res.json({ success: true, role: "guest" });

  return res.status(401).json({ success: false, message: "Invalid credentials" });
});

// ====================================
// ANNOUNCEMENTS
// ====================================
app.get("/announcement", (req, res) => {
  res.json(readJSON("announcements.json"));
});

app.post("/announcement", (req, res) => {
  const announcements = readJSON("announcements.json");
  announcements.push(req.body);
  writeJSON("announcements.json", announcements);
  res.json({ success: true });
});

app.delete("/announcement/:index", (req, res) => {
  const announcements = readJSON("announcements.json");
  const idx = parseInt(req.params.index);
  if (idx >= 0 && idx < announcements.length) announcements.splice(idx, 1);
  writeJSON("announcements.json", announcements);
  res.json({ success: true });
});

// ====================================
// WALLET
// ====================================
app.get("/wallet", (req, res) => {
  res.json(readJSON("wallet.json"));
});

app.post("/wallet", (req, res) => {
  const wallets = readJSON("wallet.json");
  wallets.push(req.body);
  writeJSON("wallet.json", wallets);
  res.json({ success: true });
});

app.delete("/wallet/:index", (req, res) => {
  const wallets = readJSON("wallet.json");
  const idx = parseInt(req.params.index);
  if (idx >= 0 && idx < wallets.length) wallets.splice(idx, 1);
  writeJSON("wallet.json", wallets);
  res.json({ success: true });
});

// ====================================
// COMBAT (image upload placeholder)
// ====================================
app.post("/upload", upload.single("file"), (req, res) => {
  // For now, no OCR yet — will implement later
  res.json({ success: true, filename: req.file.filename });
});

// ====================================
// REQUESTS (guest edit requests)
// ====================================
app.get("/requests", (req, res) => {
  res.json(readJSON("requests.json"));
});

app.post("/requests", (req, res) => {
  const requests = readJSON("requests.json");
  requests.push(req.body);
  writeJSON("requests.json", requests);
  res.json({ success: true });
});

app.delete("/requests/:index", (req, res) => {
  const requests = readJSON("requests.json");
  const idx = parseInt(req.params.index);
  if (idx >= 0 && idx < requests.length) requests.splice(idx, 1);
  writeJSON("requests.json", requests);
  res.json({ success: true });
});

// ====================================
// STATIC ROUTES
// ====================================
app.get("/", (req, res) => {
  res.sendFile(path.join(publicDir, "index.html"));
});

app.get("/dashboard.html", (req, res) => {
  res.sendFile(path.join(publicDir, "dashboard.html"));
});

// ====================================
// SERVER START
// ====================================
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));

