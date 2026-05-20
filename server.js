/**
 * SoloPhotography backend — Express server for Render.com deployment.
 *
 * Single admin auth. Endpoints for clients, properties, payments, finances, AI.
 * Persists to Firestore when FIREBASE_SERVICE_ACCOUNT is set, else in-memory.
 */
import express from 'express';
import multer from 'multer';
import { validateCredentials, createSession, verifySession } from './auth.js';
import { store } from './store.js';
import { isFirebaseEnabled, isStorageEnabled, getInitError, uploadToStorage } from './firebase.js';
import * as ai from './ai.js';
import * as finances from './finances.js';
import * as payments from './payments.js';
import * as autofill from './autofill.js';

const app = express();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } });
const PORT = process.env.PORT || 3000;

// Permissive CORS — single-admin app gated client-side.
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, stripe-signature');
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }
  next();
});

// Stripe webhook needs raw body — mount BEFORE json parser.
app.post('/api/payments/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const signature = req.headers['stripe-signature'];
  if (!signature) return res.status(400).json({ error: 'Missing stripe-signature' });
  try {
    res.json(await payments.handleWebhook(req.body, signature));
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.use(express.json({ limit: '12mb' }));

const wrap = (fn) => async (req, res) => {
  try {
    const result = await fn(req, res);
    if (result !== undefined && !res.headersSent) res.json(result);
  } catch (err) {
    console.error('[api]', req.method, req.path, err.message);
    if (!res.headersSent) res.status(err.status || 500).json({ error: err.message });
  }
};

// Health.
app.get('/', (_req, res) => res.json({ ok: true, service: 'solo-service' }));
app.get('/api/status', (_req, res) =>
  res.json({
    store: store.kind,
    firebase: isFirebaseEnabled(),
    firebaseError: getInitError(),
    storage: isStorageEnabled(),
    gemini: !!process.env.GEMINI_API_KEY,
    stripe: !!process.env.STRIPE_SECRET_KEY,
    stripeWebhook: !!process.env.STRIPE_WEBHOOK_SECRET,
  }),
);

// Auth.
app.post(
  '/api/auth/sign-in',
  wrap(async (req) => {
    const { email, password } = req.body || {};
    if (!validateCredentials(email, password)) {
      const err = new Error('Invalid credentials. This platform is admin-only.');
      err.status = 401;
      throw err;
    }
    const { token, session } = createSession();
    return { token, user: session };
  }),
);
app.get('/api/auth/me', (req, res) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : undefined;
  const session = verifySession(token);
  if (!session) return res.status(401).json({ error: 'Unauthorized' });
  res.json({ user: session });
});

// Clients.
app.get('/api/clients', wrap(async () => store.listClients()));
app.get(
  '/api/clients/:id',
  wrap(async (req, res) => {
    const c = await store.getClient(req.params.id);
    if (!c) res.status(404).json({ error: 'Not found' });
    return c || undefined;
  }),
);
app.post('/api/clients', wrap(async (req) => store.createClient(req.body)));
app.patch(
  '/api/clients/:id',
  wrap(async (req, res) => {
    const c = await store.updateClient(req.params.id, req.body);
    if (!c) res.status(404).json({ error: 'Not found' });
    return c || undefined;
  }),
);
app.delete('/api/clients/:id', wrap(async (req) => ({ ok: await store.deleteClient(req.params.id) })));

// Properties.
app.get('/api/properties', wrap(async () => store.listProperties()));
app.get(
  '/api/properties/:id',
  wrap(async (req, res) => {
    const p = await store.getProperty(req.params.id);
    if (!p) res.status(404).json({ error: 'Not found' });
    return p || undefined;
  }),
);
app.get(
  '/api/public/properties/by-slug/:slug',
  wrap(async (req, res) => {
    const p = await store.getPropertyBySlug(req.params.slug);
    if (!p) {
      res.status(404).json({ error: 'Not found' });
      return;
    }
    return p.isLocked ? { ...p, images: (p.images || []).slice(0, 8), videos: [] } : p;
  }),
);
app.post('/api/properties', wrap(async (req) => store.createProperty(req.body)));
app.patch(
  '/api/properties/:id',
  wrap(async (req, res) => {
    const p = await store.updateProperty(req.params.id, req.body);
    if (!p) res.status(404).json({ error: 'Not found' });
    return p || undefined;
  }),
);
app.delete(
  '/api/properties/:id',
  wrap(async (req) => ({ ok: await store.deleteProperty(req.params.id) })),
);

// Media upload — Firebase Storage if configured, else attach a curated demo URL.
const DEMO_IMAGES = [
  'https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=1400&q=80',
  'https://images.unsplash.com/photo-1600585154363-67eb9e2e2099?auto=format&fit=crop&w=1400&q=80',
  'https://images.unsplash.com/photo-1600585152220-90363fe7e115?auto=format&fit=crop&w=1400&q=80',
  'https://images.unsplash.com/photo-1600210491892-03d54c0aaf87?auto=format&fit=crop&w=1400&q=80',
  'https://images.unsplash.com/photo-1600566753104-685f4f24cb4d?auto=format&fit=crop&w=1400&q=80',
];
app.post(
  '/api/properties/:id/upload',
  upload.array('files', 30),
  wrap(async (req, res) => {
    const files = req.files || [];
    if (!files.length) {
      res.status(400).json({ error: 'No files attached' });
      return;
    }
    let property = null;
    const urls = [];
    for (const file of files) {
      const kind = file.mimetype.startsWith('video') ? 'video' : 'image';
      let url;
      if (isStorageEnabled()) {
        const result = await uploadToStorage({
          propertyId: req.params.id,
          buffer: file.buffer,
          filename: file.originalname,
          contentType: file.mimetype,
        });
        url = result.url;
      } else {
        url = DEMO_IMAGES[Math.floor(Math.random() * DEMO_IMAGES.length)];
      }
      property = await store.addPropertyMedia(req.params.id, url, kind);
      urls.push(url);
    }
    return { property, urls };
  }),
);
app.post(
  '/api/properties/:id/media',
  wrap(async (req, res) => {
    const { url, kind } = req.body || {};
    const p = await store.addPropertyMedia(req.params.id, url, kind || 'image');
    if (!p) res.status(404).json({ error: 'Not found' });
    return p || undefined;
  }),
);
app.post('/api/properties/autofill', wrap(async (req) => autofill.autofillFromAddress(req.body)));

// Payments.
app.get('/api/payments', wrap(async () => store.listPurchases()));
app.post(
  '/api/public/payments/checkout',
  wrap(async (req) => {
    const { propertyId, clientEmail } = req.body || {};
    const origin = req.headers.origin || `${req.protocol}://${req.get('host')}`;
    return payments.createCheckoutSession({
      propertyId,
      clientEmail: clientEmail || 'client@example.com',
      origin,
    });
  }),
);

// Finances.
app.get('/api/finances/summary', wrap(async () => finances.getSummary()));
app.get('/api/finances/revenue-over-time', wrap(async () => finances.getRevenueOverTime()));
app.get('/api/finances/revenue-by-city', wrap(async () => finances.getRevenueByCity()));
app.get('/api/finances/top-clients', wrap(async () => finances.getTopClients()));

// AI.
app.post(
  '/api/ai/ask',
  wrap(async (req) => {
    const { prompt, history } = req.body || {};
    return { reply: await ai.ask(prompt, history || []) };
  }),
);
app.post(
  '/api/ai/generate-listing',
  wrap(async (req) => ({ reply: await ai.generateListing(req.body?.propertyId) })),
);
app.post(
  '/api/ai/generate-caption',
  wrap(async (req) => ({ reply: await ai.generateCaption(req.body?.propertyId) })),
);

app.listen(PORT, () => {
  console.log(`🚀 SoloPhotography backend ready on port ${PORT}`);
});
