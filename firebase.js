/**
 * Firebase Admin SDK initialization.
 * Requires FIREBASE_SERVICE_ACCOUNT (full JSON) to enable Firestore persistence.
 * Optionally FIREBASE_STORAGE_BUCKET for media uploads.
 */
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

let app = null;
let firestore = null;
let storage = null;
let bucketName = null;
let initError = null;

function init() {
  if (app || initError) return;
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  const bucket = process.env.FIREBASE_STORAGE_BUCKET;
  if (!raw) {
    initError = 'FIREBASE_SERVICE_ACCOUNT not set — using in-memory store';
    return;
  }
  try {
    const credentials = JSON.parse(raw);
    app =
      getApps()[0] ||
      initializeApp({
        credential: cert(credentials),
        storageBucket: bucket || undefined,
      });
    firestore = getFirestore(app);
    if (bucket) {
      storage = getStorage(app);
      bucketName = bucket;
    }
    console.log('[firebase] initialized — project:', credentials.project_id);
  } catch (err) {
    initError = `Failed to init Firebase: ${err.message}`;
    console.error('[firebase]', initError);
  }
}
init();

export function isFirebaseEnabled() {
  return !!firestore;
}
export function isStorageEnabled() {
  return !!storage && !!bucketName;
}
export function getFirestoreDb() {
  return firestore;
}
export function getInitError() {
  return initError;
}

/** Upload a buffer to Firebase Storage at properties/{propertyId}/{filename}. */
export async function uploadToStorage({ propertyId, buffer, filename, contentType }) {
  if (!storage || !bucketName) throw new Error('Firebase Storage is not configured');
  const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
  const path = `properties/${propertyId}/${Date.now()}-${safeName}`;
  const bucket = storage.bucket(bucketName);
  const file = bucket.file(path);
  await file.save(buffer, {
    contentType,
    metadata: { cacheControl: 'public, max-age=31536000' },
    resumable: false,
  });
  await file.makePublic().catch(() => undefined);
  return { url: `https://storage.googleapis.com/${bucketName}/${encodeURI(path)}` };
}
