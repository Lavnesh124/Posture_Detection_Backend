const express = require("express");
const cors = require("cors");
const { spawn } = require("child_process");

const app = express();

app.get("/test-python", (req, res) => {
  const { spawn } = require("child_process");
  const py = spawn("python3", ["-c", "import cv2; import mediapipe; print('ok')"]);

  py.stdout.on("data", (data) => {
    console.log("✅ Python test:", data.toString());
    res.send(data.toString());
  });

  py.stderr.on("data", (err) => {
    console.error("❌ Python test error:", err.toString());
    res.status(500).send(err.toString());
  });
});


// ✅ Allow frontend domains (adjust if needed)
app.use(cors({
  origin: [
    "http://localhost:3000",
    "https://posture-detection-frontend-f2ey.vercel.app",
    "https://posture-detection-frontend-ukwr.vercel.app",
    "https://posture-detection-frontend-v6er.vercel.app"
  ],
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type"],
}));

// ✅ Accept large base64 images
app.use(express.json({ limit: "20mb" }));

// ✅ Analyze route
app.post("/analyze", (req, res) => {
  console.log("📥 Received POST /analyze");

  // ⬇️ Use app.py instead of analyze.py
  const python = spawn("python3", ["app.py"]);

  let result = "";

  python.stdin.write(JSON.stringify(req.body));
  python.stdin.end();

  python.stdout.on("data", (data) => {
    console.log("🟢 Python stdout:", data.toString());
    result += data.toString();
  });

  python.stderr.on("data", (err) => {
    console.error("🔴 Python error:", err.toString());
  });

  python.on("error", (err) => {
    console.error("❌ Failed to start Python process:", err);
    res.status(500).json({ error: "Failed to run Python" });
  });

  python.on("close", (code) => {
    console.log("🟡 Python exited with code:", code);
    try {
      const jsonResult = JSON.parse(result);
      console.log("✅ Sending response:", jsonResult);
      res.json(jsonResult);
    } catch (err) {
      console.error("❌ JSON parse error:", err);
      res.status(500).json({ error: "Invalid JSON from Python" });
    }
  });
});

// ✅ Health check
app.get("/", (req, res) => {
  res.json({ status: "Backend server is running!" });
});

// ✅ Start server
app.listen(5001, () => {
  console.log("✅ Server running at http://localhost:5001");
});
