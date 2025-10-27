import express from "express";
import multer from "multer";
import fs from "fs-extra";
import cors from "cors";
import Tesseract from "tesseract.js";
import sharp from "sharp";
import path from "path";

const app = express();
const PORT = process.env.PORT || 3000;

// ✅ Safe folder setup
const uploadsPath = process.env.UPLOADS_DIR || "./uploads";
const dataPath = process.env.DATA_DIR || "./data";
await fs.ensureDir(uploadsPath);
await fs.ensureDir(dataPath);

// ✅ Multer setup (one declaration only)
const upload = multer({ dest: uploadsPath });

app.use(cors());
app.use(express.json());
app.use(express.static("public"));
app.use("/uploads", express.static(uploadsPath));

// ✅ Helper functions
const readJSON = async (file, def = []) =>
  (await fs.pathExists(file)) ? JSON.parse(await fs.readFile(file, "utf8")) : def;
const writeJSON = (file, data) => fs.writeFile(file, JSON.stringify(data, null, 2));

const dataPaths = {
  announcements: `${dataPath}/announcements.json`,
  wallets: `${dataPath}/wallets.json`,
  combats: `${dataPath}/combats.json`,
};

// ---------- ANNOUNCEMENTS ----------
app.get("/announcements", async (_, res) =>
  res.json(await readJSON(dataPaths.announcements))
);
app.post("/announcements", async (req, res) => {
  const list = await readJSON(dataPaths.announcements);
  list.push({ ...req.body, time: new Date().toISOString() });
  await writeJSON(dataPaths.announcements, list);
  res.json({ ok: true });
});

// ---------- WALLETS ----------
app.get("/wallets", async (_, res) =>
  res.json(await readJSON(dataPaths.wallets))
);
app.post("/wallets", async (req, res) => {
  const list = await readJSON(dataPaths.wallets);
  list.push({ ...req.body, time: new Date().toISOString() });
  await writeJSON(dataPaths.wallets, list);
  res.json({ ok: true });
});

// ---------- COMBAT UPLOAD + OCR ----------
app.post("/upload", upload.single("image"), async (req, res) => {
  try {
    const filePath = req.file.path;
    const cropped = path.join(uploadsPath, `cropped-${Date.now()}.png`);

    // crop bottom-left 25% height, 40% width
    const img = sharp(filePath);
    const { width, height } = await img.metadata();
    const cropHeight = Math.floor(height * 0.25);
    const cropWidth = Math.floor(width * 0.4);
    await img
      .extract({ left: 0, top: height - cropHeight, width: cropWidth, height: cropHeight })
      .toFile(cropped);

    const { data: { text } } = await Tesseract.recognize(cropped, "eng");
    const match = text.match(/Combat\s*Power[: ]+(\d{5,6})/i);
    const power = match ? match[1] : "Not detected";

    const record = {
      user: req.body.user || "Guest",
      filename: path.basename(filePath),
      combatPower: power,
      time: new Date().toISOString(),
    };

    const combats = await readJSON(dataPaths.combats);
    combats.push(record);
    await writeJSON(dataPaths.combats, combats);

    res.json({ ok: true, ...record });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

// ---------- START ----------
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`📂 Uploads folder: ${uploadsPath}`);
  console.log(`📂 Data folder: ${dataPath}`);
});

// ---------- ADMIN LOGIN (simple, in-memory for demo) ----------
const ADMIN_USER = process.env.ADMIN_USER || "admin";
const ADMIN_PASS = process.env.ADMIN_PASS || "1234";

// Login check
app.post("/login", (req, res) => {
  const { username, password } = req.body;
  if (username === ADMIN_USER && password === ADMIN_PASS)
    res.json({ role: "admin" });
  else
    res.json({ role: "guest" });
});

// ---------- UPDATE & DELETE ROUTES ----------
app.put("/wallets/:id", async (req, res) => {
  const wallets = await readJSON(dataPaths.wallets);
  const index = wallets.findIndex((_, i) => i === parseInt(req.params.id));
  if (index >= 0) {
    wallets[index] = { ...wallets[index], ...req.body };
    await writeJSON(dataPaths.wallets, wallets);
  }
  res.json({ ok: true });
});

app.delete("/wallets/:id", async (req, res) => {
  const wallets = await readJSON(dataPaths.wallets);
  wallets.splice(req.params.id, 1);
  await writeJSON(dataPaths.wallets, wallets);
  res.json({ ok: true });
});

app.put("/combats/:id", async (req, res) => {
  const combats = await readJSON(dataPaths.combats);
  const index = combats.findIndex((_, i) => i === parseInt(req.params.id));
  if (index >= 0) {
    combats[index] = { ...combats[index], ...req.body };
    await writeJSON(dataPaths.combats, combats);
  }
  res.json({ ok: true });
});

app.delete("/combats/:id", async (req, res) => {
  const combats = await readJSON(dataPaths.combats);
  combats.splice(req.params.id, 1);
  await writeJSON(dataPaths.combats, combats);
  res.json({ ok: true });
});

// Guest “request update”
app.post("/request-update", async (req, res) => {
  const requestsFile = `${dataPath}/requests.json`;
  const list = await readJSON(requestsFile);
  list.push({ ...req.body, time: new Date().toISOString() });
  await writeJSON(requestsFile, list);
  res.json({ ok: true });
});


