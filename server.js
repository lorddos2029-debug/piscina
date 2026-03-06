const express = require("express");
const path = require("path");
const fetch = require("node-fetch");

const app = express();
const PORT = process.env.PORT || 3000;
const PIXEL_ID = process.env.FB_PIXEL_ID || "1388988872703996";
const ACCESS_TOKEN = process.env.FB_ACCESS_TOKEN || "";

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: false }));

app.post("/capi/events", async (req, res) => {
  try {
    if (!ACCESS_TOKEN) return res.status(500).json({ error: "FB_ACCESS_TOKEN missing" });
    const body = req.body || {};
    const ip = (req.headers["x-forwarded-for"] || "").split(",")[0].trim() || req.ip;
    const ua = req.headers["user-agent"] || "";
    const event = {
      event_name: body.event_name,
      event_time: Math.floor(Date.now() / 1000),
      action_source: "website",
      event_source_url: body.event_source_url || req.headers.referer || "",
      event_id: body.event_id,
      user_data: {
        client_ip_address: ip,
        client_user_agent: ua,
        fbp: body.user_data && body.user_data.fbp,
        fbc: body.user_data && body.user_data.fbc,
        external_id: body.user_data && body.user_data.external_id
      },
      custom_data: body.custom_data || {}
    };
    const payload = { data: [event] };
    if (body.test_event_code) payload.test_event_code = body.test_event_code;
    const url = `https://graph.facebook.com/v18.0/${PIXEL_ID}/events?access_token=${encodeURIComponent(ACCESS_TOKEN)}`;
    const fbRes = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const json = await fbRes.json();
    res.status(fbRes.status).json(json);
  } catch (e) {
    res.status(500).json({ error: "capi_error" });
  }
});

app.use(express.static(path.join(__dirname)));

app.listen(PORT, () => {
  console.log(`server on http://localhost:${PORT}`);
});

