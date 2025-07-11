const express = require("express");
const cors = require("cors");
const { spawn } = require("child_process");

const app = express();

// ✅ Allow frontend at localhost:3000
app.use(cors({
  origin: ["http://localhost:3000","https://posture-detection-frontend-f2ey.vercel.app",
   "https://posture-detection-frontend-ukwr.vercel.app",
   "https://posture-detection-frontend-v6er.vercel.app"],
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type"],
}));

// ✅ Accept large JSON body (for image data)
app.use(express.json({ limit: "20mb" }));


app.post("/analyze", (req, res) => {
    console.log("📥 Received POST /analyze");
  
    const python = spawn("python3", ["analyze.py"]);
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
  
  // Dummy root route to check if server is running
app.get("/", (req, res) => {
  res.json({ status: "Backend server is running!" });
});
  
  
// ✅ Start server
app.listen(5001, () => {
  console.log("✅ Server running at http://localhost:5001");
});
