import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = Number(process.env.PORT || 3000);
const TIKTOK_RESEARCH_TOKEN = process.env.TIKTOK_RESEARCH_TOKEN;

app.disable("x-powered-by");
app.use(express.static(path.join(__dirname, "public"), {
  extensions: ["html"],
  maxAge: process.env.NODE_ENV === "production" ? "1h" : 0
}));

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    service: "haxvq",
    lookupConfigured: Boolean(TIKTOK_RESEARCH_TOKEN)
  });
});

app.get("/api/tiktok/lookup", async (req, res) => {
  const username = String(req.query.username || "").trim().replace(/^@/, "");

  if (!/^[A-Za-z0-9._]{2,24}$/.test(username)) {
    return res.status(400).json({ error: { message: "Enter a valid TikTok username." } });
  }

  if (!TIKTOK_RESEARCH_TOKEN) {
    return res.status(503).json({
      error: {
        message: "Live lookup is not configured. This server needs an approved TikTok Research API access token."
      }
    });
  }

  try {
    const fields = [
      "display_name",
      "bio_description",
      "avatar_url",
      "is_verified",
      "follower_count",
      "following_count",
      "likes_count",
      "video_count"
    ].join(",");

    const upstream = await fetch(
      `https://open.tiktokapis.com/v2/research/user/info/?fields=${encodeURIComponent(fields)}`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${TIKTOK_RESEARCH_TOKEN}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ username }),
        signal: AbortSignal.timeout(12000)
      }
    );

    const payload = await upstream.json().catch(() => ({}));

    if (!upstream.ok || (payload.error && payload.error.code && payload.error.code !== "ok")) {
      console.error("TikTok provider error:", upstream.status, payload.error?.code || "unknown");
      return res.status(upstream.status === 404 ? 404 : 502).json({
        error: {
          message: "The TikTok data provider could not return this profile. Check API access, permissions, and username."
        }
      });
    }

    const u = payload.data || {};
    if (!Object.keys(u).length) {
      return res.status(404).json({ error: { message: "No profile data was returned for that username." } });
    }

    // The official Research API fields used here do not include account-registration
    // country, friend count, account creation date, username-change history, or gift level.
    // Those fields are intentionally omitted rather than guessed.
    return res.json({
      profile: {
        username,
        nickname: u.display_name,
        bio: u.bio_description,
        avatar_url: u.avatar_url,
        is_verified: u.is_verified,
        profile_url: `https://www.tiktok.com/@${encodeURIComponent(username)}`
      },
      stats: {
        followers: u.follower_count,
        following: u.following_count,
        hearts: u.likes_count,
        videos: u.video_count
      },
      availability: {
        registered_region: false,
        language: false,
        friends: false,
        created_at: false,
        nickname_edited_at: false,
        username_changed_at: false,
        gift_level: false
      },
      source: "TikTok Research API"
    });
  } catch (error) {
    console.error("Lookup request failed:", error.message);
    return res.status(502).json({
      error: { message: "Could not reach the TikTok data provider. Please try again later." }
    });
  }
});

app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api/")) {
    return res.status(404).json({ error: { message: "API route not found." } });
  }
  return res.sendFile(path.join(__dirname, "public", "index.html"), next);
});

app.listen(PORT, () => {
  console.log(`haxvq is running on http://localhost:${PORT}`);
});
