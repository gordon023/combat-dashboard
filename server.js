import express from "express";
import multer from "multer";
import fs from "fs-extra";
import cors from "cors";
import Tesseract from "tesseract.js";
import sharp from "sharp";
import path from "path";

const app = express();
const PORT = process.env.PORT || 3000;

// Change this
// await fs.ensureDir("/uploads");
// await fs.ensureDir("/data");

// To this 👇
const uploadsPath = process.env.UPLOADS_DIR || "./uploads";
const dataPath = process.env.DATA_DIR || "./data";
await fs.ensureDir(uploadsPath);
await fs.ensureDir(dataPath);

const upload = multer({ dest: uploadsPath });

app.use("/uploads", express.static(uploadsPath));

const dataPaths = {
  announcements: `${dataPath}/announcements.json`,
  wallets: `${dataPath}/wallets.json`,
  combats: `${dataPath}/combats.json`,
};

const upload = multer({ dest: "/uploads" });
app.use(cors());
app.use(express.json());
app.use(express.static("public"));
app.use("/uploads", express.static("/uploads"));

// JSON file helpers
const readJSON = async (file, def = []) =>
  (await fs.pathExists(file)) ? JSON.parse(await fs.readFile(file, "utf8")) : def;
const writeJSON = (file, data) => fs.writeFile(file, JSON.stringify(data, null, 2));

const dataPaths = {
  announcements: "/data/announcements.json",
  wallets: "/data/wallets.json",
  combats: "/data/combats.json",
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

// ---------- COMBAT POWER UPLOAD + OCR ----------
app.post("/upload", upload.single("image"), async (req, res) => {
  try {
    const filePath = req.file.path;
    const cropped = `/uploads/cropped-${Date.now()}.png`;

    // crop bottom-left area
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
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

