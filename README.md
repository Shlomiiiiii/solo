# SoloPhotography Backend — Render Deployment

Self-contained Express backend for the SoloPhotography admin platform.
Runs on any Node 20+ host. Designed for Render.com's free tier.

## Files

- `server.js` — Express app entry
- `auth.js` — admin-only auth (single hardcoded account)
- `store.js` — Firestore + in-memory dual-mode data store
- `firebase.js` — Firebase Admin SDK init
- `seed.js` — mock data
- `ai.js` — Gemini proxy
- `payments.js` — Stripe Checkout
- `finances.js` — revenue aggregation
- `autofill.js` — property data autofill
- `package.json` — deps and `start` script

## Deploy to Render (5-minute setup)

1. **Upload this folder to GitHub** as a new repo (use github.com/new in the
   browser — drag-and-drop the folder contents).
2. **Render.com** → "New +" → "Web Service" → connect the GitHub repo.
3. Settings auto-detected from `render.yaml`. Just click **Create Web Service**.
4. In the service → **Environment** tab, add these vars (only the ones you have):
   - `FIREBASE_SERVICE_ACCOUNT` — entire JSON of your Firebase service account key
   - `FIREBASE_STORAGE_BUCKET` — e.g. `solophotographyny.firebasestorage.app`
   - `GEMINI_API_KEY` — Google AI Studio key
   - `STRIPE_SECRET_KEY` — Stripe secret
   - `STRIPE_WEBHOOK_SECRET` — Stripe webhook signing secret
5. Render builds and deploys (~3 min). Service URL appears at the top.
6. Update the frontend's `DEFAULT_BACKEND` in `api.ts` to the Render URL.

## Local dev

```
npm install
GEMINI_API_KEY=... node server.js
```

Visit http://localhost:3000/api/status to verify integrations.

## Admin login

- Email: `solophotography@icloud.com`
- Password: `Shlomi123!`

Edit `auth.js` to change.
