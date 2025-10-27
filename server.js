// ============================
// Combat Dashboard Server
// ============================
import express from "express";
import fs from "fs";
import path from "path";
import bodyParser from "body-parser";
import multer from "multer";

const app = express();
const __dirname = path.resolve();
const publicDir = path.join(__dirname, "public");
const dataDir = path.join(__dirname, "data");
const uploadDir = path.join(__dirname, "uploads");

if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

app.use(bodyParser.json());
app.use(express.static(publicDir));

// ---------- file helpers ----------
function readJSON(file) {
  const filePath = path.join(dataDir, file);
  if (!fs.existsSync(filePath)) return [];
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}
function writeJSON(file, data) {
  fs.writeFileSync(path.join(dataDir, file), JSON.stringify(data, null, 2));
}

// ---------- file upload ----------
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname)
});
const upload = multer({ storage });

// ---------- login ----------
app.post("/login", (req, res) => {
  const { username, password } = req.body;
  const ADMIN_USER = process.env.ADMIN_USER || "admin";
  const ADMIN_PASS = process.env.ADMIN_PASS || "1234";

  if (username === ADMIN_USER && password === ADMIN_PASS)
    return res.json({ success: true, role: "admin" });
  if (username && password === "")
    return res.json({ success: true, role: "guest" });

  res.status(401).json({ success: false, message: "Invalid credentials" });
});

// ---------- announcements ----------
app.get("/announcement", (req, res) => res.json(readJSON("announcements.json")));
app.post("/announcement", (req, res) => {
  const a = readJSON("announcements.json");
  a.push(req.body);
  writeJSON("announcements.json", a);
  res.json({ success: true });
});
app.delete("/announcement/:index", (req, res) => {
  const a = readJSON("announcements.json");
  a.splice(parseInt(req.params.index), 1);
  writeJSON("announcements.json", a);
  res.json({ success: true });
});

// ---------- wallet ----------
app.get("/wallet", (req, res) => res.json(readJSON("wallet.json")));
app.post("/wallet", (req, res) => {
  const w = readJSON("wallet.json");
  w.push(req.body);
  writeJSON("wallet.json", w);
  res.json({ success: true });
});
app.delete("/wallet/:index", (req, res) => {
  const w = readJSON("wallet.json");
  w.splice(parseInt(req.params.index), 1);
  writeJSON("wallet.json", w);
  res.json({ success: true });
});

// ---------- combat uploads (placeholder) ----------
app.post("/upload", upload.single("file"), (req, res) => {
  res.json({ success: true, filename: req.file.filename });
});

// ---------- guest edit requests ----------
app.get("/requests", (req, res) => res.json(readJSON("requests.json")));
app.post("/requests", (req, res) => {
  const r = readJSON("requests.json");
  r.push(req.body);
  writeJSON("requests.json", r);
  res.json({ success: true });
});
app.delete("/requests/:index", (req, res) => {
  const r = readJSON("requests.json");
  r.splice(parseInt(req.params.index), 1);
  writeJSON("requests.json", r);
  res.json({ success: true });
});

// ---------- serve static pages ----------
app.get("/", (_, res) => res.sendFile(path.join(publicDir, "index.html")));
app.get("/dashboard.html", (_, res) => res.sendFile(path.join(publicDir, "dashboard.html")));

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
