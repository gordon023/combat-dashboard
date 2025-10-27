// ==========================
// Combat Dashboard Server
// ==========================
import express from "express";
import path from "path";
import fs from "fs";
import bodyParser from "body-parser";
import multer from "multer";

const app = express();

// --- Middleware ---
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// --- Folder Setup ---
const __dirname = path.resolve();
const publicDir = path.join(__dirname, "public");
const dataDir = path.join(__dirname, "data");
const uploadDir = path.join(__dirname, "uploads");

if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

// --- Static files (Frontend) ---
app.use(express.static(publicDir));

// --- Multer setup for uploads ---
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  }
});
const upload = multer({ storage });

// --- LOGIN ROUTE ---
app.post("/login", (req, res) => {
  const { username, password } = req.body;

  const ADMIN_USER = process.env.ADMIN_USER || "admin";
  const ADMIN_PASS = process.env.ADMIN_PASS || "1234";

  if (username === ADMIN_USER && password === ADMIN_PASS) {
    return res.json({ success: true, role: "admin" });
  }

  // Guest (password blank)
  if (username && password === "") {
    return res.json({ success: true, role: "guest" });
  }

  return res.status(401).json({ success: false, message: "Invalid credentials" });
});

// --- Placeholder routes for later use (wallet, combat, announcements) ---
app.get("/wallet", (req, res) => {
  const file = path.join(dataDir, "wallet.json");
  if (!fs.existsSync(file)) return res.json([]);
  const data = JSON.parse(fs.readFileSync(file, "utf8"));
  res.json(data);
});

app.post("/wallet", (req, res) => {
  const file = path.join(dataDir, "wallet.json");
  let data = [];
  if (fs.existsSync(file)) data = JSON.parse(fs.readFileSync(file, "utf8"));
  data.push(req.body);
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
  res.json({ success: true });
});

// --- Upload endpoint (for combat images) ---
app.post("/upload", upload.single("file"), (req, res) => {
  res.json({ success: true, filename: req.file.filename });
});

// --- Fallback route for dashboard.html ---
app.get("/dashboard.html", (req, res) => {
  res.sendFile(path.join(publicDir, "dashboard.html"));
});

// --- Root route (index.html) ---
app.get("/", (req, res) => {
  res.sendFile(path.join(publicDir, "index.html"));
});

// --- Server Start ---
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`✅ Combat Dashboard Server running on port ${PORT}`));

