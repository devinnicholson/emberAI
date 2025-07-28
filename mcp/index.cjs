const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const algoliasearch = require("algoliasearch");

const APP_ID  = process.env.ALGOLIA_APP_ID;
const API_KEY = process.env.ALGOLIA_ADMIN_KEY;
if (!APP_ID || !API_KEY) {
  console.error("❌ Missing ALGOLIA_APP_ID or ALGOLIA_ADMIN_KEY");
  process.exit(1);
}

const client = algoliasearch(APP_ID, API_KEY);
const app = express();
app.use(cors());
app.use(bodyParser.json());

// Health check
app.get("/health", (_req, res) => res.json({ status: "ok" }));

// Search proxy
app.post("/api/search", async (req, res) => {
  const { index, query = "", params = {} } = req.body;
  if (!index) return res.status(400).json({ error: "'index' is required" });
  try {
    const idx = client.initIndex(index);
    const result = await idx.search(query, params);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = 4000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Proxy listening on 0.0.0.0:${PORT}`);
});

