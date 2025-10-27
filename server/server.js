import express from "express";
import fs from "fs";
import path from "path";
import cors from "cors";
import multer from "multer";
import Tesseract from "tesseract.js";

const app = express();
const __dirname = path.resolve();
const dataDir = path.join(__dirname, "data");
const uploadDir = "/tmp/uploads";
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
const upload = multer({ dest: uploadDir });

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

function readJSON(file) {
  const f = path.join(dataDir, file);
  if (!fs.existsSync(f)) fs.writeFileSync(f, "[]");
  return JSON.parse(fs.readFileSync(f));
}
function writeJSON(file, data) {
  fs.writeFileSync(path.join(dataDir, file), JSON.stringify(data, null, 2));
}

// ---------- Announcements ----------
app.get("/announcement", (req, res) => res.json(readJSON("announcements.json")));
app.post("/announcement", (req, res) => {
  if (req.body.role !== "admin") return res.status(403).json({ error: "Only admin" });
  const list = readJSON("announcements.json");
  list.unshift({ text: req.body.text, author: req.body.name, date: new Date().toISOString() });
  writeJSON("announcements.json", list);
  res.json({ success: true });
});
app.put("/announcement/:i", (req, res) => {
  const list = readJSON("announcements.json");
  list[req.params.i].text = req.body.text;
  writeJSON("announcements.json", list);
  res.json({ success: true });
});
app.delete("/announcement/:i", (req, res) => {
  const list = readJSON("announcements.json");
  list.splice(req.params.i, 1);
  writeJSON("announcements.json", list);
  res.json({ success: true });
});

// ---------- Wallet ----------
app.get("/wallet", (req, res) => res.json(readJSON("wallets.json")));
app.post("/wallet", (req, res) => {
  const list = readJSON("wallets.json");
  const record = { name: req.body.name, wallet: req.body.wallet, date: new Date().toISOString() };
  list.push(record);
  writeJSON("wallets.json", list);
  res.json({ success: true });
});

// ---------- Combat OCR ----------
app.get("/combat", (req, res) => res.json(readJSON("combats.json")));
app.post("/upload", upload.single("file"), async (req, res) => {
  try {
    const { data: { text } } = await Tesseract.recognize(req.file.path, "eng");
    const match = text.match(/Combat\\s*Power[:\\-\\s]*(\\d{5,6})/i);
    const combatPower = match ? match[1] : "Not found";
    const combats = readJSON("combats.json");
    combats.push({
      name: req.body.name,
      filename: req.file.filename,
      combatPower,
      date: new Date().toISOString()
    });
    writeJSON("combats.json", combats);
    res.json({ success: true, combatPower });
  } catch (err) {
    res.status(500).json({ error: "OCR failed" });
  }
});
app.delete("/combat/:i", (req, res) => {
  const list = readJSON("combats.json");
  list.splice(req.params.i, 1);
  writeJSON("combats.json", list);
  res.json({ success: true });
});

// ---------- Requests ----------
app.get("/requests", (req, res) => res.json(readJSON("requests.json")));
app.post("/requests", (req, res) => {
  const list = readJSON("requests.json");
  list.push({ ...req.body, date: new Date().toISOString(), status: "Pending" });
  writeJSON("requests.json", list);
  res.json({ success: true });
});
app.put("/requests/:i", (req, res) => {
  const list = readJSON("requests.json");
  list[req.params.i].status = req.body.status;
  writeJSON("requests.json", list);
  res.json({ success: true });
});
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running on port", PORT));


