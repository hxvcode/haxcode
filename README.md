# haxvq

A black-themed TikTok profile lookup website with a Node.js backend.

## Run locally

1. Install Node.js 20 or newer.
2. Open a terminal in this folder.
3. Run:

   ```bash
   npm install
   cp .env.example .env
   npm start
   ```

4. Open `http://localhost:3000`.

The site works as a frontend immediately. Live profile lookup requires an approved TikTok Research API token in `.env`:

```env
TIKTOK_RESEARCH_TOKEN=your_approved_token
```

Never put the token in `public/index.html` or share it publicly.

## Data availability and limitations

This project uses TikTok's official Research API user-info endpoint. Access is restricted and requires TikTok approval. A normal TikTok developer account does not automatically grant Research API access.

When authorized, this integration requests:
- Display name
- Bio
- Avatar URL
- Verification status
- Followers
- Following
- Likes/hearts
- Public video count

The official endpoint used here does **not** return:
- Original account registration region/country
- Language
- Friends count
- Account creation date
- Nickname edit date
- Username change history
- Gift/support level

Those fields are not fabricated. The UI will show them as unavailable unless a legitimate data source later supplies them.

## Deployment

Deploy this folder to a Node.js host that supports Express. Set the start command to `npm start` and add environment variables in the host's private settings. If you have not been approved for TikTok Research API access, leave the token unset; the site will explain that live lookup is unavailable.

## API

`GET /api/health` reports whether a provider token is configured.

`GET /api/tiktok/lookup?username=example` looks up a public username through the approved Research API.

## Privacy

The app does not ask for TikTok passwords, does not log users into TikTok, and does not attempt to access private accounts or private information.
